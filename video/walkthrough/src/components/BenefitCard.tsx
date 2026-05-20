import { interpolate } from "remotion";
import { COLORS } from "../theme";

export type BenefitCardProps = {
  title: string;
  index: number;
  progress: number;
};

export const BenefitCard: React.FC<BenefitCardProps> = ({
  title,
  index,
  progress,
}) => {
  const x = 360 + index * 400;
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 0.5, 1]);
  const y = interpolate(progress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 620,
        transform: `translate(-50%, 0) translateY(${y}px)`,
        opacity,
        width: 340,
        padding: "28px 32px",
        borderRadius: 22,
        background: `linear-gradient(160deg, ${COLORS.surfaceElevated}, ${COLORS.surface})`,
        border: `1px solid ${COLORS.borderStrong}`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 3,
          background: COLORS.brass,
          borderRadius: 2,
          marginBottom: 18,
        }}
      />
      <div
        style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 24,
          fontWeight: 500,
          color: COLORS.paper,
          lineHeight: 1.35,
        }}
      >
        {title}
      </div>
    </div>
  );
};
