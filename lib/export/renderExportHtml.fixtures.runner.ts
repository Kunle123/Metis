/**
 * No-browser checks for HTML export escaping and basic document shape.
 * Run: `npm run test:export-html`
 */
import assert from "node:assert/strict";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";

import { escapeHtml, renderExportPackageHtml } from "./renderExportPackage";

assert.equal(escapeHtml(`A & B <tag> "'`), "A &amp; B &lt;tag&gt; &quot;&#39;");

const minimalArtifact = BriefArtifactSchema.parse({
  lede: `Intro <style>x</style> and <script>bad()</script>`,
  metadata: { audience: null, circulation: "Internal", lastRevisionLabel: "now", openGapsLabel: "3" },
  full: {
    sections: [
      {
        id: "executive-summary",
        title: "Summary<b>",
        body: "First graf.\n\nSecond <iframe></iframe>",
        confidence: "Unclear",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
      {
        id: "recommended-actions",
        title: `Actions<img src=x onerror=alert(1)>`,
        body: `- item & one`,
        confidence: "Likely",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
    ],
  },
  executive: {
    blocks: [{ label: "Situation", body: "Exec line" }],
    immediateActions: ["Do something"],
  },
});

const md = renderExportPackageHtml({
  issue: { title: "Issue<title>" },
  mode: "full",
  format: "full-issue-brief",
  artifact: minimalArtifact,
}).content;

assert.match(md, /<article>/);
assert.match(md, /<\/article>/);
assert.ok(!/<script/i.test(md), "literal script angle-bracket leakage");
assert.ok(md.includes("&lt;script&gt;"), "escaped script markup");
assert.ok(md.includes("&lt;style&gt;"), "escaped style markup");
assert.ok(md.includes("&lt;iframe&gt;"), "escaped iframe markup");

console.log("export HTML fixtures: ok");
