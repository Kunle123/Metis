/**
 * METIS DEMO — Bramley Junction Issue Record Timeline
 * ============================================================
 * SOURCE OF TRUTH: bramley-junction-demo-export.json → timelineProjection
 *
 * Card visibility rules:
 *   INCOMING UPDATES  → lane "incoming_update" in timelineProjection (addedToMetisAt → BST)
 *   ISSUE RECORD      → lane "issue_record" in timelineProjection (timestamp → BST)
 *   METIS OUTPUTS     → lane "metis_output" in timelineProjection (generatedAt → BST)
 *
 * All times displayed in UK local time (BST = UTC+1, May 2026).
 * eventOccurredAt appears ONLY inside the modal as context — never as a card timestamp.
 * No cards for historical operational events described inside another update.
 * impactChips on incoming_update cards are derived from issueRecordImpacts in the JSON.
 * ============================================================
 */

export type Lane = 'input' | 'issue' | 'output';

export interface AiPolish {
  enabled: boolean;
  preparedAt?: string;
  label: string;
  summary: string;
  preservedConstraints: string[];
  changed: string[];
}

export interface TimelineEvent {
  id: string;
  lane: Lane;
  day: string;
  time: string;
  badgeLabel: string;
  title: string;
  summary: string;
  relatedIds: string[];
  impactChips?: string[];
  inputFrom?: string;
  linkedSource?: string;
  sourceConfidence?: string;
  issueImpact?: string;
  outputAudience?: string;
  outputStatus?: string;
  outputVersion?: number;
  outputSupersededBy?: string;
  doNotSay?: string[];
  openQuestionsAtGeneration?: string[];
  caveatsAtGeneration?: string[];
  // AI-polish wording toggle (message-style outputs only)
  draftBody?: string;
  aiPolishedBody?: string;
  wordingModeDefault?: 'draft' | 'ai_polished';
  aiPolish?: AiPolish;
  fullRecord: { heading: string; body: string }[];
}

// ============================================================
// LANE CONFIGURATION
// ============================================================
export const LANE_CONFIG = {
  input: {
    label: 'Incoming Updates',
    sublabel: 'Comms-facing submissions',
    color: '#8FA38A',
    bgColor: 'rgba(143, 163, 138, 0.10)',
    borderColor: 'rgba(143, 163, 138, 0.55)',
    textColor: '#4A6B45',
    accentColor: '#8FA38A',
    badgeBackground: '#EAF0E8',
  },
  issue: {
    label: 'Issue Record',
    sublabel: 'Metis record actions',
    color: '#263B2E',
    bgColor: 'rgba(38, 59, 46, 0.07)',
    borderColor: 'rgba(38, 59, 46, 0.45)',
    textColor: '#263B2E',
    accentColor: '#263B2E',
    badgeBackground: '#DDE8DA',
  },
  output: {
    label: 'METIS Outputs',
    sublabel: 'Generated messages and briefs',
    color: '#B78B45',
    bgColor: 'rgba(183, 139, 69, 0.08)',
    borderColor: 'rgba(183, 139, 69, 0.5)',
    textColor: '#8B6020',
    accentColor: '#B78B45',
    badgeBackground: '#F5E9D0',
  },
} as const;

// ============================================================
// EVENTS — derived strictly from timelineProjection in JSON
// ============================================================
export const events: TimelineEvent[] = [

  // ──────────────────────────────────────────────────────────
  // INCOMING UPDATES — lane "incoming_update" in JSON
  // All times in BST (UTC+1). addedToMetisAt is the card timestamp.
  // ──────────────────────────────────────────────────────────

  // Mon 05:42 — Duty manager summary to comms
  // JSON: dddd0015, addedToMetisAt 04:42Z → 05:42 BST
  // issueRecordImpacts: statusNote "Active issue opened — comms engaged"
  {
    id: 'e_duty',
    lane: 'input',
    day: 'Mon',
    time: '05:42',
    badgeLabel: 'DUTY SUMMARY',
    title: 'Duty manager summary to comms',
    summary: 'Handback delay at main entrance after overnight works. Station open via side entrance; trains running. Comms asked to open Metis issue.',
    relatedIds: ['iss_status_0542', 'iss_populated'],
    impactChips: ['Status: Active issue opened'],
    inputFrom: 'Duty Station Manager',
    linkedSource: 'Phone briefing to corporate affairs duty',
    sourceConfidence: 'High',
    issueImpact: 'Active issue opened — comms engaged',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Phone briefing to corporate affairs duty\nReceived by comms: Mon 05:42 BST\nSender: Duty Station Manager',
      },
      {
        heading: 'SUMMARY',
        body: 'Handback delay at main entrance after overnight works. Station open via side entrance; trains running. Comms asked to open Metis issue and help with passenger/social lines.',
      },
      {
        heading: 'FULL TEXT',
        body: 'Duty manager → corporate affairs duty phone briefing\n\nSituation: planned overnight works largely complete but main entrance remains closed pending ceiling panel sign-off.\nStation is operating via side entrance with extra staff/security being deployed.\nNOC confirms trains calling — no service change.\nCustomer team reports growing confusion at main doors; no major crowding yet.\nNo confirmed safety failure; facilities inspection still required before main entrance reopening.\n\nOvernight sequence described in this briefing (not live comms channels — detail logged to Metis from duty overnight pack):\n- Planned works notice issued Sun evening.\n- Contractor mobilised Sun night.\n- Ceiling panel sign-off withheld at handback.\n- Station manager escalated likely miss of 05:30 target.\n- Security confirmed barriers and officers available.\n- NOC confirmed trains continue to call.\n- Customer service reported passenger confusion at main doors.\n\nAsk of comms: open controlled issue record in Metis; prepare staff and passenger lines; stand by for social/media attention.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Active issue opened — comms engaged\nDuty overnight pack to be logged as source-backed records',
      },
    ],
  },

  // Mon 05:49 — Social monitoring note
  // JSON: dddd0008, addedToMetisAt 04:49Z → 05:49 BST
  // issueRecordImpacts: claimsAdded [CLM-007], observationsAdded [OBS-002], statusNote "Managed operational disruption"
  {
    id: 'e_social',
    lane: 'input',
    day: 'Mon',
    time: '05:49',
    badgeLabel: 'SOCIAL SIGNAL',
    title: 'Social monitoring — local posts say station is shut',
    summary: 'Three local posts describe the station as shut, which is inaccurate — side entrance is open and trains are running.',
    relatedIds: ['iss_record_0549', 'out_social'],
    impactChips: ['+1 claim', '+1 observation', 'Status updated'],
    inputFrom: 'Comms Monitoring',
    linkedSource: 'SRC-008 · Social monitoring — inaccurate closure posts',
    sourceConfidence: 'Medium',
    issueImpact: 'CLM-007 added · OBS-002 added · status: Managed operational disruption',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Social monitoring note\nReceived by comms: Mon 05:48 BST\nAdded to Metis: Mon 05:49 BST\nSender: Comms Monitoring',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-008 — Social monitoring — inaccurate closure posts\nTier: Social monitoring\nReliability: Medium (monitoring summary; paraphrased)',
      },
      {
        heading: 'FULL TEXT',
        body: 'Approx. 3 local posts in 40 minutes describe Bramley Junction as "shut" or "closed".\nExample themes: "can\'t get in", "station closed again", "no trains" (last is inaccurate).\nNo verified influencer amplification. Engagement modest.\nRecommended: short corrective line emphasising trains running and side entrance open.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'CLM-007 added: Social posts inaccurately describe station as fully closed\nOBS-002 added: Social monitoring flagged inaccurate closure narrative\nStatus updated: Managed operational disruption',
      },
    ],
  },

  // Mon 05:50 — Duty overnight pack logged in Metis
  // JSON: dddd0001, addedToMetisAt 04:50Z → 05:50 BST
  // issueRecordImpacts: 6 claims, 4 gaps opened, 1 gap closed, 3 observations
  {
    id: 'e_overnight_pack',
    lane: 'input',
    day: 'Mon',
    time: '05:50',
    badgeLabel: 'COMMS INTAKE',
    title: 'Duty overnight pack logged in Metis',
    summary: 'Corporate Affairs logs source-backed records from the duty manager overnight pack: planned works, contractor handback, station/security/NOC updates and customer floor report.',
    relatedIds: ['iss_record_0550', 'out_staff', 'out_passenger_v1'],
    impactChips: ['+6 claims', '+4 open questions', '+3 observations', '1 question closed'],
    inputFrom: 'Corporate Affairs',
    linkedSource: 'Metis intake from duty handover',
    sourceConfidence: 'High',
    issueImpact: '6 claims added · 4 questions opened · 1 question closed · 3 observations added',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Metis intake from duty handover\nReceived by comms: Mon 05:42 BST\nAdded to Metis: Mon 05:50 BST\nSender: Corporate Affairs',
      },
      {
        heading: 'FULL TEXT',
        body: 'Corporate Affairs — duty overnight pack logged\n\nLogged from duty manager phone briefing at 05:42. Each item below is recorded as a linked source in the issue record.\n\nSRC-001 Planned works notice (reported Sun 20:00): overnight concourse lighting, ticket gate and wayfinding; 05:30 handback; no planned train disruption.\nSRC-002 Contractor mobilisation (reported Sun 21:15): team on site; works commenced.\nSRC-003 Contractor handback note (reported Mon 04:28): ceiling panel sign-off pending at main entrance; possible roof drain residue — not confirmed structural failure.\nSRC-004 Station manager escalation (reported Mon 04:35): main entrance unlikely at 05:30; side entrance with staffing from 05:45 if security confirms.\nSRC-005 Security update (reported Mon 04:50): additional officers and barriers from 05:45.\nSRC-006 NOC confirmation (reported Mon 04:55): trains continue to call.\nSRC-007 Customer service floor report (reported Mon 05:32): passengers confused at main doors; low crowding.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'CLM-001 to CLM-006 added from overnight pack\nQ-001 opened: Is the ceiling area safe for passenger use?\nQ-002 opened: Can the side entrance safely handle morning flow?\nQ-004 opened: What public line should be used if asked whether the station is shut?\nQ-005 opened: What is the expected main entrance reopening time?\nQ-003 closed immediately: Are trains running? (NOC confirmed yes via SRC-006)\nOBS-001, OBS-003, OBS-004 added',
      },
    ],
  },

  // Mon 06:09 — Press office call log
  // JSON: dddd0009, addedToMetisAt 05:09Z → 06:09 BST
  // issueRecordImpacts: {} (empty — source linked, no claims/gaps/obs)
  {
    id: 'e_press',
    lane: 'input',
    day: 'Mon',
    time: '06:09',
    badgeLabel: 'PRESS CALL',
    title: 'Press office call log — reporter asks about reopening',
    summary: 'Local reporter asks whether planned works overran and whether passengers were locked out. 45-minute response window.',
    relatedIds: ['iss_record_0609', 'out_press'],
    inputFrom: 'Press Office',
    linkedSource: 'SRC-009 · Press call log — local reporter',
    sourceConfidence: 'High',
    issueImpact: 'SRC-009 linked to issue record',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Press office call log\nReceived by comms: Mon 06:08 BST\nAdded to Metis: Mon 06:09 BST\nSender: Press Office',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-009 — Press call log — local reporter\nTier: Media enquiry\nReliability: High (press office log)',
      },
      {
        heading: 'REPORTER QUESTIONS',
        body: '1. Did planned overnight works overrun?\n2. Were passengers unable to enter the station?\n3. When will the main entrance reopen?\n\nDeadline: requested response within 45 minutes for online update.\nNo broadcast crew on site reported.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'SRC-009 linked to issue record\nHolding press line output triggered',
      },
    ],
  },

  // Mon 06:24 — Station manager update: passenger flow manageable
  // JSON: dddd0010, addedToMetisAt 05:24Z → 06:24 BST
  // issueRecordImpacts: gapsClosed [Q-002]
  {
    id: 'e_flow',
    lane: 'input',
    day: 'Mon',
    time: '06:24',
    badgeLabel: 'STATION UPDATE',
    title: 'Station manager update — passenger flow manageable',
    summary: 'Side entrance open, extra staff deployed, passenger flow manageable, no safety concerns reported.',
    relatedIds: ['iss_record_0624', 'out_passenger_v2'],
    impactChips: ['1 question closed'],
    inputFrom: 'Station Manager',
    linkedSource: 'SRC-010 · Station ops update — passenger flow',
    sourceConfidence: 'High',
    issueImpact: 'Q-002 closed: Side entrance confirmed handling morning flow safely',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Phone update to corporate affairs\nReceived by comms: Mon 06:20 BST\nAdded to Metis: Mon 06:24 BST\nSender: Station Manager',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-010 — Station update — passenger flow\nTier: Internal operational source\nReliability: High (station manager)',
      },
      {
        heading: 'FULL TEXT',
        body: 'Side entrance open with additional staff and security.\nQueue time under 3 minutes at time of report.\nMain entrance remains closed pending facilities clearance.\nNo safety incidents. Customer team reports improving clarity with written line.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Q-002 closed: Side entrance confirmed handling morning flow safely',
      },
    ],
  },

  // Mon 06:36 — Executive office request for position note
  // JSON: dddd0016, addedToMetisAt 05:36Z → 06:36 BST
  // issueRecordImpacts: {} (empty)
  {
    id: 'e_exec_req',
    lane: 'input',
    day: 'Mon',
    time: '06:36',
    badgeLabel: 'EXEC REQUEST',
    title: 'Executive office request for short position note',
    summary: 'Regional director\'s office requests a short position note for morning leadership covering customer impact, media handling and expected reopening.',
    relatedIds: ['out_exec_v1'],
    inputFrom: 'Executive Office',
    linkedSource: 'Email to corporate affairs duty',
    issueImpact: 'Executive brief V1 triggered',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Email to corporate affairs duty\nReceived by comms: Mon 06:35 BST\nAdded to Metis: Mon 06:36 BST\nSender: Executive Office (Regional Director\'s office)',
      },
      {
        heading: 'REQUEST',
        body: 'Please provide a short executive position note covering:\n- What happened overnight and this morning at Bramley Junction\n- Customer impact and mitigations\n- Media/social handling and open risks\n- Expected main entrance reopening (if known)\n\nAudience: regional leadership morning call.\nLength: one page maximum.\nDeadline: before 07:00 where possible.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Executive brief V1 output triggered',
      },
    ],
  },

  // Mon 07:08 — Facilities inspection summary
  // JSON: dddd0011, addedToMetisAt 06:08Z → 07:08 BST
  // issueRecordImpacts: claimsAdded [CLM-008], gapsClosed [Q-001], statusNote "Reopening expected shortly"
  {
    id: 'e_facilities',
    lane: 'input',
    day: 'Mon',
    time: '07:08',
    badgeLabel: 'FACILITIES NOTE',
    title: 'Facilities inspection summary forwarded to comms',
    summary: 'Ceiling panels secure. Small roof drain repair needed later. Main entrance can reopen after clean-up and signage check.',
    relatedIds: ['iss_record_0708', 'out_passenger_v2'],
    impactChips: ['+1 claim', '1 question closed', 'Status updated'],
    inputFrom: 'Facilities Engineer',
    linkedSource: 'SRC-011 · Facilities inspection — ceiling secure',
    sourceConfidence: 'High',
    issueImpact: 'CLM-008 added · Q-001 closed · status: Reopening expected shortly',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Email to station manager, copied to comms\nReceived by comms: Mon 07:06 BST\nAdded to Metis: Mon 07:08 BST\nSender: Facilities Engineer',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-011 — Facilities inspection — ceiling secure\nTier: Internal operational source\nReliability: High (facilities engineer inspection)',
      },
      {
        heading: 'FULL TEXT',
        body: 'Ceiling panels secure for passenger use.\nMinor staining consistent with historic drain seepage; no active water ingress observed.\nRemedial roof drain repair scheduled non-urgent within 14 days.\nClearance: main entrance may reopen after contractor clean-up and signage check.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'CLM-008 added: Ceiling area confirmed structurally safe for passenger use\nQ-001 closed: Ceiling area safety confirmed by facilities engineer\nStatus updated: Reopening expected shortly',
      },
    ],
  },

  // Mon 07:54 — Accessibility assessment
  // JSON: dddd0012, addedToMetisAt 06:54Z → 07:54 BST
  // issueRecordImpacts: gapsOpened [Q-006], observationsAdded [OBS-005]
  {
    id: 'e_access',
    lane: 'input',
    day: 'Mon',
    time: '07:54',
    badgeLabel: 'ACCESSIBILITY NOTE',
    title: 'Accessibility assessment forwarded to comms',
    summary: 'Step-free access available through side entrance, but temporary signage needs improvement.',
    relatedIds: ['iss_record_0754'],
    impactChips: ['+1 open question', '+1 observation'],
    inputFrom: 'Accessibility Lead',
    linkedSource: 'SRC-012 · Accessibility assessment — side entrance',
    sourceConfidence: 'Medium–High',
    issueImpact: 'Q-006 opened · OBS-005 added',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Email to corporate affairs\nReceived by comms: Mon 07:52 BST\nAdded to Metis: Mon 07:54 BST\nSender: Accessibility Lead',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-012 — Accessibility assessment — side entrance\nTier: Internal operational source\nReliability: Medium–High (accessibility lead)',
      },
      {
        heading: 'FULL TEXT',
        body: 'Step-free route available via side entrance lift (operational).\nTemporary signage not meeting usual contrast/position standards.\nRecommendation: deploy high-visibility directional totems within 30 minutes.\nNo reported barriers for wheelchair users during observation window.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Q-006 opened: Are accessibility arrangements adequate while main entrance is closed?\nOBS-005 added: Temporary signage for step-free access needs improvement',
      },
    ],
  },

  // Mon 08:15 — Station manager confirmation: main entrance reopened
  // JSON: dddd0013, addedToMetisAt 07:15Z → 08:15 BST
  // issueRecordImpacts: claimsAdded [CLM-009], gapsClosed [Q-005, Q-004], statusNote "Operational disruption closed"
  {
    id: 'e_reopen',
    lane: 'input',
    day: 'Mon',
    time: '08:15',
    badgeLabel: 'OPS CONFIRMATION',
    title: 'Station manager confirmation — main entrance reopened',
    summary: 'Main entrance reopened at 08:12. Side entrance remains available. Staff continue to monitor.',
    relatedIds: ['iss_record_0815', 'out_exec_v2'],
    impactChips: ['+1 claim', '2 questions closed', 'Status updated'],
    inputFrom: 'Station Manager',
    linkedSource: 'SRC-013 · Reopening confirmation — main entrance',
    sourceConfidence: 'High',
    issueImpact: 'CLM-009 added · Q-004 and Q-005 closed · status: Operational disruption closed',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Phone confirmation to corporate affairs\nReceived by comms: Mon 08:13 BST\nAdded to Metis: Mon 08:15 BST\nSender: Station Manager',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-013 — Reopening confirmation — main entrance\nTier: Internal operational source\nReliability: High (station manager)',
      },
      {
        heading: 'FULL TEXT',
        body: 'Main entrance opened after clean-up and signage checks.\nSide entrance remains open to avoid bottlenecks.\nPassenger flow normalising. No further press queries in last 20 minutes.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'CLM-009 added: Main entrance reopened at 08:12 after facilities clearance\nQ-004 closed: Public line confirmed — station not shut, side entrance open\nQ-005 closed: Main entrance reopening time confirmed (08:12)\nStatus updated: Operational disruption closed',
      },
    ],
  },

  // Mon 08:41 — Follow-up actions requested
  // JSON: dddd0014, addedToMetisAt 07:41Z → 08:41 BST
  // issueRecordImpacts: gapsOpened [Q-007], observationsAdded [OBS-006], statusNote "Review / audit stage"
  {
    id: 'e_followup',
    lane: 'input',
    day: 'Mon',
    time: '08:41',
    badgeLabel: 'EXEC ACTION',
    title: 'Follow-up actions requested',
    summary: 'Regional Operations Director requests short review of what happened, customer impact, media handling, and improvements for future planned works.',
    relatedIds: ['iss_record_0841', 'out_post_incident'],
    impactChips: ['+1 open question', '+1 observation', 'Status updated'],
    inputFrom: 'Regional Operations Director',
    issueImpact: 'Q-007 opened · OBS-006 added · status: Review / audit stage',
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Channel: Executive action note\nReceived by comms: Mon 08:40 BST\nAdded to Metis: Mon 08:41 BST\nSender: Regional Operations Director',
      },
      {
        heading: 'REQUEST',
        body: 'Please provide a short post-incident review covering:\n- Timeline of handback and comms decisions\n- Customer impact assessment\n- Media/social handling\n- Lessons for future planned works handback criteria\n\nTarget: draft to regional leadership within 2 working days.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Q-007 opened: What follow-up action is needed before future planned works?\nOBS-006 added: Future works handback focus for post-incident review\nStatus updated: Review / audit stage',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // ISSUE RECORD — lane "issue_record" in JSON
  // Derived strictly from timelineProjection. No hand-authored extras.
  // ──────────────────────────────────────────────────────────

  // Mon 05:42 — Issue status: Comms engaged (from duty summary issueRecordImpacts.statusNote)
  // JSON: timestamp 04:42Z → 05:42 BST, badge DECISION
  {
    id: 'iss_status_0542',
    lane: 'issue',
    day: 'Mon',
    time: '05:42',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Comms engaged — issue opened in Metis',
    relatedIds: ['e_duty'],
    issueImpact: 'Active issue opened — comms engaged',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue status updated\nTime: Mon 05:42 BST\nLinked record: Bramley Junction issue',
      },
      {
        heading: 'STATUS',
        body: 'Comms engaged — issue opened in Metis',
      },
      {
        heading: 'ISSUE DETAILS',
        body: 'Title: Bramley Junction: main entrance reopening delay\nType: Planned works handback delay\nSeverity: Important\nPriority: High\nPosture: Active\nOwner: Duty Station Support',
      },
    ],
  },

  // Mon 05:48 — Issue status: Managed operational disruption (from social signal issueRecordImpacts.statusNote)
  // JSON: timestamp 04:48Z → 05:48 BST, badge DECISION
  {
    id: 'iss_status_0548',
    lane: 'issue',
    day: 'Mon',
    time: '05:48',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Managed operational disruption',
    relatedIds: ['e_social'],
    issueImpact: 'Status updated: Managed operational disruption',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue status updated\nTime: Mon 05:48 BST\nLinked record: Bramley Junction issue',
      },
      {
        heading: 'STATUS',
        body: 'Managed operational disruption',
      },
    ],
  },

  // Mon 05:49 — Issue record updated from Social inaccuracy
  // JSON: timestamp 04:49Z → 05:49 BST, badge RECORD UPDATED
  // impact: +1 claim (CLM-007), +1 observation (OBS-002), statusNote "Managed operational disruption"
  {
    id: 'iss_record_0549',
    lane: 'issue',
    day: 'Mon',
    time: '05:49',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Social inaccuracy',
    summary: '+1 claims · +1 observations · status updated',
    relatedIds: ['e_social', 'out_social'],
    issueImpact: 'CLM-007 added · OBS-002 added · status: Managed operational disruption',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue record updated\nTime: Mon 05:49 BST\nTriggered by: Social monitoring note (SRC-008)',
      },
      {
        heading: 'CLAIM ADDED',
        body: 'CLM-007: Social posts inaccurately describe Bramley Junction as fully closed.\nStatus: Contested\nLinked source: SRC-008',
      },
      {
        heading: 'OBSERVATION ADDED',
        body: 'OBS-002: Social monitoring flagged inaccurate closure narrative — corrective line recommended.',
      },
      {
        heading: 'STATUS',
        body: 'Managed operational disruption',
      },
    ],
  },

  // Mon 05:50 — Issue record updated from Overnight pack logged
  // JSON: timestamp 04:50Z → 05:50 BST, badge RECORD UPDATED
  // impact: +6 claims, +4 gaps opened, 1 gap closed, +3 observations
  {
    id: 'iss_record_0550',
    lane: 'issue',
    day: 'Mon',
    time: '05:50',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Overnight pack logged',
    summary: '+6 claims · +4 open questions · +3 observations · 1 question closed',
    relatedIds: ['e_overnight_pack'],
    issueImpact: '6 claims added · 4 questions opened · 1 question closed · 3 observations added',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue record populated from duty overnight pack\nTime: Mon 05:50 BST\nTriggered by: Duty manager summary (logged from phone briefing)',
      },
      {
        heading: 'CLAIMS ADDED',
        body: 'CLM-001: Planned overnight works were scheduled with expected handback before morning peak. [Confirmed]\nCLM-002: Most planned works were completed as expected overnight. [Confirmed]\nCLM-003: Main entrance ceiling panel sign-off was withheld by contractor. [Confirmed]\nCLM-004: Station remained open via side entrance with additional staffing. [Confirmed]\nCLM-005: Train services continued to call throughout. [Confirmed]\nCLM-006: Passenger confusion at main entrance was reported but crowding was low. [Confirmed]',
      },
      {
        heading: 'QUESTIONS OPENED',
        body: 'Q-001: Is the ceiling area safe for passenger use?\nQ-002: Can the side entrance safely handle early morning passenger flow?\nQ-004: What public line should be used if asked whether the station is shut?\nQ-005: What is the expected main entrance reopening time?',
      },
      {
        heading: 'QUESTION CLOSED',
        body: 'Q-003 closed immediately: Are trains running? (NOC confirmed yes via SRC-006)',
      },
      {
        heading: 'OBSERVATIONS ADDED',
        body: 'OBS-001: Handback criteria for planned works should be reviewed — ceiling sign-off not anticipated.\nOBS-003: Side entrance staffing was mobilised quickly — good practice to document.\nOBS-004: Passenger messaging for planned works handback delays should be pre-agreed.',
      },
    ],
  },

  // Mon 06:09 — Issue record updated from Press enquiry
  // JSON: timestamp 05:09Z → 06:09 BST, badge RECORD UPDATED
  // impact: empty (source linked only)
  {
    id: 'iss_record_0609',
    lane: 'issue',
    day: 'Mon',
    time: '06:09',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Press enquiry',
    summary: 'Issue record updated',
    relatedIds: ['e_press', 'out_press'],
    issueImpact: 'SRC-009 linked to issue record',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Source linked\nTime: Mon 06:09 BST\nTriggered by: Press office call log',
      },
      {
        heading: 'SOURCE',
        body: 'SRC-009 — Press call log — local reporter\nTier: Media enquiry\nReliability: High (press office log)\nLinked to: Press enquiry incoming update',
      },
      {
        heading: 'NEXT ACTION',
        body: 'Holding press line output generated to respond within reporter\'s 45-minute window.',
      },
    ],
  },

  // Mon 06:24 — Issue record updated from Flow manageable
  // JSON: timestamp 05:24Z → 06:24 BST, badge RECORD UPDATED
  // impact: gapsClosed [Q-002]
  {
    id: 'iss_record_0624',
    lane: 'issue',
    day: 'Mon',
    time: '06:24',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Flow manageable',
    summary: '1 question closed',
    relatedIds: ['e_flow'],
    issueImpact: 'Q-002 closed: Side entrance confirmed handling morning flow safely',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Open question closed\nTime: Mon 06:24 BST\nTriggered by: Station manager update (SRC-010)',
      },
      {
        heading: 'QUESTION CLOSED',
        body: 'Q-002: Can the side entrance safely handle early morning passenger flow?\nAnswer: Yes — queue under 3 minutes; no safety incidents reported.\nSource: SRC-010 (station manager phone update)',
      },
    ],
  },

  // Mon 06:40 — Compare executive brief versions
  // JSON: timestamp 05:40Z → 06:40 BST, badge COMPARE
  {
    id: 'iss_compare_exec',
    lane: 'issue',
    day: 'Mon',
    time: '06:40',
    badgeLabel: 'COMPARE',
    title: 'Compare executive brief versions',
    summary: 'V1 → V2 after reopening evidence',
    relatedIds: ['out_exec_v1', 'out_exec_v2'],
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Brief version comparison\nTime: Mon 06:40 BST\nVersions: Executive brief V1 → V2',
      },
      {
        heading: 'COMPARISON NOTE',
        body: 'V1 generated at 06:48 with ceiling safety and reopening time still open.\nV2 generated at 08:28 after facilities clearance (SRC-011) and reopening confirmation (SRC-013).\nKey changes: ceiling confirmed safe; main entrance reopened 08:12; press/social position contained.',
      },
    ],
  },

  // Mon 07:08 — Issue record updated from Ceiling cleared
  // JSON: timestamp 06:08Z → 07:08 BST, badge RECORD UPDATED
  // impact: claimsAdded [CLM-008], gapsClosed [Q-001], statusNote "Reopening expected shortly"
  {
    id: 'iss_record_0708',
    lane: 'issue',
    day: 'Mon',
    time: '07:08',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Ceiling cleared',
    summary: '+1 claims · 1 question closed · status updated',
    relatedIds: ['e_facilities', 'out_passenger_v2'],
    issueImpact: 'CLM-008 added · Q-001 closed · status: Reopening expected shortly',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Open question closed · Claim added\nTime: Mon 07:08 BST\nTriggered by: Facilities inspection summary (SRC-011)',
      },
      {
        heading: 'CLAIM ADDED',
        body: 'CLM-008: Ceiling area confirmed structurally safe for passenger use after facilities inspection. [Confirmed]',
      },
      {
        heading: 'QUESTION CLOSED',
        body: 'Q-001: Is the ceiling area safe for passenger use?\nAnswer: Yes — panels secure; minor drain remedial works scheduled non-urgent.\nSource: SRC-011 (facilities engineer inspection)',
      },
      {
        heading: 'STATUS',
        body: 'Reopening expected shortly',
      },
    ],
  },

  // Mon 07:12 — Issue status: Reopening expected shortly
  // JSON: timestamp 06:12Z → 07:12 BST, badge DECISION
  {
    id: 'iss_status_0712',
    lane: 'issue',
    day: 'Mon',
    time: '07:12',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Reopening expected shortly',
    relatedIds: ['e_facilities'],
    issueImpact: 'Status updated: Reopening expected shortly',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue status updated\nTime: Mon 07:12 BST\nLinked record: Bramley Junction issue',
      },
      {
        heading: 'STATUS',
        body: 'Reopening expected shortly',
      },
    ],
  },

  // Mon 07:54 — Issue record updated from Accessibility check
  // JSON: timestamp 06:54Z → 07:54 BST, badge RECORD UPDATED
  // impact: gapsOpened [Q-006], observationsAdded [OBS-005]
  {
    id: 'iss_record_0754',
    lane: 'issue',
    day: 'Mon',
    time: '07:54',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Accessibility check',
    summary: '+1 open questions · +1 observations',
    relatedIds: ['e_access'],
    issueImpact: 'Q-006 opened · OBS-005 added',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Open question added · Observation added\nTime: Mon 07:54 BST\nTriggered by: Accessibility assessment (SRC-012)',
      },
      {
        heading: 'QUESTION OPENED',
        body: 'Q-006: Are accessibility arrangements adequate while the main entrance is closed?\nContext: Step-free route available but temporary signage below standard.',
      },
      {
        heading: 'OBSERVATION ADDED',
        body: 'OBS-005: Temporary signage for step-free access needs improvement — high-visibility totems recommended within 30 minutes.',
      },
    ],
  },

  // Mon 08:12 — Issue status: Operational disruption closed
  // JSON: timestamp 07:12Z → 08:12 BST, badge DECISION
  {
    id: 'iss_status_0812',
    lane: 'issue',
    day: 'Mon',
    time: '08:12',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Operational disruption closed',
    relatedIds: ['e_reopen'],
    issueImpact: 'Status updated: Operational disruption closed',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue status updated\nTime: Mon 08:12 BST\nLinked record: Bramley Junction issue',
      },
      {
        heading: 'STATUS',
        body: 'Operational disruption closed',
      },
    ],
  },

  // Mon 08:15 — Issue record updated from Main entrance open
  // JSON: timestamp 07:15Z → 08:15 BST, badge RECORD UPDATED
  // impact: claimsAdded [CLM-009], gapsClosed [Q-005, Q-004], statusNote "Operational disruption closed"
  {
    id: 'iss_record_0815',
    lane: 'issue',
    day: 'Mon',
    time: '08:15',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Main entrance open',
    summary: '+1 claims · 2 questions closed · status updated',
    relatedIds: ['e_reopen', 'out_exec_v2'],
    issueImpact: 'CLM-009 added · Q-004 and Q-005 closed · status: Operational disruption closed',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Record updated — reopening confirmed\nTime: Mon 08:15 BST\nTriggered by: Station manager reopening confirmation (SRC-013)',
      },
      {
        heading: 'CLAIM ADDED',
        body: 'CLM-009: Main entrance reopened at 08:12 after facilities clearance and clean-up. [Confirmed]',
      },
      {
        heading: 'QUESTIONS CLOSED',
        body: 'Q-004: What public line should be used if asked whether the station is shut?\nAnswer: Station is open — main entrance now reopened; side entrance also available.\n\nQ-005: What is the expected main entrance reopening time?\nAnswer: Main entrance reopened 08:12.',
      },
      {
        heading: 'STATUS',
        body: 'Operational disruption closed',
      },
    ],
  },

  // Mon 08:41 — Issue record updated from Exec follow-up
  // JSON: timestamp 07:41Z → 08:41 BST, badge RECORD UPDATED
  // impact: gapsOpened [Q-007], observationsAdded [OBS-006], statusNote "Review / audit stage"
  {
    id: 'iss_record_0841',
    lane: 'issue',
    day: 'Mon',
    time: '08:41',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Exec follow-up',
    summary: '+1 open questions · +1 observations · status updated',
    relatedIds: ['e_followup', 'out_post_incident'],
    issueImpact: 'Q-007 opened · OBS-006 added · status: Review / audit stage',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Open question added · Observation added\nTime: Mon 08:41 BST\nTriggered by: Executive follow-up request',
      },
      {
        heading: 'QUESTION OPENED',
        body: 'Q-007: What follow-up action is needed before future planned works?\nContext: Regional Operations Director requested post-incident review.',
      },
      {
        heading: 'OBSERVATION ADDED',
        body: 'OBS-006: Future works handback focus — review should cover handback criteria, temporary signage and pre-agreed passenger messaging.',
      },
      {
        heading: 'STATUS',
        body: 'Review / audit stage',
      },
    ],
  },

  // Mon 09:00 — Issue status: Review / audit stage
  // JSON: timestamp 08:00Z → 09:00 BST, badge DECISION
  {
    id: 'iss_status_0900',
    lane: 'issue',
    day: 'Mon',
    time: '09:00',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Review / audit stage',
    relatedIds: ['out_circulation_audit'],
    issueImpact: 'Status updated: Ready for review',
    fullRecord: [
      {
        heading: 'METIS ACTION',
        body: 'Action: Issue status updated\nTime: Mon 09:00 BST\nLinked record: Bramley Junction issue',
      },
      {
        heading: 'STATUS',
        body: 'Review / audit stage',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────
  // METIS OUTPUTS — lane "metis_output" in JSON
  // All times in BST (UTC+1)
  // ──────────────────────────────────────────────────────────

  // Mon 05:52 — Social response line
  // JSON: dddd5003, generatedAt 04:52Z → 05:52 BST
  {
    id: 'out_social',
    lane: 'output',
    day: 'Mon',
    time: '05:52',
    badgeLabel: 'SOCIAL RESPONSE LINE',
    title: 'Social response line',
    summary: 'Corrective social response to inaccurate closure posts. Trains running; side entrance open.',
    relatedIds: ['e_social', 'iss_record_0549'],
    outputAudience: 'Social media replies',
    outputStatus: 'Approved',
    outputVersion: 1,
    wordingModeDefault: 'ai_polished',
    draftBody: `Bramley Junction is open via the side entrance and trains are running as normal. The main entrance is temporarily closed while final checks are completed after overnight improvement works. We'll share an update when the main entrance reopens.`,
    aiPolishedBody: `Bramley Junction is open via the side entrance and trains are running as normal. The main entrance is temporarily closed while final checks are completed after overnight improvement works. We'll share an update once the main entrance reopens.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T04:52:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: ['Do not engage with speculation about structural issues.'],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not engage with speculation about structural issues.'],
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Social response line\nAudience: Social media replies\nStatus: Approved\nGenerated: Mon 05:52 BST',
      },
      {
        heading: 'MESSAGE',
        body: 'Thanks for flagging this. Bramley Junction is open via the side entrance and trains are running as normal. The main entrance is temporarily closed while we complete final checks after overnight improvement works. We will update when the main entrance reopens.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'Do not engage with speculation about structural issues.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-008 Social monitoring — inaccurate closure posts\nSRC-006 NOC confirmation — trains calling\nSRC-004 Station manager escalation — main entrance delay',
      },
    ],
  },

  // Mon 05:54 — Staff holding update
  // JSON: dddd5001, generatedAt 04:54Z → 05:54 BST
  {
    id: 'out_staff',
    lane: 'output',
    day: 'Mon',
    time: '05:54',
    badgeLabel: 'STAFF HOLDING UPDATE',
    title: 'Staff holding update',
    summary: 'Internal staff briefing: station open via side entrance, trains running, main entrance pending final checks.',
    relatedIds: ['iss_record_0550'],
    outputAudience: 'Station staff and customer service',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    wordingModeDefault: 'ai_polished',
    draftBody: `Staff holding update — Bramley Junction (internal)
Use this line with passengers
- Bramley Junction is open via the side entrance. Trains are running as normal.
- The main entrance is temporarily unavailable while final checks complete after overnight improvement works.
Do not say
- That the station is closed or trains are cancelled.
- Anything about roof leaks/structural failure (not confirmed).
- A reopening time until facilities confirms.
Escalate
- Direct press/social queries to corporate affairs duty.`,
    aiPolishedBody: `Staff holding update — Bramley Junction (internal)
Use with passengers
- Bramley Junction is open via the side entrance. Trains are running as normal.
- The main entrance is temporarily unavailable while final checks complete after overnight improvement works.
Do not say
- The station is closed or trains are cancelled.
- Anything about roof leaks or structural failure (not confirmed).
- A reopening time until facilities confirms.
Escalate
- Direct press/social queries to corporate affairs duty.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T04:54:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Do not say the station is closed.',
        'Do not confirm a structural failure or active roof leak.',
        'Do not give a main entrance reopening time yet.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: [
      'Do not say the station is closed.',
      'Do not confirm a structural failure or active roof leak.',
      'Do not give a main entrance reopening time yet.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Staff holding update\nAudience: Station staff and customer service\nStatus: Ready for review\nGenerated: Mon 05:54 BST',
      },
      {
        heading: 'MESSAGE',
        body: 'Staff holding update — Bramley Junction (internal)\n\nWhat we know\n- Overnight planned works ran on concourse lighting, ticket gates and wayfinding.\n- Main entrance remains closed pending final checks after contractor handback note.\n- Side entrance is in use with additional staff and security.\n- Trains continue to call; no NOC service change.\n\nTell passengers\n- The station is open via the side entrance.\n- Trains are running as normal.\n- The main entrance is temporarily unavailable while final checks complete after improvement works.\n\nEscalation\n- Station manager → duty manager → corporate affairs duty for press/social lines.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'Do not say the station is closed.\nDo not confirm a structural failure or active roof leak.\nDo not give a main entrance reopening time yet.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-001 Planned works notice\nSRC-003 Contractor handback note\nSRC-004 Station manager escalation\nSRC-006 NOC confirmation — trains calling',
      },
    ],
  },

  // Mon 05:58 — Passenger message V1
  // JSON: dddd5002, generatedAt 04:58Z → 05:58 BST
  {
    id: 'out_passenger_v1',
    lane: 'output',
    day: 'Mon',
    time: '05:58',
    badgeLabel: 'PASSENGER MESSAGE',
    title: 'Passenger message draft',
    summary: 'Station open via side entrance. Main entrance temporarily unavailable. Trains running as normal.',
    relatedIds: ['iss_record_0550', 'out_passenger_v2'],
    outputAudience: 'Passengers',
    outputStatus: 'Approved',
    outputVersion: 1,
    outputSupersededBy: 'Updated passenger message V2',
    wordingModeDefault: 'ai_polished',
    draftBody: `Bramley Junction station is open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. Staff are on site to help direct passengers.`,
    aiPolishedBody: `Bramley Junction is open via the side entrance and trains are running as normal. The main entrance is temporarily unavailable while final checks complete after overnight improvement works. Staff are on site to direct passengers.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T04:58:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Do not say the station is shut.',
        'Do not imply train cancellations.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: [
      'Do not say the station is shut.',
      'Do not imply train cancellations.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Passenger message\nAudience: Passengers\nStatus: Approved\nVersion: 1 (superseded by V2)\nGenerated: Mon 05:58 BST',
      },
      {
        heading: 'MESSAGE',
        body: 'Bramley Junction station is open via the side entrance. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. Trains are running as normal. Staff are on site to help direct passengers.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'Do not say the station is shut.\nDo not imply train cancellations.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-004 Station manager escalation — main entrance delay\nSRC-006 NOC confirmation — trains calling',
      },
    ],
  },

  // Mon 06:18 — Holding press line
  // JSON: dddd5004, generatedAt 05:18Z → 06:18 BST
  {
    id: 'out_press',
    lane: 'output',
    day: 'Mon',
    time: '06:18',
    badgeLabel: 'HOLDING PRESS LINE',
    title: 'Holding press line',
    summary: 'Holding line for local media. Station open; trains running; main entrance pending inspection and clean-up.',
    relatedIds: ['e_press', 'iss_record_0609'],
    outputAudience: 'Local media',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    wordingModeDefault: 'ai_polished',
    draftBody: `Bramley Junction remains open via the side entrance and trains are running as normal.
The main entrance is temporarily unavailable while final checks are completed after overnight improvement works.
We will provide an update once inspections and clean-up are complete.`,
    aiPolishedBody: `Bramley Junction remains open via the side entrance and trains are running as normal.
The main entrance is temporarily unavailable while final checks are completed after overnight improvement works.
We will update once inspections and clean-up are complete.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T05:18:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Facilities inspection not yet complete — do not confirm ceiling safety or reopening time.',
        'Main entrance still closed at time of generation.',
        'That the station is closed.',
        'That trains are cancelled or diverted.',
        'That there is a confirmed structural failure or active leak.',
        'A precise reopening time until station/facilities confirm.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: [
      'That the station is closed.',
      'That trains are cancelled or diverted.',
      'That there is a confirmed structural failure or active leak.',
      'A precise reopening time until station/facilities confirm.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [
      'Facilities inspection not yet complete — do not confirm ceiling safety or reopening time.',
      'Main entrance still closed at time of generation.',
    ],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Holding press line\nAudience: Local media\nStatus: Ready for review\nGenerated: Mon 06:18 BST',
      },
      {
        heading: 'SUGGESTED LINE',
        body: 'Bramley Junction remains open via the side entrance and trains are running as normal.\nThe main entrance is temporarily unavailable while we complete final checks following overnight improvement works.\nWe expect to reopen the main entrance once inspections and clean-up are complete.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'That the station is closed.\nThat trains are cancelled or diverted.\nThat there is a confirmed structural failure or active leak.\nA precise reopening time until station/facilities confirm.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-003 Contractor handback note\nSRC-004 Station manager escalation\nSRC-006 NOC confirmation\nSRC-007 Customer service floor report\nSRC-008 Social monitoring\nSRC-009 Press call log',
      },
    ],
  },

  // Mon 06:48 — Executive brief V1
  // JSON: dddd5005, generatedAt 05:48Z → 06:48 BST
  {
    id: 'out_exec_v1',
    lane: 'output',
    day: 'Mon',
    time: '06:48',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Executive brief V1',
    summary: 'Executive position note for morning leadership. Main entrance delayed; station open; press and social managed. Facilities inspection pending.',
    relatedIds: ['e_exec_req', 'out_exec_v2'],
    outputAudience: 'Senior leadership',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    outputSupersededBy: 'Executive brief V2',
    wordingModeDefault: 'ai_polished',
    draftBody: `Executive brief — Bramley Junction main entrance delay (V1)

Current position
- Main entrance delayed after overnight planned works handback.
- Station open via side entrance; trains running.
- Comms engaged from 05:42 when duty manager briefed corporate affairs; duty overnight pack logged in Metis at 05:50.
- Social monitoring (05:49) and press enquiry (06:09) drove external messaging; executive office requested this note at 06:35.

What happened
- Planned works scheduled with 05:30 handback (SRC-001).
- Contractor withheld final ceiling panel sign-off at main entrance (SRC-003).
- Station manager escalated likely miss of 05:30 target (SRC-004).

Customer impact
- Limited but visible at main entrance; help point queries (SRC-007).
- Some social posts incorrectly describe station as shut (SRC-008).

Operational position
- Side entrance staffing and barriers deployed (SRC-005).
- NOC confirms trains calling (SRC-006).

Media / reputation
- Local reporter deadline following 06:08 press call; holding line drafted after enquiry.

Open questions
- Ceiling area safety confirmation.
- Expected main entrance reopening time.

Next actions
- Maintain side entrance flow; staff and passenger lines in use.
- Respond to press within window using holding line.
- Await facilities inspection outcome before committing reopening time.

Confidence / caveats
- Based only on records in Metis as of 06:48; facilities clearance and reopening not yet logged.
- No confirmed safety failure reported; ceiling issue is precautionary pending inspection.
- Do not state station is closed or trains affected.`,
    aiPolishedBody: `Bramley Junction — Executive brief V1 (Mon 06:48)

Current position
The main entrance is delayed following last night's planned works. The station is open via the side entrance and trains are running normally. Comms engaged at 05:42 when the duty manager briefed Corporate Affairs; the overnight duty pack was logged in Metis at 05:50. A social monitoring alert (05:49) and a press enquiry (06:09) have driven external messaging; this note was requested by the Executive Office at 06:35.

What happened
Overnight works were scheduled for a 05:30 handback. The contractor withheld final sign-off on ceiling panels at the main entrance (SRC-003), and the station manager escalated the likely miss at 05:04 (SRC-004).

Customer and operational impact
Impact is limited but visible at the main entrance — help point queries have been received (SRC-007). Some social posts are incorrectly describing the station as shut (SRC-008). The side entrance is staffed with barriers deployed (SRC-005); NOC confirms trains are calling (SRC-006).

Media and reputation
A local reporter has a deadline following a 06:09 press call. A holding line has been drafted and is ready to issue within the reporter's window.

Open questions
- Q-001: Ceiling area safety confirmation (pending facilities inspection).
- Q-005: Expected main entrance reopening time (not yet confirmed).

Next actions
- Maintain side entrance flow; staff and passenger lines remain active.
- Issue holding press line within reporter's window.
- Await facilities inspection before committing a reopening time.

Caveats
Based on Metis records as of 06:48 only. No confirmed safety failure; ceiling issue is precautionary. Do not state the station is closed or that trains are affected.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T05:48:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, preserving all facts, guardrails and open questions.',
      preservedConstraints: [
        'Do not state main entrance has reopened.',
        'Do not state facilities have cleared ceiling.',
        'Based on Metis records as of 06:48 only — excludes facilities clearance and reopening logged later.',
        'Q-001 ceiling safety and Q-005 reopening time still open at generation.',
      ],
      changed: [
        'Restructured into cleaner prose paragraphs',
        'Added brief version label and timestamp to header',
        'Tightened bullet points into flowing sentences where appropriate',
        'Preserved all open questions, caveats and do-not-say constraints',
      ],
    },
    doNotSay: [
      'Do not state main entrance has reopened.',
      'Do not state facilities have cleared ceiling.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [
      'Based on Metis records as of 06:48 only — excludes facilities clearance and reopening logged later.',
      'Overnight operational detail from duty pack logged in Metis after 05:42 comms engagement.',
      'Q-001 ceiling safety and Q-005 reopening time still open at generation.',
    ],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Executive brief\nAudience: Senior leadership\nStatus: Ready for review\nVersion: 1 (superseded by V2)\nGenerated: Mon 06:48 BST',
      },
      {
        heading: 'CURRENT POSITION',
        body: 'Main entrance delayed after overnight planned works handback.\nStation open via side entrance; trains running.\nComms engaged from 05:42; duty overnight pack logged in Metis at 05:50.\nSocial monitoring (05:49) and press enquiry (06:09) drove external messaging.\nExecutive office requested this note at 06:36.',
      },
      {
        heading: 'WHAT HAPPENED',
        body: 'Planned works scheduled with 05:30 handback (SRC-001).\nContractor withheld final ceiling panel sign-off at main entrance (SRC-003).\nStation manager escalated likely miss of 05:30 target (SRC-004).',
      },
      {
        heading: 'OPEN QUESTIONS',
        body: 'Q-001: Ceiling area safety confirmation.\nQ-005: Expected main entrance reopening time.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'Do not state main entrance has reopened.\nDo not state facilities have cleared ceiling.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-001 Planned works notice\nSRC-003 Contractor handback note\nSRC-004 Station manager escalation\nSRC-006 NOC confirmation\nSRC-007 Customer service floor report\nSRC-008 Social monitoring\nSRC-009 Press call log',
      },
    ],
  },

  // Mon 07:22 — Updated passenger message V2
  // JSON: dddd5006, generatedAt 06:22Z → 07:22 BST
  {
    id: 'out_passenger_v2',
    lane: 'output',
    day: 'Mon',
    time: '07:22',
    badgeLabel: 'PASSENGER MESSAGE',
    title: 'Updated passenger message',
    summary: 'Updated message with expected reopening window (~08:00). Facilities inspection complete; main entrance expected to reopen.',
    relatedIds: ['e_facilities', 'iss_record_0708', 'out_passenger_v1'],
    outputAudience: 'Passengers',
    outputStatus: 'Approved',
    outputVersion: 2,
    wordingModeDefault: 'ai_polished',
    draftBody: `Bramley Junction station remains open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. We expect the main entrance to reopen around 08:00, subject to final confirmation. Staff are on site to help direct passengers.`,
    aiPolishedBody: `Bramley Junction remains open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. We expect the main entrance to reopen around 08:00, subject to final confirmation. Staff are on site to direct passengers.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T06:22:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Expected reopening around 08:00 — subject to final confirmation; not yet open at 07:22.',
        'Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet).',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: [
      'Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet).',
    ],
    openQuestionsAtGeneration: [
      'Q-005: What is the expected main entrance reopening time? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Expected reopening around 08:00 — subject to final confirmation; not yet open at 07:22.',
    ],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Passenger message\nAudience: Passengers\nStatus: Approved\nVersion: 2 (supersedes V1)\nGenerated: Mon 07:22 BST',
      },
      {
        heading: 'MESSAGE',
        body: 'Bramley Junction station remains open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while we complete final checks after overnight improvement works. We expect the main entrance to reopen around 08:00 following inspection and clean-up, subject to final confirmation. Staff are on site to help direct passengers.',
      },
      {
        heading: 'DO NOT SAY',
        body: 'Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet).',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-011 Facilities inspection — ceiling secure\nSRC-004 Station manager escalation\nSRC-006 NOC confirmation',
      },
    ],
  },

  // Mon 07:38 — Councillor and stakeholder note
  // JSON: dddd5007, generatedAt 06:38Z → 07:38 BST
  {
    id: 'out_stakeholder',
    lane: 'output',
    day: 'Mon',
    time: '07:38',
    badgeLabel: 'STAKEHOLDER NOTE',
    title: 'Councillor and stakeholder note',
    summary: 'Note for local authority and accessibility contacts. Station open; trains unaffected; main entrance expected ~08:00.',
    relatedIds: ['e_facilities', 'e_flow'],
    outputAudience: 'Local authority / accessibility / transport stakeholders',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    wordingModeDefault: 'ai_polished',
    draftBody: `Stakeholder note (draft)

Bramley Junction remains open via the side entrance and trains are running as normal.
The main entrance is temporarily unavailable following overnight improvement works. Facilities clearance has been recorded; reopening is expected around 08:00 subject to final checks.
Mitigations
- Additional staff/security at the side entrance and clear passenger lines in use.
- Accessibility/wayfinding checks on temporary arrangements are in progress.`,
    aiPolishedBody: `Stakeholder note (draft)

Bramley Junction remains open via the side entrance and trains are running as normal.
The main entrance is temporarily unavailable following overnight improvement works. Facilities clearance has been recorded; reopening is expected around 08:00, subject to final checks.
Mitigations
- Additional staff/security at the side entrance and agreed passenger lines in use.
- Accessibility and wayfinding checks for the temporary arrangements are in progress.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T06:38:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Accessibility formal assessment not yet in Metis at generation — wording treats accessibility as being checked.',
        'Do not state that an accessibility assessment is complete if temporary signage actions are still in progress.',
        'Do not speculate on causes beyond what facilities has confirmed.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: [],
    openQuestionsAtGeneration: [
      'Q-005: What is the expected main entrance reopening time? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Accessibility formal assessment not yet in Metis at generation — wording treats accessibility as being checked.',
    ],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Stakeholder note\nAudience: Local authority / accessibility / transport stakeholders\nStatus: Ready for review\nVersion: 1\nGenerated: Mon 07:38 BST',
      },
      {
        heading: 'SUMMARY',
        body: 'Overnight planned works completed with minor handback delay at main entrance only.\nStation remained open via side entrance; trains unaffected.\nFacilities have cleared the ceiling area for reopening; main entrance expected to reopen around 08:00 following final checks.',
      },
      {
        heading: 'ACCESSIBILITY',
        body: 'Step-free access is understood to be available via the side entrance lift based on station operational reports.\nA formal accessibility check on temporary signage and wayfinding is in progress (Q-006) — do not state the assessment is complete.',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-011 Facilities inspection — ceiling secure\nSRC-010 Station update — passenger flow\nSRC-004 Station manager escalation\nSRC-009 Press call log',
      },
    ],
  },

  // Mon 08:28 — Executive brief V2
  // JSON: dddd5008, generatedAt 07:28Z → 08:28 BST
  {
    id: 'out_exec_v2',
    lane: 'output',
    day: 'Mon',
    time: '08:28',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Executive brief V2',
    summary: 'Updated executive brief after reopening. Main entrance reopened 08:12. Press/social position contained.',
    relatedIds: ['e_reopen', 'iss_record_0815', 'out_exec_v1'],
    outputAudience: 'Senior leadership',
    outputStatus: 'Approved',
    outputVersion: 2,
    wordingModeDefault: 'ai_polished',
    draftBody: `Executive brief — Bramley Junction update (V2)

Current position
- Main entrance reopened 08:12 after facilities clearance.
- Side entrance remains available; passenger flow normalising.
- Press/social position contained with corrective lines.

What changed since V1
- Facilities confirmed ceiling panels secure (SRC-011).
- Main entrance reopened (SRC-013).
- Passenger impact remained limited; queues manageable via side entrance.

Customer impact
- Morning peak confusion at main doors; no significant crowding reported after mitigations.

Operational position
- Remedial roof drain repair scheduled non-urgent.
- Executive request for post-incident review received.

Open questions
- Accessibility signage improvements (action in progress).
- Follow-up actions for future planned works handback (Q-007).

Next actions
- Complete post-incident review note.
- Confirm circulation audit for governance record.`,
    aiPolishedBody: `Bramley Junction — Executive brief V2 (Mon 08:28)

Current position
The main entrance reopened at 08:12 following facilities clearance. The side entrance remains available and passenger flow is normalising. The press and social media position has been contained with corrective lines.

What changed since V1
Facilities confirmed ceiling panels secure (SRC-011) and the main entrance reopened at 08:12 (SRC-013). Passenger impact remained limited — queues were manageable via the side entrance throughout the morning peak.

Customer impact
Some confusion at the main entrance during the morning peak; no significant crowding was reported following mitigations.

Operational position
A remedial roof drain repair has been scheduled as non-urgent. The Executive Office has requested a post-incident review.

Open questions
- Q-006: Accessibility signage improvements (action in progress).
- Q-007: Follow-up actions for future planned works handback.

Next actions
- Complete post-incident review note.
- Confirm circulation audit for governance record.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-05-11T07:28:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, preserving all facts and open questions.',
      preservedConstraints: [
        'Q-006 accessibility signage still open at generation.',
        'Q-007 future planned works follow-up still open at generation.',
        'Avoid speculative language until records are attributable.',
      ],
      changed: [
        'Restructured into cleaner prose paragraphs',
        'Added brief version label and timestamp to header',
        'Tightened bullet points into flowing sentences where appropriate',
        'Preserved all open questions and caveats',
      ],
    },
    doNotSay: [],
    openQuestionsAtGeneration: [
      'Q-006: Are accessibility arrangements adequate while the main entrance is closed?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Executive brief\nAudience: Senior leadership\nStatus: Approved\nVersion: 2 (supersedes V1)\nGenerated: Mon 08:28 BST',
      },
      {
        heading: 'CURRENT POSITION',
        body: 'Main entrance reopened 08:12 after facilities clearance.\nSide entrance remains available; passenger flow normalising.\nPress/social position contained with corrective lines.',
      },
      {
        heading: 'WHAT CHANGED SINCE V1',
        body: 'Facilities confirmed ceiling panels secure (SRC-011).\nMain entrance reopened (SRC-013).\nPassenger impact remained limited; queues manageable via side entrance.',
      },
      {
        heading: 'OPEN QUESTIONS',
        body: 'Q-006: Accessibility signage improvements (action in progress).',
      },
      {
        heading: 'SOURCES USED',
        body: 'SRC-011 Facilities inspection — ceiling secure\nSRC-013 Reopening confirmation\nSRC-010 Station update — passenger flow\nSRC-008 Social monitoring',
      },
    ],
  },

  // Mon 08:45 — Post-incident review note
  // JSON: dddd5009, generatedAt 07:45Z → 08:45 BST
  {
    id: 'out_post_incident',
    lane: 'output',
    day: 'Mon',
    time: '08:45',
    badgeLabel: 'POST INCIDENT REVIEW',
    title: 'Post-incident review note',
    summary: 'Draft review covering handback delay, customer impact, media handling, and recommended actions for future planned works.',
    relatedIds: ['e_followup', 'iss_record_0841'],
    outputAudience: 'Operations and comms leadership',
    outputStatus: 'Draft',
    outputVersion: 1,
    doNotSay: [],
    openQuestionsAtGeneration: [
      'Q-006: Are accessibility arrangements adequate while the main entrance is closed?',
      'Q-007: What follow-up action is needed before future planned works?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Post-incident review note\nAudience: Operations and comms leadership\nStatus: Draft\nVersion: 1\nGenerated: Mon 08:45 BST',
      },
      {
        heading: 'SUMMARY',
        body: 'Overnight planned works largely succeeded; main entrance handback delayed by ceiling panel sign-off and inspection.\nStation remained open via side entrance; trains unaffected.\nReputation risk driven by "station shut" confusion rather than service cancellation.',
      },
      {
        heading: 'WHAT WORKED',
        body: 'Early NOC confirmation on trains.\nSide entrance opening with security support.\nRapid passenger/social corrective lines.',
      },
      {
        heading: 'RECOMMENDED ACTIONS',
        body: '1. Pre-agree passenger messaging pack for planned works handback delays.\n2. Temporary signage standard for side-entrance-only access.\n3. Handback checklist requiring facilities sign-off before public reopening target.',
      },
    ],
  },

  // Mon 09:00 — Circulation audit
  // JSON: dddd5010, generatedAt 08:00Z → 09:00 BST
  {
    id: 'out_circulation_audit',
    lane: 'output',
    day: 'Mon',
    time: '09:00',
    badgeLabel: 'CIRCULATION AUDIT',
    title: 'Circulation audit',
    summary: 'Governance record of all outputs circulated during the Bramley Junction incident window.',
    relatedIds: ['iss_status_0900'],
    outputAudience: 'Governance record',
    outputStatus: 'Approved',
    doNotSay: [],
    openQuestionsAtGeneration: [
      'Q-006: Are accessibility arrangements adequate while the main entrance is closed?',
      'Q-007: What follow-up action is needed before future planned works?',
    ],
    caveatsAtGeneration: [],
    fullRecord: [
      {
        heading: 'OUTPUT DETAILS',
        body: 'Kind: Circulation audit\nAudience: Governance record\nStatus: Approved\nGenerated: Mon 09:00 BST',
      },
      {
        heading: 'OUTPUTS CIRCULATED',
        body: '05:52 Social response line — social media replies\n05:54 Staff holding update — station staff & customer service\n05:58 Passenger message V1 — digital/PA (superseded by V2)\n06:18 Holding press line — local media\n06:48 Executive brief V1 — senior leadership (superseded by V2)\n07:22 Updated passenger message V2 — digital/PA\n07:38 Councillor and stakeholder note — local authority\n08:28 Executive brief V2 — senior leadership\n08:45 Post-incident review note — operations & comms leadership (draft)',
      },
      {
        heading: 'AUDIT POSTURE',
        body: 'All lines tied to sources recorded in Metis issue record.\nV2 executive brief reflects reopening confirmation and facilities clearance.\nNo outputs issued without source backing.',
      },
    ],
  },
];
