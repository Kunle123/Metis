export type DemoStageId = "stage-1" | "stage-2" | "stage-3" | "stage-4";
export type DemoTabId = "situation" | "brief" | "messages";
export type DemoTone = "critical" | "warning" | "info" | "success" | "neutral";
export type DemoClaimStatus = "Confirmed" | "Assumption" | "Needs validation" | "Superseded";
export type DemoApprovalStatus = "Draft" | "Ready for review" | "Approved" | "Prepared but not issued";

export type DemoStage = {
  id: DemoStageId;
  index: number;
  title: string;
  shortLabel: string;
  timestampLabel: string;
  posture: string;
  summary: string;
  knownNow: string[];
  changedNow: string[];
  unresolvedNow: string[];
  safeToSay: string[];
  cockpit: {
    currentPosition: string;
    whatChanged: string;
    needsDecision: string;
    safeToSay: string;
    doNotSayYet: string;
  };
};

export type DemoRecordBase = {
  id: string;
  code: string;
  stageIntroduced: DemoStageId;
  stageSuperseded?: DemoStageId;
  status: string;
  title: string;
  body: string;
  ownerName: string;
  ownerRole: string;
  department: string;
  timestampLabel: string;
  linkedRecordCodes: string[];
};

export type DemoInputRecord = DemoRecordBase & {
  recordType: "source";
  detail: string[];
};

export type DemoObservationRecord = DemoRecordBase & {
  recordType: "observation";
  confidence: "Confirmed" | "Likely" | "Unclear";
};

export type DemoClaimRecord = DemoRecordBase & {
  recordType: "claim";
  claimStatus: DemoClaimStatus;
};

export type DemoQuestionRecord = DemoRecordBase & {
  recordType: "question";
  severity: "Critical" | "Important" | "Watch";
};

export type DemoBriefSection = {
  title: string;
  body: string[];
  tone?: DemoTone;
};

export type DemoBriefRecord = DemoRecordBase & {
  recordType: "brief";
  sections: DemoBriefSection[];
  lede: string;
  statusLine: string;
  severity: string;
  urgency: string;
  briefingPosture: string;
};

export type DemoMessageRecord = DemoRecordBase & {
  recordType: "message";
  audience: string;
  approvalStatus: DemoApprovalStatus;
  freshness: "Current" | "Draft";
  alignmentCue: "Aligned" | "Review risk" | "Not checked";
  purposeLine: string;
  reviewBeforeUse: string[];
  provenanceLine: string;
};

export type DemoAttentionItem = {
  id: string;
  stageId: DemoStageId;
  tone: DemoTone;
  title: string;
  description: string;
  tab: DemoTabId;
  linkLabel: string;
};

export type DemoReviewFinding = {
  id: string;
  code: string;
  stageIntroduced: DemoStageId;
  tone: DemoTone;
  title: string;
  body: string;
  linkedRecordCodes: string[];
};

export type DemoActivityEvent = {
  id: string;
  stageIntroduced: DemoStageId;
  timestampLabel: string;
  title: string;
  body: string;
  linkedRecordCodes: string[];
};

export type DemoSituationRecord = DemoInputRecord | DemoObservationRecord | DemoClaimRecord | DemoQuestionRecord;

export const demoTabs: Array<{ id: DemoTabId; label: string }> = [
  { id: "situation", label: "Situation" },
  { id: "brief", label: "Brief" },
  { id: "messages", label: "Messages" },
];

export function stageRank(stageId: DemoStageId): number {
  return towerBriefingDemo.stages.find((s) => s.id === stageId)?.index ?? 0;
}

export function isAvailableAtStage(
  record: Pick<DemoRecordBase, "stageIntroduced">,
  stageId: DemoStageId,
): boolean {
  return stageRank(record.stageIntroduced) <= stageRank(stageId);
}

export function isSupersededAtStage(
  record: Pick<DemoRecordBase, "stageSuperseded">,
  stageId: DemoStageId,
): boolean {
  return Boolean(record.stageSuperseded && stageRank(record.stageSuperseded) <= stageRank(stageId));
}

export function recordStateAtStage(record: DemoSituationRecord, stageId: DemoStageId): string {
  if (isSupersededAtStage(record, stageId)) return "Superseded";
  if (record.stageIntroduced === stageId) return "New";
  if (record.recordType === "question" && record.status === "Open") return "Still open";
  if (record.recordType === "claim") {
    if (record.claimStatus === "Confirmed") return "Confirmed";
    if (record.claimStatus === "Assumption") return "Needs validation";
    if (record.claimStatus === "Needs validation") return "Needs validation";
    return "Superseded";
  }
  return "Carried forward";
}

export function getTowerDemoStageData(stageId: DemoStageId) {
  const stage = towerBriefingDemo.stages.find((s) => s.id === stageId) ?? towerBriefingDemo.stages[0]!;
  const situationRecords: DemoSituationRecord[] = [
    ...towerBriefingDemo.inputs,
    ...towerBriefingDemo.observations,
    ...towerBriefingDemo.claims,
    ...towerBriefingDemo.questions,
  ].filter((r) => isAvailableAtStage(r, stageId));

  const visibleBriefs = towerBriefingDemo.briefs.filter((r) => isAvailableAtStage(r, stageId));

  return {
    stage,
    situationRecords,
    currentBrief: visibleBriefs.at(-1) ?? null,
    visibleMessages: towerBriefingDemo.messages.filter((r) => isAvailableAtStage(r, stageId)),
    visibleReviews: towerBriefingDemo.reviewFindings.filter((r) => isAvailableAtStage(r, stageId)),
    attentionItems: towerBriefingDemo.attentionItems.filter((item) => item.stageId === stageId),
    visibleActivity: towerBriefingDemo.activity.filter((r) => isAvailableAtStage(r, stageId)),
  };
}

const briefSection = (title: string, body: string[], tone?: DemoTone): DemoBriefSection => ({
  title,
  body,
  ...(tone ? { tone } : {}),
});

export const towerBriefingDemo = {
  coreLine: "Before the incident, there was just an office party.",
  title: "The Tower Briefing Record",
  subtitle: "How a routine office update becomes a live incident briefing.",
  disclaimer:
    "This is a fictional issue-briefing exercise created to demonstrate Metis workflows. It is not affiliated with any film, studio, rights holder or real organisation.",
  walkthroughHref: "https://metisbriefing.com",

  issue: {
    status: "Active",
    severity: "Stage-dependent",
    owner: "Amara Lewis",
    ownerRole: "Communications Lead",
    issueType: "Event & incident communications",
    audienceGroups: ["Executive leadership", "Tower staff", "Hospitality & facilities", "Security", "Press & external"],
  },

  stages: [
    {
      id: "stage-1",
      index: 1,
      title: "Routine event preparation",
      shortLabel: "Routine prep",
      timestampLabel: "Fri 08:30",
      posture: "Planning and proportionate preparation for a high-profile internal celebration.",
      summary:
        "Guest numbers are trending above forecast. Catering and reception are adjusting proportionately. No safety or security concerns are on record.",
      knownNow: [
        "Confirmed guest count is above the original forecast (CLM-001).",
        "Catering may need a modest uplift; treat as assumption until Facilities confirms (CLM-002).",
        "All routine vendor and access checks are on track.",
      ],
      changedNow: [
        "Hospitality revised the floor plan after the latest RSVP sweep.",
        "HR flagged two VIP arrivals requiring escort from reception.",
      ],
      unresolvedNow: [
        "Final confirmed headcount for hot food service (Q-001).",
        "Whether the executive balcony walk-through proceeds as scheduled (Q-002).",
      ],
      safeToSay: [
        "We are preparing for a well-attended internal celebration with additional hospitality capacity as needed.",
        "Routine safety and access procedures remain in place.",
      ],
      cockpit: {
        currentPosition: "Routine high-profile event preparation; no incident indicators.",
        whatChanged: "Guest numbers revised upward; hospitality adjusting proportionately.",
        needsDecision: "Approve modest catering uplift once Facilities confirms kitchen capacity.",
        safeToSay:
          "We are preparing for a well-attended internal celebration and adjusting hospitality proportionately.",
        doNotSayYet: "Do not speculate about incidents, injuries, security escalations or external media interest.",
      },
    },
    {
      id: "stage-2",
      index: 2,
      title: "Day-of-event live update",
      shortLabel: "Live update",
      timestampLabel: "Fri 11:15",
      posture: "Event is live; logistics and guest flow are the primary comms focus.",
      summary:
        "Attendance is higher than forecast. Several external guests arrived without pre-registration. Operations are managing flow; no incident declared.",
      knownNow: [
        "Guest numbers remain above forecast; catering uplift in progress (CLM-001 updated).",
        "Multiple external guests arrived without pre-registration (CLM-003).",
        "Reception and security are managing access without evacuation or lockdown.",
      ],
      changedNow: [
        "Live headcount exceeded the stage-1 forecast by a further margin.",
        "Reception logged walk-in external guests; security issued temporary credentials.",
      ],
      unresolvedNow: [
        "Whether additional security posts are needed at the mezzanine (Q-004).",
        "Final sign-off on executive talking points for the 12:00 update (Q-005).",
      ],
      safeToSay: [
        "The event is well attended; we are managing guest flow and access in line with our plans.",
        "A small number of guests arrived without prior registration and are being processed safely.",
      ],
      cockpit: {
        currentPosition: "Live event operations; elevated attendance and access friction, not an incident.",
        whatChanged: "Walk-in external guests and higher-than-forecast attendance; catering uplift underway.",
        needsDecision: "Confirm whether to add a temporary security post at the mezzanine.",
        safeToSay:
          "The celebration is underway; guest flow is being actively managed and we will share updates through official channels.",
        doNotSayYet:
          "Do not describe any tower incident, injuries, emergency services activity or operational lockdown.",
      },
    },
    {
      id: "stage-3",
      index: 3,
      title: "Ambiguous incident signal",
      shortLabel: "Ambiguous signal",
      timestampLabel: "Fri 13:40",
      posture: "Possible incident signal; facts not yet confirmed. Holding lines prepared but not issued.",
      summary:
        "Security reports unusual activity on an upper floor and one floor contact is temporarily unreachable. Earlier 'event proceeding normally' language is superseded pending confirmation.",
      knownNow: [
        "Security has an unconfirmed report of unusual activity on level 42 (OBS-004).",
        "One floor warden has not checked in on schedule; cause unknown (Q-006).",
        "Earlier claim that the event is proceeding normally is superseded (CLM-006).",
      ],
      changedNow: [
        "Security escalated an ambiguous activity report; facilities lost routine contact with one floor warden.",
        "Comms prepared holding lines but has not issued external or staff-wide incident language.",
      ],
      unresolvedNow: [
        "Whether an incident has occurred and its nature (Q-007).",
        "Status and location of the unreachable floor contact (Q-006).",
        "Whether to pause the live broadcast feed from the atrium (Q-003).",
      ],
      safeToSay: [
        "We are checking reports regarding activity in the building and will update through official channels.",
        "Staff should follow security instructions and await verified updates.",
      ],
      cockpit: {
        currentPosition: "Possible incident signal; facts not yet confirmed.",
        whatChanged: "Security reports unusual activity and one floor contact is unreachable.",
        needsDecision: "Prepare holding lines but do not issue until confirmation.",
        safeToSay: "We are checking reports and will update through official channels.",
        doNotSayYet: "Do not mention injuries, motive, numbers, emergency services detail or operational tactics.",
      },
    },
    {
      id: "stage-4",
      index: 4,
      title: "Confirmed incident response",
      shortLabel: "Confirmed response",
      timestampLabel: "Fri 15:05",
      posture: "Serious incident confirmed at the tower; controlled staff and press messaging under legal review.",
      summary:
        "A serious incident at the tower is confirmed. Injury reports require validation before use in any message. Staff and press drafts are ready for review, not yet approved for issue.",
      knownNow: [
        "A serious incident at the tower is confirmed (CLM-004).",
        "Injury reports exist but require validation before external use (CLM-005).",
        "Emergency services are on site; building partial evacuation in progress per security lead.",
      ],
      changedNow: [
        "Incident status moved from ambiguous signal to confirmed serious incident.",
        "Executive, staff and press drafts prepared; awaiting review and approval.",
      ],
      unresolvedNow: [
        "Validated injury count and nature suitable for external audiences (Q-008).",
        "Whether the atrium broadcast should remain live (Q-003).",
      ],
      safeToSay: [
        "There is a serious incident at the tower; we are supporting those affected and cooperating with authorities.",
        "Further detail will be shared when verified; please rely on official channels only.",
      ],
      cockpit: {
        currentPosition: "Confirmed serious incident; controlled messaging and legal review in progress.",
        whatChanged: "Incident confirmed; injury details unvalidated; drafts prepared for staff and press.",
        needsDecision: "Approve staff note and press holding statement after legal validation of injury language.",
        safeToSay:
          "There is a serious incident; we are responding and will provide verified updates through official channels.",
        doNotSayYet:
          "Do not state injury numbers, names, cause, speculation about motive or unverified operational detail.",
      },
    },
  ] satisfies DemoStage[],

  inputs: [
    {
      id: "src-001",
      recordType: "source",
      code: "SRC-001",
      stageIntroduced: "stage-1",
      status: "Logged",
      title: "Final RSVP sweep — hospitality",
      body: "Maya Chen reports confirmed RSVPs exceed forecast by 18% with VIP arrivals concentrated 17:00–18:00.",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 08:05",
      linkedRecordCodes: ["CLM-001", "OBS-001"],
      detail: [
        "Forecast: 420 seated guests; confirmed RSVPs: 496.",
        "VIP list includes two board observers requiring escort from reception.",
        "No dietary or accessibility escalations beyond routine.",
      ],
    },
    {
      id: "src-002",
      recordType: "source",
      code: "SRC-002",
      stageIntroduced: "stage-1",
      status: "Logged",
      title: "Kitchen capacity check — facilities",
      body: "Priya Raman confirms hot-food lines can absorb a modest uplift if final numbers arrive by 10:00.",
      ownerName: "Priya Raman",
      ownerRole: "Facilities Manager",
      department: "Facilities",
      timestampLabel: "Fri 08:12",
      linkedRecordCodes: ["CLM-002", "Q-001"],
      detail: [
        "Secondary service station can be opened with 90 minutes' notice.",
        "Cold storage sufficient for revised dessert count.",
      ],
    },
    {
      id: "src-003",
      recordType: "source",
      code: "SRC-003",
      stageIntroduced: "stage-1",
      status: "Logged",
      title: "HR VIP arrival protocol",
      body: "Daniel Price confirms escort protocol for two VIP guests; no change to public messaging required.",
      ownerName: "Daniel Price",
      ownerRole: "HR Business Partner",
      department: "People",
      timestampLabel: "Fri 08:18",
      linkedRecordCodes: ["Q-002"],
      detail: ["Escort from reception to level 61.", "No media-facing elements for these arrivals."],
    },
    {
      id: "src-004",
      recordType: "source",
      code: "SRC-004",
      stageIntroduced: "stage-1",
      status: "Logged",
      title: "Security routine access plan",
      body: "Lena Ortiz confirms standard bag-check and credential zones; no elevated threat posture.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 08:22",
      linkedRecordCodes: ["CLM-006"],
      detail: ["Credential zones unchanged.", "No additional perimeter closures planned."],
    },
    {
      id: "src-005",
      recordType: "source",
      code: "SRC-005",
      stageIntroduced: "stage-2",
      status: "Logged",
      title: "Reception walk-in log",
      body: "Ben Carter logs eleven external guests without pre-registration; temporary credentials issued.",
      ownerName: "Ben Carter",
      ownerRole: "Reception Manager",
      department: "Reception",
      timestampLabel: "Fri 10:48",
      linkedRecordCodes: ["CLM-003", "OBS-002"],
      detail: [
        "Walk-ins processed at desk B; average delay 6 minutes.",
        "All walk-ins presented corporate-adjacent invitations; verification ongoing.",
      ],
    },
    {
      id: "src-006",
      recordType: "source",
      code: "SRC-006",
      stageIntroduced: "stage-2",
      status: "Logged",
      title: "Live headcount — hospitality floor",
      body: "Maya Chen reports in-building count already 12% above the revised forecast with peak arrival not yet reached.",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 11:02",
      linkedRecordCodes: ["CLM-001", "OBS-003"],
      detail: ["Mezzanine flow steady.", "Additional cold beverages deployed."],
    },
    {
      id: "src-007",
      recordType: "source",
      code: "SRC-007",
      stageIntroduced: "stage-3",
      status: "Logged",
      title: "Security ambiguous activity report",
      body: "Lena Ortiz reports unconfirmed unusual activity on level 42; responding team dispatched, facts pending.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 13:22",
      linkedRecordCodes: ["OBS-004", "Q-007"],
      detail: [
        "Report source: patrol radio, not CCTV confirmed.",
        "No evacuation order issued at time of log.",
      ],
    },
    {
      id: "src-008",
      recordType: "source",
      code: "SRC-008",
      stageIntroduced: "stage-3",
      status: "Logged",
      title: "Floor warden check-in miss",
      body: "Priya Raman notes level 42 warden has not checked in; may be comms congestion during event peak.",
      ownerName: "Priya Raman",
      ownerRole: "Facilities Manager",
      department: "Facilities",
      timestampLabel: "Fri 13:28",
      linkedRecordCodes: ["Q-006"],
      detail: ["Last check-in 12:51.", "Alternate contact attempting reach via radio."],
    },
    {
      id: "src-009",
      recordType: "source",
      code: "SRC-009",
      stageIntroduced: "stage-4",
      status: "Logged",
      title: "Incident confirmation — security command",
      body: "Lena Ortiz confirms a serious incident on level 42; partial evacuation and emergency services on site.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 14:52",
      linkedRecordCodes: ["CLM-004", "OBS-005"],
      detail: [
        "Incident command post established on level 40.",
        "Do not relay unverified injury detail from radio traffic.",
      ],
    },
    {
      id: "src-010",
      recordType: "source",
      code: "SRC-010",
      stageIntroduced: "stage-4",
      status: "Logged",
      title: "Legal review — injury language",
      body: "Noah Grant advises all external injury references remain provisional until hospital liaison confirms.",
      ownerName: "Noah Grant",
      ownerRole: "Legal Counsel",
      department: "Legal",
      timestampLabel: "Fri 15:00",
      linkedRecordCodes: ["CLM-005", "Q-008", "MSG-008"],
      detail: [
        "Press draft must not include numbers or names.",
        "Staff note may reference support available without injury counts.",
      ],
    },
  ] satisfies DemoInputRecord[],

  observations: [
    {
      id: "obs-001",
      recordType: "observation",
      code: "OBS-001",
      stageIntroduced: "stage-1",
      status: "Recorded",
      title: "RSVP trend above forecast",
      body: "Internal analytics show sustained upward revision across three RSVP sweeps.",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 08:08",
      linkedRecordCodes: ["SRC-001", "CLM-001"],
      confidence: "Confirmed",
    },
    {
      id: "obs-002",
      recordType: "observation",
      code: "OBS-002",
      stageIntroduced: "stage-2",
      status: "Recorded",
      title: "Reception queue lengthening",
      body: "Walk-in processing is creating a visible queue at desk B; no safety threshold breached.",
      ownerName: "Ben Carter",
      ownerRole: "Reception Manager",
      department: "Reception",
      timestampLabel: "Fri 10:55",
      linkedRecordCodes: ["SRC-005", "CLM-003"],
      confidence: "Likely",
    },
    {
      id: "obs-003",
      recordType: "observation",
      code: "OBS-003",
      stageIntroduced: "stage-2",
      status: "Recorded",
      title: "Mezzanine density elevated",
      body: "Crowd density on the mezzanine is elevated but movement remains orderly.",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 11:08",
      linkedRecordCodes: ["SRC-006", "Q-004"],
      confidence: "Likely",
    },
    {
      id: "obs-004",
      recordType: "observation",
      code: "OBS-004",
      stageIntroduced: "stage-3",
      status: "Recorded",
      title: "Unconfirmed activity on level 42",
      body: "Patrol report describes unusual activity; CCTV review not yet complete.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 13:25",
      linkedRecordCodes: ["SRC-007", "Q-007"],
      confidence: "Unclear",
    },
    {
      id: "obs-005",
      recordType: "observation",
      code: "OBS-005",
      stageIntroduced: "stage-4",
      status: "Recorded",
      title: "Emergency services on site",
      body: "Ambulance and fire command visible at loading bay; consistent with serious incident posture.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 14:55",
      linkedRecordCodes: ["SRC-009", "CLM-004"],
      confidence: "Confirmed",
    },
  ] satisfies DemoObservationRecord[],

  claims: [
    {
      id: "clm-001",
      recordType: "claim",
      code: "CLM-001",
      stageIntroduced: "stage-1",
      status: "Confirmed",
      claimStatus: "Confirmed",
      title: "Guest numbers higher than expected",
      body: "Confirmed RSVPs and early arrivals exceed the original forecast; live count updated again at 11:02 (stage 2).",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 08:10 · updated Fri 11:05",
      linkedRecordCodes: ["SRC-001", "SRC-006", "OBS-001"],
    },
    {
      id: "clm-002",
      recordType: "claim",
      code: "CLM-002",
      stageIntroduced: "stage-1",
      status: "Open",
      claimStatus: "Assumption",
      title: "Additional catering may be required",
      body: "Facilities assessment suggests a modest hot-food uplift is likely if final headcount holds; not yet fully confirmed.",
      ownerName: "Priya Raman",
      ownerRole: "Facilities Manager",
      department: "Facilities",
      timestampLabel: "Fri 08:14",
      linkedRecordCodes: ["SRC-002", "Q-001"],
    },
    {
      id: "clm-003",
      recordType: "claim",
      code: "CLM-003",
      stageIntroduced: "stage-2",
      status: "Confirmed",
      claimStatus: "Confirmed",
      title: "External guests without pre-registration",
      body: "Several external guests arrived without pre-registration and were processed with temporary credentials.",
      ownerName: "Ben Carter",
      ownerRole: "Reception Manager",
      department: "Reception",
      timestampLabel: "Fri 10:50",
      linkedRecordCodes: ["SRC-005", "OBS-002"],
    },
    {
      id: "clm-004",
      recordType: "claim",
      code: "CLM-004",
      stageIntroduced: "stage-4",
      status: "Confirmed",
      claimStatus: "Confirmed",
      title: "Serious incident at tower",
      body: "Security command has confirmed a serious incident on level 42; partial evacuation underway.",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 14:53",
      linkedRecordCodes: ["SRC-009", "OBS-005"],
    },
    {
      id: "clm-005",
      recordType: "claim",
      code: "CLM-005",
      stageIntroduced: "stage-4",
      status: "Open",
      claimStatus: "Needs validation",
      title: "Injuries occurred",
      body: "Multiple injury reports are circulating internally; legal counsel requires hospital liaison validation before external use.",
      ownerName: "Noah Grant",
      ownerRole: "Legal Counsel",
      department: "Legal",
      timestampLabel: "Fri 15:02",
      linkedRecordCodes: ["SRC-010", "Q-008"],
    },
    {
      id: "clm-006",
      recordType: "claim",
      code: "CLM-006",
      stageIntroduced: "stage-1",
      stageSuperseded: "stage-3",
      status: "Superseded",
      claimStatus: "Superseded",
      title: "Event proceeding normally",
      body: "Earlier position that the celebration was proceeding normally without incident indicators; superseded at ambiguous signal stage.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 08:25 · superseded Fri 13:35",
      linkedRecordCodes: ["SRC-004"],
    },
  ] satisfies DemoClaimRecord[],

  questions: [
    {
      id: "q-001",
      recordType: "question",
      code: "Q-001",
      stageIntroduced: "stage-1",
      status: "Open",
      severity: "Important",
      title: "Final headcount for hot food service",
      body: "What confirmed seated count should catering plan against for the 13:00 service window?",
      ownerName: "Maya Chen",
      ownerRole: "Hospitality Lead",
      department: "Hospitality",
      timestampLabel: "Fri 08:16",
      linkedRecordCodes: ["SRC-002", "CLM-002"],
    },
    {
      id: "q-002",
      recordType: "question",
      code: "Q-002",
      stageIntroduced: "stage-1",
      status: "Open",
      severity: "Watch",
      title: "Executive balcony walk-through",
      body: "Does the executive office still want the scheduled balcony walk-through given revised VIP timing?",
      ownerName: "Marcus Hale",
      ownerRole: "Executive Office",
      department: "Executive Office",
      timestampLabel: "Fri 08:20",
      linkedRecordCodes: ["SRC-003"],
    },
    {
      id: "q-003",
      recordType: "question",
      code: "Q-003",
      stageIntroduced: "stage-1",
      status: "Open",
      severity: "Important",
      title: "Atrium broadcast feed",
      body: "Should the live atrium broadcast continue if building activity status changes?",
      ownerName: "Sofia Reed",
      ownerRole: "Media Lead",
      department: "Media",
      timestampLabel: "Fri 08:28",
      linkedRecordCodes: ["BRF-003"],
    },
    {
      id: "q-004",
      recordType: "question",
      code: "Q-004",
      stageIntroduced: "stage-2",
      status: "Open",
      severity: "Important",
      title: "Temporary security post at mezzanine",
      body: "Is an additional security post warranted given elevated mezzanine density?",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 11:10",
      linkedRecordCodes: ["OBS-003"],
    },
    {
      id: "q-005",
      recordType: "question",
      code: "Q-005",
      stageIntroduced: "stage-2",
      status: "Closed",
      severity: "Watch",
      title: "Executive talking points for 12:00",
      body: "Sign-off received from executive office for routine attendance update talking points.",
      ownerName: "Marcus Hale",
      ownerRole: "Executive Office",
      department: "Executive Office",
      timestampLabel: "Fri 11:55",
      linkedRecordCodes: ["MSG-003"],
    },
    {
      id: "q-006",
      recordType: "question",
      code: "Q-006",
      stageIntroduced: "stage-3",
      status: "Open",
      severity: "Critical",
      title: "Unreachable floor warden",
      body: "What is the status and location of the level 42 floor warden who missed check-in?",
      ownerName: "Priya Raman",
      ownerRole: "Facilities Manager",
      department: "Facilities",
      timestampLabel: "Fri 13:30",
      linkedRecordCodes: ["SRC-008"],
    },
    {
      id: "q-007",
      recordType: "question",
      code: "Q-007",
      stageIntroduced: "stage-3",
      status: "Open",
      severity: "Critical",
      title: "Nature of reported activity",
      body: "Has security confirmed whether an incident has occurred and what type?",
      ownerName: "Lena Ortiz",
      ownerRole: "Security Supervisor",
      department: "Security",
      timestampLabel: "Fri 13:32",
      linkedRecordCodes: ["SRC-007", "OBS-004"],
    },
    {
      id: "q-008",
      recordType: "question",
      code: "Q-008",
      stageIntroduced: "stage-4",
      status: "Open",
      severity: "Critical",
      title: "Validated injury detail for external audiences",
      body: "What injury information is validated for staff and press channels?",
      ownerName: "Noah Grant",
      ownerRole: "Legal Counsel",
      department: "Legal",
      timestampLabel: "Fri 15:04",
      linkedRecordCodes: ["CLM-005", "SRC-010"],
    },
  ] satisfies DemoQuestionRecord[],

  briefs: [
    {
      id: "brf-001",
      recordType: "brief",
      code: "BRF-001",
      stageIntroduced: "stage-1",
      status: "Current",
      title: "Routine event preparation brief",
      body: "Leadership brief for a high-profile internal celebration with above-forecast attendance and routine operational adjustments.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 08:35",
      linkedRecordCodes: ["CLM-001", "CLM-002", "Q-001", "Q-002"],
      lede: "A well-attended internal celebration requires modest hospitality uplift; no safety or security escalations are on record.",
      statusLine: "Routine preparation · no incident indicators",
      severity: "Low",
      urgency: "Standard",
      briefingPosture: "Proportionate planning and calm executive awareness",
      sections: [
        briefSection("Executive summary", [
          "The tower celebration remains a routine high-profile internal event.",
          "Guest numbers are confirmed above forecast (CLM-001); catering uplift is being assessed as an assumption (CLM-002).",
          "Security and access plans are unchanged; no incident language is warranted.",
        ], "success"),
        briefSection("Current assessment", [
          "Operations are adjusting hospitality and reception flow proportionately.",
          "Executive office is considering whether a scheduled balcony walk-through should proceed (Q-002).",
        ], "info"),
        briefSection("Confirmed facts", [
          "RSVP and early indicators exceed original forecast (CLM-001, SRC-001, OBS-001).",
          "Standard credential and bag-check zones remain in place (SRC-004).",
        ], "success"),
        briefSection("Claims", [
          "CLM-001 — Guest numbers higher than expected: Confirmed.",
          "CLM-002 — Additional catering may be required: Assumption; validate with Facilities.",
          "CLM-006 — Event proceeding normally: Current planning posture (not yet superseded at this stage).",
        ], "info"),
        briefSection("Open questions", [
          "Q-001 — Final headcount for hot food service.",
          "Q-002 — Executive balcony walk-through timing.",
          "Q-003 — Atrium broadcast contingency (watch item).",
        ], "warning"),
        briefSection("Recommended decisions / next actions", [
          "Approve modest catering uplift once Q-001 is resolved with Facilities.",
          "Confirm VIP escort protocol with HR; no external messaging required.",
        ], "warning"),
        briefSection("What not to say yet / uncertainty guardrails", [
          "Do not reference incidents, injuries, emergency services or external media speculation.",
          "Do not cite unvalidated catering numbers externally.",
        ], "neutral"),
      ],
    },
    {
      id: "brf-002",
      recordType: "brief",
      code: "BRF-002",
      stageIntroduced: "stage-2",
      status: "Current",
      title: "Day-of live event brief",
      body: "Live operations brief: elevated attendance, walk-in external guests, and active logistics management without incident declaration.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 11:20",
      linkedRecordCodes: ["CLM-001", "CLM-003", "MSG-003", "MSG-004"],
      lede: "The event is live and well attended; guest flow and access are actively managed with no confirmed incident.",
      statusLine: "Live event · elevated attendance",
      severity: "Moderate",
      urgency: "Elevated",
      briefingPosture: "Active logistics and disciplined language",
      sections: [
        briefSection("Executive summary", [
          "Attendance exceeds forecast; catering uplift is in progress.",
          "Walk-in external guests are being processed safely (CLM-003).",
          "No incident has been declared; messaging remains operational.",
        ], "info"),
        briefSection("Current assessment", [
          "Mezzanine density is elevated but orderly (OBS-003).",
          "Security is evaluating an optional mezzanine post (Q-004).",
        ], "info"),
        briefSection("Confirmed facts", [
          "CLM-001 updated with live in-building count above revised forecast (SRC-006).",
          "CLM-003 — external guests without pre-registration: Confirmed.",
        ], "success"),
        briefSection("Claims", [
          "CLM-001 — Guest numbers: Confirmed, updated live.",
          "CLM-002 — Catering uplift: Still assumption until kitchen sign-off.",
          "CLM-003 — Walk-in externals: Confirmed.",
        ], "info"),
        briefSection("Open questions", [
          "Q-004 — Temporary mezzanine security post.",
          "Q-005 — Executive talking points: closed for 12:00 routine update.",
        ], "warning"),
        briefSection("Recommended decisions / next actions", [
          "Issue live executive update (MSG-003) and staff logistics note (MSG-004).",
          "Decide on mezzanine security post before peak arrival window ends.",
        ], "warning"),
        briefSection("What not to say yet / uncertainty guardrails", [
          "Do not describe any tower incident, lockdown or injury.",
          "Do not quantify walk-in guests beyond 'a small number' until reception confirms.",
        ], "neutral"),
      ],
    },
    {
      id: "brf-003",
      recordType: "brief",
      code: "BRF-003",
      stageIntroduced: "stage-3",
      status: "Current",
      title: "Ambiguous incident signal brief",
      body: "Holding posture brief: unconfirmed activity report and missing floor contact; prepared lines not yet issued.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 13:45",
      linkedRecordCodes: ["OBS-004", "Q-006", "Q-007", "MSG-005", "MSG-006"],
      lede: "Possible incident signal; facts unconfirmed. Prepare holding language but do not issue until security confirms.",
      statusLine: "Ambiguous signal · hold external issue",
      severity: "High",
      urgency: "Immediate preparation",
      briefingPosture: "Verify before speaking; protect against overclaiming",
      sections: [
        briefSection("Executive summary", [
          "Security reports unconfirmed unusual activity on level 42 (OBS-004).",
          "One floor warden is unreachable; cause unknown (Q-006).",
          "Earlier 'event proceeding normally' claim is superseded (CLM-006).",
        ], "warning"),
        briefSection("Current assessment", [
          "Incident status is not confirmed; emergency language must not be issued.",
          "Holding drafts are prepared but marked not issued (MSG-005, MSG-006).",
        ], "warning"),
        briefSection("Confirmed facts", [
          "An ambiguous activity report exists (SRC-007, OBS-004).",
          "Floor warden check-in miss is documented (SRC-008).",
        ], "info"),
        briefSection("Claims", [
          "CLM-006 — Event proceeding normally: Superseded at this stage.",
          "Do not introduce CLM-004 or CLM-005 until confirmation stage.",
        ], "neutral"),
        briefSection("Open questions", [
          "Q-006 — Floor warden status.",
          "Q-007 — Whether an incident has occurred.",
          "Q-003 — Atrium broadcast pause decision.",
        ], "critical"),
        briefSection("Recommended decisions / next actions", [
          "Hold all external and staff-wide incident language pending Q-007 resolution.",
          "Keep MSG-005 and MSG-006 in 'prepared but not issued' until confirmation.",
        ], "warning"),
        briefSection("What not to say yet / uncertainty guardrails", [
          "Do not mention injuries, motive, numbers or operational tactics.",
          "Do not confirm a serious incident (CLM-004 is not yet available at this stage).",
        ], "critical"),
      ],
    },
    {
      id: "brf-004",
      recordType: "brief",
      code: "BRF-004",
      stageIntroduced: "stage-4",
      status: "Current",
      title: "Confirmed incident response brief",
      body: "Confirmed serious incident; controlled staff and press messaging under legal review with unvalidated injury detail.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 15:10",
      linkedRecordCodes: ["CLM-004", "CLM-005", "MSG-007", "MSG-008"],
      lede: "A serious incident at the tower is confirmed. Messaging must stay verified, minimal and legally cleared.",
      statusLine: "Confirmed incident · drafts ready for review",
      severity: "Critical",
      urgency: "Immediate",
      briefingPosture: "Controlled response; accuracy over speed",
      sections: [
        briefSection("Executive summary", [
          "Serious incident confirmed on level 42 (CLM-004).",
          "Injury information requires validation before external use (CLM-005, Q-008).",
          "Staff and press drafts are ready for review, not approved for issue.",
        ], "critical"),
        briefSection("Current assessment", [
          "Partial evacuation and emergency services on site (OBS-005).",
          "Legal counsel is gatekeeping injury language (SRC-010).",
        ], "warning"),
        briefSection("Confirmed facts", [
          "CLM-004 — Serious incident at tower: Confirmed.",
          "Emergency services presence observed (OBS-005).",
        ], "success"),
        briefSection("Claims", [
          "CLM-004 — Serious incident: Confirmed.",
          "CLM-005 — Injuries occurred: Needs validation; do not use counts in messages.",
          "CLM-006 — Event proceeding normally: Superseded.",
        ], "warning"),
        briefSection("Open questions", [
          "Q-008 — Validated injury detail for external audiences.",
          "Q-003 — Atrium broadcast status.",
        ], "critical"),
        briefSection("Recommended decisions / next actions", [
          "Approve MSG-007 staff note after legal review.",
          "Approve MSG-008 press holding statement only when Q-008 is resolved.",
        ], "warning"),
        briefSection("What not to say yet / uncertainty guardrails", [
          "No injury numbers, names, cause or speculation.",
          "Direct all audiences to official channels; do not amplify unverified social posts.",
        ], "critical"),
      ],
    },
  ] satisfies DemoBriefRecord[],

  messages: [
    {
      id: "msg-001",
      recordType: "message",
      code: "MSG-001",
      stageIntroduced: "stage-1",
      status: "Approved",
      title: "Staff event reminder",
      body: "Reminder: internal celebration today. Please bring your building pass, arrive via the main atrium entrance, and allow extra time for reception. Hospitality will direct you from the mezzanine.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 07:45",
      linkedRecordCodes: ["CLM-001"],
      audience: "Tower staff",
      approvalStatus: "Approved",
      freshness: "Current",
      alignmentCue: "Aligned",
      purposeLine: "Routine attendance reminder ahead of doors opening.",
      reviewBeforeUse: [
        "Confirm atrium entrance remains correct if security zones change.",
        "Do not mention incidents or emergency procedures beyond standard pass requirement.",
      ],
      provenanceLine: "Based on CLM-001 attendance trend and SRC-001 RSVP sweep; approved by Communications.",
    },
    {
      id: "msg-002",
      recordType: "message",
      code: "MSG-002",
      stageIntroduced: "stage-1",
      status: "Approved",
      title: "Executive event update",
      body: "Today's internal celebration is expected to be well attended. Hospitality and facilities are adjusting proportionately. No changes to executive movements are required at this time.",
      ownerName: "Marcus Hale",
      ownerRole: "Executive Office",
      department: "Executive Office",
      timestampLabel: "Fri 08:40",
      linkedRecordCodes: ["CLM-001", "CLM-002"],
      audience: "Executive leadership",
      approvalStatus: "Approved",
      freshness: "Current",
      alignmentCue: "Aligned",
      purposeLine: "Routine situational awareness for leadership before doors open.",
      reviewBeforeUse: [
        "Treat catering uplift as internal planning only until Facilities confirms.",
        "Avoid quantifying guest numbers externally.",
      ],
      provenanceLine: "Derived from BRF-001 and CLM-001/CLM-002; executive office clearance.",
    },
    {
      id: "msg-003",
      recordType: "message",
      code: "MSG-003",
      stageIntroduced: "stage-2",
      status: "Approved",
      title: "Live executive update",
      body: "The celebration is underway and attendance is higher than forecast. Operations are managing guest flow. A small number of guests arrived without prior registration and are being processed safely. We will share further updates through official channels.",
      ownerName: "Marcus Hale",
      ownerRole: "Executive Office",
      department: "Executive Office",
      timestampLabel: "Fri 11:25",
      linkedRecordCodes: ["CLM-001", "CLM-003", "BRF-002"],
      audience: "Executive leadership",
      approvalStatus: "Approved",
      freshness: "Current",
      alignmentCue: "Aligned",
      purposeLine: "Live leadership update during event operations.",
      reviewBeforeUse: [
        "Do not use incident, injury or emergency services language.",
        "Keep walk-in reference qualitative ('a small number').",
      ],
      provenanceLine: "Aligned to BRF-002, CLM-001 and CLM-003; Q-005 talking points incorporated.",
    },
    {
      id: "msg-004",
      recordType: "message",
      code: "MSG-004",
      stageIntroduced: "stage-2",
      status: "Approved",
      title: "Staff logistics note",
      body: "Higher attendance today. Please use signed routes on the mezzanine, follow hospitality directions, and expect brief waits at reception for credential checks. Report access issues to your floor warden, not via social channels.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 11:28",
      linkedRecordCodes: ["OBS-003", "CLM-003"],
      audience: "Tower staff",
      approvalStatus: "Approved",
      freshness: "Current",
      alignmentCue: "Aligned",
      purposeLine: "Practical staff guidance during live event congestion.",
      reviewBeforeUse: [
        "Update if mezzanine security post is added (Q-004).",
        "Do not reference unconfirmed security reports.",
      ],
      provenanceLine: "Based on OBS-003 and CLM-003; cleared with Security and Hospitality.",
    },
    {
      id: "msg-005",
      recordType: "message",
      code: "MSG-005",
      stageIntroduced: "stage-3",
      status: "Prepared",
      title: "Holding statement (prepared, not issued)",
      body: "We are aware of reports regarding activity in the building. We are checking the situation and will provide an update through official channels. Please follow instructions from security and avoid speculation.",
      ownerName: "Amara Lewis",
      ownerRole: "Communications Lead",
      department: "Communications",
      timestampLabel: "Fri 13:50",
      linkedRecordCodes: ["OBS-004", "Q-007", "BRF-003"],
      audience: "All staff",
      approvalStatus: "Prepared but not issued",
      freshness: "Draft",
      alignmentCue: "Review risk",
      purposeLine: "Pre-approved holding language if incident is confirmed; not for issue while ambiguous.",
      reviewBeforeUse: [
        "Do not issue until Q-007 resolved.",
        "Remove if activity report is downgraded to non-incident.",
        "Must not mention injuries or emergency services.",
      ],
      provenanceLine: "Drafted from BRF-003 posture; pending security confirmation.",
    },
    {
      id: "msg-006",
      recordType: "message",
      code: "MSG-006",
      stageIntroduced: "stage-3",
      status: "Prepared",
      title: "Internal leadership note (prepared, not issued)",
      body: "Security is investigating an unconfirmed report on level 42. One floor contact is unreachable. We are not issuing external language. Executive office should await the next verified brief before outreach.",
      ownerName: "Marcus Hale",
      ownerRole: "Executive Office",
      department: "Executive Office",
      timestampLabel: "Fri 13:52",
      linkedRecordCodes: ["SRC-007", "SRC-008", "Q-006"],
      audience: "Executive leadership",
      approvalStatus: "Prepared but not issued",
      freshness: "Draft",
      alignmentCue: "Not checked",
      purposeLine: "Internal situational note only; prevents premature executive outreach.",
      reviewBeforeUse: [
        "Contains operational detail unsuitable for external use.",
        "Reconcile with floor warden status before any wider cascade.",
      ],
      provenanceLine: "Internal only; not aligned to issued brief while stage 3 holds issue.",
    },
    {
      id: "msg-007",
      recordType: "message",
      code: "MSG-007",
      stageIntroduced: "stage-4",
      status: "Review",
      title: "Staff incident note",
      body: "There has been a serious incident on level 42. Please follow security instructions, use marked evacuation routes, and await verified updates. Support resources will be shared through People team channels. Do not share unverified information.",
      ownerName: "Elise Morgan",
      ownerRole: "People Director",
      department: "People",
      timestampLabel: "Fri 15:08",
      linkedRecordCodes: ["CLM-004", "BRF-004"],
      audience: "Tower staff",
      approvalStatus: "Ready for review",
      freshness: "Draft",
      alignmentCue: "Review risk",
      purposeLine: "Controlled staff notification after incident confirmation.",
      reviewBeforeUse: [
        "Legal must clear any injury reference before issue.",
        "Confirm evacuation routes with Security command.",
        "Remove CLM-005 language until Q-008 resolved.",
      ],
      provenanceLine: "Based on CLM-004 and BRF-004; People and Legal review pending.",
    },
    {
      id: "msg-008",
      recordType: "message",
      code: "MSG-008",
      stageIntroduced: "stage-4",
      status: "Review",
      title: "Press holding statement",
      body: "We can confirm there has been a serious incident at the tower. Emergency services are on site. We are supporting those affected and cooperating with authorities. We will provide further verified information in due course.",
      ownerName: "Sofia Reed",
      ownerRole: "Media Lead",
      department: "Media",
      timestampLabel: "Fri 15:12",
      linkedRecordCodes: ["CLM-004", "CLM-005", "SRC-010"],
      audience: "Press & external",
      approvalStatus: "Ready for review",
      freshness: "Draft",
      alignmentCue: "Review risk",
      purposeLine: "External holding statement after confirmation; injury detail gated.",
      reviewBeforeUse: [
        "No injury numbers, names or cause until Q-008 and Legal clear.",
        "Coordinate issue timing with Security and executive office.",
        "Ensure alignment with MSG-007 before any staff-wide send.",
      ],
      provenanceLine: "Derived from CLM-004; CLM-005 explicitly excluded pending validation.",
    },
  ] satisfies DemoMessageRecord[],

  attentionItems: [
    {
      id: "att-1",
      stageId: "stage-1",
      tone: "warning",
      title: "Catering uplift still an assumption",
      description: "CLM-002 remains unvalidated; executive messaging should not quantify catering changes externally.",
      tab: "situation",
      linkLabel: "Review claims in Situation",
    },
    {
      id: "att-2",
      stageId: "stage-1",
      tone: "info",
      title: "Headcount decision needed before service window",
      description: "Q-001 affects hot food planning; linked to Facilities source SRC-002.",
      tab: "brief",
      linkLabel: "Open preparation brief",
    },
    {
      id: "att-3",
      stageId: "stage-2",
      tone: "warning",
      title: "Walk-in externals affecting reception flow",
      description: "CLM-003 is confirmed; keep external language qualitative until reception finalises count.",
      tab: "messages",
      linkLabel: "Review live messages",
    },
    {
      id: "att-4",
      stageId: "stage-2",
      tone: "info",
      title: "Mezzanine density watch",
      description: "OBS-003 may require security post decision (Q-004).",
      tab: "situation",
      linkLabel: "Review observations",
    },
    {
      id: "att-5",
      stageId: "stage-3",
      tone: "critical",
      title: "Do not issue holding lines yet",
      description: "MSG-005 and MSG-006 are prepared but must remain not issued until Q-007 is resolved.",
      tab: "messages",
      linkLabel: "Review prepared drafts",
    },
    {
      id: "att-6",
      stageId: "stage-3",
      tone: "warning",
      title: "Superseded 'normal event' language",
      description: "CLM-006 is superseded; remove from any live talking points.",
      tab: "situation",
      linkLabel: "View superseded claims",
    },
    {
      id: "att-7",
      stageId: "stage-4",
      tone: "critical",
      title: "Injury language blocked pending validation",
      description: "CLM-005 and Q-008 gate press and staff injury references.",
      tab: "messages",
      linkLabel: "Review press draft",
    },
    {
      id: "att-8",
      stageId: "stage-4",
      tone: "warning",
      title: "Staff and press drafts await approval",
      description: "MSG-007 and MSG-008 are ready for review, not approved for issue.",
      tab: "messages",
      linkLabel: "Open message review",
    },
  ] satisfies DemoAttentionItem[],

  reviewFindings: [
    {
      id: "rev-1",
      code: "REV-001",
      stageIntroduced: "stage-2",
      tone: "warning",
      title: "Live exec update risks quantifying walk-ins",
      body: "MSG-003 uses qualitative language, but executive ad-libs could introduce unverified counts linked to CLM-003.",
      linkedRecordCodes: ["MSG-003", "CLM-003"],
    },
    {
      id: "rev-2",
      code: "REV-002",
      stageIntroduced: "stage-3",
      tone: "critical",
      title: "Holding draft could be mistaken for issued",
      body: "MSG-005 approval status is 'Prepared but not issued'; ensure distribution controls are visible to reviewers.",
      linkedRecordCodes: ["MSG-005"],
    },
    {
      id: "rev-3",
      code: "REV-003",
      stageIntroduced: "stage-3",
      tone: "warning",
      title: "Internal note contains operational detail",
      body: "MSG-006 includes floor-specific investigation detail unsuitable for wider staff cascade.",
      linkedRecordCodes: ["MSG-006", "SRC-007"],
    },
    {
      id: "rev-4",
      code: "REV-004",
      stageIntroduced: "stage-4",
      tone: "critical",
      title: "Press draft alignment risk on injuries",
      body: "MSG-008 must not pick up radio-traffic injury counts; CLM-005 remains needs validation.",
      linkedRecordCodes: ["MSG-008", "CLM-005", "Q-008"],
    },
    {
      id: "rev-5",
      code: "REV-005",
      stageIntroduced: "stage-4",
      tone: "warning",
      title: "Staff note must match press timing",
      body: "MSG-007 should not be issued before press holding line strategy is agreed with executive office.",
      linkedRecordCodes: ["MSG-007", "MSG-008"],
    },
  ] satisfies DemoReviewFinding[],

  activity: [
    {
      id: "act-1",
      stageIntroduced: "stage-1",
      timestampLabel: "Fri 08:10",
      title: "Claim CLM-001 introduced",
      body: "Guest numbers confirmed above forecast from RSVP sweep.",
      linkedRecordCodes: ["CLM-001", "SRC-001"],
    },
    {
      id: "act-2",
      stageIntroduced: "stage-1",
      timestampLabel: "Fri 08:35",
      title: "Preparation brief BRF-001 published",
      body: "Routine event preparation brief issued to communications record.",
      linkedRecordCodes: ["BRF-001"],
    },
    {
      id: "act-3",
      stageIntroduced: "stage-2",
      timestampLabel: "Fri 11:05",
      title: "CLM-001 updated with live headcount",
      body: "Live in-building count added from hospitality floor source.",
      linkedRecordCodes: ["CLM-001", "SRC-006"],
    },
    {
      id: "act-4",
      stageIntroduced: "stage-2",
      timestampLabel: "Fri 11:30",
      title: "Live messages approved",
      body: "MSG-003 executive update and MSG-004 staff logistics note approved for issue.",
      linkedRecordCodes: ["MSG-003", "MSG-004"],
    },
    {
      id: "act-5",
      stageIntroduced: "stage-3",
      timestampLabel: "Fri 13:35",
      title: "CLM-006 superseded",
      body: "Earlier 'event proceeding normally' claim superseded due to ambiguous signal.",
      linkedRecordCodes: ["CLM-006"],
    },
    {
      id: "act-6",
      stageIntroduced: "stage-3",
      timestampLabel: "Fri 13:55",
      title: "Holding drafts prepared, not issued",
      body: "MSG-005 and MSG-006 moved to prepared-but-not-issued status.",
      linkedRecordCodes: ["MSG-005", "MSG-006"],
    },
    {
      id: "act-7",
      stageIntroduced: "stage-4",
      timestampLabel: "Fri 14:53",
      title: "Serious incident confirmed",
      body: "CLM-004 introduced following security command confirmation.",
      linkedRecordCodes: ["CLM-004", "SRC-009"],
    },
    {
      id: "act-8",
      stageIntroduced: "stage-4",
      timestampLabel: "Fri 15:12",
      title: "Staff and press drafts ready for review",
      body: "MSG-007 and MSG-008 submitted for legal and executive review.",
      linkedRecordCodes: ["MSG-007", "MSG-008", "BRF-004"],
    },
  ] satisfies DemoActivityEvent[],
};
