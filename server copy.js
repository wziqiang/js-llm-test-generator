require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// 从环境变量读取 智谱 AI Key 和配置
const zhipuApiKey = process.env.ZHIPU_API_KEY;
const zhipuBaseUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const zhipuModel = process.env.ZHIPU_MODEL || "glm-4";

// 配置 CORS 允许前端跨域访问
app.use(cors({ origin: "http://localhost:5175" }));
// 解析 JSON 请求体，限制大小为 1mb
app.use(express.json({ limit: "1mb" }));

/**
 * 生成智谱 AI 的 JWT Token
 * 智谱 API Key 格式为 id.secret，需要用 secret 对 payload 进行签名
 */
function generateZhipuToken(apiKey, expSeconds = 3600) {
  if (!apiKey) return null;
  const [id, secret] = apiKey.split(".");
  if (!id || !secret) return null;

  const payload = {
    api_key: id,
    exp: Date.now() + expSeconds * 1000,
    timestamp: Date.now(),
  };

  // header 必须包含 alg 和 sign_type
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    header: { alg: "HS256", sign_type: "SIGN" },
  });
  return token;
}

/**
 * 收集源代码中的函数名，供自动导出和兜底测试使用
 */
function collectFunctionNames(code) {
  const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  const arrowRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>/g;
  const functionNames = new Set();
  let match;

  while ((match = funcRegex.exec(code)) !== null) {
    functionNames.add(match[1]);
  }
  while ((match = arrowRegex.exec(code)) !== null) {
    functionNames.add(match[1]);
  }

  return Array.from(functionNames);
}

/**
 * 智能包装源代码，确保顶级函数被导出 (module.exports)
 * 这样用户只需粘贴函数定义，无需手动写 exports
 */
function wrapSourceWithExports(code) {
  // 如果代码中已经有 module.exports 或 export 关键字，不再二次处理
  if (code.includes('module.exports') || code.includes('export ')) {
    return code;
  }

  const functionNames = collectFunctionNames(code);

  if (functionNames.length > 0) {
    const exportList = functionNames.join(", ");
    return `${code}\n\n// 自动添加的导出语句，方便测试执行\nmodule.exports = { ${exportList} };`;
  }

  return code;
}

/**
 * 将源代码和生成的测试代码写入临时文件
 */
function writeTempFiles(sourceCode, testCode) {
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const timestamp = Date.now().toString();
  const baseName = `code_${timestamp}`;
  const sourceFile = path.join(tempDir, `${baseName}.js`);
  const testFile = path.join(tempDir, `${baseName}.test.js`);
  
  // 处理源代码：自动增加导出逻辑
  const wrappedSource = wrapSourceWithExports(sourceCode);
  
  fs.writeFileSync(sourceFile, wrappedSource, "utf-8");
  fs.writeFileSync(testFile, testCode, "utf-8");
  return { sourceFile, testFile };
}

/**
 * 运行 Jest 测试并智能分流日志
 * @param {string} testFilePath - 测试文件路径
 * @returns {Promise<Object>} 包含退出码、stdout 和 stderr
 */
function runJest(testFilePath) {
  return new Promise((resolve) => {
    // --verbose: 确保输出 console.log
    // --color=false: 禁用颜色，方便正则表达式处理
    const args = [testFilePath, "--verbose", "--color=false"];
    const jestProcess = spawn("npx", ["jest", ...args], {
      cwd: __dirname,
      shell: true,
    });

    let rawStdout = "";
    let rawStderr = "";
    let isFinished = false;

    // 设置 10 秒超时
    const timeout = setTimeout(() => {
      if (!isFinished) {
        jestProcess.kill();
        isFinished = true;
        resolve({ code: 1, stdout: "", stderr: "测试运行超时 (10s)，可能存在死循环或网络问题。" });
      }
    }, 10000);

    jestProcess.stdout.on("data", (data) => {
      rawStdout += data.toString();
    });
    jestProcess.stderr.on("data", (data) => {
      rawStderr += data.toString();
    });
    jestProcess.on("close", (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);
      
      let stdout = rawStdout;
      let stderr = rawStderr;
      // 【核心逻辑】从 stderr 中提取 Jest 格式化的 console.log 块并移至 stdout
      // 匹配模式：以 console.log 开头，直到下一个 console.log 或测试摘要开始
      const logPattern = /^\s*console\.log\s*([\s\S]*?)(?=\n\s*(console\.log|FAIL|PASS|Test Suites|$))/gm;
      let logs = "";
      let match;
      while ((match = logPattern.exec(rawStderr)) !== null) {
        // 提取日志正文并清理多余空格
        const logContent = match[0].trim();
        logs += logContent + "\n\n";
      }
      if (logs) {
        // 将提取到的日志放入 stdout，并从 stderr 中移除，保持界面整洁
        stdout = logs + "\n" + stdout;
        stderr = rawStderr.replace(logPattern, "").trim();
      }
      resolve({ code, stdout, stderr });
    });
  });
}

/**
 * 基于源代码生成一份安全、可运行的兜底测试
 */
function buildSafeFallbackTest(sourceCode) {
  const functionNames = collectFunctionNames(sourceCode);

  if (functionNames.length === 0) {
    return [
      "describe('generated tests', () => {",
      "  test('should run fallback test', () => {",
      "    expect(true).toBe(true);",
      "  });",
      "});",
    ].join("\n");
  }

  const importLine = `const { ${functionNames.join(", ")} } = require('./sourceFile');`;
  const assertionLines = functionNames.map((name) => `    expect(typeof ${name}).toBe('function');`);

  return [
    importLine,
    "",
    "describe('generated tests', () => {",
    "  test('should export callable functions', () => {",
    ...assertionLines,
    "  });",
    "});",
  ].join("\n");
}

/**
 * 检查生成内容中是否残留说明文字、占位符或其他高风险脏数据
 */
function hasSuspiciousTestArtifacts(code) {
  const suspiciousPatterns = [
    /example line only/i,
    /actual code will differ/i,
    /actual implementation may vary/i,
    /assuming it'?s/i,
    /adjust according to/i,
    /modify according to/i,
    /note that the expected result/i,
    /this test case may vary/i,
    /only outputting code block/i,
    /sourcefile/i,
    /functionname/i,
    /__\.tofixed/i,
    /\b__+\b/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(code));
}

/**
 * 做最小必要的生成后清洗；如果仍不安全，则回退到干净的兜底测试
 */
function normalizeGeneratedTestCode(testCode, sourceCode) {
  const cleanupPatterns = [
    /Example line only[^.\n]*\.?/gi,
    /Actual code will differ[^.\n]*\.?/gi,
    /actual implementation may vary[^.\n]*\.?/gi,
    /Assuming it'?s[^.\n]*\.?/gi,
    /Adjust according to[^.\n]*\.?/gi,
    /Modify according to[^.\n]*\.?/gi,
    /Note that the expected result[^.\n]*\.?/gi,
    /This test case may vary[^.\n]*\.?/gi,
    /only outputting code block without any explanation text/gi,
  ];

  let cleaned = testCode.replace(/\r\n/g, "\n");

  for (const pattern of cleanupPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[ \t]+\/\/.*$/gm, "")
    .replace(/\}\);\s*(?=(?:test|it|describe)\s*\()/g, "});\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const looksLikeJestTest =
    cleaned.includes("describe(") &&
    cleaned.includes("test(") &&
    cleaned.includes("expect(");

  try {
    new Function(cleaned);
  } catch (error) {
    return buildSafeFallbackTest(sourceCode);
  }

  if (!looksLikeJestTest || hasSuspiciousTestArtifacts(cleaned)) {
    return buildSafeFallbackTest(sourceCode);
  }

  return cleaned;
}

/**
 * 构造发送给大模型的 Prompt
 * 极致约束版：强制语法模板，禁止任何“创意”写法
 */
function buildPrompt(sourceCode) {
  return [
    "你是一个严谨的 JavaScript 测试代码生成器。",
    "你的任务是根据提供的源代码，生成 100% 符合 Jest 语法的单元测试。",
    "",
    "### 严格遵循的生成准则：",
    "1. 必须在文件顶部使用 require 引入源代码中的函数。示例：const { functionName } = require('./sourceFile');",
    "2. 顶层结构必须是：describe('测试标题', () => { ... });",
    "3. 每个测试项必须是：test('用例描述', () => { ... });",
    "4. 断言格式必须是：expect(actual).toBe(expected);",
    "5. 注意事项：代码逻辑中涉及到的函数名必须与源代码一致。",
    "6. 严禁生成多余的文字说明，只输出代码块。",
    "7. 严禁输出解释性注释、示例说明、占位符、伪代码或自然语言补充。",
    "8. 严禁出现 sourceFile、functionName、Example line only、actual implementation may vary、__ 这类占位文本。",
    "9. 生成内容必须可直接保存为 .test.js 并通过 JavaScript 语法解析。",
    "",
    "### 正确示例：",
    "const { add } = require('./sourceFile');",
    "describe('add tests', () => {",
    "  test('should return 3 for 1 and 2', () => {",
    "    expect(add(1, 2)).toBe(3);",
    "  });",
    "});",
    "",
    "### 待测试的源代码：",
    "```javascript",
    sourceCode,
    "```",
    "",
    "请仅输出代码（以 ```javascript 开头），不要任何文字解释、不要注释、不要示例提示语。",
  ].join("\n");
}

/**
 * 从大模型返回的内容中提取代码块
 * 增强版：支持从文本中间提取，支持各种语言标签，处理推理模型 (DeepSeek) 的 <think> 标签
 */
function extractCodeFromContent(content) {
  // 1. 移除推理模型的思考过程 (DeepSeek 等)
  let cleanContent = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. 尝试匹配标准的 Markdown 代码块
  // [ \t]* 用于匹配反引号前的空白，(javascript|js|ts)? 用于匹配可选语言标签
  const codeBlockRegex = /```(?:javascript|js|ts)?\s*([\s\S]*?)```/i;
  const match = cleanContent.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // 3. 如果没有匹配到反引号块，可能是模型直接输出了代码，或者在代码前带了语言名称
  // 处理常见的 "javascript\ndescribe(...)" 情况
  const lines = cleanContent.split("\n");
  const resultLines = [];
  let foundActualCode = false;

  for (let line of lines) {
    const trimmed = line.trim();
    
    // 如果还没找到真正的代码，跳过空行、只有语言标识符的行、或者常见的引导词
    if (!foundActualCode) {
      const lowerTrimmed = trimmed.toLowerCase();
      if (!trimmed || 
          lowerTrimmed === "javascript" || 
          lowerTrimmed === "js" || 
          lowerTrimmed.startsWith("here is") ||
          lowerTrimmed.startsWith("这是")) {
        continue;
      }
      foundActualCode = true;
    }
    resultLines.push(line);
  }

  // 4. 最后清理掉残留的反引号
  return resultLines.join("\n").replace(/```/g, "").trim();
}

/**
 * 调用 智谱 AI 生成测试代码
 */
async function callZhipuAI(prompt) {
  if (!zhipuApiKey) {
    throw new Error("智谱 API Key 未配置");
  }
  const token = generateZhipuToken(zhipuApiKey);
  if (!token) {
    throw new Error("智谱 Token 生成失败");
  }

  const payload = {
    model: zhipuModel,
    messages: [
      { role: "system", content: "你是一个熟悉 Jest 的前端测试工程师，只输出 Jest 测试代码。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  };

  const response = await axios.post(zhipuBaseUrl, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
  
  return response.data.choices[0].message.content || "";
}

/**
 * 调用 Ollama 本地模型生成测试代码
 */
async function callOllama(prompt, model) {
  const ollamaBaseUrl = "http://localhost:11434/api/chat";
  
  const payload = {
    model: model,
    messages: [
      { role: "system", content: "你是一个熟悉 Jest 的前端测试工程师，只输出 Jest 测试代码。" },
      { role: "user", content: prompt },
    ],
    stream: false, // 不使用流式输出，简单处理
    options: {
      temperature: 0.2
    }
  };

  try {
    const response = await axios.post(ollamaBaseUrl, payload, {
      timeout: 120000, // 本地模型可能较慢，增加超时时间
    });
    return response.data.message.content || "";
  } catch (error) {
    // 尝试捕获更详细的错误信息
    const msg = error.response?.data?.error || error.message;
    throw new Error(`Ollama 调用失败: ${msg}`);
  }
}

/**
 * 统一调用 LLM 生成测试代码
 * 策略：根据 provider 参数选择调用
 * @param {string} prompt - 提示词
 * @param {string} provider - 提供商 ('zhipu' | 'ollama')
 * @param {string} model - 模型名称
 * @returns {Promise<string>} 生成的测试代码
 */
async function callLLMToGenerateTest(prompt, provider = 'zhipu', model = 'glm-4') {
  // 兜底用的 Stub 测试代码
  const stubTest = `
describe("auto generated test (Fallback)", () => {
  test("basic arithmetic", () => {
    expect(1 + 2).toBe(3);
  });
  test("fallback info", () => {
    console.log("模型调用均失败，这是降级生成的测试代码");
  });
});
`;

  console.log(`尝试调用 ${provider} (${model}) 生成测试代码...`);

  try {
    let content = "";
    if (provider === 'ollama') {
      content = await callOllama(prompt, model);
      console.log(`Ollama 生成的原始内容:`, content);
    } else if (provider === 'zhipu') {
      if (zhipuApiKey) {
        content = await callZhipuAI(prompt);
      } else {
        throw new Error("智谱 API Key 未配置");
      }
    } else {
      throw new Error(`未知的 Provider: ${provider}`);
    }
    return extractCodeFromContent(content);
  } catch (error) {
    console.error(`${provider} 调用出错:`, error.message);
  }

  // 失败使用 Stub 兜底
  console.log("使用 Stub 测试代码兜底");
  return stubTest;
}


/**
 * 主 API 接口：生成并运行测试
 * POST /api/generate-and-test
 */
app.post("/api/generate-and-test", async (req, res) => {
  try {
    const { code, provider, model } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code 字段不能为空" });
    }

    // 1. 构造 Prompt
    const prompt = buildPrompt(code);
    
    // 2. 调用大模型生成测试代码
    const useProvider = provider || 'zhipu';
    const useModel = model || (useProvider === 'ollama' ? 'deepseek-r1:1.5b' : 'glm-4');

    const testCode = await callLLMToGenerateTest(prompt, useProvider, useModel);
    const testCodeClean = normalizeGeneratedTestCode(testCode, code);

    // 3. 写入临时文件
    const { sourceFile, testFile } = writeTempFiles(code, testCodeClean);
    const sourceFileName = path.basename(sourceFile, '.js');

    // 4. 动态修正测试代码中的 require 路径
    let testContent = fs.readFileSync(testFile, 'utf-8');
    testContent = testContent.replace(/require\((['"])(.*?)(['"])\)/g, `require($1./${sourceFileName}$3)`);
    testContent = normalizeGeneratedTestCode(testContent, code);
    fs.writeFileSync(testFile, testContent, 'utf-8');
    
    // 5. 运行 Jest
    const jestResult = await runJest(testFile);

    // 6. 返回结果
    res.json({
      success: jestResult.code === 0,
      testCode: testContent, // 返回修正后的代码
      stdout: jestResult.stdout,
      stderr: jestResult.stderr,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "内部错误" });
  }
});

// 健康检查接口
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 启动服务器
const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log("---------------------------------------------------");
  console.log(`LLM 配置状态 (版本: v3):`);
  console.log(`- 智谱 API:  ${zhipuApiKey ? "✅ 已配置" : "❌ 未配置 (禁用)"}`);
  if (!zhipuApiKey) {
    console.log("⚠️  未检测到任何 Key，系统将运行在纯本地模式 (Stub Mode)");
  }
  console.log("---------------------------------------------------");
  console.log("提示: 自动导出功能已启用。");
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ 错误: 端口 ${port} 已被占用。请关闭旧的后端窗口后再重新启动。`);
    process.exit(1);
  }
});
