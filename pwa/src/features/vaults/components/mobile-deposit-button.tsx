import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DepositForm } from "./deposit-form"

export function MobileDepositButton({ vaultId, vaultName }: { vaultId: string; vaultName: string }) {
  const { ready, authenticated, login } = useWallet()
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (!ready) return
    if (!authenticated) { login(); return }
    setOpen(true)
  }

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-24 left-4 right-4 z-40 shadow-lg md:hidden"
        onClick={handleClick}
      >
        {!ready ? "Loading..." : !authenticated ? "Connect Wallet" : "Deposit"}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="px-4 pb-16">
          <div className="mx-auto mt-3 h-1 w-10 bg-muted-foreground/20" />
          <SheetHeader className="px-0">
            <SheetTitle>Deposit USDC in {vaultName}</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          <DepositForm vaultId={vaultId} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
