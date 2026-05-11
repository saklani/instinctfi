export type BarColor = "red" | "green";
export type Bar = {
  /** 0-indexed column */
  col: number;
  /** 0-indexed row of the bar's BOTTOM cell */
  row: number;
  /** number of cells tall */
  height: number;
  color: BarColor;
};

export const GRID = { cols: 50, rows: 18 } as const;

// Hand-tuned to evoke the mockup (sparse columns of red/green bars).
// Each entry is { col, row, height, color }.
// The exact arrangement is tunable — Phase 2 will replace this with live data.
export const BARS: Bar[] = [
  { col: 4,  row: 0, height: 7,  color: "red" },
  { col: 7,  row: 0, height: 4,  color: "green" },
  { col: 9,  row: 0, height: 9,  color: "red" },
  { col: 12, row: 0, height: 5,  color: "green" },
  { col: 14, row: 0, height: 11, color: "red" },
  { col: 17, row: 0, height: 6,  color: "red" },
  { col: 19, row: 0, height: 8,  color: "green" },
  { col: 22, row: 0, height: 3,  color: "red" },
  { col: 24, row: 0, height: 10, color: "green" },
  { col: 26, row: 0, height: 12, color: "green" },
  { col: 29, row: 0, height: 7,  color: "red" },
  { col: 31, row: 0, height: 9,  color: "green" },
  { col: 34, row: 0, height: 5,  color: "red" },
  { col: 37, row: 0, height: 8,  color: "green" },
  { col: 40, row: 0, height: 4,  color: "red" },
  { col: 43, row: 0, height: 11, color: "red" },
  { col: 46, row: 0, height: 6,  color: "green" },
  { col: 49, row: 0, height: 9,  color: "red" },
];
