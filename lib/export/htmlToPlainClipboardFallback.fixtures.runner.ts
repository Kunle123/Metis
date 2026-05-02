/**
 * Run: `npm run test:export-plain-fallback`
 */
import assert from "node:assert/strict";

import { htmlExportToPlainClipboardFallback } from "./htmlToPlainClipboardFallback";

const sample = `<!DOCTYPE html><html><head><style>b{color:red}</style></head><body><article><h1>H &amp; Co</h1><h3>Section</h3><p>P1<script>evil()</script></p><p>P2 &#39;x&#39;</p><ul><li>A</li><li>B<br/>c</li></ul></article></body></html>`;

const plain = htmlExportToPlainClipboardFallback(sample);
assert.ok(!plain.includes("<script"), "script removed");
assert.ok(!plain.includes("color:red"), "style removed");
assert.ok(plain.includes("H & Co"), "entities decoded");
assert.ok(plain.includes("Section"), "h3 heading text preserved with line breaks");
assert.ok(plain.includes("• "), "list marker");
assert.ok(plain.includes("P1"), "paragraph text");
assert.ok(plain.includes("'x'"), "numeric/apos entities");

const inlineStyle = '<p x="1"><style type="text/css">.x{display:none}</style></p><p>After</p>';
assert.ok(!htmlExportToPlainClipboardFallback(inlineStyle).includes("display:none"), "inline style block stripped");

console.log("html plain clipboard fallback fixtures: ok");
