import { Composition } from "remotion";
import { WalkthroughComposition, walkthroughMetadata } from "./Walkthrough";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id={walkthroughMetadata.id}
      component={WalkthroughComposition}
      durationInFrames={walkthroughMetadata.durationInFrames}
      fps={walkthroughMetadata.fps}
      width={walkthroughMetadata.width}
      height={walkthroughMetadata.height}
      defaultProps={walkthroughMetadata.defaultProps}
    />
  </>
);
