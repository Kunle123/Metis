import { interpolate } from "remotion";
import { COLORS } from "../theme";
import { panelStyle } from "./SceneChrome";

export const BRIEF_SECTIONS = [
  { title: "Current position", tone: COLORS.paper, preview: "Service disruption contained; customer comms in progress." },
  { title: "Key developments", tone: COLORS.info, preview: "Hub throughput reduced; executive briefing scheduled." },
  { title: "Risks", tone: COLORS.danger, preview: "Escalating media interest if timeline slips." },
  { title: "Open questions", tone: COLORS.warning, preview: "Reopening date; third-party statement timing." },
  { title: "Recommended next steps", tone: COLORS.brass, preview: "Approve holding statement; align regional leads." },
] as const;

export type BriefDocumentProps = {
  /** Per-section reveal 0–1 (length 5) */
  sectionProgress: readonly number[];
  title?: string;
  compact?: boolean;
};

export const BriefDocument: React.FC<BriefDocumentProps> = ({
  sectionProgress,
  title = "Leadership brief",
  compact = false,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: compact ? "54%" : "52%",
      transform: "translate(-50%, -50%)",
      width: compact ? 900 : 1000,
      ...panelStyle({ padding: compact ? 28 : 36 }),
    }}
  >
    <div
      style={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: compact ? 30 : 34,
        color: COLORS.paper,
        marginBottom: compact ? 20 : 28,
        paddingBottom: 16,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {title}
    </div>
    {BRIEF_SECTIONS.map((section, i) => {
      const p = sectionProgress[i] ?? 0;
      const opacity = interpolate(p, [0, 0.4, 1], [0, 0.6, 1]);
      const y = interpolate(p, [0, 1], [12, 0]);
      return (
        <div
          key={section.title}
          style={{
            opacity,
            transform: `translateY(${y}px)`,
            marginBottom: compact ? 14 : 18,
            padding: compact ? "12px 0" : "14px 0",
            borderBottom:
              i < BRIEF_SECTIONS.length - 1
                ? `1px solid ${COLORS.border}`
                : undefined,
          }}
        >
          <div
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: section.tone,
              marginBottom: 8,
            }}
          >
            {section.title}
          </div>
          <div
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: compact ? 18 : 20,
              color: COLORS.paperMuted,
              lineHeight: 1.4,
            }}
          >
            {section.preview}
          </div>
        </div>
      );
    })}
  </div>
);

export type BriefWorkspaceChromeProps = {
  showAudience: number;
  showCreate: number;
};

export const BriefWorkspaceChrome: React.FC<BriefWorkspaceChromeProps> = ({
  showAudience,
  showCreate,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: 200,
      transform: "translateX(-50%)",
      display: "flex",
      gap: 24,
      alignItems: "center",
      opacity: showAudience,
    }}
  >
    <div
      style={{
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 18,
        color: COLORS.inkSoft,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      Brief workspace
    </div>
    <div
      style={{
        padding: "12px 22px",
        borderRadius: 14,
        border: `1px solid ${COLORS.borderStrong}`,
        background: "rgba(255,255,255,0.05)",
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 20,
        color: COLORS.paper,
      }}
    >
      Audience: Leadership team
    </div>
    <div
      style={{
        padding: "14px 28px",
        borderRadius: 14,
        background: COLORS.brass,
        color: COLORS.frame,
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 20,
        fontWeight: 600,
        opacity: interpolate(showCreate, [0, 1], [0.4, 1]),
        transform: `scale(${interpolate(showCreate, [0, 1], [0.98, 1])})`,
      }}
    >
      Create brief
    </div>
  </div>
);
