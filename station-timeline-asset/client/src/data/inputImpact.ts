// Resolved per-input metisImpact map keyed by input title
export const INPUT_IMPACT: Record<string, {
  fullText: string;
  metisImpact: {
    statusNote?: string;
    linkedSource?: { code: string; title: string };
    claimsAdded: { code: string; text: string }[];
    questionsOpened: { code: string; title: string }[];
    questionsClosed: { code: string; title: string }[];
    observationsAdded: { code: string; title: string }[];
  };
}> = {
  'Duty manager summary to comms': {
    fullText: 'Duty manager → corporate affairs duty phone briefing\n\nSituation: planned overnight works largely complete but main entrance remains closed pending ceiling panel sign-off.\nStation is operating via side entrance with extra staff/security being deployed.\nNOC confirms trains calling — no service change.\nCustomer team reports growing confusion at main doors; no major crowding yet.\nNo confirmed safety failure; facilities inspection still required before main entrance reopening.\n\nReported overnight sequence (described in this briefing, not live comms channels):\n- Sun 20:00 — planned works notice issued for concourse lighting, gates and wayfinding; 05:30 handback target.\n- Sun 21:15 — contractor mobilised on site.\n- Mon 04:28 — contractor handback note: ceiling panel sign-off pending near main entrance (possible roof drain residue; not confirmed active leak).\n- Mon 04:35 — station manager: main entrance unlikely at 05:30; side entrance proposed with extra staffing from 05:45.\n- Mon 04:50 — security: barriers and two additional officers available from 05:45.\n- Mon 04:55 — NOC: trains continue to call; no service change.\n- Mon 05:32 — customer service: passengers asking at help point; low crowding at side entrance.\n\nAsk of comms:\n- Open controlled issue record in Metis and log the duty overnight pack as source-backed records.\n- Prepare staff and passenger lines distinguishing main entrance closure vs whole-station closure.\n- Stand by for possible social/media attention during the morning peak.',
    metisImpact: {
      statusNote: 'Active issue opened — comms engaged',
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Duty overnight pack logged in Metis': {
    fullText: 'Corporate Affairs — duty overnight pack logged\n\nLogged from duty manager phone briefing at 05:42. Transcribed items from the overnight sequence:\n\nPlanned works notice (reported Sun 20:00)\nOvernight concourse lighting, ticket gate and wayfinding; 05:30 handback target; no planned train disruption.\n\nContractor mobilisation (reported Sun 21:15)\nTeam on site; works commenced.\n\nContractor handback note (reported Mon 04:28)\nThe contractor has held back sign-off on the ceiling panels near the main entrance after noting staining or residue that may relate to a roof drain. This has not been confirmed as an active leak or structural issue.\n\nStation manager escalation (reported Mon 04:35)\nMain entrance unlikely at 05:30; side entrance proposed with extra staffing from 05:45 if security confirms.\n\nSecurity update (reported Mon 04:50)\nAdditional officers and barriers available from 05:45.\n\nNOC confirmation (reported Mon 04:55)\nTrains continue to call; no service change.\n\nCustomer service floor report (reported Mon 05:32)\nPassengers confused at main doors; low crowding at the side entrance.',
    metisImpact: {
      claimsAdded: [
        { code: 'CLM-001', text: 'Planned overnight works were scheduled at Bramley Junction with expected handback before the morning peak.' },
        { code: 'CLM-002', text: 'Most planned works were completed as expected overnight.' },
        { code: 'CLM-003', text: 'Main entrance opening was delayed pending final inspection of ceiling panels near the main entrance.' },
        { code: 'CLM-004', text: 'The station remained open via the side entrance while the main entrance was unavailable.' },
        { code: 'CLM-005', text: 'Train services continued to call at Bramley Junction with no planned service changes.' },
        { code: 'CLM-006', text: 'Passenger impact was limited but visible at the main entrance during the early morning peak.' },
      ],
      questionsOpened: [
        { code: 'Q-001', title: 'Is the ceiling area safe for passenger use?' },
        { code: 'Q-005', title: 'What is the expected main entrance reopening time?' },
        { code: 'Q-002', title: 'Can the side entrance safely handle early morning passenger flow?' },
        { code: 'Q-004', title: 'What public line should be used if asked whether the station is shut?' },
      ],
      questionsClosed: [
        { code: 'Q-003', title: 'Are train services affected?' },
      ],
      observationsAdded: [
        { code: 'OBS-001', title: 'Main entrance vs whole station confusion' },
        { code: 'OBS-003', title: 'Avoid speculation on roof drainage' },
        { code: 'OBS-004', title: 'Lead with what remains available' },
      ],
    },
  },
  'Social monitoring — local posts say station is shut': {
    fullText: 'Social monitoring note (paraphrased, fictional)\n\nApprox. 03 local posts in 40 minutes describe Bramley Junction as \'shut\' or \'closed\'.\nExample themes: \'can\'t get in\', \'station closed again\', \'no trains\' (last is inaccurate).\nNo verified influencer amplification. Engagement modest.\nRecommended: short corrective line emphasising trains running and side entrance open.',
    metisImpact: {
      statusNote: 'Managed operational disruption',
      linkedSource: { code: 'SRC-008', title: 'Social monitoring — inaccurate closure posts' },
      claimsAdded: [
        { code: 'CLM-007', text: 'Some external commentary incorrectly described the station as fully shut.' },
      ],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-002', title: 'Reputationally visible despite modest operational impact' },
      ],
    },
  },
  'Press office call log — reporter asks about reopening': {
    fullText: 'Press call log — fictional local outlet\n\nReporter questions:\n1) Did planned overnight works overrun?\n2) Were passengers unable to enter the station?\n3) When will the main entrance reopen?\n\nDeadline: requested response within 45 minutes for online update.\nNo broadcast crew on site reported.',
    metisImpact: {
      linkedSource: { code: 'SRC-009', title: 'Press call log — local reporter' },
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Executive office request for short position note': {
    fullText: 'Executive office request — position note\n\nPlease provide a short executive position note covering:\n- what happened overnight and this morning at Bramley Junction\n- customer impact and mitigations\n- media/social handling and open risks\n- expected main entrance reopening (if known)\n\nAudience: regional leadership morning call.\nLength: one page maximum.\nDeadline: before 07:00 where possible.',
    metisImpact: {
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Station manager update — passenger flow manageable': {
    fullText: 'Station manager phone update to corporate affairs\n\nReported event time: 06:22 (station ops update).\nReceived by comms: 06:20 following press enquiry coordination.\n\nSide entrance open with additional staff and security.\nQueue time under 3 minutes at time of report.\nMain entrance remains closed pending facilities clearance.\nNo safety incidents. Customer team reports improving clarity with written line.',
    metisImpact: {
      linkedSource: { code: 'SRC-010', title: 'Station update — passenger flow' },
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-002', title: 'Can the side entrance safely handle early morning passenger flow?' },
      ],
      observationsAdded: [],
    },
  },
  'Facilities inspection summary forwarded to comms': {
    fullText: 'Facilities inspection note — main entrance canopy\n\nReported event time: inspection completed ~07:05.\nForwarded to comms: 07:06 via station manager email.\n\nCeiling panels secure for passenger use.\nMinor staining consistent with historic drain seepage; no active water ingress observed.\nRemedial roof drain repair scheduled non-urgent within 14 days.\nClearance: main entrance may reopen after contractor clean-up and signage check.',
    metisImpact: {
      statusNote: 'Reopening expected shortly',
      linkedSource: { code: 'SRC-011', title: 'Facilities inspection — ceiling secure' },
      claimsAdded: [
        { code: 'CLM-008', text: 'Ceiling panels in the main entrance area were later confirmed secure for passenger use.' },
      ],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-001', title: 'Is the ceiling area safe for passenger use?' },
      ],
      observationsAdded: [],
    },
  },
  'Accessibility assessment forwarded to comms': {
    fullText: 'Accessibility assessment\n\nReported event time: 07:50 observation window.\nReceived by comms: 07:52.\n\nStep-free route available via side entrance lift (operational).\nTemporary signage not meeting usual contrast/position standards.\nRecommendation: deploy high-visibility directional totems within 30 minutes.\nNo reported barriers for wheelchair users during observation window.',
    metisImpact: {
      linkedSource: { code: 'SRC-012', title: 'Accessibility assessment — side entrance' },
      claimsAdded: [],
      questionsOpened: [
        { code: 'Q-006', title: 'Are accessibility arrangements adequate while the main entrance is closed?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-005', title: 'Check accessibility separately' },
      ],
    },
  },
  'Station manager confirmation — main entrance reopened': {
    fullText: 'Reopening confirmation — station manager to comms\n\nReported event time: main entrance opened 08:12.\nReceived by comms: 08:13 phone confirmation.\n\nMain entrance opened after clean-up and signage checks.\nSide entrance remains open to avoid bottlenecks.\nPassenger flow normalising. No further press queries in last 20 minutes.',
    metisImpact: {
      statusNote: 'Operational disruption closed',
      linkedSource: { code: 'SRC-013', title: 'Reopening confirmation — main entrance' },
      claimsAdded: [
        { code: 'CLM-009', text: 'The main entrance reopened at 08:12 following clean-up and signage checks.' },
      ],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-005', title: 'What is the expected main entrance reopening time?' },
        { code: 'Q-004', title: 'What public line should be used if asked whether the station is shut?' },
      ],
      observationsAdded: [],
    },
  },
  'Follow-up actions requested': {
    fullText: 'Executive follow-up request\n\nPlease provide a short post-incident review covering:\n- timeline of handback and comms decisions\n- customer impact assessment\n- media/social handling\n- lessons for future planned works handback criteria\n\nTarget: draft to regional leadership within 2 working days.',
    metisImpact: {
      statusNote: 'Review / audit stage',
      claimsAdded: [],
      questionsOpened: [
        { code: 'Q-007', title: 'What follow-up action is needed before future planned works?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-006', title: 'Future works handback focus' },
      ],
    },
  },
};
