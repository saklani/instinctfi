// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
  experimental: {
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: "Inter Variable",
        cssVariable: "--font-instinct-sans",
        subsets: ["latin"],
      },
      {
        provider: fontProviders.fontsource(),
        name: "Bricolage Grotesque Variable",
        cssVariable: "--font-instinct-heading",
        subsets: ["latin"],
      },
    ],
  },
})
