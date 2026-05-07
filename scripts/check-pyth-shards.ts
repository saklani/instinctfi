/**
 * For a given feed ID, find which shard the on-chain account lives at on mainnet.
 * Useful because different operators push to different shards.
 */

import { Connection, PublicKey } from "@solana/web3.js"
import { getPriceFeedAccountForProgram } from "@pythnetwork/pyth-solana-receiver"

// Push Oracle program — what actually creates price feed account PDAs.
const PUSH_ORACLE_PROGRAM_ID = new PublicKey("pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT")

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=7ab8b174-ab40-4c2a-aef7-93a19dbd364c"

const FEEDS: Array<{ ticker: string; feedId: string }> = [
  // Existing on-chain (sanity check)
  { ticker: "NVDA",  feedId: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593" },
  // New equity feeds we need
  { ticker: "LLY",   feedId: "70dcf5fd56553d0023693e4b590336a8c9bcfd0d98dd9f093b1f697820d98325" },
  { ticker: "NVO",   feedId: "8dde322496e031d942b9eee8ca769d618cd2e69b18196644369379f5a1e7c23d" },
  { ticker: "TMO",   feedId: "244fdf268ed7ecfad2cf84529c46d0fcef7a643428ff4ef8b16e8dbb63e0f2d9" },
  { ticker: "DHR",   feedId: "725ae6c67201359f9601d6ee8228c821f0abc93fef5cc509acfcee3f7bc2a388" },
  { ticker: "VRTX",  feedId: "ac9de86ae3dcff03514bde733f5793f1446b2cd31f1539a1c449acc3e76cacc1" },
  { ticker: "GLXY",  feedId: "67e031d1723e5c89e4a826d80b2f3b41a91b05ef6122d523b8829a02e0f563aa" },
  { ticker: "RKLB",  feedId: "40589e289317e4fbd997b1a267606e20a1cc7c3e4689f9e5a5992957917816c8" },
  { ticker: "UNH",   feedId: "05380f8817eb1316c0b35ac19c3caa92c9aa9ea6be1555986c46dce97fed6afd" },
  { ticker: "HIMS",  feedId: "2132cbc333161e94b91da745ed73b1450410fdc870f2235bf628c28da358b652" },
  { ticker: "VNQ",   feedId: "1feb5bc35d3a601d1e39c4d1dd65de285a04f5e7923fdaba1d87359d8c14a9ae" },
  { ticker: "AVGO",  feedId: "d0c9aef79b28308b256db7742a0a9b08aaa5009db67a52ea7fa30ed6853f243b" },
  { ticker: "CRWD",  feedId: "baed936d3c6c2e34104e92c6b015b97ce96adc5ab4f04230c1270e1162e7a270" },
  // Crypto
  { ticker: "BIO",   feedId: "d9d22050e7413a16129f1334cd4dd5a359975ce16389cdadae8f677cf46e2839" },
  { ticker: "AI16Z", feedId: "2551eca7784671173def2c41e6f3e51e11cd87494863f1d208fdd8c64a1f85ae" },
]

async function main() {
  const conn = new Connection(RPC_URL, "confirmed")

  for (const f of FEEDS) {
    const candidates: { shard: number; pda: PublicKey }[] = []
    for (let shard = 0; shard < 8; shard++) {
      candidates.push({
        shard,
        pda: getPriceFeedAccountForProgram(shard, f.feedId, PUSH_ORACLE_PROGRAM_ID),
      })
    }
    const infos = await conn.getMultipleAccountsInfo(candidates.map((c) => c.pda))
    const found = candidates.find((_, i) => infos[i] != null)
    if (found) {
      console.log(`${f.ticker.padEnd(7)} ${found.pda.toBase58()}  shard=${found.shard}  ✓`)
    } else {
      const pda = candidates[0].pda.toBase58()
      console.log(`${f.ticker.padEnd(7)} ${pda}  shard=0  ✗ needs push`)
    }
  }
}

main().catch(console.error)
