/** Theme-independent light document styles for standalone article HTML (full brief, board note). */
export const EXPORT_STANDALONE_HTML_STYLES = `
  :root {
    color-scheme: light only;
    --doc-ink: #141418;
    --doc-muted: #52525b;
    --doc-border: #d4d4d8;
    --doc-accent: #2c3e50;
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.55;
    font-size: 14px;
  }
  @media print {
    html, body { background: white !important; }
    body { padding: 0; }
    article { max-width: 100%; }
    a { text-decoration: none; color: inherit; }
  }
  body {
    margin: 0 auto;
    max-width: 52rem;
    padding: 2rem clamp(16px, 4vw, 2.5rem) 3rem;
    background: #ffffff;
    color: var(--doc-ink);
  }
  article > header {
    padding-bottom: 1rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid var(--doc-border);
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 0.75rem;
    color: var(--doc-accent);
  }
  h2 {
    font-size: 1.1rem;
    font-weight: 650;
    margin: 1.75rem 0 0.65rem;
    color: var(--doc-accent);
    border-bottom: 1px solid var(--doc-border);
    padding-bottom: 0.35rem;
  }
  section { margin-bottom: 1.35rem; }
  p {
    margin: 0 0 0.75rem;
    color: var(--doc-ink);
  }
  ul {
    margin: 0 0 0.75rem;
    padding-left: 1.35rem;
    color: var(--doc-muted);
  }
  li { margin-bottom: 0.35rem; }
  .posture-line {
    font-size: 0.92rem;
    color: var(--doc-muted);
    margin-top: 0.5rem;
  }
  footer.meta {
    margin-top: 2.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--doc-border);
    font-size: 0.8rem;
    color: var(--doc-muted);
  }
`;

/** Theme-independent styles for structured executive briefing packs. */
export const BRIEFING_PACK_DOCUMENT_STYLES = `
  :root {
    color-scheme: light only;
    --doc-ink: #141418;
    --doc-muted: #52525b;
    --doc-border: #d4d4d8;
    --doc-fill: #f4f4f5;
    --doc-accent: #2c3e50;
    --doc-guardrail-bg: #faf8f5;
    --doc-guardrail-border: #d6cfc4;
    --doc-decision-bg: #f8fafc;
    --doc-decision-border: #c5d4e4;
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    font-size: 14px;
  }
  * { box-sizing: border-box; }
  @media print {
    html, body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { padding: 0; margin: 0; }
    .briefing-pack { max-width: 100%; box-shadow: none; border: none; }
    .no-print { display: none !important; }
    .page-break { break-before: page; page-break-before: always; }
    h2, h3 { break-after: avoid; page-break-after: avoid; }
    .section-card, .message-card { break-inside: avoid; page-break-inside: avoid; }
    a { color: var(--doc-ink); text-decoration: none; }
  }
  body {
    margin: 0 auto;
    padding: 2rem clamp(16px, 4vw, 2.5rem) 3rem;
    max-width: 46rem;
    background: #ffffff;
    color: var(--doc-ink);
  }
  .briefing-pack {
    background: #ffffff;
    border: 1px solid var(--doc-border);
    border-radius: 6px;
    padding: clamp(1.25rem, 3vw, 2rem);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .pack-cover {
    padding-bottom: 1.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--doc-border);
  }
  .pack-cover h1 {
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 0.75rem;
    color: var(--doc-ink);
  }
  .pack-cover .pack-subtitle {
    font-size: 0.92rem;
    color: var(--doc-muted);
    margin: 0 0 1rem;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: 0.65rem 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .meta-grid li {
    font-size: 0.78rem;
    line-height: 1.4;
  }
  .meta-grid .meta-k {
    display: block;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--doc-muted);
    margin-bottom: 0.15rem;
  }
  .meta-grid .meta-v { color: var(--doc-ink); font-weight: 500; }
  .pack-part {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--doc-muted);
    margin: 0 0 1rem;
  }
  .pack-section { margin-bottom: 2rem; }
  .section-card {
    margin-bottom: 1.25rem;
    padding: 0 0 0.25rem;
  }
  .section-card h3 {
    font-size: 0.95rem;
    font-weight: 650;
    margin: 0 0 0.55rem;
    color: var(--doc-accent);
    border-bottom: 1px solid var(--doc-border);
    padding-bottom: 0.35rem;
  }
  .section-card.lead-block h3 { border-bottom-color: var(--doc-accent); }
  .section-card p {
    margin: 0 0 0.65rem;
    color: var(--doc-ink);
  }
  .section-card ul {
    margin: 0 0 0.65rem;
    padding-left: 1.25rem;
    color: var(--doc-ink);
  }
  .section-card li { margin-bottom: 0.35rem; }
  .decision-block {
    background: var(--doc-decision-bg);
    border: 1px solid var(--doc-decision-border);
    border-radius: 4px;
    padding: 0.85rem 1rem;
  }
  .guardrail-block {
    background: var(--doc-guardrail-bg);
    border: 1px solid var(--doc-guardrail-border);
    border-radius: 4px;
    padding: 0.85rem 1rem;
  }
  .message-card {
    border: 1px solid var(--doc-border);
    border-radius: 4px;
    padding: 1rem 1.1rem;
    margin-bottom: 1rem;
    background: #fff;
  }
  .message-card header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--doc-border);
  }
  .message-card h4 {
    margin: 0 0 0.35rem;
    font-size: 0.95rem;
    font-weight: 650;
    color: var(--doc-ink);
  }
  .message-meta {
    font-size: 0.75rem;
    color: var(--doc-muted);
    margin: 0;
  }
  .message-primary {
    font-size: 0.92rem;
    line-height: 1.65;
    white-space: pre-wrap;
  }
  .message-support {
    margin-top: 0.85rem;
    padding-top: 0.65rem;
    border-top: 1px dashed var(--doc-border);
    font-size: 0.8rem;
    color: var(--doc-muted);
  }
  .message-support h5 {
    margin: 0 0 0.4rem;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--doc-muted);
  }
  .record-basis-card {
    background: var(--doc-fill);
    border: 1px solid var(--doc-border);
    border-radius: 4px;
    padding: 1rem 1.1rem;
    font-size: 0.88rem;
    color: var(--doc-muted);
  }
  .record-basis-card ul {
    margin: 0.5rem 0 0;
    padding-left: 1.2rem;
    color: var(--doc-ink);
  }
  .pack-provenance {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--doc-border);
    font-size: 0.75rem;
    color: var(--doc-muted);
    line-height: 1.5;
  }
  h2.pack-heading {
    font-size: 1.15rem;
    font-weight: 650;
    margin: 0 0 1rem;
    color: var(--doc-accent);
  }
`;
