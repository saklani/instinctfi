import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-vite-plugin"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tanstackRouter(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Instinct",
        short_name: "Instinct",
        description: "Invest like the 1%. Tokenized US equities on Solana.",
        theme_color: "#0D0D0D",
        background_color: "#0D0D0D",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
    nodePolyfills({ include: ["buffer", "crypto", "stream", "util"] }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
