import { useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DepositForm } from "./deposit-form"

export function DesktopDepositButton({ vaultId, vaultName }: { vaultId: string; vaultName: string }) {
  const { ready, authenticated, login } = useWallet()
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (!ready) return
    if (!authenticated) { login(); return }
    setOpen(true)
  }

  return (
    <>
      <Button onClick={handleClick}>
        {!ready ? "Loading..." : !authenticated ? "Start Investing" : "Deposit"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{vaultName}</DialogTitle>
            <DialogDescription>Deposit USDC</DialogDescription>
          </DialogHeader>
          <DepositForm vaultId={vaultId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
