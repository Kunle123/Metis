/** Brand tokens aligned with `app/globals.css` (dark editorial). */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
  /** Total duration ~2:00 — must match sum of scene durations in `scenes.ts`. */
  durationInSeconds: 120,
} as const;

export const COLORS = {
  frame: "#0f1118",
  frameSoft: "#181c26",
  surface: "#1e2433",
  surfaceElevated: "#262f42",
  rail: "#1a1f2c",
  paper: "#f2efe8",
  paperMuted: "#c8c4bc",
  inkSoft: "#9a968f",
  brass: "#b8a078",
  brassSoft: "#d4c4a0",
  info: "#8eb4d4",
  success: "#7a9e82",
  successBg: "rgba(90, 130, 100, 0.22)",
  warning: "#c9a86a",
  warningBg: "rgba(180, 140, 70, 0.2)",
  danger: "#c47a7a",
  dangerBg: "rgba(160, 90, 90, 0.2)",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
} as const;

export const FONTS = {
  display: '"Cormorant Garamond", Georgia, serif',
  ui: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
} as const;

export const RADIUS = {
  card: 28,
  panel: 22,
  chip: 999,
} as const;
