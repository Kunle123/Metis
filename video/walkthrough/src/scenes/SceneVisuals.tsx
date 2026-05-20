import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AddInputPanel } from "../components/AddInputPanel";
import { BenefitCard } from "../components/BenefitCard";
import {
  BriefDocument,
  BriefWorkspaceChrome,
} from "../components/BriefDocument";
import { BriefingRecordPanel } from "../components/BriefingRecordPanel";
import { FinalFlow } from "../components/FinalFlow";
import { FloatingInputCard } from "../components/FloatingInputCard";
import { IssueWorkspace } from "../components/IssueWorkspace";
import { ReviewPanel } from "../components/ReviewPanel";
import { StructuredRecordCard } from "../components/StructuredRecordCard";
import type { SceneDefinition } from "../scenes";
import { COLORS } from "../theme";
import { panelStyle } from "../components/SceneChrome";

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

const FLOATING_INPUTS = [
  { label: "Email update", kind: "email" as const, x: 420, y: 380, rotation: -6 },
  { label: "Media enquiry", kind: "media" as const, x: 1480, y: 420, rotation: 5 },
  { label: "Ops note", kind: "ops" as const, x: 520, y: 680, rotation: 4 },
  { label: "Exec request", kind: "exec" as const, x: 1380, y: 640, rotation: -4 },
  { label: "Call note", kind: "call" as const, x: 760, y: 520, rotation: 2 },
  { label: "Open question", kind: "question" as const, x: 1180, y: 560, rotation: -3 },
];

type SceneVisualsProps = {
  scene: SceneDefinition;
};

export const SceneVisuals: React.FC<SceneVisualsProps> = ({ scene }) => {
  const localFrame = useCurrentFrame();
  const durationInFrames = scene.durationInFrames;

  switch (scene.id) {
    case "scattered-inputs":
      return (
        <>
          {FLOATING_INPUTS.map((card, i) => (
            <FloatingInputCard
              key={card.label}
              {...card}
              enter={interpolate(
                localFrame,
                [i * 4, i * 4 + 18],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
              )}
            />
          ))}
        </>
      );

    case "issue-workspace": {
      const converge = interpolate(localFrame, [0, durationInFrames * 0.55], [0, 1], {
        extrapolateRight: "clamp",
        easing: ease,
      });
      return (
        <>
          {FLOATING_INPUTS.map((card, i) => (
            <FloatingInputCard
              key={card.label}
              {...card}
              enter={1}
              converge={converge}
              targetX={960}
              targetY={380}
            />
          ))}
          <IssueWorkspace
            reveal={interpolate(localFrame, [durationInFrames * 0.35, durationInFrames * 0.7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            })}
            columnsReveal={interpolate(localFrame, [durationInFrames * 0.5, durationInFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            })}
          />
        </>
      );
    }

    case "add-input":
      return (
        <AddInputPanel
          open={interpolate(localFrame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
            easing: ease,
          })}
          pasteProgress={interpolate(localFrame, [15, durationInFrames * 0.85], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}
        />
      );

    case "structure-input":
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              transform: "translateX(-50%)",
              width: 520,
              opacity: interpolate(localFrame, [0, 12], [1, 0.35], { extrapolateRight: "clamp" }),
              ...panelStyle({ padding: 20 }),
            }}
          >
            <div
              style={{
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 18,
                color: COLORS.inkSoft,
              }}
            >
              Input received — structuring…
            </div>
          </div>
          {(["observation", "claim", "question"] as const).map((type, i) => (
            <StructuredRecordCard
              key={type}
              type={type}
              index={i}
              progress={interpolate(
                localFrame,
                [20 + i * 18, 50 + i * 18],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
              )}
            />
          ))}
        </>
      );

    case "briefing-record":
      return (
        <BriefingRecordPanel
          completeness={interpolate(localFrame, [0, durationInFrames * 0.9], [0.15, 1], {
            extrapolateRight: "clamp",
            easing: ease,
          })}
        />
      );

    case "create-brief": {
      const transition = interpolate(localFrame, [0, durationInFrames * 0.45], [0, 1], {
        extrapolateRight: "clamp",
        easing: ease,
      });
      const briefForm = interpolate(localFrame, [durationInFrames * 0.4, durationInFrames * 0.85], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: ease,
      });
      return (
        <>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              transform: "translate(-50%, -50%)",
              opacity: 1 - transition,
            }}
          >
            <IssueWorkspace reveal={1} columnsReveal={1} />
          </div>
          <div style={{ opacity: transition }}>
            <BriefWorkspaceChrome
              showAudience={interpolate(localFrame, [8, 28], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              showCreate={interpolate(localFrame, [28, 50], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
            <div style={{ opacity: briefForm }}>
              <BriefDocument
                title="Draft leadership brief"
                compact
                sectionProgress={[
                  briefForm,
                  briefForm * 0.8,
                  briefForm * 0.6,
                  briefForm * 0.4,
                  briefForm * 0.3,
                ]}
              />
            </div>
          </div>
        </>
      );
    }

    case "leadership-brief": {
      const sectionProgress = BRIEF_SECTIONS_INDICES.map((_, i) =>
        interpolate(
          localFrame,
          [12 + i * 16, 36 + i * 16],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
        ),
      );
      return <BriefDocument sectionProgress={sectionProgress} />;
    }

    case "review":
      return (
        <ReviewPanel
          checkSource={interpolate(localFrame, [8, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}
          editWording={interpolate(localFrame, [35, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}
          approveSection={interpolate(localFrame, [durationInFrames * 0.55, durationInFrames * 0.85], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}
        />
      );

    case "benefits": {
      const fadeFragments = interpolate(localFrame, [0, 25], [1, 0], {
        extrapolateRight: "clamp",
      });
      const benefits = [
        "Fewer disconnected drafts",
        "Fewer lost decisions",
        "More briefing confidence",
      ];
      return (
        <>
          {FLOATING_INPUTS.slice(0, 4).map((card) => (
            <FloatingInputCard
              key={card.label}
              {...card}
              enter={fadeFragments}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "38%",
              transform: "translate(-50%, -50%)",
              opacity: interpolate(localFrame, [15, 35], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <BriefDocument
              title="Final brief"
              compact
              sectionProgress={[1, 1, 1, 1, 1]}
            />
          </div>
          {benefits.map((title, i) => (
            <BenefitCard
              key={title}
              title={title}
              index={i}
              progress={interpolate(
                localFrame,
                [30 + i * 14, 55 + i * 14],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
              )}
            />
          ))}
        </>
      );
    }

    case "closing":
      return (
        <FinalFlow
          progress={interpolate(localFrame, [0, durationInFrames * 0.9], [0, 1], {
            extrapolateRight: "clamp",
            easing: ease,
          })}
        />
      );

    default:
      return null;
  }
};

const BRIEF_SECTIONS_INDICES = [0, 1, 2, 3, 4];
