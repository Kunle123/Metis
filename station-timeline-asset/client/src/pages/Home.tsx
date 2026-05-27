/**
 * METIS Station Timeline — Bramley Junction Scenario
 * Design: "Signal & Noise" — deep navy, amber-gold outputs, teal issue record, slate-blue inputs
 * Cormorant Garamond (display), DM Sans (body), DM Mono (timestamps)
 */

import { useState, useRef, useEffect } from 'react';
import { events, LANE_CONFIG, type TimelineEvent, type Lane } from '@/data/timelineData';
import { X, ChevronRight, Clock, Tag, Zap, FileText, Link2 } from 'lucide-react';

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

const LANES: Lane[] = ['input', 'issue', 'output'];

export default function Home() {
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'record' | 'related'>('summary');
  const drawerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const timeGroups = groupByTime(events);
  const timeKeys = Array.from(timeGroups.keys());

  // Highlight related events on hover
  const highlightedIds = hoveredId
    ? new Set([hoveredId, ...(events.find(e => e.id === hoveredId)?.relatedIds ?? [])])
    : selected
    ? new Set([selected.id, ...(selected.relatedIds ?? [])])
    : new Set<string>();

  function handleCardClick(event: TimelineEvent) {
    setSelected(event);
    setActiveTab('summary');
  }

  function handleClose() {
    setSelected(null);
  }

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const laneCount = { input: 0, issue: 0, output: 0 };
  events.forEach(e => laneCount[e.lane]++);

  return (
    <div className="metis-root">
      {/* Header */}
      <header className="metis-header">
        <div className="metis-header-inner">
          <div className="metis-logo-area">
            <span className="metis-logo-mark">M</span>
            <div>
              <div className="metis-logo-name">METIS</div>
              <div className="metis-logo-sub">Issue Intelligence Platform</div>
            </div>
          </div>
          <div className="metis-header-title-area">
            <div className="metis-incident-label">INCIDENT TIMELINE</div>
            <h1 className="metis-incident-title">Bramley Junction Station — Reopening Delay</h1>
            <div className="metis-incident-meta">
              <span className="metis-meta-pill metis-meta-resolved">● Resolved</span>
              <span className="metis-meta-sep">·</span>
              <span className="metis-meta-text">Sun 20:00 → Mon 09:00</span>
              <span className="metis-meta-sep">·</span>
              <span className="metis-meta-text">{events.length} events recorded</span>
            </div>
          </div>
          <div className="metis-legend">
            {LANES.map(lane => (
              <div key={lane} className="metis-legend-item">
                <span className="metis-legend-dot" style={{ background: LANE_CONFIG[lane].color }} />
                <span className="metis-legend-label">{LANE_CONFIG[lane].label}</span>
                <span className="metis-legend-count">{laneCount[lane]}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="metis-layout">
        {/* Swimlane labels (sticky left) */}
        <div className="metis-lane-labels">
          <div className="metis-time-label-spacer" />
          {LANES.map(lane => (
            <div key={lane} className="metis-lane-label" style={{ borderLeftColor: LANE_CONFIG[lane].color }}>
              <span className="metis-lane-icon" style={{ color: LANE_CONFIG[lane].color }}>
                {LANE_CONFIG[lane].icon}
              </span>
              <div>
                <div className="metis-lane-name" style={{ color: LANE_CONFIG[lane].textColor }}>
                  {LANE_CONFIG[lane].label}
                </div>
                <div className="metis-lane-sublabel">{LANE_CONFIG[lane].sublabel}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline scroll area */}
        <div className="metis-timeline-scroll" ref={timelineRef}>
          {/* Time axis */}
          <div className="metis-time-axis">
            {timeKeys.map(key => (
              <div key={key} className="metis-time-col">
                <div className="metis-time-tick" />
                <div className="metis-time-label">
                  <span className="metis-time-day">{key.split(' ')[0]}</span>
                  <span className="metis-time-hour">{key.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Swimlane rows */}
          {LANES.map(lane => (
            <div key={lane} className="metis-swimlane" style={{ borderTopColor: LANE_CONFIG[lane].borderColor }}>
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
                          className={`metis-card ${isSelected ? 'metis-card--selected' : ''} ${isDimmed ? 'metis-card--dimmed' : ''} ${isHighlighted && !isSelected ? 'metis-card--highlighted' : ''}`}
                          style={{
                            '--card-color': LANE_CONFIG[lane].color,
                            '--card-bg': LANE_CONFIG[lane].bgColor,
                            '--card-border': LANE_CONFIG[lane].borderColor,
                            '--card-glow': LANE_CONFIG[lane].glowColor,
                          } as React.CSSProperties}
                          onClick={() => handleCardClick(event)}
                          onMouseEnter={() => setHoveredId(event.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div className="metis-card-header">
                            <span className="metis-card-icon" style={{ color: LANE_CONFIG[lane].textColor }}>
                              {LANE_CONFIG[lane].icon}
                            </span>
                            {event.status && (
                              <span className={`metis-card-status metis-card-status--${event.status}`}>
                                {event.status}
                              </span>
                            )}
                          </div>
                          <div className="metis-card-title">{event.title}</div>
                          <div className="metis-card-summary">{event.summary}</div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="metis-card-tags">
                              {event.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="metis-card-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="metis-card-cta">
                            View full record <ChevronRight size={10} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="metis-drawer-overlay" onClick={handleClose} />
          <div className="metis-drawer" ref={drawerRef}>
            {/* Drawer header */}
            <div className="metis-drawer-header" style={{ borderBottomColor: LANE_CONFIG[selected.lane].borderColor }}>
              <div className="metis-drawer-lane-badge" style={{ background: LANE_CONFIG[selected.lane].bgColor, borderColor: LANE_CONFIG[selected.lane].borderColor, color: LANE_CONFIG[selected.lane].textColor }}>
                <span>{LANE_CONFIG[selected.lane].icon}</span>
                <span>{LANE_CONFIG[selected.lane].label}</span>
              </div>
              <button className="metis-drawer-close" onClick={handleClose}>
                <X size={18} />
              </button>
            </div>

            <div className="metis-drawer-body">
              {/* Time and title */}
              <div className="metis-drawer-time">
                <Clock size={13} />
                <span>{selected.day} {selected.time}</span>
              </div>
              <h2 className="metis-drawer-title" style={{ color: LANE_CONFIG[selected.lane].textColor }}>
                {selected.title}
              </h2>

              {/* Status badge */}
              {selected.status && (
                <span className={`metis-drawer-status metis-card-status--${selected.status}`}>
                  {selected.status}
                </span>
              )}

              {/* Tabs */}
              <div className="metis-drawer-tabs">
                {(['summary', 'record', 'related'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`metis-drawer-tab ${activeTab === tab ? 'metis-drawer-tab--active' : ''}`}
                    style={activeTab === tab ? { borderBottomColor: LANE_CONFIG[selected.lane].color, color: LANE_CONFIG[selected.lane].textColor } : {}}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'summary' && <><Zap size={12} /> Summary</>}
                    {tab === 'record' && <><FileText size={12} /> Full Record</>}
                    {tab === 'related' && <><Link2 size={12} /> Related Events</>}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'summary' && (
                <div className="metis-drawer-content">
                  <p className="metis-drawer-summary-text">{selected.summary}</p>

                  {selected.source && (
                    <div className="metis-drawer-field">
                      <div className="metis-drawer-field-label">Source</div>
                      <div className="metis-drawer-field-value">{selected.source}</div>
                    </div>
                  )}

                  <div className="metis-drawer-field">
                    <div className="metis-drawer-field-label">METIS Feature</div>
                    <div className="metis-drawer-field-value">{selected.metisFeature}</div>
                  </div>

                  <div className="metis-drawer-field">
                    <div className="metis-drawer-field-label">Demo Value</div>
                    <div className="metis-drawer-field-value metis-drawer-field-value--highlight">{selected.demoValue}</div>
                  </div>

                  {selected.tags && selected.tags.length > 0 && (
                    <div className="metis-drawer-field">
                      <div className="metis-drawer-field-label"><Tag size={11} /> Tags</div>
                      <div className="metis-drawer-tags">
                        {selected.tags.map(tag => (
                          <span key={tag} className="metis-drawer-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'record' && (
                <div className="metis-drawer-content">
                  <div className="metis-full-record">
                    {selected.fullRecord.split('\n').map((line, i) => {
                      if (line.trim() === '') return <div key={i} className="metis-record-spacer" />;
                      if (line.match(/^[A-Z][A-Z\s\-—]+$/) || line.match(/^[A-Z][A-Z\s]+:$/)) {
                        return <div key={i} className="metis-record-heading">{line}</div>;
                      }
                      if (line.match(/^(✓|✗|→|•|Q\d|Action \d|Claim \d|Observation \d|Post \d|Finding|PENDING|SIGN-OFF)/)) {
                        return <div key={i} className="metis-record-bullet">{line}</div>;
                      }
                      return <div key={i} className="metis-record-line">{line}</div>;
                    })}
                  </div>
                </div>
              )}

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
                            style={{
                              '--rel-color': LANE_CONFIG[rel.lane].color,
                              '--rel-bg': LANE_CONFIG[rel.lane].bgColor,
                              '--rel-border': LANE_CONFIG[rel.lane].borderColor,
                            } as React.CSSProperties}
                            onClick={() => { setSelected(rel); setActiveTab('summary'); }}
                          >
                            <div className="metis-related-meta">
                              <span className="metis-related-lane" style={{ color: LANE_CONFIG[rel.lane].textColor }}>
                                {LANE_CONFIG[rel.lane].icon} {LANE_CONFIG[rel.lane].label}
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
              <span className="metis-drawer-footer-lane" style={{ color: LANE_CONFIG[selected.lane].textColor }}>
                {LANE_CONFIG[selected.lane].label}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="metis-footer">
        <span className="metis-footer-brand">METIS</span>
        <span className="metis-footer-sep">·</span>
        <span>Issue Intelligence Platform</span>
        <span className="metis-footer-sep">·</span>
        <a href="https://metisbriefing.com" target="_blank" rel="noopener noreferrer" className="metis-footer-link">
          metisbriefing.com
        </a>
        <span className="metis-footer-sep">·</span>
        <span>Demo scenario: Bramley Junction Station</span>
      </footer>
    </div>
  );
}
