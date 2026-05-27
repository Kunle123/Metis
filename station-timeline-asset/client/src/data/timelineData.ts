/*
 * METIS Station Timeline — Bramley Junction Demo Data
 * Source: bramley-junction-demo-export.json (canonical demo export)
 * Design: "Editorial Record" — paper #F6F1E8, ink #171713, deep olive #263B2E, sage #8FA38A, brass #B78B45
 *
 * Conceptual model:
 *   input  = Incoming Updates — "What arrived in the organisation?" (BAU signals)
 *   issue  = Issue Record     — "What did METIS understand, structure, question or evidence?"
 *   output = METIS Outputs    — "What did the organisation say or brief as a result?"
 *
 * Timeline rule: cards appear at the time they were ADDED TO METIS (receivedByCommsAt / addedToMetisAt).
 * eventOccurredAt appears only inside the modal as "Reported event time" — never drives the visible timeline.
 */

export type Lane = 'input' | 'issue' | 'output';

export interface TimelineEvent {
  id: string;
  time: string;
  day: string;
  lane: Lane;
  title: string;
  summary: string;
  fullRecord: string;
  badgeLabel: string;
  status?: 'open' | 'closed' | 'updated' | 'active' | 'managed';
  // Drawer detail fields
  inputFrom?: string;
  linkedSource?: string;
  sourceConfidence?: 'high' | 'medium' | 'low';
  issueImpact?: string[];
  outputAudience?: string;
  outputStatus?: string;
  outputVersion?: number;
  openQuestionsAtGeneration?: string[];
  caveatsAtGeneration?: string[];
  doNotSay?: string[];
  relatedIds?: string[];
}

// ─── LANE CONFIGURATION ────────────────────────────────────────────────────

export const LANE_CONFIG = {
  input: {
    label: 'Incoming Updates',
    sublabel: 'BAU signals',
    color: '#8FA38A',
    bgColor: 'rgba(143, 163, 138, 0.10)',
    borderColor: 'rgba(143, 163, 138, 0.55)',
    textColor: '#4A6B45',
    accentColor: '#8FA38A',
    badgeBackground: '#EAF0E8',
  },
  issue: {
    label: 'Issue Record',
    sublabel: 'Claims, questions & observations',
    color: '#263B2E',
    bgColor: 'rgba(38, 59, 46, 0.07)',
    borderColor: 'rgba(38, 59, 46, 0.45)',
    textColor: '#263B2E',
    accentColor: '#263B2E',
    badgeBackground: '#DDE8DA',
  },
  output: {
    label: 'METIS Outputs',
    sublabel: 'Briefings and messages',
    color: '#B78B45',
    bgColor: 'rgba(183, 139, 69, 0.08)',
    borderColor: 'rgba(183, 139, 69, 0.5)',
    textColor: '#8B6020',
    accentColor: '#B78B45',
    badgeBackground: '#F5E9D0',
  },
} as const;

// ─── EVENTS ────────────────────────────────────────────────────────────────

export const events: TimelineEvent[] = [

  // ── INCOMING UPDATES ──────────────────────────────────────────────────────

  // e15: First real-time input — duty manager calls comms at 04:42
  {
    id: 'e15',
    time: '04:42', day: 'Mon', lane: 'input',
    badgeLabel: 'DUTY SUMMARY',
    title: 'Duty manager summary to comms',
    summary: 'Handback delay at main entrance after overnight works. Station open via side entrance; trains running. Comms asked to open Metis issue.',
    inputFrom: 'Duty Station Manager',
    linkedSource: 'Phone briefing to corporate affairs duty',
    sourceConfidence: 'high',
    issueImpact: [
      'Active issue opened in Metis — comms engaged from this point.',
      'Initial issue record populated from this briefing (CLM-001 to CLM-006, Q-001 to Q-005).',
    ],
    relatedIds: ['iss01', 'iss_batch', 'out01'],
    fullRecord: `INCOMING UPDATE — DUTY SUMMARY
Sender: Duty Station Manager
Channel: Phone briefing to corporate affairs duty
Occurred: Mon 04:42 · Added to Metis: Mon 04:42
Intake route: Direct to comms

SUMMARY
Handback delay at main entrance after overnight works. Station open via side entrance; trains running. Comms asked to open Metis issue and help with passenger/social lines.

FULL TEXT
Duty manager → corporate affairs duty phone briefing

Situation: planned overnight works largely complete but main entrance remains closed pending ceiling panel sign-off.
Station is operating via side entrance with extra staff/security being deployed.
NOC confirms trains calling — no service change.
Customer team reports growing confusion at main doors; no major crowding yet.
No confirmed safety failure; facilities inspection still required before main entrance reopening.

Ask of comms:
- Open controlled issue record in Metis and reconstruct overnight operational notes as sources.
- Prepare staff and passenger lines distinguishing main entrance closure vs whole-station closure.
- Stand by for possible social/media attention during the morning peak.

ISSUE RECORD IMPACT
→ Active issue opened — comms engaged from this point.
→ Initial issue record populated from this briefing (CLM-001 to CLM-006, Q-001 to Q-005).`,
  },

  // e_intake: Duty overnight pack logged in Metis — COMMS INTAKE at 04:50
  {
    id: 'e_intake',
    time: '04:50', day: 'Mon', lane: 'input',
    badgeLabel: 'COMMS INTAKE',
    title: 'Duty overnight pack logged in Metis',
    summary: 'Corporate Affairs logs source-backed records from the duty manager overnight pack: SRC-001 to SRC-007 (planned works, contractor handback, station/security/NOC updates and customer floor report).',
    inputFrom: 'Corporate Affairs',
    linkedSource: 'Metis intake from duty handover',
    sourceConfidence: 'high',
    issueImpact: [
      'SRC-001 to SRC-007 logged as linked sources in the issue record.',
      'CLM-001 to CLM-006 added from duty pack context.',
      'Q-001, Q-002, Q-004, Q-005 opened; Q-003 resolved immediately (NOC confirmation).',
      'OBS-001, OBS-003, OBS-004 added.',
    ],
    relatedIds: ['e15', 'iss01', 'iss_batch', 'out01', 'out02'],
    fullRecord: `INCOMING UPDATE — COMMS INTAKE
Sender: Corporate Affairs
Channel: Metis intake from duty handover
Occurred: Mon 04:50 · Added to Metis: Mon 04:50
Intake route: Direct to comms

SUMMARY
Corporate Affairs logs source-backed records from the duty manager overnight pack. Each item is recorded as a linked source in the issue record.

SOURCES LOGGED
SRC-001 Planned works notice (reported Sun 20:00): overnight concourse lighting, ticket gate and wayfinding; 05:30 handback; no planned train disruption.
SRC-002 Contractor mobilisation (reported Sun 21:15): team on site; works commenced.
SRC-003 Contractor handback note (reported Mon 04:28): ceiling panel sign-off pending at main entrance; possible roof drain residue — not confirmed structural failure.
SRC-004 Station manager escalation (reported Mon 04:35): main entrance unlikely at 05:30; side entrance with staffing from 05:45 if security confirms.
SRC-005 Security update (reported Mon 04:50): additional officers and barriers from 05:45.
SRC-006 NOC confirmation (reported Mon 04:55): trains continue to call.
SRC-007 Customer service floor report (reported Mon 05:32): passengers confused at main doors; low crowding.

Claims, open questions and observations created from this pack per Metis discipline.

ISSUE RECORD IMPACT
→ SRC-001 to SRC-007 logged as linked sources.
→ CLM-001 to CLM-006 added from duty pack context.
→ Q-001, Q-002, Q-004, Q-005 opened; Q-003 resolved immediately.
→ OBS-001, OBS-003, OBS-004 added.`,
  },

  // e08: Social monitoring — real-time input at 04:49
  {
    id: 'e08',
    time: '04:49', day: 'Mon', lane: 'input',
    badgeLabel: 'SOCIAL SIGNAL',
    title: 'Social monitoring — station described as shut',
    summary: 'Three local posts describe the station as shut, which is inaccurate — side entrance is open and trains are running.',
    inputFrom: 'Comms Monitoring',
    linkedSource: 'SRC-008 · Social monitoring — inaccurate closure posts',
    sourceConfidence: 'medium',
    issueImpact: [
      'CLM-007 added: Some external commentary incorrectly described the station as fully shut.',
      'OBS-002 added: Issue is operationally modest but reputationally visible during the morning peak.',
    ],
    status: 'managed',
    relatedIds: ['out03', 'out04', 'out05'],
    fullRecord: `INCOMING UPDATE — SOCIAL SIGNAL (SRC-008)
Sender: Comms Monitoring
Channel: Social monitoring note
Occurred: Mon 04:48 · Added to Metis: Mon 04:49
Intake route: Direct to comms

SUMMARY
Three local posts describe the station as shut, which is inaccurate because side entrance is open and trains are running.

FULL TEXT
Social monitoring note

Approx. 3 local posts in 40 minutes describe Bramley Junction as 'shut' or 'closed'.
Example themes: 'can't get in', 'station closed again', 'no trains' (last is inaccurate).
No verified influencer amplification. Engagement modest.
Recommended: short corrective line emphasising trains running and side entrance open.

SOURCE RECORD
Code: SRC-008 · Tier: Social monitoring
Reliability: Medium (monitoring summary; paraphrased)

ISSUE RECORD IMPACT
→ CLM-007 added: Some external commentary incorrectly described the station as fully shut.
→ OBS-002 added: Issue is operationally modest but reputationally visible during the morning peak.`,
  },

  // e09: Press call — real-time input at 05:09
  {
    id: 'e09',
    time: '05:09', day: 'Mon', lane: 'input',
    badgeLabel: 'PRESS CALL',
    title: 'Press office call — reporter asks about reopening',
    summary: 'Local reporter asks whether planned works overran and whether passengers were locked out. 45-minute response window.',
    inputFrom: 'Press Office',
    linkedSource: 'SRC-009 · Press call log — local reporter',
    sourceConfidence: 'high',
    issueImpact: [],
    relatedIds: ['out04', 'out05'],
    fullRecord: `INCOMING UPDATE — PRESS CALL (SRC-009)
Sender: Press Office
Channel: Call log
Occurred: Mon 05:08 · Added to Metis: Mon 05:09
Intake route: Direct to comms

SUMMARY
Local reporter asks whether planned works overran and whether passengers were locked out.

FULL TEXT
Press call log

Reporter questions:
1) Did planned overnight works overrun?
2) Were passengers unable to enter the station?
3) When will the main entrance reopen?

Deadline: requested response within 45 minutes for online update.
No broadcast crew on site reported.

SOURCE RECORD
Code: SRC-009 · Tier: Media enquiry
Reliability: High (press office log)

ISSUE RECORD IMPACT
No direct impact on claims or questions at time of logging.
Holding press line (Output 4) drafted in response.`,
  },

  // e10: Station ops update — real-time at 05:24
  {
    id: 'e10',
    time: '05:24', day: 'Mon', lane: 'input',
    badgeLabel: 'STATION UPDATE',
    title: 'Passenger flow manageable',
    summary: 'Side entrance open, extra staff deployed, passenger flow manageable, no safety concerns reported.',
    inputFrom: 'Station Manager',
    linkedSource: 'SRC-010 · Station ops update — passenger flow',
    sourceConfidence: 'high',
    issueImpact: [
      'Q-002 resolved: Can the side entrance safely handle early morning passenger flow? — Confirmed manageable.',
    ],
    relatedIds: ['e15', 'out06'],
    fullRecord: `INCOMING UPDATE — STATION UPDATE (SRC-010)
Sender: Station Manager
Channel: Station ops update
Occurred: Mon 05:22 · Added to Metis: Mon 05:24
Intake route: Direct to comms (phone update)

SUMMARY
Side entrance open, extra staff deployed, passenger flow manageable, no safety concerns reported.

FULL TEXT
Station operational update

Side entrance open with additional staff and security.
Queue time under 3 minutes at time of report.
Main entrance remains closed pending facilities clearance.
No safety incidents. Customer team reports improving clarity with written line.

SOURCE RECORD
Code: SRC-010 · Tier: Internal operational source
Reliability: High (station manager)

ISSUE RECORD IMPACT
→ Q-002 resolved: Can the side entrance safely handle early morning passenger flow? — Confirmed manageable.`,
  },

  // e16: Executive request — real-time at 05:36
  {
    id: 'e16',
    time: '05:36', day: 'Mon', lane: 'input',
    badgeLabel: 'EXEC REQUEST',
    title: 'Executive office requests position note',
    summary: 'Regional director\'s office requests a short position note for morning leadership covering customer impact, media handling and expected reopening.',
    inputFrom: 'Executive Office',
    linkedSource: 'Email to corporate affairs duty',
    sourceConfidence: 'high',
    issueImpact: [],
    relatedIds: ['out05', 'out08'],
    fullRecord: `INCOMING UPDATE — EXEC REQUEST
Sender: Executive Office
Channel: Email to corporate affairs duty
Occurred: Mon 05:35 · Added to Metis: Mon 05:36
Intake route: Direct to comms

SUMMARY
Regional director's office requests a short position note for morning leadership covering customer impact, media handling and expected reopening.

FULL TEXT
Executive office request — position note

Please provide a short executive position note covering:
- what happened overnight and this morning at Bramley Junction
- customer impact and mitigations
- media/social handling and open risks
- expected main entrance reopening (if known)

Audience: regional leadership morning call.
Length: one page maximum.
Deadline: before 07:00 where possible.

ISSUE RECORD IMPACT
Executive brief V1 (Output 5) generated in response at 05:48.`,
  },

  // e11: Facilities inspection — real-time at 06:08
  {
    id: 'e11',
    time: '06:08', day: 'Mon', lane: 'input',
    badgeLabel: 'FACILITIES NOTE',
    title: 'Ceiling area safe after inspection',
    summary: 'Ceiling panels secure. Small roof drain repair needed later. Main entrance can reopen after clean-up and signage check.',
    inputFrom: 'Facilities Engineer',
    linkedSource: 'SRC-011 · Facilities inspection — ceiling secure',
    sourceConfidence: 'high',
    issueImpact: [
      'CLM-008 added: Ceiling panels in the main entrance area were later confirmed secure for passenger use.',
      'Q-001 resolved: Is the ceiling area safe for passenger use? — Confirmed safe.',
      'Status updated: Reopening expected shortly.',
    ],
    relatedIds: ['e15', 'e13', 'out06', 'out08'],
    fullRecord: `INCOMING UPDATE — FACILITIES NOTE (SRC-011)
Sender: Facilities Engineer
Channel: Inspection note (email to station manager, copied to comms)
Occurred: Mon 06:05 · Added to Metis: Mon 06:08
Intake route: Reconstructed from operational source

SUMMARY
Ceiling panels secure. Small roof drain repair needed later. Main entrance can reopen after clean-up and signage check.

FULL TEXT
Facilities inspection note — main entrance canopy

Inspection: ceiling panels secure for passenger use.
Minor staining consistent with historic drain seepage; no active water ingress observed.
Remedial roof drain repair scheduled non-urgent within 14 days.
Clearance: main entrance may reopen after contractor clean-up and signage check.

SOURCE RECORD
Code: SRC-011 · Tier: Internal operational source
Reliability: High (facilities engineer inspection)

ISSUE RECORD IMPACT
→ CLM-008 added: Ceiling panels confirmed secure for passenger use.
→ Q-001 resolved: Is the ceiling area safe for passenger use? — Confirmed safe.
→ Status updated: Reopening expected shortly.`,
  },

  // e12: Accessibility note — real-time at 06:54
  {
    id: 'e12',
    time: '06:54', day: 'Mon', lane: 'input',
    badgeLabel: 'ACCESSIBILITY NOTE',
    title: 'Step-free access remains available',
    summary: 'Step-free access available through side entrance, but temporary signage needs improvement.',
    inputFrom: 'Accessibility Lead',
    linkedSource: 'SRC-012 · Accessibility assessment — side entrance',
    sourceConfidence: 'medium',
    issueImpact: [
      'Q-006 opened: Are accessibility arrangements adequate while the main entrance is closed?',
      'OBS-005 added: Check accessibility separately, not assumed from general flow reports.',
    ],
    relatedIds: ['out07'],
    fullRecord: `INCOMING UPDATE — ACCESSIBILITY NOTE (SRC-012)
Sender: Accessibility Lead
Channel: Service accessibility update
Occurred: Mon 06:50 · Added to Metis: Mon 06:54
Intake route: Reconstructed from operational source

SUMMARY
Step-free access available through side entrance, but temporary signage needs improvement.

FULL TEXT
Accessibility assessment

Step-free route available via side entrance lift (operational).
Temporary signage not meeting usual contrast/position standards.
Recommendation: deploy high-visibility directional totems within 30 minutes.
No reported barriers for wheelchair users during observation window.

SOURCE RECORD
Code: SRC-012 · Tier: Internal operational source
Reliability: Medium–High (accessibility lead)

ISSUE RECORD IMPACT
→ Q-006 opened: Are accessibility arrangements adequate while the main entrance is closed?
→ OBS-005 added: Check accessibility separately, not assumed from general flow reports.`,
  },

  // e13: Reopening confirmation — real-time at 07:15
  {
    id: 'e13',
    time: '07:15', day: 'Mon', lane: 'input',
    badgeLabel: 'OPS CONFIRMATION',
    title: 'Main entrance reopened',
    summary: 'Main entrance reopened at 08:12. Side entrance remains available. Staff continue to monitor.',
    inputFrom: 'Station Manager',
    linkedSource: 'SRC-013 · Reopening confirmation — main entrance',
    sourceConfidence: 'high',
    issueImpact: [
      'CLM-009 added: The main entrance reopened at 08:12 following clean-up and signage checks.',
      'Q-005 resolved: What is the expected main entrance reopening time? — Reopened 08:12.',
      'Q-004 resolved: What public line should be used? — Reopening confirmed.',
      'Status updated: Operational disruption closed.',
    ],
    status: 'closed',
    relatedIds: ['e11', 'out08', 'out09'],
    fullRecord: `INCOMING UPDATE — OPS CONFIRMATION (SRC-013)
Sender: Station Manager
Channel: Reopening confirmation (call to comms)
Occurred: Mon 07:12 · Added to Metis: Mon 07:15
Intake route: Direct to comms

SUMMARY
Main entrance reopened at 08:12. Side entrance remains available. Staff continue to monitor.

FULL TEXT
Reopening confirmation

Main entrance opened 08:12 after clean-up and signage checks.
Side entrance remains open to avoid bottlenecks.
Passenger flow normalising. No further press queries in last 20 minutes.

SOURCE RECORD
Code: SRC-013 · Tier: Internal operational source
Reliability: High (station manager)

ISSUE RECORD IMPACT
→ CLM-009 added: The main entrance reopened at 08:12 following clean-up and signage checks.
→ Q-005 resolved: What is the expected main entrance reopening time? — Reopened 08:12.
→ Q-004 resolved: What public line should be used? — Reopening confirmed.
→ Status updated: Operational disruption closed.`,
  },

  // e14: Executive follow-up — real-time at 07:41
  {
    id: 'e14',
    time: '07:41', day: 'Mon', lane: 'input',
    badgeLabel: 'EXEC ACTION',
    title: 'Follow-up actions requested',
    summary: 'Request for short review of what happened, customer impact, media handling, and improvements for future planned works.',
    inputFrom: 'Regional Operations Director',
    linkedSource: 'Exec action note',
    sourceConfidence: 'high',
    issueImpact: [
      'Q-007 opened: What follow-up action is needed before future planned works?',
      'OBS-006 added: Future works handback focus — handback criteria, signage and pre-agreed messaging.',
      'Status updated: Review / audit stage.',
    ],
    relatedIds: ['out09', 'out10'],
    fullRecord: `INCOMING UPDATE — EXEC ACTION
Sender: Regional Operations Director
Channel: Exec action note
Occurred: Mon 07:40 · Added to Metis: Mon 07:41
Intake route: Direct to comms

SUMMARY
Request short review of what happened, customer impact, media handling, and improvements for future planned works.

FULL TEXT
Executive follow-up request

Please provide a short post-incident review covering:
- timeline of handback and comms decisions
- customer impact assessment
- media/social handling
- lessons for future planned works handback criteria

Target: draft to regional leadership within 2 working days.

ISSUE RECORD IMPACT
→ Q-007 opened: What follow-up action is needed before future planned works?
→ OBS-006 added: Future works handback focus.
→ Status updated: Review / audit stage.`,
  },

  // ── ISSUE RECORD ──────────────────────────────────────────────────────────

  // iss01: Workspace created at 04:42
  {
    id: 'iss01',
    time: '04:42', day: 'Mon', lane: 'issue',
    badgeLabel: 'WORKSPACE',
    title: 'Issue workspace created',
    summary: 'Comms engaged at 04:42. Issue record opened: "Bramley Junction: main entrance reopening delay". Overnight operational logs to be reconstructed as sources.',
    relatedIds: ['e15', 'iss_batch', 'out01'],
    fullRecord: `ISSUE RECORD — WORKSPACE
Created: Mon 04:42
Owner: Duty Station Support
Audience: Station operations, customer service, corporate affairs, regional leadership

ISSUE TITLE
Bramley Junction: main entrance reopening delay

ISSUE TYPE: Planned works handback delay
SEVERITY: Important · PRIORITY: High
STATUS AT CREATION: Active

CONTEXT
Comms engaged after duty manager phone briefing at 04:42.
Overnight operational events handled by station, contractor, security and NOC channels.
Corporate affairs asked to open Metis issue and reconstruct overnight logs as sources.

CONFIRMED FACTS (at opening)
- Planned overnight works scheduled with 05:30 handback target.
- Main entrance opening delayed pending ceiling panel inspection.
- Station remained open via side entrance with additional staffing.
- Train services continued to call (NOC confirmed).`,
  },

  // iss_batch: Issue record populated from duty pack at 04:50
  {
    id: 'iss_batch',
    time: '04:50', day: 'Mon', lane: 'issue',
    badgeLabel: 'RECORD POPULATED',
    title: 'Issue record populated from duty pack',
    summary: '6 claims added, 5 open questions logged (Q-003 resolved immediately). Based on SRC-001 to SRC-007 from the duty overnight pack.',
    relatedIds: ['e_intake', 'e15', 'iss01', 'out01', 'out02'],
    fullRecord: `ISSUE RECORD — POPULATED FROM DUTY PACK
Updated: Mon 04:50

CLAIMS ADDED

CLM-001 [Confirmed]
Planned overnight works were scheduled at Bramley Junction with expected handback before the morning peak.
Sources: SRC-001

CLM-002 [Confirmed]
Most planned works were completed as expected overnight.
Sources: SRC-002, SRC-003

CLM-003 [Confirmed]
Main entrance opening was delayed pending final inspection of ceiling panels near the main entrance.
Note: Pending sign-off was precautionary; not reported as confirmed structural failure.
Sources: SRC-003, SRC-004

CLM-004 [Confirmed]
The station remained open via the side entrance while the main entrance was unavailable.
Sources: SRC-004, SRC-010

CLM-005 [Confirmed]
Train services continued to call at Bramley Junction with no planned service changes.
Sources: SRC-006, SRC-001

CLM-006 [Confirmed]
Passenger impact was limited but visible at the main entrance during the early morning peak.
Sources: SRC-007

OPEN QUESTIONS LOGGED

Q-001 [Critical] — Is the ceiling area safe for passenger use?
Why it matters: Reopening the main entrance without confirmation could create safety and reputational risk.
Stakeholder: Station operations / Facilities

Q-002 [Important] — Can the side entrance safely handle early morning passenger flow?
Why it matters: Passenger safety and queue management depend on a viable alternate route.
Stakeholder: Station manager / Security

Q-003 [Important] → RESOLVED immediately
Are train services affected?
Resolved by: SRC-006 (NOC confirmation trains calling)

Q-004 [Important] — What public line should be used if asked whether the station is shut?
Why it matters: Social posts and passenger confusion create reputational risk.
Stakeholder: Corporate Affairs

Q-005 [Important] — What is the expected main entrance reopening time?
Why it matters: Press and passenger messaging need a realistic time window.
Stakeholder: Station operations

SOURCES LINKED TO CLAIMS

SRC-001 → CLM-001, CLM-005 · Planned works notice
SRC-002 → CLM-002 · Contractor mobilisation update
SRC-003 → CLM-002, CLM-003 · Handback note — ceiling panels
SRC-004 → CLM-003, CLM-004 · Station manager escalation
SRC-005 → (supports CLM-004) · Security update
SRC-006 → CLM-005 · NOC confirmation
SRC-007 → CLM-006 · Customer service floor report`,
  },

  // iss05: Social inaccuracy claim — real-time at 04:49
  {
    id: 'iss05',
    time: '04:49', day: 'Mon', lane: 'issue',
    badgeLabel: 'CLAIM ADDED',
    title: 'Social inaccuracy claim added',
    summary: 'CLM-007 added: Some external commentary incorrectly described the station as fully shut. Source: social monitoring note (SRC-008).',
    relatedIds: ['e08', 'out03', 'iss_batch'],
    fullRecord: `ISSUE RECORD — CLAIM ADDED
Added: Mon 04:49

CLM-007 [Confirmed]
Some external commentary incorrectly described the station as fully shut.
Sources: SRC-008 (Social monitoring — inaccurate closure posts)

LINKED OBSERVATION
OBS-002: Issue is operationally modest but reputationally visible during the morning peak.
Author: Duty Comms Manager (Corporate Affairs)

COMMS IMPLICATION
Short corrective line needed distinguishing main entrance closure from whole-station closure.
Social response line (Output 3) drafted in response.`,
  },

  // iss06: Q-002 resolved at 05:24
  {
    id: 'iss06',
    time: '05:24', day: 'Mon', lane: 'issue',
    badgeLabel: 'Q RESOLVED',
    title: 'Q-002 resolved: side entrance flow confirmed',
    summary: 'Q-002 closed with evidence from station ops update (SRC-010). Side entrance can safely handle early morning passenger flow.',
    relatedIds: ['e10', 'iss_batch', 'out02'],
    fullRecord: `ISSUE RECORD — QUESTION RESOLVED
Resolved: Mon 05:24

Q-002 [Important] → RESOLVED
Can the side entrance safely handle early morning passenger flow?

Resolution evidence: SRC-010 (Station ops update — Mon 05:22)
"Side entrance open with additional staff and security. Queue time under 3 minutes at time of report."

Linked claim confirmed: CLM-004 — The station remained open via the side entrance.

REMAINING OPEN QUESTIONS AT THIS POINT
Q-001: Is the ceiling area safe for passenger use? [Critical — open]
Q-004: What public line should be used? [Important — open]
Q-005: What is the expected main entrance reopening time? [Important — open]`,
  },

  // iss07: Q-001 resolved at 06:08
  {
    id: 'iss07',
    time: '06:08', day: 'Mon', lane: 'issue',
    badgeLabel: 'Q RESOLVED',
    title: 'Q-001 resolved: ceiling confirmed safe',
    summary: 'Q-001 closed with evidence from facilities inspection (SRC-011). Ceiling panels confirmed secure for passenger use. Status updated: Reopening expected shortly.',
    relatedIds: ['e11', 'iss_batch', 'out06'],
    fullRecord: `ISSUE RECORD — QUESTION RESOLVED
Resolved: Mon 06:08

Q-001 [Critical] → RESOLVED
Is the ceiling area safe for passenger use?

Resolution evidence: SRC-011 (Facilities inspection note — Mon 06:05)
"Ceiling panels secure for passenger use. Minor staining consistent with historic drain seepage; no active water ingress observed."

CLM-008 added: Ceiling panels in the main entrance area were later confirmed secure for passenger use.
Remedial roof drain repair scheduled non-urgent within 14 days.

STATUS UPDATE
Issue status moved to: Reopening expected shortly (Mon 06:12)`,
  },

  // iss08: Disruption closed at 07:15
  {
    id: 'iss08',
    time: '07:15', day: 'Mon', lane: 'issue',
    badgeLabel: 'STATUS UPDATE',
    title: 'Operational disruption closed',
    summary: 'Main entrance reopened 08:12 confirmed. CLM-009 added. Q-005 and Q-004 resolved. Status updated: Operational disruption closed.',
    relatedIds: ['e13', 'out08', 'out09'],
    fullRecord: `ISSUE RECORD — STATUS UPDATE
Updated: Mon 07:15

MAIN ENTRANCE REOPENED
Confirmed by: SRC-013 (Station manager reopening confirmation — Mon 07:12)
"Main entrance opened 08:12 after clean-up and signage checks."

CLM-009 [Confirmed] added:
The main entrance reopened at 08:12 following clean-up and signage checks.

QUESTIONS RESOLVED
Q-005 resolved: What is the expected main entrance reopening time? → Reopened 08:12.
Q-004 resolved: What public line should be used? → Reopening confirmed.

REMAINING OPEN QUESTIONS
Q-006: Are accessibility arrangements adequate? [Open — action in progress]
Q-007: What follow-up action is needed for future planned works? [Open]

STATUS UPDATE
Issue status moved to: Operational disruption closed (Mon 07:12)`,
  },

  // iss09: Review stage at 07:41
  {
    id: 'iss09',
    time: '07:41', day: 'Mon', lane: 'issue',
    badgeLabel: 'REVIEW STAGE',
    title: 'Review and audit stage',
    summary: 'Q-007 opened: follow-up actions for future planned works. OBS-006 added. Status updated: Review / audit stage.',
    relatedIds: ['e14', 'out09', 'out10'],
    fullRecord: `ISSUE RECORD — REVIEW STAGE
Updated: Mon 07:41

Q-007 [Watch] opened:
What follow-up action is needed before future planned works?
Prompt: What handback criteria, signage and pre-agreed passenger messaging should be updated?
Stakeholder: Regional operations / Corporate Affairs

OBS-006 added:
Later review should focus on handback criteria, temporary signage and pre-agreed passenger messaging for planned works.
Author: Regional Operations Director

STATUS UPDATE
Issue status moved to: Review / audit stage (Mon 08:00)

OPEN QUESTIONS REMAINING
Q-006: Are accessibility arrangements adequate? [Open]
Q-007: What follow-up action is needed? [Open]`,
  },

  // ── METIS OUTPUTS ─────────────────────────────────────────────────────────

  {
    id: 'out01',
    time: '04:54', day: 'Mon', lane: 'output',
    badgeLabel: 'STAFF',
    title: 'Staff holding update',
    summary: 'Internal message for station staff: what is known, what to say, what not to speculate on.',
    outputAudience: 'Station staff and customer service',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    doNotSay: [
      'Do not say the station is closed.',
      'Do not confirm a structural failure or active roof leak.',
      'Do not give a main entrance reopening time yet.',
    ],
    relatedIds: ['e15', 'iss_batch', 'iss01'],
    fullRecord: `METIS OUTPUT — STAFF HOLDING UPDATE
Generated: Mon 04:54 · Status: Ready for review · Version: 1
Audience: Station staff and customer service
Template: internal_staff_update
Based on Metis record snapshot: Mon 04:54

CONTENT
Staff holding update — Bramley Junction (internal)

What we know
- Overnight planned works ran on concourse lighting, ticket gates and wayfinding.
- Main entrance remains closed pending final checks after contractor handback note.
- Side entrance is in use / being prepared with additional staff and security.
- Trains continue to call; no NOC service change.

Tell passengers
- The station is open via the side entrance.
- Trains are running as normal.
- The main entrance is temporarily unavailable while final checks complete after improvement works.

Do not speculate on
- Roof leaks, structural failure, or a confirmed safety defect (not confirmed).
- A time for main entrance reopening until facilities confirms.

Escalation
- Station manager → duty manager → corporate affairs duty for press/social lines.

DO NOT SAY
- Do not say the station is closed.
- Do not confirm a structural failure or active roof leak.
- Do not give a main entrance reopening time yet.

OPEN QUESTIONS AT GENERATION
Q-001: Is the ceiling area safe for passenger use?
Q-002: Can the side entrance safely handle early morning passenger flow?
Q-004: What public line should be used if asked whether the station is shut?
Q-005: What is the expected main entrance reopening time?

SOURCES USED
SRC-001, SRC-003, SRC-004, SRC-006`,
  },

  {
    id: 'out02',
    time: '04:58', day: 'Mon', lane: 'output',
    badgeLabel: 'PASSENGER',
    title: 'Passenger message draft',
    summary: 'Station announcement and website/app update: main entrance delayed, use side entrance, trains running.',
    outputAudience: 'Passengers',
    outputStatus: 'Approved',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    doNotSay: [
      'Do not imply train cancellations.',
    ],
    relatedIds: ['e15', 'out06'],
    fullRecord: `METIS OUTPUT — PASSENGER MESSAGE
Generated: Mon 04:58 · Status: Approved · Version: 1
Audience: Passengers
Template: external_customer_resident_student
Based on Metis record snapshot: Mon 04:58
Superseded by: Updated passenger message (Output 6, Mon 06:22)

CONTENT
Bramley Junction station is open via the side entrance. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. Trains are running as normal. Staff are on site to help direct passengers.

DO NOT SAY
- Do not imply train cancellations.

OPEN QUESTIONS AT GENERATION
Q-001: Is the ceiling area safe for passenger use?
Q-002: Can the side entrance safely handle early morning passenger flow?
Q-004: What public line should be used if asked whether the station is shut?
Q-005: What is the expected main entrance reopening time?

SOURCES USED
SRC-004, SRC-006`,
  },

  {
    id: 'out03',
    time: '04:52', day: 'Mon', lane: 'output',
    badgeLabel: 'SOCIAL',
    title: 'Social response line',
    summary: 'Approved response: station open via side entrance, trains running, main entrance inspection underway.',
    outputAudience: 'Social media replies',
    outputStatus: 'Approved',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-004: What public line should be used if asked whether the station is shut?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [],
    doNotSay: [
      'Do not engage with speculation about structural issues.',
    ],
    relatedIds: ['e08', 'iss05'],
    fullRecord: `METIS OUTPUT — SOCIAL RESPONSE LINE
Generated: Mon 04:52 · Status: Approved · Version: 1
Audience: Social media replies
Template: external_customer_resident_student
Based on Metis record snapshot: Mon 04:52

CONTENT
Thanks for flagging this. Bramley Junction is open via the side entrance and trains are running as normal. The main entrance is temporarily closed while we complete final checks after overnight improvement works. We will update when the main entrance reopens.

DO NOT SAY
- Do not engage with speculation about structural issues.

OPEN QUESTIONS AT GENERATION
Q-001: Is the ceiling area safe for passenger use?
Q-002: Can the side entrance safely handle early morning passenger flow?
Q-004: What public line should be used if asked whether the station is shut?
Q-005: What is the expected main entrance reopening time?

SOURCES USED
SRC-008, SRC-006, SRC-004`,
  },

  {
    id: 'out04',
    time: '05:18', day: 'Mon', lane: 'output',
    badgeLabel: 'PRESS LINE',
    title: 'Holding press line',
    summary: 'Press line: planned works took place, main entrance delayed for final inspection, station accessible.',
    outputAudience: 'Local media',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-002: Can the side entrance safely handle early morning passenger flow?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [
      'Facilities inspection not yet complete — do not confirm ceiling safety or reopening time.',
      'Main entrance still closed at time of generation.',
    ],
    doNotSay: [
      'That the station is closed.',
      'That trains are cancelled or diverted.',
      'That there is a confirmed structural failure or active leak.',
      'A precise reopening time until station/facilities confirm.',
    ],
    relatedIds: ['e09', 'e15', 'out05'],
    fullRecord: `METIS OUTPUT — HOLDING PRESS LINE
Generated: Mon 05:18 · Status: Ready for review · Version: 1
Audience: Local media
Template: media_holding_line
Based on Metis record snapshot: Mon 05:18

CONTENT
Suggested line
Bramley Junction remains open via the side entrance and trains are running as normal.
The main entrance is temporarily unavailable while we complete final checks following overnight improvement works.
We expect to reopen the main entrance once inspections and clean-up are complete.

DO NOT SAY
- That the station is closed.
- That trains are cancelled or diverted (not the case).
- That there is a confirmed structural failure or active leak (not confirmed).
- A precise reopening time until station/facilities confirm.

CAVEATS AT GENERATION
- Facilities inspection not yet complete — do not confirm ceiling safety or reopening time.
- Main entrance still closed at time of generation.

OPEN QUESTIONS AT GENERATION
Q-001: Is the ceiling area safe for passenger use?
Q-002: Can the side entrance safely handle early morning passenger flow?
Q-005: What is the expected main entrance reopening time?

BASED ON
SRC-003, SRC-004 (station manager and contractor handback notes)
SRC-006 (NOC confirmation trains calling)
SRC-007, SRC-008 (customer and social monitoring on passenger confusion)`,
  },

  {
    id: 'out05',
    time: '05:48', day: 'Mon', lane: 'output',
    badgeLabel: 'BRIEF V1',
    title: 'Executive brief V1',
    summary: 'What happened, customer impact, media risk, current position and next decision points for senior leadership.',
    outputAudience: 'Senior leadership',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-001: Is the ceiling area safe for passenger use?',
      'Q-005: What is the expected main entrance reopening time?',
    ],
    caveatsAtGeneration: [
      'Based on Metis records as of 05:48 only — excludes facilities clearance and reopening logged later.',
      'Overnight operational context known only from duty manager summary received at 04:42.',
      'Q-001 ceiling safety and Q-005 reopening time still open at generation.',
    ],
    doNotSay: [
      'Do not state main entrance has reopened.',
      'Do not state facilities have cleared ceiling.',
    ],
    relatedIds: ['e16', 'e15', 'e08', 'e09', 'out08'],
    fullRecord: `METIS OUTPUT — EXECUTIVE BRIEF V1
Generated: Mon 05:48 · Status: Ready for review · Version: 1
Audience: Senior leadership
Based on Metis record snapshot: Mon 05:48
Superseded by: Executive brief V2 (Output 8, Mon 07:28)

CONTENT
Current position
- Main entrance delayed after overnight planned works handback.
- Station open via side entrance; trains running.
- Comms engaged from 04:42; overnight operational context known from duty manager summary.
- Social monitoring (04:49) and press enquiry (05:09) drove external messaging; executive office requested this note at 05:36.

What happened (from reconstructed sources — not live overnight comms feeds)
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
- Local reporter deadline following 05:09 press call; holding line drafted after enquiry.

Open questions
- Ceiling area safety confirmation.
- Expected main entrance reopening time.

Next actions
- Maintain side entrance flow; staff and passenger lines in use.
- Respond to press within window using holding line.
- Await facilities inspection outcome before committing reopening time.

CAVEATS AT GENERATION
- Based only on records in Metis as of 05:48; facilities clearance and reopening not yet logged.
- No confirmed safety failure reported; ceiling issue is precautionary pending inspection.
- Do not state station is closed or trains affected.

DO NOT SAY
- Do not state main entrance has reopened.
- Do not state facilities have cleared ceiling.`,
  },

  {
    id: 'out06',
    time: '06:22', day: 'Mon', lane: 'output',
    badgeLabel: 'PASSENGER',
    title: 'Updated passenger message',
    summary: 'Main entrance expected to reopen around 08:00. Side entrance remains open.',
    outputAudience: 'Passengers',
    outputStatus: 'Approved',
    outputVersion: 2,
    openQuestionsAtGeneration: [
      'Q-005: What is the expected main entrance reopening time? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Expected reopening around 08:00 — subject to final confirmation; not yet open at time of generation.',
    ],
    doNotSay: [
      'Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet).',
    ],
    relatedIds: ['e11', 'out02', 'out07'],
    fullRecord: `METIS OUTPUT — UPDATED PASSENGER MESSAGE
Generated: Mon 06:22 · Status: Approved · Version: 2
Audience: Passengers
Template: external_customer_resident_student
Based on Metis record snapshot: Mon 06:22

Supersedes: Passenger message draft (Output 2, Mon 04:58)

CONTENT
Bramley Junction station remains open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while we complete final checks after overnight improvement works. We expect the main entrance to reopen around 08:00 following inspection and clean-up, subject to final confirmation. Staff are on site to help direct passengers.

DO NOT SAY
- Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet).

CAVEATS AT GENERATION
- Expected reopening around 08:00 — subject to final confirmation; not yet open at time of generation.

OPEN QUESTIONS AT GENERATION
Q-005: What is the expected main entrance reopening time? (partially answered)

SOURCES USED
SRC-011, SRC-004, SRC-006`,
  },

  {
    id: 'out07',
    time: '06:38', day: 'Mon', lane: 'output',
    badgeLabel: 'STAKEHOLDER',
    title: 'Councillor and stakeholder note',
    summary: 'Short note for local authority, accessibility group and transport stakeholders.',
    outputAudience: 'Local authority / accessibility / transport stakeholders',
    outputStatus: 'Ready for review',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-005: What is the expected main entrance reopening time? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Accessibility formal assessment not yet in Metis at generation — wording treats accessibility as being checked.',
    ],
    doNotSay: [],
    relatedIds: ['e12', 'e11', 'out06', 'out08'],
    fullRecord: `METIS OUTPUT — STAKEHOLDER NOTE
Generated: Mon 06:38 · Status: Ready for review · Version: 1
Audience: Local authority / accessibility / transport stakeholders
Template: external_customer_resident_student
Based on Metis record snapshot: Mon 06:38

CONTENT
Summary
- Overnight planned works completed with minor handback delay at main entrance only.
- Station remained open via side entrance; trains unaffected.
- Facilities have cleared the ceiling area for reopening; main entrance expected to reopen around 08:00 following final checks.

Accessibility
- Step-free access is understood to be available via the side entrance lift based on station operational reports.
- A formal accessibility check on temporary signage and wayfinding is in progress (Q-006) — do not state the assessment is complete.

Mitigations
- Additional staff and security at side entrance.
- Corrective passenger and social lines deployed.

Next steps
- Confirm main entrance reopening once station/facilities sign off.
- Complete accessibility signage review and post-incident learning note.

CAVEATS AT GENERATION
- Accessibility formal assessment not yet in Metis at generation.

OPEN QUESTIONS AT GENERATION
Q-005: What is the expected main entrance reopening time? (partially answered)

SOURCES USED
SRC-011, SRC-010, SRC-004, SRC-009`,
  },

  {
    id: 'out08',
    time: '07:28', day: 'Mon', lane: 'output',
    badgeLabel: 'BRIEF V2',
    title: 'Executive brief V2',
    summary: 'Confirmed reopening, final impact, media position and recommended follow-up for senior leadership.',
    outputAudience: 'Senior leadership',
    outputStatus: 'Approved',
    outputVersion: 2,
    openQuestionsAtGeneration: [
      'Q-006: Are accessibility arrangements adequate while the main entrance is closed?',
    ],
    caveatsAtGeneration: [],
    doNotSay: [],
    relatedIds: ['e13', 'e11', 'out05', 'out09'],
    fullRecord: `METIS OUTPUT — EXECUTIVE BRIEF V2
Generated: Mon 07:28 · Status: Approved · Version: 2
Audience: Senior leadership
Based on Metis record snapshot: Mon 07:28
Supersedes: Executive brief V1 (Output 5, Mon 05:48)

CONTENT
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
- Confirm circulation audit for governance record.

OPEN QUESTIONS AT GENERATION
Q-006: Are accessibility arrangements adequate while the main entrance is closed?

SOURCES USED
SRC-011, SRC-013, SRC-010, SRC-008`,
  },

  {
    id: 'out09',
    time: '07:45', day: 'Mon', lane: 'output',
    badgeLabel: 'REVIEW',
    title: 'Post-incident review note',
    summary: 'What happened, what worked, what caused confusion, recommended actions for future planned works.',
    outputAudience: 'Operations and comms leadership',
    outputStatus: 'Draft',
    outputVersion: 1,
    openQuestionsAtGeneration: [
      'Q-006: Are accessibility arrangements adequate while the main entrance is closed?',
      'Q-007: What follow-up action is needed before future planned works?',
    ],
    caveatsAtGeneration: [],
    doNotSay: [],
    relatedIds: ['e14', 'out08', 'out10', 'iss09'],
    fullRecord: `METIS OUTPUT — POST-INCIDENT REVIEW NOTE
Generated: Mon 07:45 · Status: Draft · Version: 1
Audience: Operations and comms leadership
Based on Metis record snapshot: Mon 07:45

CONTENT
Summary
- Overnight planned works largely succeeded; main entrance handback delayed by ceiling panel sign-off and inspection.
- Station remained open via side entrance; trains unaffected.
- Reputation risk driven by 'station shut' confusion rather than service cancellation.

Timeline
- See linked incoming updates and outputs 04:42–08:12.

What worked
- Early NOC confirmation on trains.
- Side entrance opening with security support.
- Rapid passenger/social corrective lines.

What caused confusion
- Main entrance closure visible to passengers without clear alternate routing signage.
- Social posts conflating entrance closure with whole-station closure.

Recommended actions
1. Pre-agree passenger messaging pack for planned works handback delays.
2. Temporary signage standard for side-entrance-only access.
3. Handback checklist requiring facilities sign-off before public reopening target.

Owners
- Station operations (handback criteria).
- Corporate affairs (messaging pack).
- Accessibility lead (signage standard).

OPEN QUESTIONS AT GENERATION
Q-006: Are accessibility arrangements adequate while the main entrance is closed?
Q-007: What follow-up action is needed before future planned works?`,
  },

  {
    id: 'out10',
    time: '08:00', day: 'Mon', lane: 'output',
    badgeLabel: 'AUDIT',
    title: 'Circulation audit',
    summary: 'Governance record: who received each output, when, and what record state each was based on.',
    outputAudience: 'Governance record',
    outputStatus: 'Approved',
    openQuestionsAtGeneration: [],
    caveatsAtGeneration: [],
    doNotSay: [],
    relatedIds: ['out01', 'out02', 'out03', 'out04', 'out05', 'out08', 'out09'],
    fullRecord: `METIS OUTPUT — CIRCULATION AUDIT
Generated: Mon 08:00 · Status: Approved
Audience: Governance record
Based on Metis record snapshot: Mon 08:00

CONTENT
Comms engagement
- 04:42 Duty manager briefing to corporate affairs; Metis issue opened.
- 04:50–04:53 Overnight operational logs reconstructed as sources (not live overnight comms channels).

Outputs circulated / coordinated
- 04:52 Social response line — after social monitoring note (approved).
- 04:54 Staff holding update — station staff & customer service (after comms engagement).
- 04:58 Passenger message — digital/PA (approved for use).
- 05:18 Holding press line — after 05:09 press enquiry (approved for reporter window).
- 05:48 Executive brief V1 — after 05:36 executive request.
- 06:22 Updated passenger message — digital/PA.
- 06:38 Stakeholder note — local authority & accessibility contacts.
- 07:28 Executive brief V2 — senior leadership (supersedes V1 for position).
- 07:45 Post-incident review note — operations & comms leadership (draft).

Audit posture
- All lines tied to sources recorded in Metis issue record.
- V2 executive brief reflects reopening confirmation and facilities clearance.`,
  },
];

