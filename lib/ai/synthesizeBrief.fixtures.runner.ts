/**
 * No-network guards for Brief executive-summary synthesis output.
 * Run: `npm run test:brief-synthesis`
 */
import assert from "node:assert/strict";

import { isBriefExecutiveSummaryRewriteSafe } from "./synthesizeBrief";

const allowed = new Set(["2", "2024"]);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Open questions remain about the 2 incidents in 2024.",
    allowedNumbers: allowed,
    hasOpenQuestions: true,
  }),
  true,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Everything is now confirmed and closed.",
    allowedNumbers: allowed,
    hasOpenQuestions: true,
  }),
  false,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "A new figure of 999 residents is affected.",
    allowedNumbers: allowed,
    hasOpenQuestions: false,
  }),
  false,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Status is subject to change while we coordinate with estates.",
    allowedNumbers: new Set(["3"]),
    hasOpenQuestions: true,
  }),
  true,
);

console.log("synthesizeBrief fixtures: ok");
