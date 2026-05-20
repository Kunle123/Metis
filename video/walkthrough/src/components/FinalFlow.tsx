import { Img, interpolate, staticFile } from "remotion";
import { COLORS } from "../theme";

const FLOW_STEPS = [
  "Scattered input",
  "Structured issue record",
  "Leadership-ready brief",
] as const;

export type FinalFlowProps = {
  progress: number;
};

export const FinalFlow: React.FC<FinalFlowProps> = ({ progress }) => {
  const logoOpacity = interpolate(progress, [0.3, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          marginBottom: 80,
        }}
      >
        {FLOW_STEPS.map((step, i) => {
          const stepProgress = interpolate(
            progress,
            [i * 0.22, i * 0.22 + 0.35],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div
                style={{
                  opacity: stepProgress,
                  transform: `translateY(${interpolate(stepProgress, [0, 1], [16, 0])}px)`,
                  padding: "20px 28px",
                  borderRadius: 18,
                  border: `1px solid ${COLORS.borderStrong}`,
                  background: "rgba(255,255,255,0.04)",
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 22,
                  fontWeight: 500,
                  color: COLORS.paper,
                  minWidth: 220,
                  textAlign: "center",
                }}
              >
                {step}
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div
                  style={{
                    opacity: interpolate(
                      progress,
                      [i * 0.22 + 0.2, i * 0.22 + 0.4],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                    ),
                    color: COLORS.brass,
                    fontSize: 28,
                  }}
                >
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Replace with your master logo asset if you update `public/metis-logo-300.png`. */}
      <div style={{ opacity: logoOpacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Img
          src={staticFile("metis-logo-300.png")}
          style={{ width: 96, height: 96, objectFit: "contain" }}
        />
        <div
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: COLORS.paper,
          }}
        >
          Metis
        </div>
      </div>
    </div>
  );
};
