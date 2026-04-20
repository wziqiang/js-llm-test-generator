# 基于大模型的自动化软件测试生成系统（Vue + Node + Jest）

本项目是一个用于毕业设计演示的“小型完整系统”，实现了：

- 前端：基于 **Vue 3 + Vite** 的单页应用  
- 后端：基于 **Node.js + Express** 的 REST API  
- 测试执行：使用 **Jest** 自动执行测试用例  

核心流程：**前端输入源代码 → 后端生成测试代码（预留大模型接口）→ 后端写入临时测试文件 → 调用 Jest 执行测试 → 返回测试执行结果并在前端展示**。

---

## 1. 目录结构

项目根目录（`js-llm-test-generator`）主要结构如下：

- `server.js`：后端入口文件（Express 服务 + Jest 调用）
- `jest.config.cjs`：Jest 配置文件（测试环境设置为 Node）
- `package.json`：后端项目配置与脚本
- `frontend/`：前端 Vue 3 + Vite 项目
  - `src/App.vue`：前端主界面，包含代码输入、测试代码展示和结果展示
  - 其它为 Vite 自动生成的前端脚手架文件
- `temp/`（运行后自动生成）：后端写入的临时源代码和测试代码文件目录

---

## 2. 环境要求

在本机运行本项目需要：

- Node.js（建议版本：18+）
- npm（随 Node 一起安装）
- 浏览器（Chrome / Edge 等现代浏览器）

---

## 3. 获取项目代码

如果已经在本机有完整项目文件（例如导师/同学给了你整个文件夹），只需要将整个 `js-llm-test-generator` 文件夹放在任意位置即可。


## 4. 安装依赖

### 4.1 后端依赖安装

在项目根目录 `js-llm-test-generator` 下执行：

```bash
cd js-llm-test-generator
npm install
```

会安装以下主要依赖：

- `express`：后端 Web 框架
- `jest`：测试框架
- `cross-env`：跨平台设置环境变量
- `cors`：跨域访问支持

### 4.2 前端依赖安装

切换到前端目录：

```bash
cd js-llm-test-generator\frontend
npm install
```

会安装 Vue 3、Vite 等前端依赖。

---

## 5. 启动步骤

### 步骤 1：启动后端服务（Node + Express + Jest）

在项目根目录 `js-llm-test-generator` 下打开终端，执行：

```bash
cd js-llm-test-generator
npm run dev
```

成功后终端会显示类似信息：

```bash
> js-llm-test-generator@1.0.0 dev
> cross-env NODE_ENV=development node server.js

Server listening on http://localhost:3000
```

说明后端服务已在 `http://localhost:3000` 启动。

> 提示：请保持该终端窗口打开，不要关闭，否则后端服务会停止。

### 步骤 2：启动前端开发服务器（Vue 3 + Vite）

再打开一个新的终端窗口，切换到前端目录：

```bash
cd js-llm-test-generator\frontend
npm run dev
```

成功后终端会显示类似信息：

```bash
> frontend@0.0.0 dev
> vite

  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5175/
```

说明前端开发服务器已在 `http://localhost:5175` 启动。

> 同样需要保持该终端窗口打开，前端页面才能正常访问。

### 步骤 3：在浏览器访问系统

打开浏览器，访问：

- 前端页面地址：<http://localhost:5175/>

如果一切正常，你会看到一个页面，包含：

- “源代码输入”文本框（默认有一个 `sum(a, b)` 示例函数）
- “生成并运行测试”按钮
- “生成的 Jest 测试代码”展示区
- “测试运行结果 (stdout / stderr)”展示区
- Standard Error (标准错误输出): Jest 默认使用这个通道来输出 测试报告本身 。这包括你看到的漂亮的 PASS / FAIL 状态、测试套件的摘要、花费的时间，以及测试失败时的错误详情。所以，你看到的所有测试结果都在这里是 完全正确 的。
- Standard Output (标准输出): 这个通道是留给 被测试代码内部 的 console.log() 输出的。也就是说，只有当你的函数内部或者测试代码内部写了 console.log() ，这里才会有内容。
function sum(a, b) {
  // 我们在这里加了一行日志输出
  console.log(`正在计算 ${a} + ${b}...`);
  return a + b;
}
---

## 6. 使用说明

### 6.1 基本使用流程

1. 在“源代码输入”文本框中输入或粘贴需要测试的 JavaScript 代码，例如一个函数或模块；
2. 点击“生成并运行测试”按钮；
3. 前端会向后端发送请求，后端会：
   - 生成对应的 Jest 测试代码（当前为示例 stub，预留大模型接口）
   - 将源代码和测试代码写入 `temp/` 目录下的临时文件
   - 调用 `npx jest` 执行测试，并收集 `stdout` / `stderr`
4. 执行结束后，前端会展示：
   - 生成的 Jest 测试代码；
   - Jest 的执行结果（通过/失败信息、日志输出等）。

### 6.2 注意事项

- 如果没有配置 **智谱 AI** 的 API Key，且未启动 **Ollama**，后端会使用内置的示例测试代码（Stub 模式），主要用于演示系统整体流程；
- 系统支持 **双模式**：既可以使用云端的智谱 AI (GLM-4)，也可以使用本地运行的 Ollama 模型（DeepSeek, Qwen 等）。

---

## 7. 接入大模型 (云端 + 本地)

系统支持两种大模型接入方式，可根据需要在前端界面灵活切换。

### 7.1 接入智谱 AI (云端 GLM-4)

后端已支持通过智谱 AI 开放平台生成测试代码，配置方式如下：

1. **修改配置文件**：

   打开项目根目录下的 `.env` 文件（如果没有则新建），添加或修改以下内容：

   ```env
   ZHIPU_API_KEY=你的智谱APIKey
   ZHIPU_MODEL=glm-4
   ```

   > 注意：智谱 API Key 格式通常为 `id.secret`。

2. **重启服务**：

   修改配置文件后，请关闭并重新运行后端服务。

3. **运行原理**：

   后端 `server.js` 会：
   - 读取 `ZHIPU_API_KEY` 并生成 JWT Token（有效期 1 小时）。
   - 调用 `https://open.bigmodel.cn/api/paas/v4/chat/completions` 接口。
   - 将 `buildPrompt(sourceCode)` 构造的 prompt 发送给 GLM-4 模型。
   - 自动提取返回内容中的测试代码并执行。

### 7.2 接入本地 Ollama 模型

系统支持直接调用本地运行的 Ollama 模型，无需 API Key，数据不上云，更加安全私密。

1. **准备工作**：
   - 请确保已安装并启动 [Ollama](https://ollama.com/)。
   - 确保 Ollama 服务监听在默认端口 `11434`。

---

## 8. 毕业论文测试样本集 (30 个)

为了验证系统生成测试用例的有效性，项目内置了一个包含 30 个典型 JavaScript 函数的测试样本集。这些样本涵盖了论文中提到的三大类别，可用于答辩时的功能演示和实验数据支撑。

样本文件：[test_samples.js](file:///c:/Users/27105/Desktop/dome/js-llm-test-generator/test_samples.js)

### 8.1 基础算法类 (1-10)
包含经典的计算机科学算法，逻辑清晰，边界明确：
- `fibonacci`: 斐波那契数列（递归）
- `quickSort`: 快速排序
- `binarySearch`: 二分查找
- `bubbleSort`: 冒泡排序
- `isPrime`: 质数判断
- `factorial`: 阶乘计算
- `reverseString`: 字符串反转
- `findMax`: 查找数组最大值
- `isPalindrome`: 回文字符串判断
- `uniqueArray`: 数组去重

### 8.2 数据处理类 (11-20)
模拟前端开发中常见的工具函数，涉及正则、对象操作和日期处理：
- `parseQueryParams`: URL 参数解析
- `validateEmail`: 邮箱格式校验
- `deepCloneSimple`: 对象深拷贝
- `formatDate`: 日期格式化 (YYYY-MM-DD)
- `camelToKebab`: 驼峰转连字符命名
- `flattenArray`: 嵌套数组展平
- `sortByProperty`: 对象数组排序
- `getCharFrequency`: 字符频率统计
- `truncateString`: 字符串截断加省略号
- `isEmptyObject`: 空对象判断

### 8.3 业务逻辑类 (21-30)
模拟真实的业务场景，逻辑相对复杂，包含条件分支和数值计算：
- `calculateCartTotal`: 购物车总价计算（含折扣和税费）
- `hasPermission`: 用户角色与权限校验
- `checkPasswordStrength`: 密码强度等级评估
- `getDistance`: 地理坐标两点间距离计算
- `getPagination`: 分页组件逻辑计算
- `extractPhoneNumbers`: 文本中手机号提取
- `convertToChineseCurrency`: 数字转人民币大写
- `generateRandomId`: 指定长度随机 ID 生成
- `prepareLoginParams`: 登录参数预处理（Base64 模拟）
- `getDaysDiff`: 两个日期之间的天数差计算

### 8.4 使用方法
在演示时，可以直接从 `test_samples.js` 中复制任意函数源码，粘贴到系统的“源代码输入”框中，点击“生成并运行测试”即可观察不同类别下的生成效果。
   - **快捷方式**：你可以运行项目根目录下的 `start_ollama.bat` 脚本，它会自动检查并启动 Ollama 服务，并列出当前已安装的模型。

2. **下载模型**：
   在使用前，请在终端运行以下命令下载所需模型（根据你的硬件配置选择）：

   ```bash
   ollama pull deepseek-coder:1.3b
   ollama pull deepseek-r1:1.5b
   ollama pull deepseek-r1:7b
   ollama pull qwen2.5:7b
   ```

3. **使用方式**：
   - 在前端界面“模型服务”中选择“本地 Ollama”。
   - 在“选择模型”下拉框中选择已下载的模型。
   - 点击生成测试即可。

---

## 8. 关键文件说明（与论文章节对应）

- 后端核心文件：  
  - `server.js`
    - `/api/generate-and-test`：完成“生成测试 + 写入临时文件 + 调用 Jest + 返回结果”的完整流程
    - `buildPrompt(sourceCode)`：构造给大模型的提示词（Prompt）
    - `callLLMToGenerateTest(prompt, provider, model)`：统一大模型调用入口，支持策略切换
    - `callOllama(prompt, model)`：**[新增]** 调用本地 Ollama 接口生成代码
    - `writeTempFiles(sourceCode, testCode)`：在 `temp/` 目录写入源代码和测试代码
    - `runJest(testFilePath)`：通过 `child_process` 调用 Jest，收集 stdout/stderr

- Jest 配置文件：  
  - `jest.config.cjs`：设置 `testEnvironment: "node"`，保证在 Node 环境下运行测试。

- 前端核心文件：  
  - `frontend/src/App.vue`
    - `sourceCode`：源代码输入状态
    - `generatedTest`：展示的测试代码
    - `stdout` / `stderr`：测试运行结果展示
    - `runGenerateAndTest()`：调用后端 API 的主要方法

这些文件和模块可以在论文中对应到：

- “测试代码生成模块”
- “测试执行模块”
- “前端展示模块”
- “系统整体架构与流程设计”

---

## 9. 后续扩展建议

在当前系统的基础上，可以进一步扩展：

1. **接入真实大模型 API**  
   在 `callLLMToGenerateTest` 中使用 `axios` 或 `fetch` 请求 DeepSeek / OpenAI 等，传入 `buildPrompt` 生成的 prompt，让模型直接输出 Jest 测试代码。

2. **完善错误分析模块**  
   将 Jest 失败时的 `stderr` 作为输入，再调用一次大模型，让其输出错误原因分析和修复建议，在前端新增“错误分析”展示区域。

3. **增加覆盖率统计和报告**  
   配置 Jest 的覆盖率统计，将覆盖率信息一并返回前端，在界面中展示，增强工程性和论文可写性。

通过上述扩展，可以让本项目更贴近真实工程实践，同时也为毕业论文提供更丰富的技术内容和实验结果。
