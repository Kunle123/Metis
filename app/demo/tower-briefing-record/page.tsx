import type { Metadata } from "next";

import { TowerBriefingDemoWorkspace } from "./demo-workspace";

export const metadata: Metadata = {
  title: "The Tower Briefing Record | Metis Demo",
  description: "A fictional Metis demo showing how a routine office update becomes a live incident briefing.",
};

export const dynamic = "force-static";

export default function TowerBriefingRecordDemoPage() {
  return <TowerBriefingDemoWorkspace />;
}
