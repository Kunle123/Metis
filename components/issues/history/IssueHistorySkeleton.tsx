import { ISSUE_HISTORY_LANE_CONFIG } from "@/lib/issues/issueHistoryTypes";

const LANES = ["input", "issue", "output"] as const;

export function IssueHistorySkeleton() {
  return (
    <div className="issue-history-timeline">
      <div className="metis-root">
        <header className="metis-header">
          <div className="metis-header-inner">
            <div className="metis-header-left">
              <div className="metis-brand-row">
                <span className="metis-brand-name">METIS</span>
              </div>
            </div>
            <div className="metis-header-centre">
              <div className="h-8 w-2/3 max-w-lg animate-pulse rounded bg-[#E7D8BF]" />
              <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-[#E7D8BF]/80" />
            </div>
            <div className="metis-position-panel">
              <div className="h-3 w-24 animate-pulse rounded bg-[#E7D8BF]/70" />
              <div className="mt-2 h-5 w-full animate-pulse rounded bg-[#E7D8BF]" />
            </div>
          </div>
          <div className="metis-legend-bar">
            {LANES.map((lane) => (
              <div key={lane} className="metis-legend-item opacity-60">
                <span className="metis-legend-dot" style={{ background: ISSUE_HISTORY_LANE_CONFIG[lane].color }} />
                <span className="metis-legend-label">{ISSUE_HISTORY_LANE_CONFIG[lane].label}</span>
              </div>
            ))}
          </div>
        </header>
        <div className="metis-layout">
          <div
            className="flex flex-col items-center justify-center gap-3 px-8 py-20"
            style={{ color: "#5E5A50", fontFamily: "Inter, sans-serif" }}
          >
            <div className="h-2 w-40 animate-pulse rounded-full bg-[#D8D0C3]" />
            <p className="text-sm font-medium">Building issue history…</p>
            <p className="text-xs text-[#8A8478]">Loading timeline cards</p>
          </div>
          <div className="metis-timeline-scroll opacity-40">
            {LANES.map((lane) => (
              <div key={lane} className="metis-swimlane-row">
                <div className="metis-lane-label" style={{ borderLeftColor: ISSUE_HISTORY_LANE_CONFIG[lane].color }}>
                  <div className="metis-lane-label-inner">
                    <div className="metis-lane-name" style={{ color: ISSUE_HISTORY_LANE_CONFIG[lane].textColor }}>
                      {ISSUE_HISTORY_LANE_CONFIG[lane].label}
                    </div>
                  </div>
                </div>
                <div className="metis-swimlane flex-1" style={{ borderTopColor: ISSUE_HISTORY_LANE_CONFIG[lane].color }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="metis-cell">
                      <div className="metis-card animate-pulse" style={{ minHeight: 88 }}>
                        <div className="metis-card-body">
                          <div className="h-3 w-16 rounded bg-[#E7D8BF]" />
                          <div className="mt-2 h-4 w-full rounded bg-[#E7D8BF]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
