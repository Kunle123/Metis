import { interpolate } from "remotion";
import { COLORS } from "../theme";

export type FloatingInputKind =
  | "email"
  | "media"
  | "ops"
  | "exec"
  | "call"
  | "question";

const KIND_COLORS: Record<FloatingInputKind, string> = {
  email: COLORS.info,
  media: COLORS.warning,
  ops: COLORS.paperMuted,
  exec: COLORS.brass,
  call: COLORS.paperMuted,
  question: COLORS.warning,
};

export type FloatingInputCardProps = {
  label: string;
  kind: FloatingInputKind;
  x: number;
  y: number;
  rotation: number;
  /** 0–1 entrance */
  enter: number;
  /** 0–1 convergence toward centre (scene 2) */
  converge?: number;
  targetX?: number;
  targetY?: number;
};

export const FloatingInputCard: React.FC<FloatingInputCardProps> = ({
  label,
  kind,
  x,
  y,
  rotation,
  enter,
  converge = 0,
  targetX = 960,
  targetY = 540,
}) => {
  const cx = interpolate(converge, [0, 1], [x, targetX]);
  const cy = interpolate(converge, [0, 1], [y, targetY]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]) * interpolate(converge, [0, 1], [1, 0.55]);
  const opacity = interpolate(enter, [0, 0.4, 1], [0, 0.6, 1]);
  const rot = interpolate(converge, [0, 1], [rotation, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
        opacity,
        width: 280,
        padding: "18px 22px",
        borderRadius: 20,
        background: `linear-gradient(160deg, ${COLORS.surfaceElevated} 0%, ${COLORS.surface} 100%)`,
        border: `1px solid ${COLORS.borderStrong}`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: KIND_COLORS[kind],
          marginBottom: 10,
        }}
      />
      <div
        style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 22,
          fontWeight: 500,
          color: COLORS.paper,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
};
