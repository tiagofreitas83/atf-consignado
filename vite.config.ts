/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages serve em /atf-consignado/; local continua em /.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  // node_modules é symlink para node_modules.nosync (iCloud); sem isso o Vite
  // não reconhece as deps como node_modules e não pré-empacota o React.
  resolve: { preserveSymlinks: true },
  server: { watch: { ignored: ["**/node_modules.nosync/**"] } },
  test: { environment: "jsdom", css: false, include: ["src/**/*.test.{ts,tsx}"], setupFiles: ["src/test/setup.ts"] },
});
