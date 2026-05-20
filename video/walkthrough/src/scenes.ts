import { VIDEO } from "./theme";

/** Frame-accurate scene boundaries — keep in sync with voiceover edit. */
export const FPS = VIDEO.fps;

export type SceneId =
  | "scattered-inputs"
  | "issue-workspace"
  | "add-input"
  | "structure-input"
  | "briefing-record"
  | "create-brief"
  | "leadership-brief"
  | "review"
  | "benefits"
  | "closing";

export type SceneDefinition = {
  id: SceneId;
  /** Scene index 1–10 for comments / exports */
  index: number;
  /** Inclusive start frame (0-based) */
  startFrame: number;
  /** Scene length in frames */
  durationInFrames: number;
  /** Human-readable range for editors */
  timeRange: string;
  voiceover: string;
  headline: string;
  subline: string;
};

/** Replace voiceover copy here when the script is finalised. */
const SCENE_DATA: Omit<SceneDefinition, "startFrame">[] = [
  {
    id: "scattered-inputs",
    index: 1,
    durationInFrames: 8 * FPS,
    timeRange: "00:00–00:08",
    voiceover:
      "When an issue is moving quickly, the problem is rarely a lack of information. It is that the information is scattered across emails, updates, calls, documents and unanswered questions.",
    headline: "Fast-moving issue?",
    subline: "Inputs everywhere.",
  },
  {
    id: "issue-workspace",
    index: 2,
    durationInFrames: 10 * FPS,
    timeRange: "00:08–00:18",
    voiceover:
      "In Metis, we start by opening the issue workspace. This gives the team one place to collect what is known, what is still uncertain, and what needs to be turned into a clear briefing line.",
    headline: "One issue workspace",
    subline: "Known. Uncertain. Ready to brief.",
  },
  {
    id: "add-input",
    index: 3,
    durationInFrames: 14 * FPS,
    timeRange: "00:18–00:32",
    voiceover:
      "Here, we add a new input. This could be an email from operations, a media enquiry, a note from the executive team, or an update from a colleague on the ground.",
    headline: "Add input",
    subline: "Email, enquiry, note or update",
  },
  {
    id: "structure-input",
    index: 4,
    durationInFrames: 13 * FPS,
    timeRange: "00:32–00:45",
    voiceover:
      "As the input is added, Metis helps structure the information. Important claims, observations and possible gaps are pulled into the issue record, so the team can see the shape of the situation more clearly.",
    headline: "Structure the input",
    subline: "Observations. Claims. Open questions.",
  },
  {
    id: "briefing-record",
    index: 5,
    durationInFrames: 13 * FPS,
    timeRange: "00:45–00:58",
    voiceover:
      "The aim is not just to produce words. It is to build a briefing record that shows what the organisation knows, where the evidence came from, and what is still unresolved.",
    headline: "Not just words",
    subline: "A briefing record with evidence",
  },
  {
    id: "create-brief",
    index: 6,
    durationInFrames: 12 * FPS,
    timeRange: "00:58–01:10",
    voiceover:
      "From here, we can move into the brief. Metis uses the issue record, the selected audience, and the available source material to prepare a draft briefing for leadership.",
    headline: "Create brief",
    subline: "Built from the issue record",
  },
  {
    id: "leadership-brief",
    index: 7,
    durationInFrames: 14 * FPS,
    timeRange: "01:10–01:24",
    voiceover:
      "The brief brings together the current position, key developments, risks, open questions and recommended next steps. It gives senior leaders a clear view without forcing the comms team to rebuild the story from scratch.",
    headline: "Leadership-ready structure",
    subline: "Current position. Risks. Next steps.",
  },
  {
    id: "review",
    index: 8,
    durationInFrames: 14 * FPS,
    timeRange: "01:24–01:38",
    voiceover:
      "The team can review the draft, check the underlying sources, refine the wording, and decide what is ready to circulate.",
    headline: "Review before circulation",
    subline: "Check sources. Refine wording. Approve.",
  },
  {
    id: "benefits",
    index: 9,
    durationInFrames: 12 * FPS,
    timeRange: "01:38–01:50",
    voiceover:
      "That means fewer disconnected drafts, fewer lost decisions, and more confidence that the final brief reflects the current state of the issue.",
    headline: "Less drift",
    subline: "More confidence",
  },
  {
    id: "closing",
    index: 10,
    durationInFrames: 10 * FPS,
    timeRange: "01:50–02:00",
    voiceover:
      "Metis helps teams move from scattered input to structured understanding, and from structured understanding to leadership-ready briefings.",
    headline: "From scattered input to leadership-ready briefings",
    subline: "Metis",
  },
];

let cursor = 0;
export const SCENES: SceneDefinition[] = SCENE_DATA.map((scene) => {
  const def: SceneDefinition = { ...scene, startFrame: cursor };
  cursor += scene.durationInFrames;
  return def;
});

export const TOTAL_DURATION_IN_FRAMES = cursor;

export function getSceneAtFrame(frame: number): {
  scene: SceneDefinition;
  localFrame: number;
  progress: number;
} {
  const scene =
    SCENES.find(
      (s) =>
        frame >= s.startFrame && frame < s.startFrame + s.durationInFrames,
    ) ?? SCENES[SCENES.length - 1];
  const localFrame = frame - scene.startFrame;
  const progress = localFrame / scene.durationInFrames;
  return { scene, localFrame, progress };
}

/** Narration in `public/` — run `npm run voiceover` in video/walkthrough. */
export const VOICEOVER_STATIC_FILE = "walkthrough-voiceover.wav";
