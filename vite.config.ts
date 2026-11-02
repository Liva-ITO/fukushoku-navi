import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages のサブパスでも動くよう、相対パスで出力する
export default defineConfig({
  plugins: [react()],
  base: "./",
});
