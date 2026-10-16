/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * GitHub Pages não tem roteamento: um link /atf-consignado/<token> cairia no
 * 404. Servimos o próprio app como 404.html, e ele lê o token do caminho.
 */
const spaFallback = () => ({
  name: "spa-fallback-404",
  closeBundle() {
    const dist = resolve(import.meta.dirname, "dist");
    copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
  },
});

export default defineConfig({
  // GitHub Pages serve em /atf-consignado/; local continua em /.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss(), spaFallback()],
  // node_modules é symlink para node_modules.nosync (iCloud); sem isso o Vite
  // não reconhece as deps como node_modules e não pré-empacota o React.
  resolve: { preserveSymlinks: true },
  server: { watch: { ignored: ["**/node_modules.nosync/**"] } },
  test: { environment: "jsdom", css: false, include: ["src/**/*.test.{ts,tsx}"], setupFiles: ["src/test/setup.ts"] },
});
