/** Merkezi tema renkleri — tek yerden yönetim, ileride açık/koyu mod */
export const theme = {
  gold: "#d4a853",
  goldL: "#f0c87a",
  bg: "#07080d",
  card: "#10121c",
  brd: "#1c1f33",
  sub: "#6b7394",
  txt: "#dde0f0",
  BG_BLUEPRINT: "#001428",
} as const;

export type Theme = typeof theme;
