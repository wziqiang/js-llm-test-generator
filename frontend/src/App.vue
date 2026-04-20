<script setup>
import { ref, computed, watch } from "vue";

const sourceCode = ref(
  `function sum(a, b) {
  console.log(\`[系统日志] 正在计算 \${a} + \${b}...\`);
  return a + b;
}

module.exports = { sum };`
);

const generatedTest = ref("");
const stdout = ref("");
const stderr = ref("");
const loading = ref(false);
const error = ref("");
const testSuccess = ref(null); // null: 未运行, true: PASS, false: FAIL

// AI 配置
const provider = ref('zhipu');
const model = ref('glm-4');

const providers = [
  { label: '智谱 AI (云端)', value: 'zhipu' },
  { label: '本地 Ollama', value: 'ollama' }
];

const modelOptions = {
  ollama: [
    'deepseek-coder:1.3b',
    'deepseek-r1:1.5b',
    'deepseek-r1:7b',
    'qwen2.5:7b'
  ],
  zhipu: ['glm-4']
};

const currentModelOptions = computed(() => modelOptions[provider.value] || []);

// 监听 provider 变化，重置 model
watch(provider, (newVal) => {
  if (modelOptions[newVal] && modelOptions[newVal].length > 0) {
    model.value = modelOptions[newVal][0];
  }
});

async function runGenerateAndTest() {
  error.value = "";
  stdout.value = "";
  stderr.value = "";
  generatedTest.value = "";
  testSuccess.value = null;
  loading.value = true;
  try {
    const resp = await fetch("http://localhost:3000/api/generate-and-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        code: sourceCode.value,
        provider: provider.value,
        model: model.value
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || "请求失败");
    }
    generatedTest.value = data.testCode || "";
    stdout.value = data.stdout || "";
    stderr.value = data.stderr || "";
    testSuccess.value = data.success;
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="app-container">
    <main class="page">
      <header class="page-header">
        <div class="header-content">
          <div class="logo-area">
            <div class="logo-icon">AI</div>
            <div>
              <h1 class="title">自动化软件测试生成系统</h1>
              <p class="subtitle">
                基于大模型 • Vue 3 • Node.js • Jest
              </p>
            </div>
          </div>
        </div>
        <div class="status-badge" :class="{ active: !loading }">
          <span class="dot"></span>
          <span class="status-label">后端服务</span>
          <span class="status-value">http://localhost:3000</span>
        </div>
      </header>

      <section class="layout">
        <section class="panel panel-left">
          <div class="panel-header">
            <h2 class="panel-title">
              <span class="icon">📝</span> 源代码输入
            </h2>
            <p class="panel-desc">
              在此处编写 JavaScript 函数，系统将自动生成 Jest 单元测试。
            </p>
          </div>

          <div class="config-area">
            <div class="config-item">
              <label>🤖 模型服务</label>
              <select v-model="provider">
                <option v-for="p in providers" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
            </div>
            <div class="config-item">
              <label>🧠 选择模型</label>
              <select v-model="model">
                <option v-for="m in currentModelOptions" :key="m" :value="m">
                  {{ m }}
                </option>
              </select>
            </div>
          </div>

          <div class="editor-wrapper">
            <textarea v-model="sourceCode" class="code-input" placeholder="// 请输入要测试的代码..."
              spellcheck="false"></textarea>
          </div>

          <div class="actions">
            <button class="primary-btn" @click="runGenerateAndTest" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              {{ loading ? "正在生成测试..." : "生成并运行测试" }}
            </button>
            <span v-if="loading" class="loading-text">AI 正在思考中...</span>
          </div>

          <transition name="fade">
            <div v-if="error" class="error-alert">
              <span class="error-icon">⚠️</span>
              <span class="error-msg">{{ error }}</span>
            </div>
          </transition>
        </section>

        <section class="panel panel-right">
          <div class="panel-block">
            <h2 class="panel-title">
              <span class="icon">🤖</span> 生成的 Jest 测试代码
            </h2>
            <div class="code-window">
              <div class="window-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
                <span class="filename">test.spec.js</span>
              </div>
              <pre class="code-view"
                :class="{ 'code-empty': !generatedTest }">{{ generatedTest || "// 等待生成测试代码..." }}</pre>
            </div>
          </div>

          <div class="panel-block">
            <div class="panel-header-with-badge">
              <h2 class="panel-title">
                <span class="icon">📊</span> 运行结果
              </h2>
              <transition name="fade">
                <div v-if="testSuccess !== null" class="status-badge-result"
                  :class="testSuccess ? 'pass' : 'fail'">
                  {{ testSuccess ? 'PASS' : 'FAIL' }}
                </div>
              </transition>
            </div>

            <div class="result-columns">
              <div class="result-column">
                <h3 class="result-sub-title">Standard Error</h3>
                <div class="code-window terminal">
                  <pre class="code-view terminal-view error-view"
                    :class="{ 'code-empty': !stderr }">{{ stderr || "// stderr empty" }}</pre>
                </div>
              </div>
              <div class="result-column">
                <h3 class="result-sub-title">Standard Output</h3>
                <div class="code-window terminal">
                  <pre class="code-view terminal-view"
                    :class="{ 'code-empty': !stdout }">{{ stdout || "// stdout empty" }}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.app-container {
  min-height: 100vh;
  background-color: #f8fafc;
  background-image:
    radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #334155;
}

.page {
  /* max-width: 1280px; */
  margin: 0 auto;
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.status-badge {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.status-badge:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
  margin-right: 8px;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}

.status-label {
  color: #64748b;
  margin-right: 6px;
  font-weight: 500;
}

.status-value {
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}

/* Layout */
.layout {
  display: flex;
  gap: 2rem;
  /* align-items: flex-start;
  margin: 0 20px 20px 20px; */
}

/* Panels */
.panel {
  background: white;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.panel:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
}

.panel-header {
  margin-bottom: 1.25rem;
}

.panel-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-title .icon {
  font-size: 1.2rem;
}

.panel-desc {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.panel-left {
  position: sticky;
  top: 2rem;
  width: 35%;
  flex-shrink: 0;
}

.panel-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  width: 65%;
  flex-grow: 1;
  min-width: 0; /* 防止内容撑开容器 */
}

.panel-block {
  background: white;
  border-radius: 16px;
  padding: 1.4rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.panel-header-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge-result {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-badge-result.pass {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-badge-result.fail {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Editor & Code */
.editor-wrapper {
  position: relative;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.editor-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.code-input {
  width: 100%;
  min-height: 300px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 1rem;
  border: none;
  outline: none;
  resize: vertical;
  background-color: #f8fafc;
  color: #334155;
}

/* Code Window Style */
.code-window {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.window-header {
  background: #0f172a;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #334155;
}

.window-header .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red {
  background: #ef4444;
}

.dot.yellow {
  background: #f59e0b;
}

.dot.green {
  background: #10b981;
}

.window-header .filename {
  margin-left: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
}

.code-view {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  background: transparent;
  border: none;
  overflow: auto; /* 同时支持垂直和水平滚动 */
  max-height: 400px; /* 限制代码展示区高度 */
  min-height: 120px;
}

.code-empty {
  color: #475569;
  font-style: italic;
}

/* Result Columns */
.result-columns {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.result-sub-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.terminal {
  background: #0f172a;
  /* Darker for terminal */
}

.terminal-view {
  color: #a5b4fc;
  /* Soft blue for stdout */
  white-space: pre-wrap; /* 允许终端输出自动换行，防止水平超出 */
  word-break: break-all;
}

.error-view {
  color: #fca5a5;
  /* Soft red for stderr */
}

/* Actions */
.actions {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 12px -1px rgba(37, 99, 235, 0.4);
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-text {
  font-size: 0.875rem;
  color: #64748b;
  animation: pulse 1.5s infinite;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

/* Error Alert */
.error-alert {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 12px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.error-icon {
  font-size: 1.1rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .layout {
    flex-direction: column;
    margin: 0;
    /* Reset or adjust margins for mobile if needed, or keep inherited */
  }

  .panel-left,
  .panel-right {
    width: 100%;
  }

  .panel-left {
    position: static;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .status-badge {
    width: 100%;
    justify-content: space-between;
  }
}

/* Config Area */
.config-area {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.config-item label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.config-item select {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: white;
  font-size: 0.9rem;
  color: #334155;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.config-item select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.config-item select:hover {
  border-color: #94a3b8;
}
</style>
