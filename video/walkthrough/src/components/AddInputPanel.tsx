import { interpolate } from "remotion";
import { COLORS } from "../theme";
import { panelStyle } from "./SceneChrome";

const INPUT_TYPES = ["Operations", "Media", "Executive", "Field update"] as const;

export type AddInputPanelProps = {
  open: number;
  pasteProgress: number;
};

/** Replace fictional email subject/body in marketing exports if needed. */
const EMAIL_SNIPPET = {
  from: "Operations Control",
  subject: "Evening status — regional hub",
  body: "Confirming reduced throughput at the hub. Customer comms draft requested by 16:30. No injuries reported.",
};

export const AddInputPanel: React.FC<AddInputPanelProps> = ({
  open,
  pasteProgress,
}) => {
  const scale = interpolate(open, [0, 1], [0.96, 1]);
  const opacity = interpolate(open, [0, 0.25, 1], [0, 0.7, 1]);
  const bodyHeight = interpolate(pasteProgress, [0, 1], [0, 100]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "54%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        width: 1100,
        ...panelStyle({ padding: 36 }),
      }}
    >
      <div
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 36,
          color: COLORS.paper,
          marginBottom: 24,
        }}
      >
        Add input
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {INPUT_TYPES.map((type, i) => {
          const chipOn = interpolate(pasteProgress, [0.15 + i * 0.05, 0.35 + i * 0.05], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const active = type === "Operations";
          return (
            <div
              key={type}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 18,
                fontWeight: 500,
                opacity: chipOn,
                background: active
                  ? "rgba(184, 160, 120, 0.2)"
                  : "rgba(255,255,255,0.05)",
                border: active
                  ? `1px solid ${COLORS.brass}`
                  : `1px solid ${COLORS.border}`,
                color: active ? COLORS.brassSoft : COLORS.paperMuted,
              }}
            >
              {type}
            </div>
          );
        })}
      </div>
      <div
        style={{
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
          background: "rgba(0,0,0,0.25)",
          padding: 28,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 18,
            color: COLORS.inkSoft,
            marginBottom: 8,
          }}
        >
          {EMAIL_SNIPPET.from}
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.paper,
            marginBottom: 16,
          }}
        >
          {EMAIL_SNIPPET.subject}
        </div>
        <div
          style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 20,
            lineHeight: 1.5,
            color: COLORS.paperMuted,
            maxHeight: bodyHeight,
            overflow: "hidden",
          }}
        >
          {EMAIL_SNIPPET.body}
        </div>
      </div>
    </div>
  );
};
