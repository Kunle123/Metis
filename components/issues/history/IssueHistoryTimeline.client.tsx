"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Clock, FileText, Link2, X, Zap } from "lucide-react";

import type {
  IssueHistoryEventCard,
  IssueHistoryImpactRecord,
  IssueHistoryLaneUi,
  IssueHistoryModalPayload,
} from "@/lib/issues/issueHistoryTypes";
import { ISSUE_HISTORY_LANE_CONFIG, issueHistoryLaneToUi } from "@/lib/issues/issueHistoryTypes";
import {
  countEventsByLane,
  filterIssueHistoryEvents,
  filtersAreActive,
  historyHasOnlyInputLane,
  type IssueHistoryDensity,
  type IssueHistoryFilterState,
  type IssueHistoryLaneFilter,
  type IssueHistoryTypeFilter,
} from "@/lib/issues/issueHistoryFilters";

type Props = {
  issueId: string;
  issueTitle: string;
  controlledPositionHeadline: string;
  controlledPositionDetail: string;
  events: IssueHistoryEventCard[];
  latestBriefTimestamp?: string | null;
};

const LANES: IssueHistoryLaneUi[] = ["input", "issue", "output"];

const LANE_FILTER_OPTIONS: { value: IssueHistoryLaneFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "input", label: "Incoming updates" },
  { value: "issue", label: "Issue record" },
  { value: "output", label: "Outputs" },
];

const TYPE_FILTER_OPTIONS: { value: IssueHistoryTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "inputs", label: "Inputs" },
  { value: "claims_questions", label: "Claims & questions" },
  { value: "briefs_messages", label: "Briefs & messages" },
  { value: "circulation_export", label: "Circulation & export" },
];

const DEFAULT_FILTERS: IssueHistoryFilterState = {
  lane: "all",
  type: "all",
  sinceLastBrief: false,
  density: "comfortable",
};

function FilterChip({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`metis-filter-chip${active ? " metis-filter-chip--active" : ""}`}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function groupByTime(evts: IssueHistoryEventCard[]) {
  const map = new Map<string, IssueHistoryEventCard[]>();
  for (const e of evts) {
    const key = `${e.day}|${e.time}`;
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

function parseTimeGroupKey(key: string, events: IssueHistoryEventCard[]): number {
  const ts = events[0]?.timestamp;
  if (!ts) return 0;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function GroupedRecordTitles({
  event,
  visibleCount,
}: {
  event: IssueHistoryEventCard;
  visibleCount: number;
}) {
  const records = event.groupedRecords;
  if (!records?.length) return null;

  const visible = records.slice(0, visibleCount);
  const overflow = records.length - visible.length;

  return (
    <ul className="metis-card-grouped-titles" aria-label="Records in this group">
      {visible.map((record) => (
        <li key={record.id} className="metis-card-grouped-title">
          {record.title}
        </li>
      ))}
      {overflow > 0 ? (
        <li className="metis-card-grouped-title metis-card-grouped-title--more">+{overflow} more</li>
      ) : null}
    </ul>
  );
}

function ImpactRecordRow({
  record,
  laneColor,
  codeSuffix,
}: {
  record: IssueHistoryImpactRecord;
  laneColor: string;
  codeSuffix?: string;
}) {
  const codeLabel = codeSuffix ? `${record.code} ${codeSuffix}` : record.code;
  const row = (
    <>
      <span className="metis-drawer-inset-key">{codeLabel}</span>
      <span className="metis-drawer-inset-val">{record.label}</span>
    </>
  );

  if (record.href) {
    return (
      <Link
        key={record.id}
        href={record.href}
        className="metis-drawer-inset-row metis-drawer-impact-link"
        style={{ color: laneColor }}
      >
        {row}
      </Link>
    );
  }

  return (
    <div key={record.id} className="metis-drawer-inset-row">
      {row}
    </div>
  );
}

function IssueRecordImpactPanel({
  impact,
  laneColor,
}: {
  impact: NonNullable<IssueHistoryModalPayload["issueRecordImpact"]>;
  laneColor: string;
}) {
  const sections: { label: string; records: IssueHistoryImpactRecord[]; codeSuffix?: string }[] = [];
  if (impact.sources?.length) sections.push({ label: "Sources", records: impact.sources });
  if (impact.claims?.length) sections.push({ label: "Claims", records: impact.claims });
  if (impact.questionsOpened?.length) {
    sections.push({ label: "Open questions", records: impact.questionsOpened });
  }
  if (impact.questionsClosed?.length) {
    sections.push({ label: "Questions closed", records: impact.questionsClosed, codeSuffix: "closed" });
  }
  if (impact.observations?.length) sections.push({ label: "Observations", records: impact.observations });

  if (!sections.length && !impact.statusNote) return null;

  return (
    <div className="metis-drawer-inset metis-drawer-impact-panel">
      <div className="metis-drawer-inset-label">Metis issue record impact</div>
      {sections.map((section) => (
        <div key={section.label} className="metis-drawer-impact-group">
          <div className="metis-drawer-impact-group-label">{section.label}</div>
          {section.records.map((record) => (
            <ImpactRecordRow
              key={record.id}
              record={record}
              laneColor={laneColor}
              codeSuffix={section.codeSuffix}
            />
          ))}
        </div>
      ))}
      {impact.statusNote ? (
        <div className="metis-drawer-impact-note">
          <div className="metis-drawer-impact-group-label">Resolution note</div>
          <p className="metis-drawer-impact-note-text">{impact.statusNote}</p>
        </div>
      ) : null}
    </div>
  );
}

export function IssueHistoryTimeline({
  issueId,
  issueTitle,
  controlledPositionHeadline,
  controlledPositionDetail,
  events: allEvents,
  latestBriefTimestamp,
}: Props) {
  const [filters, setFilters] = useState<IssueHistoryFilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<IssueHistoryEventCard | null>(null);
  const [modalDetail, setModalDetail] = useState<IssueHistoryModalPayload | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "record" | "related">("summary");
  const [wordingMode, setWordingMode] = useState<"controlled_draft" | "ai_polished">("ai_polished");
  const drawerRef = useRef<HTMLDivElement>(null);

  const openCard = useCallback(
    async (event: IssueHistoryEventCard) => {
      setSelected(event);
      setActiveTab("summary");
      setModalDetail(null);
      setModalError(null);
      setModalLoading(true);
      try {
        const params = new URLSearchParams({
          eventId: event.id,
          linkedRecordType: event.linkedRecordType,
          linkedRecordId: event.linkedRecordId,
          modalType: event.modalType,
        });
        if (event.relatedRecordIds?.length) {
          params.set("relatedRecordIds", event.relatedRecordIds.join(","));
        }
        const res = await fetch(`/api/issues/${issueId}/history-detail?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load detail");
        const data = (await res.json()) as { modal: IssueHistoryModalPayload };
        setModalDetail(data.modal);
        setWordingMode(data.modal.messageWording?.defaultMode ?? "ai_polished");
      } catch {
        setModalError("Could not load detail for this card.");
      } finally {
        setModalLoading(false);
      }
    },
    [issueId],
  );

  const filteredEvents = useMemo(
    () =>
      filterIssueHistoryEvents(allEvents, {
        lane: filters.lane,
        type: filters.type,
        sinceLastBrief: filters.sinceLastBrief,
        latestBriefTimestamp,
      }),
    [allEvents, filters.lane, filters.type, filters.sinceLastBrief, latestBriefTimestamp],
  );

  const groupedTitleVisible = filters.density === "compact" ? 2 : 4;
  const activeFilters = filtersAreActive(filters);
  const showInputOnlyHint = historyHasOnlyInputLane(allEvents) && !activeFilters;

  const timeGroups = useMemo(() => groupByTime(filteredEvents), [filteredEvents]);
  const timeKeys = useMemo(
    () =>
      Array.from(timeGroups.keys()).sort(
        (a, b) =>
          parseTimeGroupKey(a, timeGroups.get(a) ?? []) - parseTimeGroupKey(b, timeGroups.get(b) ?? []),
      ),
    [timeGroups],
  );

  const laneCount = useMemo(() => countEventsByLane(filteredEvents), [filteredEvents]);

  const visibleLanes = useMemo((): IssueHistoryLaneUi[] => {
    if (filters.lane !== "all") return [filters.lane];
    if (activeFilters) {
      return LANES.filter((lane) => filteredEvents.some((e) => issueHistoryLaneToUi(e.lane) === lane));
    }
    return LANES;
  }, [filters.lane, activeFilters, filteredEvents]);

  const highlightedIds = useMemo(() => {
    if (hoveredId) return new Set([hoveredId]);
    if (selected) return new Set([selected.id, ...(selected.relatedRecordIds ?? [])]);
    return new Set<string>();
  }, [hoveredId, selected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const selectedLane = selected ? issueHistoryLaneToUi(selected.lane) : null;
  const selectedLaneConfig = selectedLane ? ISSUE_HISTORY_LANE_CONFIG[selectedLane] : null;

  return (
    <div className="issue-history-timeline">
      <div className={`metis-root${filters.density === "compact" ? " metis-root--compact" : ""}`}>
        <header className="metis-header">
          <div className="metis-header-inner">
            <div className="metis-header-left">
              <div className="metis-brand-row">
                <span className="metis-brand-name">METIS</span>
              </div>
            </div>
            <div className="metis-header-centre">
              <h1 className="metis-hero-title">{issueTitle}: issue record over time</h1>
              <p className="metis-hero-sub">
                How incoming updates, structured record changes, and generated outputs built the controlled
                position for this issue.
              </p>
            </div>
            <div className="metis-position-panel">
              <div className="metis-position-label">Current controlled position</div>
              <div className="metis-position-headline">{controlledPositionHeadline}</div>
              {controlledPositionDetail ? (
                <div className="metis-position-detail">{controlledPositionDetail}</div>
              ) : null}
            </div>
          </div>
          <div className="metis-legend-bar">
            {LANES.map((lane) => (
              <div key={lane} className="metis-legend-item">
                <span className="metis-legend-dot" style={{ background: ISSUE_HISTORY_LANE_CONFIG[lane].color }} />
                <span className="metis-legend-label">{ISSUE_HISTORY_LANE_CONFIG[lane].label}</span>
                <span className="metis-legend-count">{laneCount[lane]}</span>
              </div>
            ))}
            <span className="metis-legend-hint">Click any card to open the detail record</span>
          </div>

          <div className="metis-controls-bar">
            <div className="metis-controls-group">
              <span className="metis-controls-label">Lane</span>
              <div className="metis-controls-chips">
                {LANE_FILTER_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={filters.lane === option.value}
                    onClick={() => setFilters((prev) => ({ ...prev, lane: option.value }))}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="metis-controls-group">
              <span className="metis-controls-label">Type</span>
              <div className="metis-controls-chips">
                {TYPE_FILTER_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={filters.type === option.value}
                    onClick={() => setFilters((prev) => ({ ...prev, type: option.value }))}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="metis-controls-group metis-controls-group--shortcuts">
              <FilterChip
                active={filters.sinceLastBrief}
                disabled={!latestBriefTimestamp}
                title={
                  latestBriefTimestamp
                    ? "Show only events after the latest brief"
                    : "No brief generated yet"
                }
                onClick={() =>
                  setFilters((prev) => ({ ...prev, sinceLastBrief: !prev.sinceLastBrief }))
                }
              >
                Since last brief
              </FilterChip>

              <span className="metis-controls-divider" aria-hidden="true" />

              <span className="metis-controls-label">Density</span>
              {(["comfortable", "compact"] as IssueHistoryDensity[]).map((density) => (
                <FilterChip
                  key={density}
                  active={filters.density === density}
                  onClick={() => setFilters((prev) => ({ ...prev, density }))}
                >
                  {density === "comfortable" ? "Comfortable" : "Compact"}
                </FilterChip>
              ))}

              {activeFilters ? (
                <>
                  <span className="metis-controls-divider" aria-hidden="true" />
                  <button
                    type="button"
                    className="metis-controls-clear"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear filters
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <div className="metis-layout">
          {allEvents.length === 0 ? (
            <div className="metis-empty-state">
              <p className="metis-empty-state-title">No history events yet for this issue.</p>
              <p className="metis-empty-state-body">
                As you add incoming updates, Metis structures them into the issue record and generates
                briefs, messages, and exports — each step appears here on the timeline.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="metis-empty-state">
              <p className="metis-empty-state-title">No events match the current filters.</p>
              <p className="metis-empty-state-body">
                Try broadening the lane or type filter, or turn off “Since last brief”.
              </p>
              <button
                type="button"
                className="metis-controls-clear metis-empty-state-action"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Clear filters
              </button>
            </div>
          ) : (
          <>
          {showInputOnlyHint ? (
            <div className="metis-low-data-banner">
              You have incoming updates but no structured record changes or outputs yet. Once Metis
              processes updates into claims, briefs or messages, those events will appear in the lanes
              below.
            </div>
          ) : null}
          <div className="metis-timeline-scroll">
            <div className="metis-time-axis-row">
              <div className="metis-time-label-spacer" />
              <div className="metis-time-axis">
                {timeKeys.map((key) => {
                  const [axisDay, axisTime] = key.split("|");
                  return (
                  <div key={key} className="metis-time-col">
                    <div className="metis-time-label">
                      <span className="metis-time-day">{axisDay}</span>
                      <span className="metis-time-hour">{axisTime}</span>
                    </div>
                    <div className="metis-time-tick" />
                  </div>
                  );
                })}
              </div>
            </div>

            {visibleLanes.map((lane) => {
              const laneConfig = ISSUE_HISTORY_LANE_CONFIG[lane];
              return (
                <div key={lane} className="metis-swimlane-row">
                  <div className="metis-lane-label" style={{ borderLeftColor: laneConfig.color }}>
                    <div className="metis-lane-label-inner">
                      <div className="metis-lane-name" style={{ color: laneConfig.textColor }}>
                        {laneConfig.label}
                      </div>
                      <div className="metis-lane-sublabel">{laneConfig.sublabel}</div>
                    </div>
                  </div>
                  <div className="metis-swimlane" style={{ borderTopColor: laneConfig.color }}>
                    {timeKeys.map((key) => {
                      const colEvents = (timeGroups.get(key) ?? []).filter(
                        (e) => issueHistoryLaneToUi(e.lane) === lane,
                      );
                      return (
                        <div key={key} className="metis-cell">
                          {colEvents.map((event) => {
                            const isHighlighted = highlightedIds.has(event.id);
                            const isSelected = selected?.id === event.id;
                            const isDimmed = highlightedIds.size > 0 && !isHighlighted;
                            return (
                              <button
                                key={event.id}
                                type="button"
                                className={[
                                  "metis-card",
                                  isSelected ? "metis-card--selected" : "",
                                  isDimmed ? "metis-card--dimmed" : "",
                                  isHighlighted && !isSelected ? "metis-card--highlighted" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                style={{ "--card-accent": laneConfig.color } as React.CSSProperties}
                                onClick={() => void openCard(event)}
                                onMouseEnter={() => setHoveredId(event.id)}
                                onMouseLeave={() => setHoveredId(null)}
                              >
                                <div className="metis-card-body">
                                  <div className="metis-card-header">
                                    <span className="metis-card-time">{event.displayTime}</span>
                                    <span
                                      className="metis-card-badge"
                                      style={{
                                        color: laneConfig.textColor,
                                        background: laneConfig.badgeBackground,
                                      }}
                                    >
                                      {event.badge}
                                    </span>
                                  </div>
                                  <div className="metis-card-title">{event.title}</div>
                                  {event.subtitle ? (
                                    <div className="metis-card-summary">{event.subtitle}</div>
                                  ) : null}
                                  {event.groupedRecords?.length ? (
                                    <GroupedRecordTitles event={event} visibleCount={groupedTitleVisible} />
                                  ) : null}
                                  {event.impactChips && event.impactChips.length > 0 ? (
                                    <div className="metis-card-chips">
                                      {event.impactChips.map((chip: string) => (
                                        <span key={chip} className="metis-chip">
                                          {chip}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                  <div className="metis-card-cta" style={{ color: laneConfig.textColor }}>
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
              );
            })}
          </div>
          </>
          )}
        </div>

        {selected && selectedLaneConfig ? (
          <>
            <div className="metis-drawer-overlay" onClick={() => setSelected(null)} role="presentation" />
            <div className="metis-drawer" ref={drawerRef}>
              <div className="metis-drawer-header">
                <div className="metis-drawer-lane-pill">
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: selectedLaneConfig.color,
                      flexShrink: 0,
                    }}
                  />
                  {selectedLaneConfig.label} · {selected.badge}
                </div>
                <h2 className="metis-drawer-title">{selected.title}</h2>
                <div className="metis-drawer-meta">
                  {selected.displayTime} · {selectedLaneConfig.label}
                </div>
                <button
                  type="button"
                  className="metis-drawer-close"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="metis-drawer-tabs">
                {(["summary", "record", "related"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`metis-drawer-tab ${activeTab === tab ? "metis-drawer-tab--active" : ""}`}
                    style={
                      activeTab === tab
                        ? {
                            borderBottomColor: selectedLaneConfig.color,
                            color: selectedLaneConfig.textColor,
                          }
                        : {}
                    }
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "summary" && (
                      <>
                        <Zap size={11} /> Summary
                      </>
                    )}
                    {tab === "record" && (
                      <>
                        <FileText size={11} /> Full record
                      </>
                    )}
                    {tab === "related" && (
                      <>
                        <Link2 size={11} /> Related
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div className="metis-drawer-body">
                {modalLoading ? (
                  <div className="metis-drawer-content">
                    <p className="metis-drawer-summary-text" style={{ fontFamily: "Inter, sans-serif" }}>
                      Loading detail…
                    </p>
                  </div>
                ) : modalError ? (
                  <div className="metis-drawer-content">
                    <p className="metis-drawer-summary-text" style={{ fontFamily: "Inter, sans-serif" }}>
                      {modalError}
                    </p>
                  </div>
                ) : null}

                {!modalLoading && !modalError && modalDetail && activeTab === "summary" && (
                  <div className="metis-drawer-content">
                    <p className="metis-drawer-summary-text">{modalDetail.summary}</p>

                    {modalDetail.submitterMeta ? (
                      <div className="metis-drawer-inset">
                        <div className="metis-drawer-inset-label">Submitted by</div>
                        <div className="metis-drawer-inset-row">
                          <span className="metis-drawer-inset-key">Name</span>
                          <span className="metis-drawer-inset-val">{modalDetail.submitterMeta.name}</span>
                        </div>
                        <div className="metis-drawer-inset-row">
                          <span className="metis-drawer-inset-key">Role</span>
                          <span className="metis-drawer-inset-val">{modalDetail.submitterMeta.role}</span>
                        </div>
                        <div className="metis-drawer-inset-row">
                          <span className="metis-drawer-inset-key">Confidence</span>
                          <span className="metis-drawer-inset-val">{modalDetail.submitterMeta.confidence}</span>
                        </div>
                        <div className="metis-drawer-inset-row">
                          <span className="metis-drawer-inset-key">Timestamp</span>
                          <span className="metis-drawer-inset-val">{modalDetail.submitterMeta.displayTime}</span>
                        </div>
                      </div>
                    ) : null}

                    {modalDetail.recordMeta ? (
                      <div className="metis-drawer-field">
                        <div className="metis-drawer-field-label">Record</div>
                        <div className="metis-drawer-field-value">
                          {modalDetail.recordMeta.recordType}
                          {modalDetail.recordMeta.status ? ` · ${modalDetail.recordMeta.status}` : ""}
                        </div>
                        {modalDetail.recordMeta.changeSummary ? (
                          <div className="metis-drawer-field-value metis-drawer-field-value--highlight">
                            {modalDetail.recordMeta.changeSummary}
                          </div>
                        ) : null}
                        {modalDetail.recordMeta.createdAt ? (
                          <div className="metis-drawer-field-value" style={{ fontSize: "0.75rem", color: "#5E5A50" }}>
                            {modalDetail.recordMeta.updatedAt
                              ? `Created ${modalDetail.recordMeta.createdAt} · Updated ${modalDetail.recordMeta.updatedAt}`
                              : `Created ${modalDetail.recordMeta.createdAt}`}
                          </div>
                        ) : null}
                        {modalDetail.recordMeta.href ? (
                          <Link
                            href={modalDetail.recordMeta.href}
                            className="metis-drawer-field-value"
                            style={{ color: selectedLaneConfig.textColor, fontWeight: 600 }}
                          >
                            Open in Metis →
                          </Link>
                        ) : null}
                      </div>
                    ) : null}

                    {modalDetail.submittedUpdate ? (
                      <div className="metis-drawer-field">
                        <div className="metis-drawer-field-label">
                          <Clock size={10} /> {modalDetail.submittedUpdate.heading}
                        </div>
                        <div className="metis-drawer-field-value" style={{ whiteSpace: "pre-line" }}>
                          {modalDetail.submittedUpdate.body}
                        </div>
                      </div>
                    ) : null}

                    {modalDetail.outputMeta ? (
                      <div className="metis-drawer-inset">
                        <div className="metis-drawer-inset-label">Output details</div>
                        {modalDetail.outputMeta.templateLabel ? (
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Template</span>
                            <span className="metis-drawer-inset-val">{modalDetail.outputMeta.templateLabel}</span>
                          </div>
                        ) : null}
                        {modalDetail.outputMeta.audience ? (
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Audience</span>
                            <span className="metis-drawer-inset-val">{modalDetail.outputMeta.audience}</span>
                          </div>
                        ) : null}
                        {modalDetail.outputMeta.status ? (
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Status</span>
                            <span className="metis-drawer-inset-val">{modalDetail.outputMeta.status}</span>
                          </div>
                        ) : null}
                        {modalDetail.outputMeta.versionNumber != null ? (
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Version</span>
                            <span className="metis-drawer-inset-val">v{modalDetail.outputMeta.versionNumber}</span>
                          </div>
                        ) : null}
                        {modalDetail.outputMeta.generatedAt ? (
                          <div className="metis-drawer-inset-row">
                            <span className="metis-drawer-inset-key">Generated</span>
                            <span className="metis-drawer-inset-val">{modalDetail.outputMeta.generatedAt}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {modalDetail.messageWording ? (
                      <div className="metis-wording-block">
                        <div className="metis-wording-toggle-row">
                          <span className="metis-wording-toggle-label">Wording</span>
                          <div className="metis-wording-toggle">
                            <button
                              type="button"
                              className={`metis-wording-toggle-btn${
                                wordingMode === "controlled_draft" ? " metis-wording-toggle-btn--active" : ""
                              }`}
                              onClick={() => setWordingMode("controlled_draft")}
                            >
                              Controlled draft
                            </button>
                            <button
                              type="button"
                              className={`metis-wording-toggle-btn${
                                wordingMode === "ai_polished" ? " metis-wording-toggle-btn--active" : ""
                              }`}
                              onClick={() => setWordingMode("ai_polished")}
                            >
                              AI-polished wording
                            </button>
                          </div>
                        </div>
                        <div className="metis-wording-body">
                          {(wordingMode === "ai_polished"
                            ? modalDetail.messageWording.aiPolishedBody
                            : modalDetail.messageWording.draftBody
                          )
                            .split("\n")
                            .map((line, li) => (
                              <p
                                key={li}
                                className={line.startsWith("-") ? "metis-wording-bullet" : "metis-wording-para"}
                              >
                                {line.startsWith("-") ? line.slice(1).trim() : line}
                              </p>
                            ))}
                        </div>
                      </div>
                    ) : modalDetail.messageBody ? (
                      <div className="metis-drawer-field">
                        <div className="metis-drawer-field-label">Message body</div>
                        <div className="metis-drawer-field-value" style={{ whiteSpace: "pre-line" }}>
                          {modalDetail.messageBody}
                        </div>
                      </div>
                    ) : null}

                    {modalDetail.issueRecordImpact ? (
                      <IssueRecordImpactPanel
                        impact={modalDetail.issueRecordImpact}
                        laneColor={selectedLaneConfig.textColor}
                      />
                    ) : null}

                    {modalDetail.guardrails?.mustAvoid.length ? (
                      <div className="metis-drawer-field">
                        <div className="metis-drawer-field-label">Do not say</div>
                        <ul className="metis-drawer-impact-list">
                          {modalDetail.guardrails.mustAvoid.map((item) => (
                            <li key={item} className="metis-drawer-impact-item">
                              {item}
                            </li>
                          ))}
                        </ul>
                        {modalDetail.guardrails.toneNotes ? (
                          <div className="metis-drawer-field-value" style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                            {modalDetail.guardrails.toneNotes}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {modalDetail.outputMeta?.href && !modalDetail.recordMeta?.href ? (
                      <Link
                        href={modalDetail.outputMeta.href}
                        className="metis-drawer-field-value"
                        style={{ color: selectedLaneConfig.textColor, fontWeight: 600 }}
                      >
                        Open in Metis →
                      </Link>
                    ) : null}
                  </div>
                )}

                {!modalLoading && !modalError && modalDetail && activeTab === "record" && (
                  <div className="metis-drawer-content">
                    <div className="metis-full-record">
                      {(modalDetail.fullRecordSections ?? []).map((section, si) => (
                        <div key={si} className="metis-record-section">
                          {section.heading ? (
                            <div className="metis-record-section-heading">{section.heading}</div>
                          ) : null}
                          <div className="metis-record-section-body" style={{ whiteSpace: "pre-line" }}>
                            {section.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "related" && !modalLoading && (
                  <div className="metis-drawer-content">
                    {modalError ? (
                      <p className="metis-drawer-summary-text">{modalError}</p>
                    ) : (modalDetail?.relatedRecords ?? []).length === 0 ? (
                      <p className="metis-drawer-summary-text">No related records linked to this card.</p>
                    ) : (
                      <div className="metis-related-list">
                        {(modalDetail?.relatedRecords ?? []).map((rel) => (
                          rel.href ? (
                            <Link key={rel.id} href={rel.href} className="metis-related-card">
                              <div className="metis-related-meta">
                                <span className="metis-related-lane" style={{ color: selectedLaneConfig.textColor }}>
                                  {rel.recordType ?? "Related"}
                                </span>
                                <span className="metis-related-time">{rel.code}</span>
                              </div>
                              <div className="metis-related-title">{rel.label}</div>
                            </Link>
                          ) : (
                            <div key={rel.id} className="metis-related-card">
                              <div className="metis-related-meta">
                                <span className="metis-related-lane" style={{ color: selectedLaneConfig.textColor }}>
                                  {rel.recordType ?? "Related"}
                                </span>
                                <span className="metis-related-time">{rel.code}</span>
                              </div>
                              <div className="metis-related-title">{rel.label}</div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
