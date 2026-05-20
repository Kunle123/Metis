import { interpolate } from "remotion";
import { COLORS } from "../theme";
import { panelStyle } from "./SceneChrome";

export type IssueWorkspaceProps = {
  /** 0–1 panel reveal */
  reveal: number;
  /** 0–1 column stagger */
  columnsReveal: number;
};

const COLUMNS = [
  { title: "Known", items: ["Ops status confirmed", "Site access restricted"], tone: COLORS.success },
  {
    title: "Uncertain",
    items: ["Timeline for reopening", "Third-party statement"],
    tone: COLORS.warning,
  },
  {
    title: "Briefing line",
    items: ["Leadership update due 17:00"],
    tone: COLORS.brass,
  },
] as const;

export const IssueWorkspace: React.FC<IssueWorkspaceProps> = ({
  reveal,
  columnsReveal,
}) => {
  const opacity = interpolate(reveal, [0, 0.35, 1], [0, 0.5, 1]);
  const y = interpolate(reveal, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "52%",
        transform: `translate(-50%, -50%) translateY(${y}px)`,
        opacity,
        width: 1280,
        ...panelStyle({ padding: 0, overflow: "hidden" }),
      }}
    >
      <div
        style={{
          padding: "22px 32px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 32,
            color: COLORS.paper,
          }}
        >
          Issue workspace
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 16,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.inkSoft,
          }}
        >
          Regional service disruption
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, minHeight: 320 }}>
        {COLUMNS.map((col, i) => {
          const colEnter = interpolate(
            columnsReveal,
            [i * 0.2, i * 0.2 + 0.45],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={col.title}
              style={{
                flex: 1,
                padding: "24px 28px",
                borderRight:
                  i < COLUMNS.length - 1
                    ? `1px solid ${COLORS.border}`
                    : undefined,
                opacity: colEnter,
                transform: `translateY(${interpolate(colEnter, [0, 1], [16, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: col.tone,
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {col.title}
              </div>
              {col.items.map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "14px 16px",
                    marginBottom: 10,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                    fontSize: 20,
                    color: COLORS.paper,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
