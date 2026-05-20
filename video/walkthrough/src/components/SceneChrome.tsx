import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";

/** Dark command-room atmosphere — matches Metis body gradients (subtle, not flashy). */
export const SceneBackground: React.FC<{ children?: ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill
    style={{
      background: `
        radial-gradient(ellipse 80% 60% at 70% 20%, rgba(164, 132, 82, 0.07), transparent 55%),
        radial-gradient(ellipse 60% 50% at 15% 80%, rgba(60, 90, 110, 0.08), transparent 50%),
        radial-gradient(ellipse 50% 40% at 50% 100%, rgba(50, 80, 60, 0.06), transparent 45%),
        linear-gradient(165deg, ${COLORS.frame} 0%, #0a0c12 45%, ${COLORS.frameSoft} 100%)
      `,
    }}
  >
    {children}
  </AbsoluteFill>
);

export const SceneHeadline: React.FC<{
  headline: string;
  subline: string;
  opacity?: number;
}> = ({ headline, subline, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      top: 72,
      left: 96,
      right: 96,
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: 52,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: COLORS.paper,
        lineHeight: 1.15,
      }}
    >
      {headline}
    </div>
    <div
      style={{
        marginTop: 12,
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 26,
        fontWeight: 400,
        color: COLORS.paperMuted,
        letterSpacing: "0.02em",
      }}
    >
      {subline}
    </div>
  </div>
);

/** Optional lower-third captions — readable on mobile, not dominant. */
export const Subtitles: React.FC<{ text: string; opacity?: number }> = ({
  text,
  opacity = 0.92,
}) => (
  <div
    style={{
      position: "absolute",
      left: 96,
      right: 96,
      bottom: 56,
      display: "flex",
      justifyContent: "center",
      opacity,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        maxWidth: 1400,
        padding: "14px 28px",
        borderRadius: 12,
        background: "rgba(8, 10, 16, 0.72)",
        border: `1px solid ${COLORS.border}`,
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 22,
        lineHeight: 1.45,
        color: COLORS.paperMuted,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </div>
);

export const panelStyle = (extra?: CSSProperties): CSSProperties => ({
  background: `linear-gradient(145deg, ${COLORS.surface} 0%, ${COLORS.rail} 100%)`,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 28,
  boxShadow: "0 24px 72px rgba(0,0,0,0.26)",
  ...extra,
});
