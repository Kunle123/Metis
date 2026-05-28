/**
 * METIS Timeline — Northbank Green Saver Scenario
 * Design: "Editorial Record" — matches original mockup exactly
 * Colors: paper #F6F1E8, ink #171713, deep olive #263B2E, sage #8FA38A, brass #B78B45, sand #E7D8BF
 * Typography: Playfair Display (display), Inter (body), IBM Plex Mono (timestamps)
 *
 * Conceptual model:
 *   Incoming Updates = "What arrived in the organisation?" (BAU signals)
 *   Issue Record     = "What did METIS understand, structure, question or evidence?"
 *   METIS Outputs    = "What did the organisation say or brief as a result?"
 */

import { useState, useRef, useEffect } from 'react';
import { events, LANE_CONFIG, type TimelineEvent, type Lane } from '@/data/timelineData';
import { X, ChevronRight, Clock, FileText, Link2, Zap } from 'lucide-react';

// Group events by time column
function groupByTime(evts: TimelineEvent[]) {
  const map = new Map<string, TimelineEvent[]>();
  evts.forEach(e => {
    const key = `${e.day} ${e.time}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return map;
}

// Parse a "Day HH:MM" key into a sortable number
function parseTimeKey(key: string): number {
  // Multi-day support: parse "Mon 8 Jun", "Tue 9 Jun", etc.
  const DAY_ORDER: Record<string, number> = {
    'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6,
  };
  // key format: "Mon 8 Jun HH:MM" or "Mon HH:MM"
  const parts = key.split(' ');
  let dayName: string, timeStr: string;
  if (parts.length === 4) {
    // "Mon 8 Jun 11:00"
    dayName = parts[0];
    timeStr = parts[3];
  } else if (parts.length === 3) {
    // "Mon 8 Jun" — shouldn't happen but guard
    dayName = parts[0];
    timeStr = '00:00';
  } else {
    // "Mon 11:00" — original format
    dayName = parts[0];
    timeStr = parts[1];
  }
  const [h, m] = timeStr.split(':').map(Number);
  // Use day number from key if present (e.g. "8" in "Mon 8 Jun")
  let dayNum = 0;
  if (parts.length === 4) {
    dayNum = parseInt(parts[1], 10) || 0;
  }
  const dayBase = (DAY_ORDER[dayName] ?? 0) * 1440 + dayNum * 10080;
  return dayBase + h * 60 + m;
}

const LANES: Lane[] = ['input', 'issue', 'output'];

export default function Home() {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'record' | 'related'>('summary');
  const drawerRef = useRef<HTMLDivElement>(null);

  const timeGroups = groupByTime(events);
  // Sort all time keys chronologically (Sun before Mon, then by HH:MM)
  const timeKeys = Array.from(timeGroups.keys()).sort((a, b) => parseTimeKey(a) - parseTimeKey(b));

  // Highlight logic:
  //   - On hover: only the hovered card is highlighted (no related expansion)
  //   - On selection: selected card + all its related cards are highlighted
  //   - Dimming only activates when there is an active hover or selection
  const highlightedIds: Set<string> = hoveredId
    ? new Set([hoveredId])
    : selected
    ? new Set([selected.id, ...(selected.relatedIds ?? [])])
    : new Set<string>();

  function handleCardClick(event: TimelineEvent) {
    setSelected(event);
    setActiveTab('record');
  }

  function handleClose() {
    setSelected(null);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const laneCount: Record<Lane, number> = { input: 0, issue: 0, output: 0 };
  events.forEach(e => laneCount[e.lane]++);

  return (
    <div className="metis-root">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="metis-header">
        <div className="metis-header-inner">

          {/* Left: brand + demo badge */}
          <div className="metis-header-left">
            <div className="metis-brand-row">
              <span className="metis-brand-name">METIS</span>
              <span className="metis-demo-badge">Interactive Demo Asset</span>
            </div>
          </div>

          {/* Centre: hero title + subtitle */}
          <div className="metis-header-centre">
            <h1 className="metis-hero-title">Northbank Green Saver: launch readiness issue record</h1>
            <p className="metis-hero-sub">
              A product-style timeline showing how METIS turns incoming updates into a structured issue record, controlled messages and evidence-backed briefings — from launch scope to go/no-go.
            </p>
          </div>

          {/* Right: controlled position panel */}
          <div className="metis-position-panel">
            <div className="metis-position-label">Current controlled position</div>
            <div className="metis-position-headline">Launch approved. Green Saver available from launch day. Rate and eligibility confirmed.</div>
            <div className="metis-position-detail">Pricing committee approved · app release approved · go/no-go recorded · stakeholder and customer messages circulated</div>
          </div>

        </div>

        {/* Legend bar */}
        <div className="metis-legend-bar">
          {LANES.map(lane => (
            <div key={lane} className="metis-legend-item">
              <span className="metis-legend-dot" style={{ background: LANE_CONFIG[lane].color }} />
              <span className="metis-legend-label">{LANE_CONFIG[lane].label}</span>
              <span className="metis-legend-count">{laneCount[lane]}</span>
            </div>
          ))}
          <span className="metis-legend-hint">Click any card to open the detail record</span>
        </div>
      </header>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────────── */}
      <div className="metis-layout">

        {/* Timeline scroll area — label is embedded in each row */}
        <div className="metis-timeline-scroll">

          {/* Time axis row (with sticky label spacer) */}
          <div className="metis-time-axis-row">
            <div className="metis-time-label-spacer" />
            <div className="metis-time-axis">
              {timeKeys.map(key => (
                <div key={key} className="metis-time-col">
                  <div className="metis-time-label">
                    <span className="metis-time-day">{key.split(' ')[0]}</span>
                    <span className="metis-time-hour">{key.split(' ')[1]}</span>
                  </div>
                  <div className="metis-time-tick" />
                </div>
              ))}
            </div>
          </div>

          {/* Swimlane rows — each row has its own label */}
          {LANES.map(lane => (
            <div key={lane} className="metis-swimlane-row">
              {/* Sticky lane label — same height as the row */}
              <div
                className="metis-lane-label"
                style={{ borderLeftColor: LANE_CONFIG[lane].color }}
              >
                <div className="metis-lane-label-inner">
                  <div className="metis-lane-name" style={{ color: LANE_CONFIG[lane].textColor }}>
                    {LANE_CONFIG[lane].label}
                  </div>
                  <div className="metis-lane-sublabel">{LANE_CONFIG[lane].sublabel}</div>
                </div>
              </div>

              {/* Cells */}
              <div
                className="metis-swimlane"
                style={{ borderTopColor: LANE_CONFIG[lane].color }}
              >
              {timeKeys.map(key => {
                const colEvents = (timeGroups.get(key) ?? []).filter(e => e.lane === lane);
                return (
                  <div key={key} className="metis-cell">
                    {colEvents.map(event => {
                      const isHighlighted = highlightedIds.has(event.id);
                      const isSelected = selected?.id === event.id;
                      const isDimmed = highlightedIds.size > 0 && !isHighlighted;
                      return (
                        <button
                          key={event.id}
                          className={[
                            'metis-card',
                            isSelected ? 'metis-card--selected' : '',
                            isDimmed ? 'metis-card--dimmed' : '',
                            isHighlighted && !isSelected ? 'metis-card--highlighted' : '',
                          ].join(' ')}
                          style={{ '--card-accent': LANE_CONFIG[lane].color } as React.CSSProperties}
                          onClick={() => handleCardClick(event)}
                          onMouseEnter={() => setHoveredId(event.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          {/* Coloured top rule via ::before in CSS */}
                          <div className="metis-card-body">
                            <div className="metis-card-header">
                              <span className="metis-card-time">{event.day} {event.time}</span>
                              <span
                                className="metis-card-badge"
                                style={{ color: LANE_CONFIG[lane].textColor, background: LANE_CONFIG[lane].badgeBackground }}
                              >
                                {event.badgeLabel}
                              </span>
                            </div>
                            <div className="metis-card-title">{event.title}</div>
                            <div className="metis-card-summary">{event.summary}</div>
                            <div className="metis-card-cta" style={{ color: LANE_CONFIG[lane].textColor }}>
                              Open detail <ChevronRight size={10} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ── DETAIL DRAWER ────────────────────────────────────────────────── */}
      {selected && (
        <>
          <div className="metis-drawer-overlay" onClick={handleClose} />
          <div className="metis-drawer" ref={drawerRef}>

            {/* Deep olive header */}
            <div className="metis-drawer-header">
              <div className="metis-drawer-lane-pill">
                <span
                  style={{
                    display: 'inline-block',
                    width: 8, height: 8, borderRadius: '50%',
                    background: LANE_CONFIG[selected.lane].color,
                    flexShrink: 0,
                  }}
                />
                {LANE_CONFIG[selected.lane].label} · {selected.badgeLabel}
              </div>
              <h2 className="metis-drawer-title">{selected.title}</h2>
              {/* Brass metadata line */}
              <div className="metis-drawer-meta">
                {selected.day} {selected.time} · {LANE_CONFIG[selected.lane].label}
              </div>
              <button className="metis-drawer-close" onClick={handleClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="metis-drawer-tabs">
              {(['summary', 'record', 'related'] as const).map(tab => (
                <button
                  key={tab}
                  className={`metis-drawer-tab ${activeTab === tab ? 'metis-drawer-tab--active' : ''}`}
                  style={activeTab === tab ? { borderBottomColor: LANE_CONFIG[selected.lane].color, color: LANE_CONFIG[selected.lane].textColor } : {}}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'summary' && <><Zap size={11} /> Summary</>}
                  {tab === 'record' && <><FileText size={11} /> Full Record</>}
                  {tab === 'related' && <><Link2 size={11} /> Related Events</>}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="metis-drawer-body">

              {/* ── SUMMARY TAB ── */}
              {activeTab === 'summary' && (
                <div className="metis-drawer-content">
                  <p className="metis-drawer-summary-text">{selected.summary}</p>

                  {/* Input lane: show the "Input received → Linked source → Issue impact" structure */}
                  {selected.lane === 'input' && (
                    <>


                      {selected.linkedSource && (
                        <div className="metis-drawer-inset">
                          <div className="metis-drawer-inset-label">Linked source created in issue record</div>
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Source</span>
                            <span className="metis-drawer-inset-val">{selected.linkedSource}</span>
                          </div>
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Status</span>
                            <span className="metis-drawer-inset-val">Linked</span>
                          </div>


                        </div>
                      )}

                      {selected.issueImpact && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Issue record impact</div>
                          <div className="metis-drawer-field-value" style={{ whiteSpace: 'pre-line' }}>{selected.issueImpact}</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Output lane: audience, status, version, open questions, caveats, do-not-say */}
                  {selected.lane === 'output' && (
                    <>
                      {selected.audience && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Audience</div>
                          <div className="metis-drawer-field-value">{selected.audience}</div>
                        </div>
                      )}
                      {selected.outputStatus && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Status</div>
                          <div className="metis-drawer-field-value">{selected.outputStatus}</div>
                        </div>
                      )}
                      {selected.doNotSay && selected.doNotSay.length > 0 && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Do not say</div>
                          <ul className="metis-drawer-impact-list">
                            {selected.doNotSay.map((item, i) => (
                              <li key={i} className="metis-drawer-impact-item">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selected.openQuestionsAtGeneration && selected.openQuestionsAtGeneration.length > 0 && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Open questions at generation</div>
                          <ul className="metis-drawer-impact-list">
                            {selected.openQuestionsAtGeneration.map((item, i) => (
                              <li key={i} className="metis-drawer-impact-item">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selected.caveatsAtGeneration && selected.caveatsAtGeneration.length > 0 && (
                        <div className="metis-drawer-field">
                          <div className="metis-drawer-field-label">Caveats at generation</div>
                          <ul className="metis-drawer-impact-list">
                            {selected.caveatsAtGeneration.map((item, i) => (
                              <li key={i} className="metis-drawer-impact-item">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── FULL RECORD TAB ── */}
              {activeTab === 'record' && (
                <div className="metis-drawer-content">
                  <div className="metis-full-record">
                    {(() => {
                      // fullRecord is now an array of {heading, body} objects
                      const sections = selected.fullRecord as { heading: string; body: string }[];

                      return sections.map((section, si) => (
                        <div key={si} className="metis-record-section">
                          {section.heading && (
                            <div className="metis-record-section-heading">{section.heading}</div>
                          )}
                          <div className="metis-record-section-body">
                            {section.body.split('\n').map((line, li) => {
                              if (line.trim() === '') return null;
                              if (line.match(/^(→|✓|✗|•)/)) {
                                return (
                                  <div key={li} className="metis-record-bullet-row">
                                    <span className="metis-record-bullet-icon">{line[0]}</span>
                                    <span className="metis-record-bullet-text">{line.slice(1).trim()}</span>
                                  </div>
                                );
                              }
                              if (line.match(/^(Q-\d|CLM-|SRC-|OBS-|OUT-|Action|Finding|PENDING|V\d)/)) {
                                return <div key={li} className="metis-record-ref-line">{line}</div>;
                              }
                              if (line.match(/^[A-Za-z][\w\s]+:\s/)) {
                                const colonIdx = line.indexOf(':');
                                const label = line.slice(0, colonIdx);
                                const value = line.slice(colonIdx + 1).trim();
                                return (
                                  <div key={li} className="metis-record-kv-row">
                                    <span className="metis-record-kv-key">{label}</span>
                                    <span className="metis-record-kv-val">{value}</span>
                                  </div>
                                );
                              }
                              if (line.match(/^\[Metis note\]/)) {
                                return <div key={li} className="metis-record-note">{line}</div>;
                              }
                              return <div key={li} className="metis-record-para">{line}</div>;
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* ── RELATED EVENTS TAB ── */}
              {activeTab === 'related' && (
                <div className="metis-drawer-content">
                  {selected.relatedIds && selected.relatedIds.length > 0 ? (
                    <div className="metis-related-list">
                      {selected.relatedIds.map(rid => {
                        const rel = events.find(e => e.id === rid);
                        if (!rel) return null;
                        return (
                          <button
                            key={rid}
                            className="metis-related-card"
                            style={{ '--rel-accent': LANE_CONFIG[rel.lane].color } as React.CSSProperties}
                            onClick={() => { setSelected(rel); setActiveTab('summary'); }}
                          >
                            <div className="metis-related-meta">
                              <span className="metis-related-lane" style={{ color: LANE_CONFIG[rel.lane].textColor }}>
                                {LANE_CONFIG[rel.lane].label}
                              </span>
                              <span className="metis-related-time">{rel.day} {rel.time}</span>
                            </div>
                            <div className="metis-related-title">{rel.title}</div>
                            <div className="metis-related-summary">{rel.summary}</div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="metis-drawer-empty">No related events linked to this record.</p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="metis-drawer-footer">
              <span className="metis-drawer-footer-id">Event ID: {selected.id.toUpperCase()}</span>
              <span className="metis-drawer-footer-sep">·</span>
              <span style={{ color: LANE_CONFIG[selected.lane].textColor }}>{LANE_CONFIG[selected.lane].label}</span>
              <span className="metis-drawer-footer-sep">·</span>
              <span>{selected.badgeLabel}</span>
            </div>
          </div>
        </>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="metis-footer">
        <span className="metis-footer-brand">METIS</span>
        <span className="metis-footer-sep">·</span>
        <span>Issue Intelligence Platform</span>
        <span className="metis-footer-sep">·</span>
        <a href="https://metisbriefing.com" target="_blank" rel="noopener noreferrer" className="metis-footer-link">
          metisbriefing.com
        </a>
        <span className="metis-footer-sep">·</span>
        <span>Demo scenario: Northbank Green Saver</span>
        <span className="metis-footer-sep">·</span>
        <span>Selected outputs highlight source lineage, record state and review actions.</span>
      </footer>
    </div>
  );
}
