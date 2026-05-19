import type {
  DemoAiEnhancedDraft,
  DemoBriefRecord,
  DemoMessageRecord,
  DemoRecordBasisLine,
  DemoRecordGroundedDraft,
} from "@/lib/demo/towerBriefingDemo";

export type DemoBriefGuardrailsGrounded = {
  safeToSay: string[];
  doNotSayYet: string[];
  basis: DemoRecordBasisLine[];
};

export type DemoBriefDerivation = {
  recordGroundedPosition: DemoRecordGroundedDraft;
  aiEnhancedPosition?: DemoAiEnhancedDraft;
  recordGroundedDecisions: DemoRecordGroundedDraft;
  recordGroundedGuardrails: DemoBriefGuardrailsGrounded;
};

export type DemoMessageDerivation = {
  recordGroundedDraft: DemoRecordGroundedDraft;
  aiEnhancedDraft?: DemoAiEnhancedDraft;
  allowedToSay: string[];
  notSupportedYet: string[];
  guardrailsApplied: string[];
};

const ENHANCEMENT_NOTE = "Tone and structure improved. No new facts added.";

function basis(line: string, basisCodes: string[], explanation: string): DemoRecordBasisLine {
  return { line, basisCodes, explanation };
}

export const briefDerivations: Record<string, DemoBriefDerivation> = {
  "BRF-001": {
    recordGroundedPosition: {
      body: "Internal celebration preparation. Guest numbers above forecast (CLM-001). Catering uplift under assessment (CLM-002, assumption). No security escalation on record.",
      basis: [
        basis(
          "Guest numbers above forecast.",
          ["CLM-001", "SRC-001"],
          "Confirmed claim and catering source at this stage.",
        ),
        basis(
          "Catering uplift under assessment.",
          ["CLM-002", "OBS-001"],
          "Assumption only; not approved for external quantification.",
        ),
      ],
    },
    aiEnhancedPosition: {
      label: "AI-enhanced wording",
      body: "A well-attended internal celebration requires modest hospitality uplift; no safety or security escalations are on record.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    recordGroundedDecisions: {
      bullets: [
        "Resolve Q-001 headcount with Facilities before hot food commitment.",
        "Confirm VIP escort protocol with HR (SRC-003).",
      ],
      basis: [
        basis("Headcount decision.", ["Q-001", "SRC-002"], "Open question on record."),
        basis("VIP escort.", ["SRC-003", "Q-002"], "Security and HR sources."),
      ],
    },
    recordGroundedGuardrails: {
      safeToSay: ["Event is planned; teams coordinating logistics."],
      doNotSayYet: [
        "Do not reference incidents, injuries or emergency services.",
        "Do not cite unvalidated catering numbers externally.",
      ],
      basis: [basis("Routine posture only.", ["CLM-006"], "Planning claim; no incident records at stage 1.")],
    },
  },
  "BRF-002": {
    recordGroundedPosition: {
      body: "Event live. Attendance above forecast (CLM-001). Walk-in external guests confirmed (CLM-003). No incident declared on record.",
      basis: [
        basis("Higher attendance.", ["CLM-001", "SRC-006"], "Live count update."),
        basis("Walk-in externals.", ["CLM-003", "SRC-007"], "Reception source."),
        basis("No incident.", ["BRF-002"], "No CLM-004 or security signal at this stage."),
      ],
    },
    aiEnhancedPosition: {
      label: "AI-enhanced wording",
      body: "The event is live and well attended; guest flow and access are actively managed with no confirmed incident.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    recordGroundedDecisions: {
      bullets: [
        "Issue MSG-003 and MSG-004 from record-grounded drafts.",
        "Decide Q-004 mezzanine security post before peak window.",
      ],
      basis: [basis("Messages on file.", ["MSG-003", "MSG-004"], "Approved drafts derived from this brief.")],
    },
    recordGroundedGuardrails: {
      safeToSay: ["Attendance higher than forecast; access being managed."],
      doNotSayYet: ["Do not describe tower incident, lockdown or injury.", "Do not quantify walk-ins beyond qualitative language."],
      basis: [basis("Operational only.", ["OBS-003"], "Mezzanine density observation; no incident claims.")],
    },
  },
  "BRF-003": {
    recordGroundedPosition: {
      body: "Unconfirmed activity report on level 42 (OBS-004, SRC-007). Floor warden unreachable (SRC-008, Q-006). Incident not confirmed (Q-007). CLM-006 superseded. Do not use CLM-004 or CLM-005.",
      basis: [
        basis("Unconfirmed activity.", ["OBS-004", "SRC-007"], "Needs validation; not confirmed fact."),
        basis("Warden miss.", ["SRC-008", "Q-006"], "Documented gap; cause unknown."),
        basis("No serious incident claim.", ["Q-007"], "Open question; CLM-004 not on record."),
      ],
    },
    aiEnhancedPosition: {
      label: "AI-enhanced wording",
      body: "Possible incident signal; facts unconfirmed. Prepare holding language but do not issue until security confirms.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    recordGroundedDecisions: {
      bullets: [
        "Hold external and staff-wide incident language until Q-007 resolved.",
        "Keep MSG-005 and MSG-006 prepared but not issued.",
      ],
      basis: [basis("Holding posture.", ["MSG-005", "MSG-006", "OBS-003"], "Comms observation and draft status.")],
    },
    recordGroundedGuardrails: {
      safeToSay: ["We are checking reports; updates via official channels only."],
      doNotSayYet: [
        "Do not mention injuries, motive, numbers or tactics.",
        "Do not confirm serious incident (CLM-004 absent at this stage).",
        "Do not issue MSG-005 or MSG-006 until confirmation.",
      ],
      basis: [basis("Ambiguity preserved.", ["Q-007", "REV-001"], "Review finding on injury language.")],
    },
  },
  "BRF-004": {
    recordGroundedPosition: {
      body: "Serious incident at tower confirmed (CLM-004). Emergency services on site (OBS-005). Injury detail not validated for external use (CLM-005 needs validation, Q-008 open).",
      basis: [
        basis("Serious incident confirmed.", ["CLM-004", "SRC-009"], "Confirmed claim and security command source."),
        basis("Emergency services.", ["OBS-005"], "Observation on record."),
        basis("Injuries not for external use.", ["CLM-005", "Q-008"], "Needs validation; legal gate."),
      ],
    },
    aiEnhancedPosition: {
      label: "AI-enhanced wording",
      body: "A serious incident at the tower is confirmed. Messaging must stay verified, minimal and legally cleared.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    recordGroundedDecisions: {
      bullets: [
        "Approve MSG-007 after legal review.",
        "Approve MSG-008 only when Q-008 resolved.",
      ],
      basis: [basis("Drafts ready for review.", ["MSG-007", "MSG-008"], "Not approved for issue on record.")],
    },
    recordGroundedGuardrails: {
      safeToSay: ["Serious incident confirmed; safety priority; cooperating with authorities."],
      doNotSayYet: [
        "No injury numbers, names, cause or speculation.",
        "Do not use CLM-005 until validated.",
        "Do not amplify unverified social posts.",
      ],
      basis: [basis("Legal boundaries.", ["SRC-010", "REV-004"], "Counsel source and alignment review.")],
    },
  },
};

export const messageDerivations: Record<string, DemoMessageDerivation> = {
  "MSG-001": {
    recordGroundedDraft: {
      body: "Internal celebration today. Bring building pass. Main atrium entrance. Extra time at reception. Mezzanine directions from hospitality.",
      basis: [
        basis("Pass and entrance.", ["SRC-004"], "Security access plan."),
        basis("Higher attendance context.", ["CLM-001"], "Confirmed; routine reminder only."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "Reminder: internal celebration today. Please bring your building pass, arrive via the main atrium entrance, and allow extra time for reception. Hospitality will direct you from the mezzanine.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Routine event logistics and pass requirement."],
    notSupportedYet: ["Any incident, injury or emergency language."],
    guardrailsApplied: ["No risk or security escalation wording."],
  },
  "MSG-002": {
    recordGroundedDraft: {
      body: "Internal celebration today. Attendance above forecast (CLM-001). Facilities adjusting (CLM-002 assumption). No executive movement change on record.",
      basis: [
        basis("Attendance.", ["CLM-001", "BRF-001"], "Confirmed claim in brief."),
        basis("Catering assumption.", ["CLM-002"], "Phrase as internal planning only."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "Today's internal celebration is expected to be well attended. Hospitality and facilities are adjusting proportionately. No changes to executive movements are required at this time.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Well attended; proportional adjustments; no executive change."],
    notSupportedYet: ["External guest counts; incident or security signal language."],
    guardrailsApplied: ["Catering uplift not stated as approved externally."],
  },
  "MSG-003": {
    recordGroundedDraft: {
      body: "Celebration underway. Attendance above forecast (CLM-001). Guest flow managed. Small number walk-ins without registration (CLM-003). Further updates official channels only.",
      basis: [
        basis("Live attendance.", ["CLM-001", "SRC-006"], "Executive request and claim."),
        basis("Walk-ins.", ["CLM-003", "SRC-007"], "Confirmed claim and reception note."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "The celebration is underway and attendance is higher than forecast. Operations are managing guest flow. A small number of guests arrived without prior registration and are being processed safely. We will share further updates through official channels.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Higher attendance; access managed; qualitative walk-in reference."],
    notSupportedYet: ["Incident, injury, emergency services, unusual activity."],
    guardrailsApplied: ["Walk-ins described qualitatively only."],
  },
  "MSG-004": {
    recordGroundedDraft: {
      body: "Higher attendance. Use signed mezzanine routes. Follow hospitality. Brief reception waits for credentials. Access issues to floor warden not social channels.",
      basis: [
        basis("Congestion.", ["OBS-003", "CLM-003"], "Observation and walk-in claim."),
        basis("Credential checks.", ["SRC-004"], "Security plan."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "Higher attendance today. Please use signed routes on the mezzanine, follow hospitality directions, and expect brief waits at reception for credential checks. Report access issues to your floor warden, not via social channels.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Logistics and credential guidance."],
    notSupportedYet: ["Unconfirmed security reports; incident framing."],
    guardrailsApplied: ["No reference to level 42 or ambiguous signal."],
  },
  "MSG-005": {
    recordGroundedDraft: {
      body: "Reports of activity in building. Situation being checked. Update via official channels. Follow security instructions. Do not speculate.",
      basis: [
        basis("Activity report unconfirmed.", ["OBS-004", "SRC-007"], "Not confirmed as incident."),
        basis("Issue hold.", ["Q-007", "BRF-003"], "Open whether incident occurred."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "We are aware of reports regarding activity in the building. We are checking the situation and will provide an update through official channels. Please follow instructions from security and avoid speculation.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Checking reports; official channels; avoid speculation."],
    notSupportedYet: [
      "Serious incident confirmed",
      "Injuries or casualties",
      "Motive or cause",
      "Numbers affected",
      "Emergency services on site (not confirmed at this stage)",
      "Operational tactics or floor detail beyond 'activity'",
    ],
    guardrailsApplied: [
      "Prepared but not issued until Q-007 resolved.",
      "Must not reuse superseded CLM-006 'proceeding normally' line.",
    ],
  },
  "MSG-006": {
    recordGroundedDraft: {
      body: "Security investigating unconfirmed report level 42 (SRC-007). One floor contact unreachable (SRC-008, Q-006). No external language to issue. Executive office await verified brief.",
      basis: [
        basis("Unconfirmed report.", ["SRC-007", "OBS-004"], "Signal not confirmed."),
        basis("Warden gap.", ["SRC-008", "Q-006"], "Open question."),
        basis("No issue.", ["BRF-003"], "Brief holds external issue."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "Security is investigating an unconfirmed report on level 42. One floor contact is unreachable. We are not issuing external language. Executive office should await the next verified brief before outreach.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Internal leadership awareness; hold on external issue."],
    notSupportedYet: [
      "Serious incident confirmed",
      "Injuries",
      "Public holding line content for external audiences",
    ],
    guardrailsApplied: ["Internal only; operational detail not for staff-wide circulation."],
  },
  "MSG-007": {
    recordGroundedDraft: {
      body: "Serious incident on level 42 (CLM-004 confirmed). Follow security instructions. Await verified updates. Do not share unverified information. People team support route to follow.",
      basis: [
        basis("Serious incident.", ["CLM-004", "SRC-009"], "Confirmed claim only at stage 4."),
        basis("No injury detail.", ["CLM-005", "Q-008"], "Needs validation; excluded from draft."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "There has been a serious incident on level 42. Please follow security instructions, use marked evacuation routes, and await verified updates. Support resources will be shared through People team channels. Do not share unverified information.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Serious incident confirmed; follow security; official updates only."],
    notSupportedYet: [
      "Injury counts or severity",
      "Identities of those affected",
      "Motive or cause",
      "Operational detail beyond published routes",
    ],
    guardrailsApplied: [
      "Evacuation routes only as directed by Security command.",
      "CLM-005 language removed pending Q-008.",
    ],
  },
  "MSG-008": {
    recordGroundedDraft: {
      body: "Serious incident at tower confirmed (CLM-004). Emergency services on site (OBS-005). Supporting those affected. Cooperating with authorities. Further verified information later.",
      basis: [
        basis("Confirmed incident.", ["CLM-004"], "Confirmed claim."),
        basis("Emergency services.", ["OBS-005"], "Observation on record."),
        basis("No injury statement.", ["CLM-005", "Q-008"], "Explicitly excluded pending validation."),
      ],
    },
    aiEnhancedDraft: {
      label: "AI-enhanced wording",
      body: "We can confirm there has been a serious incident at the tower. Emergency services are on site. We are supporting those affected and cooperating with authorities. We will provide further verified information in due course.",
      enhancementNote: ENHANCEMENT_NOTE,
    },
    allowedToSay: ["Serious incident confirmed; services on site; cooperation; verified updates to follow."],
    notSupportedYet: [
      "Injury numbers, names or cause (CLM-005 / Q-008)",
      "Speculation on scope of impact",
    ],
    guardrailsApplied: [
      "Press issue timed with MSG-007 and legal clearance.",
      "No CLM-005 wording until validated.",
    ],
  },
};

export function applyBriefDerivation(brief: DemoBriefRecord): DemoBriefRecord {
  const d = briefDerivations[brief.code];
  if (!d) return brief;
  return { ...brief, ...d };
}

export function applyMessageDerivation(message: DemoMessageRecord): DemoMessageRecord {
  const d = messageDerivations[message.code];
  if (!d) return message;
  const aiBody = d.aiEnhancedDraft?.body ?? message.body;
  return { ...message, ...d, body: aiBody };
}

type BriefBeforeEnrichment = Omit<
  DemoBriefRecord,
  "recordGroundedPosition" | "aiEnhancedPosition" | "recordGroundedDecisions" | "recordGroundedGuardrails"
>;

type MessageBeforeEnrichment = Omit<
  DemoMessageRecord,
  "recordGroundedDraft" | "aiEnhancedDraft" | "allowedToSay" | "notSupportedYet" | "guardrailsApplied"
>;

export function enrichBriefs(briefs: BriefBeforeEnrichment[]): DemoBriefRecord[] {
  return briefs.map((b) => applyBriefDerivation(b as DemoBriefRecord));
}

export function enrichMessages(messages: MessageBeforeEnrichment[]): DemoMessageRecord[] {
  return messages.map((m) => applyMessageDerivation(m as DemoMessageRecord));
}
