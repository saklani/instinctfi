/// <reference types="vitest/config" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-vite-plugin";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), tanstackRouter(), VitePWA({
    registerType: "autoUpdate",
    manifest: {
      name: "Instinct",
      short_name: "Instinct",
      description: "Your cheatcode to Internet Capital Markets. Curated tokenized stock baskets on Solana.",
      theme_color: "#FFFFFF",
      background_color: "#FFFFFF",
      display: "standalone",
      start_url: "/",
      icons: [{
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      }, {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }]
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
    }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          privy: ["@privy-io/react-auth"],
        }
      }
    }
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});