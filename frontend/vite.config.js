import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  server: {
    port: 5175, // 你想要的端口
    open: true, // 可选：启动自动打开浏览器
  },
});
