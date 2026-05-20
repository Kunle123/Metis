import { interpolate } from "remotion";
import { COLORS } from "../theme";
import { panelStyle } from "./SceneChrome";
import { SourceBadge } from "./SourceBadge";

export type BriefingRecordPanelProps = {
  completeness: number;
};

export const BriefingRecordPanel: React.FC<BriefingRecordPanelProps> = ({
  completeness,
}) => {
  const opacity = interpolate(completeness, [0, 0.3, 1], [0, 0.6, 1]);
  const badgeReveal = interpolate(completeness, [0.2, 0.55, 0.85], [0, 0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "54%",
        transform: "translate(-50%, -50%)",
        opacity,
        width: 1050,
        ...panelStyle({ padding: 36 }),
      }}
    >
      <div
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: 34,
          color: COLORS.paper,
          marginBottom: 24,
        }}
      >
        Issue record
      </div>
      <div
        style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 22,
          color: COLORS.paper,
          lineHeight: 1.5,
          marginBottom: 28,
          padding: "20px 24px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        Regional hub operating below normal capacity. Customer-facing teams preparing holding statement.
      </div>
      <div style={{ opacity: badgeReveal }}>
        <SourceBadge label="Source attached" variant="source" />
        <SourceBadge label="Confidence: emerging" variant="confidence" />
        <SourceBadge label="Still unresolved" variant="unresolved" />
      </div>
      <div
        style={{
          marginTop: 24,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${completeness * 100}%`,
            height: "100%",
            background: COLORS.brass,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};
