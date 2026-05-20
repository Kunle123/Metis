import { loadFont } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSans";
import { Audio, Sequence, staticFile } from "remotion";
import {
  SceneBackground,
  SceneHeadline,
  Subtitles,
} from "./components/SceneChrome";
import { SCENES, TOTAL_DURATION_IN_FRAMES, VOICEOVER_STATIC_FILE } from "./scenes";
import { SceneVisuals } from "./scenes/SceneVisuals";
import { VIDEO } from "./theme";

const { fontFamily: displayFont } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

const { fontFamily: uiFont } = loadPlex("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

/**
 * Narration: `public/walkthrough-voiceover.mp3` (generate with `npm run voiceover`).
 * Replace that file with a professional recording when ready.
 */
const ENABLE_VOICEOVER = true;

/** Show lower-third captions synced to scene voiceover. */
const SHOW_SUBTITLES = true;

export const WalkthroughComposition: React.FC = () => {
  return (
    <div
      style={{
        width: VIDEO.width,
        height: VIDEO.height,
        fontFamily: uiFont,
        color: "#f2efe8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
      `}</style>

      {ENABLE_VOICEOVER && (
        <Audio src={staticFile(VOICEOVER_STATIC_FILE)} />
      )}

      {SCENES.map((s) => (
        <Sequence
          key={s.id}
          from={s.startFrame}
          durationInFrames={s.durationInFrames}
          name={`Scene ${s.index}: ${s.id}`}
        >
          <SceneBackground>
            <div style={{ fontFamily: displayFont }}>
              <SceneHeadline headline={s.headline} subline={s.subline} />
            </div>
            <SceneVisuals scene={s} />
            {SHOW_SUBTITLES && (
              <Subtitles text={s.voiceover} opacity={0.88} />
            )}
          </SceneBackground>
        </Sequence>
      ))}
    </div>
  );
};

export const walkthroughMetadata = {
  id: "MetisWalkthrough",
  width: VIDEO.width,
  height: VIDEO.height,
  fps: VIDEO.fps,
  durationInFrames: TOTAL_DURATION_IN_FRAMES,
  defaultProps: {},
};
