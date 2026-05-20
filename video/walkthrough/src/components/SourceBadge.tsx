import { COLORS } from "../theme";

export type SourceBadgeProps = {
  label: string;
  variant?: "source" | "confidence" | "unresolved";
};

const VARIANT_STYLES = {
  source: {
    color: COLORS.info,
    bg: "rgba(100, 140, 180, 0.15)",
    border: "rgba(100, 140, 180, 0.35)",
  },
  confidence: {
    color: COLORS.paperMuted,
    bg: "rgba(255,255,255,0.06)",
    border: COLORS.border,
  },
  unresolved: {
    color: COLORS.warning,
    bg: COLORS.warningBg,
    border: "rgba(180, 140, 70, 0.35)",
  },
} as const;

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  label,
  variant = "source",
}) => {
  const v = VARIANT_STYLES[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: 999,
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 16,
        fontWeight: 500,
        color: v.color,
        background: v.bg,
        border: `1px solid ${v.border}`,
        marginRight: 10,
        marginBottom: 10,
      }}
    >
      {label}
    </span>
  );
};
