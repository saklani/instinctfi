import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Custom twMerge instance that knows about our project-specific text-*
 * font-size utilities (display-*, heading, body, body-sm, mono-*, pill).
 * Without this, twMerge treats them as color utilities and silently drops
 * `text-cta-ink` / `text-accent-ink` etc. when a font-size class is also
 * applied — leaving buttons with inherited near-black text on near-black
 * backgrounds.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display-md",
            "heading",
            "body",
            "body-sm",
            "mono-xl",
            "mono-md",
            "mono-sm",
            "pill",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
