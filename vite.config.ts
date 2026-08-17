import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "dist/**"],
    fileParallelism: false,
    setupFiles: ["./vitest.setup.ts"],
    environment: "jsdom",
    globals: true,
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/trpc": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/auth/callback": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
