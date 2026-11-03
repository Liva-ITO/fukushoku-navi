import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 作った日時（デモ操作の帯に小さく出す）。2つのウィンドウが同じ版かを見分けるため
const stamp = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

// GitHub Pages のサブパスでも動くよう、相対パスで出力する
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: { __BUILD__: JSON.stringify(stamp) },
});
