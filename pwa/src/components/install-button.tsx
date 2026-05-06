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

export function InstallButton({ className }: InstallButtonProps = {}) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = React.useState(detectStandalone)
  const [isIOS] = React.useState(detectIOS)
  const [iosOpen, setIosOpen] = React.useState(false)

  React.useEffect(() => {
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
  }, [])

  if (standalone) return null

  const showIOS = isIOS && !deferredPrompt
  const showInstall = !!deferredPrompt

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
        className={cn("gap-1.5 md:hidden", className)}
        aria-label="Install app"
      >
        <Download className="size-4" aria-hidden />
      </Button>

      <Sheet open={iosOpen} onOpenChange={setIosOpen}>
        <SheetContent
          side="bottom"
          className="bg-card sm:mx-auto sm:max-w-lg"
        >
          <SheetHeader className="gap-2 pb-2">
            <SheetTitle>Install Instinct</SheetTitle>
            <SheetDescription>
              Add to your Home Screen for full-screen access and quick launch.
            </SheetDescription>
          </SheetHeader>
          <ol className="flex flex-col gap-3 px-6 pb-8 text-sm text-foreground">
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
        className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs tabular-nums text-foreground"
      >
        {n}
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  )
}
