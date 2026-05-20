import { interpolate } from "remotion";
import { COLORS } from "../theme";
import { panelStyle } from "./SceneChrome";
import { SourceBadge } from "./SourceBadge";

export type ReviewPanelProps = {
  checkSource: number;
  editWording: number;
  approveSection: number;
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  checkSource,
  editWording,
  approveSection,
}) => {
  const evidenceOpacity = interpolate(checkSource, [0, 1], [0, 1]);
  const editHighlight = interpolate(editWording, [0, 0.5, 1], [0, 1, 0.35]);
  const approved = approveSection > 0.6;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          transform: "translate(-50%, -50%)",
          width: 720,
          ...panelStyle({ padding: 32 }),
        }}
      >
        <div
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 32,
            color: COLORS.paper,
            marginBottom: 20,
          }}
        >
          Draft review
        </div>
        <div
          style={{
            padding: "18px 20px",
            borderRadius: 16,
            border: `1px solid ${editHighlight > 0.2 ? COLORS.brass : COLORS.border}`,
            background:
              editHighlight > 0.2
                ? "rgba(184, 160, 120, 0.08)"
                : "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: COLORS.inkSoft,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              marginBottom: 8,
            }}
          >
            Current position
          </div>
          <div
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 22,
              color: COLORS.paper,
              lineHeight: 1.45,
            }}
          >
            Service disruption contained; customer communications underway.
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SourceBadge label="Source attached" variant="source" />
          {approved && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: COLORS.successBg,
                border: `1px solid rgba(90, 130, 100, 0.4)`,
                color: COLORS.success,
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ✓ Ready to circulate
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 120,
          top: "42%",
          width: 380,
          opacity: evidenceOpacity,
          transform: `translateX(${interpolate(checkSource, [0, 1], [24, 0])}px)`,
          ...panelStyle({ padding: 24 }),
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.info,
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Evidence
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 18,
            color: COLORS.paperMuted,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          Ops control email — 14:22
        </div>
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(0,0,0,0.2)",
            border: `1px solid ${COLORS.border}`,
            fontSize: 17,
            color: COLORS.paper,
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          }}
        >
          “Reduced throughput at hub; no injuries reported.”
        </div>
      </div>
    </>
  );
};
