import * as React from "react"

import { Column } from "@/components/ui/column"
import { Row } from "@/components/ui/row"

const YEAR = new Date().getFullYear()

const SOCIALS = [
  {
    label: "Telegram",
    href: "https://t.me/+zYR_6cl-wa03N2M1",
    icon: "telegram" as const,
  },
  {
    label: "X",
    href: "https://x.com/instinctxyz",
    icon: "x" as const,
  },
]

function detectStandalone() {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function Footer() {
  const [standalone, setStandalone] = React.useState(detectStandalone)

  React.useEffect(() => {
    const mq = window.matchMedia?.("(display-mode: standalone)")
    if (!mq) return
    const onChange = () => setStandalone(detectStandalone())
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])

  if (standalone) return null

  return (
    <footer className="hidden md:flex mx-auto w-full max-w-7xl flex-col gap-8 px-6 lg:px-16 pt-16 pb-12">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      <Column className="gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <Column className="items-start gap-3 max-w-sm">
          <img src="/instinct_wordmark.svg" alt="Instinct" className="h-5" />
          <p className="text-sm">
            Curated tokenized stock vaults on Solana, track the smartest money
            through Instinct equity vaults
          </p>
        </Column>

        <Column className="gap-3">
          <span className="eyebrow">Follow</span>
          <Row className="items-center">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="inline-flex size-9 items-center justify-center rounded-full border border-black/5 bg-white text-foreground transition-all hover:border-black/10 hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {s.icon === "telegram" && (
                    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                  )}
                  {s.icon === "x" && (
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  )}
                </svg>
              </a>
            ))}
          </Row>
        </Column>
      </Column>

      <Row className="justify-between text-xs text-muted-foreground">
        <span>© {YEAR} Instinct, All rights reserved</span>
        <span>Built on Solana</span>
      </Row>
    </footer>
  )
}
