import { useInstallPrompt } from "@/hooks/use-install-prompt"
import { Button } from "@/components/ui/button"
import { Row } from "@/components/ui/row"

export function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm p-4">
      <div className="mx-auto max-w-2xl">
        <Row className="items-center justify-between">
          <div>
            <p className="text-sm font-medium">Install Instinct</p>
            <p className="text-xs text-muted-foreground">
              Add to home screen for the best experience
            </p>
          </div>
          <Row>
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Not now
            </Button>
            <Button size="sm" onClick={install}>
              Install
            </Button>
          </Row>
        </Row>
      </div>
    </div>
  )
}
