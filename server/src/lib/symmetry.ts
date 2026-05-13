import { Connection } from "@solana/web3.js"
import { SymmetryCore } from "@symmetry-hq/sdk"

const RPC_URL = process.env.RPC_URL!

let sdk: SymmetryCore | null = null
const connection = new Connection(RPC_URL, "confirmed")

function getSDK() {
  if (!sdk) {
    sdk = new SymmetryCore({
      connection,
      network: "mainnet",
      priorityFee: 100_000,
    })
  }
  return sdk
}

export async function fetchVault(vaultAddress: string) {
  const sdk = getSDK()
  let vault = await sdk.fetchVault(vaultAddress)
  vault = await sdk.loadVaultPrice(vault)
  return vault
}
