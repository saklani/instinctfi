const NON_LIVE_VAULT_IDS = new Set<string>([
  "429cbfe8-04a3-4cff-b860-32e68c5aff61", // REVERSE CHAMATH
  "f3810cb7-47c9-4975-b3a3-f2fa0483a5e0", // Peptidemaxxing
  "46f91aac-5312-455e-ba55-196a9de08a9d", // ANTI FINANCE FINANCE CLUB
])

export function isLiveVault(vaultId: string): boolean {
  return !NON_LIVE_VAULT_IDS.has(vaultId)
}
