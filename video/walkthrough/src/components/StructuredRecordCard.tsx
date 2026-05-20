import { interpolate } from "remotion";
import { COLORS } from "../theme";

export type RecordCardType = "observation" | "claim" | "question";

const CARD_META: Record<
  RecordCardType,
  { label: string; sample: string; accent: string; bg: string }
> = {
  observation: {
    label: "Observation",
    sample: "Throughput reduced at regional hub since 14:00",
    accent: COLORS.info,
    bg: "rgba(100, 140, 180, 0.12)",
  },
  claim: {
    label: "Claim",
    sample: "No injuries reported on site",
    accent: COLORS.success,
    bg: COLORS.successBg,
  },
  question: {
    label: "Open question",
    sample: "When will normal service resume?",
    accent: COLORS.warning,
    bg: COLORS.warningBg,
  },
};

export type StructuredRecordCardProps = {
  type: RecordCardType;
  /** 0–1 extract animation */
  progress: number;
  index: number;
};

export const StructuredRecordCard: React.FC<StructuredRecordCardProps> = ({
  type,
  progress,
  index,
}) => {
  const meta = CARD_META[type];
  const x = 520 + index * 300;
  const y = interpolate(progress, [0, 1], [620, 480]);
  const opacity = interpolate(progress, [0, 0.35, 1], [0, 0.5, 1]);
  const scale = interpolate(progress, [0, 1], [0.92, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        width: 270,
        padding: "22px 24px",
        borderRadius: 22,
        background: meta.bg,
        border: `1px solid ${COLORS.borderStrong}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 2,
            background: meta.accent,
          }}
        />
        <div
          style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 14,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: meta.accent,
          }}
        >
          {meta.label}
        </div>
        {/* Subtle structure motif — not chatbot sparkle */}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: COLORS.inkSoft,
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          }}
        >
          Structured
        </div>
      </div>
      <div
        style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 20,
          lineHeight: 1.4,
          color: COLORS.paper,
        }}
      >
        {meta.sample}
      </div>
    </div>
  );
};
