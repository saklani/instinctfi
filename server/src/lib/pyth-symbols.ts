/**
 * Ticker → Pyth Benchmarks symbol map. Tickers without a mapping are skipped
 * by the daily price cron. Mirrors the registry in `scripts/fetch-ohlcv.ts`.
 */
export const PYTH_SYMBOLS: Record<string, string> = {
  // xStocks
  NVDAx: "Equity.US.NVDA/USD",
  GOOGLx: "Equity.US.GOOGL/USD",
  AMZNx: "Equity.US.AMZN/USD",
  AAPLx: "Equity.US.AAPL/USD",
  METAx: "Equity.US.META/USD",
  MSFTx: "Equity.US.MSFT/USD",
  TSLAx: "Equity.US.TSLA/USD",
  PLTRx: "Equity.US.PLTR/USD",
  HOODx: "Equity.US.HOOD/USD",
  COINx: "Equity.US.COIN/USD",
  CRCLx: "Equity.US.CRCL/USD",
  MSTRx: "Equity.US.MSTR/USD",
  STRCx: "Equity.US.STRC/USD",
  LLYx: "Equity.US.LLY/USD",
  NVOx: "Equity.US.NVO/USD",
  TMOx: "Equity.US.TMO/USD",
  DHRx: "Equity.US.DHR/USD",
  GLXYx: "Equity.US.GLXY/USD",
  // Ondo (use the same equity feed as the underlying)
  AVGOon: "Equity.US.AVGO/USD",
  METAon: "Equity.US.META/USD",
  CRWDon: "Equity.US.CRWD/USD",
  RKLBon: "Equity.US.RKLB/USD",
  UNHon: "Equity.US.UNH/USD",
  HIMSon: "Equity.US.HIMS/USD",
  VRTXon: "Equity.US.VRTX/USD",
  VNQon: "Equity.US.VNQ/USD",
  // Crypto
  SOL: "Crypto.SOL/USD",
  USDC: "Crypto.USDC/USD",
  BIO: "Crypto.BIO/USD",
  WBTC: "Crypto.BTC/USD",
  // Commodities — tokenized gold → spot XAU; Brent ETF → Brent spot.
  GLDx: "Metal.XAU/USD",
  BNOon: "Commodities.UKOILSPOT",
}

export const PYTH_BENCHMARKS_URL =
  "https://benchmarks.pyth.network/v1/shims/tradingview/history"
