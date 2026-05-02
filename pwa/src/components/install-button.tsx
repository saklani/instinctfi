import * as React from "react"
import { Download, Plus, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type InstallButtonProps = {
  className?: string
  /** Force-render in iOS instructions mode — Storybook only. */
  forceIOS?: boolean
  /** Force-render the standard install pill — Storybook only. */
  forceInstallable?: boolean
}

function detectIOS() {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document)
  return isIOSDevice
}

function detectStandalone() {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function InstallButton({
  className,
  forceIOS,
  forceInstallable,
}: InstallButtonProps = {}) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = React.useState(() =>
    forceIOS || forceInstallable ? false : detectStandalone(),
  )
  const [isIOS] = React.useState(() =>
    forceIOS || forceInstallable ? false : detectIOS(),
  )
  const [iosOpen, setIosOpen] = React.useState(false)

  React.useEffect(() => {
    if (forceIOS || forceInstallable) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
      setStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [forceIOS, forceInstallable])

  if (standalone) return null

  const showIOS = forceIOS ?? (isIOS && !deferredPrompt)
  const showInstall = forceInstallable ?? !!deferredPrompt

  if (!showIOS && !showInstall) return null

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") setDeferredPrompt(null)
      return
    }
    setIosOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={cn("gap-1.5", className)}
        aria-label="Install app"
      >
        <Download className="size-4" aria-hidden />
        <span className="hidden md:inline">Install</span>
      </Button>

      <Sheet open={iosOpen} onOpenChange={setIosOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-card bg-surface p-0 sm:max-w-lg sm:mx-auto"
        >
          <SheetHeader className="gap-2 pb-2">
            <SheetTitle className="text-heading">Install Instinct</SheetTitle>
            <SheetDescription className="text-body-sm">
              Add to your Home Screen for full-screen access and push-quick launch.
            </SheetDescription>
          </SheetHeader>
          <ol className="flex flex-col gap-3 px-6 pb-8 text-body-sm text-ink">
            <Step n={1}>
              Tap the <Share className="inline size-4 align-text-bottom" aria-hidden />{" "}
              <span className="font-medium">Share</span> icon in Safari&rsquo;s toolbar.
            </Step>
            <Step n={2}>
              Scroll down and choose{" "}
              <span className="font-medium">Add to Home Screen</span>{" "}
              <Plus className="inline size-4 align-text-bottom" aria-hidden />.
            </Step>
            <Step n={3}>
              Tap <span className="font-medium">Add</span> in the top-right
              corner.
            </Step>
          </ol>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-mono-sm text-ink"
      >
        {n}
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  )
}
