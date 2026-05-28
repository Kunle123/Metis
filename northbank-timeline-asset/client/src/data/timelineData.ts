// ============================================================
// METIS TIMELINE — Northbank Building Society
// Scenario: Green Saver product launch readiness
// Timeline rule: cards appear at addedToMetisAt / generatedAt (BST = UTC+1)
// eventOccurredAt appears only inside the modal as context
// ============================================================

export type Lane = 'input' | 'issue' | 'output';

export interface FullRecordSection {
  heading: string;
  body: string;
}

export interface TimelineEvent {
  id: string;
  lane: Lane;
  day: string;
  time: string;
  badgeLabel: string;
  title: string;
  summary: string;
  issueImpact?: string;
  linkedSource?: string;
  audience?: string;
  outputStatus?: string;
  supersededBy?: string;
  doNotSay?: string[];
  openQuestionsAtGeneration?: string[];
  caveatsAtGeneration?: string[];
  relatedIds: string[];
  fullRecord: FullRecordSection[];
}

export const LANE_CONFIG = {
  input: {
    label: 'Incoming Updates',
    sublabel: 'Comms-facing submissions',
    color: '#5C7A6B',
    bgColor: 'rgba(92, 122, 107, 0.10)',
    borderColor: 'rgba(92, 122, 107, 0.55)',
    textColor: '#2D4A3E',
    accentColor: '#5C7A6B',
    badgeBackground: '#EAF0EC',
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

export const ISSUE_METADATA = {
  title: 'Northbank Green Saver: launch readiness issue record',
  subtitle: 'A product-style timeline showing how METIS turns incoming updates into a structured issue record, controlled messages and evidence-backed briefings.',
  controlledPosition: 'Launch approved. Green Saver available from launch day. Rate and eligibility confirmed.',
  positionDetail: 'Pricing committee approved · app release approved · go/no-go recorded · stakeholder and customer messages circulated',
  scenario: 'Northbank Building Society — Green Saver product launch',
};

export const events: TimelineEvent[] = [

  // ─── INCOMING UPDATES ────────────────────────────────────────

  {
    id: 'n_e01',
    lane: 'input',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'PRODUCT UPDATE',
    title: 'Product launch scope confirmed',
    summary: 'Corporate Affairs receives launch scope from Product team. Green Saver targeted for week commencing 22 June. Eligible savings customers only.',
    issueImpact: 'Opens launch readiness issue. SRC-001 linked. CLM-001 and CLM-002 added.',
    relatedIds: ['n_iss01', 'n_iss02', 'n_out03'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Product launch pack\nReceived by comms: Mon 8 Jun 11:00 BST\nSender: Product Team' },
      { heading: 'SUMMARY', body: 'Product team confirms Green Saver launch scope. Target launch window: week commencing 22 June 2026. Eligible savings customers linked to green home improvements. Corporate Affairs opens launch readiness issue in Metis.' },
      { heading: 'SOURCE', body: 'SRC-001 · Product launch scope — Green Saver\nProduct team launch pack · High reliability\nEvent occurred: Mon 8 Jun 09:30 · Added to Metis: Mon 8 Jun 11:00' },
      { heading: 'ISSUE RECORD IMPACT', body: 'Launch readiness issue opened.\nCLM-001 added: Green Saver is planned for launch in the stated launch window.\nCLM-002 added: Product is intended for eligible savings customers meeting published criteria.\nOBS-002 added: Positive product story needs caveats.' },
    ],
  },

  {
    id: 'n_e02',
    lane: 'input',
    day: 'Tue 9 Jun',
    time: '10:15',
    badgeLabel: 'PRICING UPDATE',
    title: 'Pricing recommendation submitted',
    summary: 'Commercial Pricing submits proposed launch rate to Corporate Affairs. Rate not yet committee-approved.',
    issueImpact: 'SRC-002 linked. CLM-003 added. Q-001 opened: Has pricing been formally approved?',
    relatedIds: ['n_iss03', 'n_out03', 'n_out05'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Pricing recommendation paper\nReceived by comms: Tue 9 Jun 10:15 BST\nSender: Commercial Pricing' },
      { heading: 'SUMMARY', body: 'Commercial Pricing team submits proposed launch rate paper. Rate is proposed, not yet subject to formal pricing committee approval. Comms must not quote the rate until committee approval is recorded.' },
      { heading: 'SOURCE', body: 'SRC-002 · Pricing recommendation — proposed rate\nCommercial Pricing · direct to comms\nAdded to Metis: Tue 9 Jun 10:15' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-003 added: Proposed launch rate submitted to pricing committee — not yet approved.\nQ-001 opened: Has pricing been formally approved?\nOBS-001 added: Rate may change before committee approval.' },
    ],
  },

  {
    id: 'n_e03',
    lane: 'input',
    day: 'Wed 10 Jun',
    time: '09:45',
    badgeLabel: 'COMPLIANCE REVIEW',
    title: 'Compliance review flags eligibility wording',
    summary: 'Compliance team flags that eligibility wording must follow approved regulatory language. Environmental claims must not overclaim.',
    issueImpact: 'SRC-003 linked. CLM-004 and CLM-005 added. Q-002 opened.',
    relatedIds: ['n_iss03', 'n_out01', 'n_out02', 'n_out03'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Compliance review note\nReceived by comms: Wed 10 Jun 09:45 BST\nSender: Compliance' },
      { heading: 'SUMMARY', body: 'Compliance review confirms eligibility wording must use approved regulatory language from the compliance pack. Environmental claims must not imply regulatory endorsement or overclaim green outcomes.' },
      { heading: 'SOURCE', body: 'SRC-003 · Compliance review — eligibility and environmental wording\nCompliance · direct to comms\nAdded to Metis: Wed 10 Jun 09:45' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-004 added: Eligibility wording must follow approved regulatory language.\nCLM-005 added: Environmental claims must not overclaim or imply regulatory endorsement.\nQ-002 opened: What eligibility wording is approved for external use?' },
    ],
  },

  {
    id: 'n_e04',
    lane: 'input',
    day: 'Wed 10 Jun',
    time: '14:30',
    badgeLabel: 'LEGAL REVIEW',
    title: 'Legal approves headline subject to caveat',
    summary: 'Legal confirms headline product description is approved for use, subject to eligibility and environmental caveats.',
    issueImpact: 'SRC-004 linked. Q-002 partially answered. Q-003 opened.',
    relatedIds: ['n_iss03', 'n_out01', 'n_out02'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Legal review note\nReceived by comms: Wed 10 Jun 14:30 BST\nSender: Legal' },
      { heading: 'SUMMARY', body: 'Legal team confirms the headline product description is approved for use in customer-facing materials. Eligibility and environmental caveats must be included. No additional legal caveats on environmental positioning beyond those already noted by compliance.' },
      { heading: 'SOURCE', body: 'SRC-004 · Legal review — headline approved subject to caveat\nLegal · direct to comms\nAdded to Metis: Wed 10 Jun 14:30' },
      { heading: 'ISSUE RECORD IMPACT', body: 'Q-002 partially answered: Approved eligibility wording confirmed by legal.\nQ-003 opened: Are there any additional legal caveats on the environmental positioning?' },
    ],
  },

  {
    id: 'n_e05',
    lane: 'input',
    day: 'Thu 11 Jun',
    time: '10:00',
    badgeLabel: 'CUSTOMER OPS',
    title: 'Customer operations requests approved agent line',
    summary: 'Customer operations asks for an approved agent script for use before launch. Colleagues receiving customer enquiries about the product.',
    issueImpact: 'SRC-005 linked. CLM-006 added. Q-005 opened.',
    relatedIds: ['n_iss03', 'n_out01'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Customer operations request\nReceived by comms: Thu 11 Jun 10:00 BST\nSender: Customer Operations' },
      { heading: 'SUMMARY', body: 'Customer operations team asks Corporate Affairs for an approved internal agent script. Colleagues are receiving customer enquiries about a new green savings product and need a safe, approved line before launch.' },
      { heading: 'SOURCE', body: 'SRC-005 · Customer operations request — agent line\nCustomer Operations · direct to comms\nAdded to Metis: Thu 11 Jun 10:00' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-006 added: Customer-facing colleagues need an approved line before launch.\nQ-005 opened: What line should customer operations use before launch?' },
    ],
  },

  {
    id: 'n_e06',
    lane: 'input',
    day: 'Fri 12 Jun',
    time: '09:30',
    badgeLabel: 'ACCESSIBILITY REVIEW',
    title: 'Accessibility review asks for alternative support wording',
    summary: 'Accessibility team asks for clearer wording for customers who cannot use the app or need assisted digital support.',
    issueImpact: 'SRC-006 linked. CLM-007 added. Q-006 opened.',
    relatedIds: ['n_iss03', 'n_out01', 'n_out04', 'n_out06'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Accessibility review note\nReceived by comms: Fri 12 Jun 09:30 BST\nSender: Accessibility and Inclusion' },
      { heading: 'SUMMARY', body: 'Accessibility and inclusion review confirms customer-facing materials must include assisted digital and non-digital support routes. Do not present app-only journeys as the only way to apply or manage the product.' },
      { heading: 'SOURCE', body: 'SRC-006 · Accessibility review — alternative support wording\nAccessibility and Inclusion · accessibility review\nAdded to Metis: Fri 12 Jun 09:30' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-007 added: Customer materials must include assisted digital and non-digital support routes.\nQ-006 opened: What support wording is needed for assisted digital and vulnerable customers?' },
    ],
  },

  {
    id: 'n_e07',
    lane: 'input',
    day: 'Mon 15 Jun',
    time: '09:00',
    badgeLabel: 'DIGITAL READINESS',
    title: 'App release dependency still open',
    summary: 'Digital Product confirms app release is on track but final build approval is not yet complete. Comms must not reference app availability until approval is recorded.',
    issueImpact: 'SRC-007 linked. CLM-008 added. Q-004 opened.',
    relatedIds: ['n_iss04', 'n_iss07', 'n_out03'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Digital Product release status note\nReceived by comms: Mon 15 Jun 09:00 BST\nSender: Digital Product' },
      { heading: 'SUMMARY', body: 'Digital Product team confirms the Green Saver journey build is on track for the target launch window. Final app store and release approval has not yet been granted. Comms must not state that customers can apply via the app until release approval is recorded in Metis.' },
      { heading: 'SOURCE', body: 'SRC-007 · Digital readiness — app release dependency\nDigital Product · release status\nAdded to Metis: Mon 15 Jun 09:00' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-008 added: App release not yet approved — comms must not reference app availability.\nQ-004 opened: Is the app release approved?' },
    ],
  },

  {
    id: 'n_e08',
    lane: 'input',
    day: 'Mon 15 Jun',
    time: '11:15',
    badgeLabel: 'EXEC REQUEST',
    title: 'Executive office requests launch readiness brief',
    summary: 'Executive office asks Corporate Affairs for a concise readiness note before the leadership meeting. Audience: executive committee.',
    issueImpact: 'Triggers Executive brief V1 generation.',
    relatedIds: ['n_iss05', 'n_out03'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Executive office email to Corporate Affairs\nReceived by comms: Mon 15 Jun 11:15 BST\nSender: Executive Office' },
      { heading: 'REQUEST', body: 'Please provide a concise launch readiness brief for the leadership meeting covering: confirmed position and dependencies, open risks and caveats, media and customer handling posture, and decision points before announcement.' },
      { heading: 'ISSUE RECORD IMPACT', body: 'Triggers generation of Executive brief V1 at Mon 15 Jun 11:45.' },
    ],
  },

  {
    id: 'n_e09',
    lane: 'input',
    day: 'Tue 16 Jun',
    time: '10:00',
    badgeLabel: 'PARTNER UPDATE',
    title: 'Green home partner content confirmed',
    summary: 'Partnerships confirms partner-facing signposting copy is approved. Must not imply endorsement of individual suppliers.',
    issueImpact: 'SRC-008 linked.',
    relatedIds: ['n_iss03', 'n_out07'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Partner sign-off note\nReceived by comms: Tue 16 Jun 10:00 BST\nSender: Partnerships' },
      { heading: 'SUMMARY', body: 'Partner signposting copy approved for use on approved channels. Must not imply endorsement of individual installers or suppliers. Comms to use approved partner wording only.' },
      { heading: 'SOURCE', body: 'SRC-008 · Partner signposting — green home content\nPartnerships · partner sign-off\nAdded to Metis: Tue 16 Jun 10:00' },
      { heading: 'ISSUE RECORD IMPACT', body: 'No new gaps or claims. Partner wording confirmed for use in stakeholder and customer variants.' },
    ],
  },

  {
    id: 'n_e10',
    lane: 'input',
    day: 'Wed 17 Jun',
    time: '09:30',
    badgeLabel: 'MEDIA ENQUIRY',
    title: 'Trade journalist asks about upcoming savings launch',
    summary: "Trade journalist asks whether Northbank is launching a new green savings product. Deadline: response by 16:00 for tomorrow's newsletter slot.",
    issueImpact: 'SRC-009 linked. OBS-005 added.',
    relatedIds: ['n_iss06', 'n_out04'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Press office media enquiry log\nReceived by comms: Wed 17 Jun 09:30 BST\nSender: Press Office' },
      { heading: 'REPORTER QUESTIONS', body: "1. Is Northbank launching a new green savings product?\n2. What is the rate and eligibility?\n3. What is the environmental positioning?\n\nDeadline: response requested by 16:00 today for tomorrow's newsletter slot.\nNo announcement authorised until go/no-go — holding line required." },
      { heading: 'SOURCE', body: 'SRC-009 · Media enquiry — trade press\nPress Office · media enquiry log\nAdded to Metis: Wed 17 Jun 09:30' },
      { heading: 'ISSUE RECORD IMPACT', body: 'OBS-005 added: Trade press interest may require a holding line before final go/no-go.\nPress holding message variant generated at Wed 17 Jun 10:00.' },
    ],
  },

  {
    id: 'n_e11',
    lane: 'input',
    day: 'Thu 18 Jun',
    time: '10:30',
    badgeLabel: 'DIGITAL APPROVAL',
    title: 'App release approved for launch',
    summary: 'Digital Product confirms final app release approval. Launch dependency closed. Customers may be directed to the app journey once messages are approved.',
    issueImpact: 'SRC-010 linked. Q-004 closed.',
    relatedIds: ['n_iss07', 'n_out05', 'n_out06'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Digital Product release approval note\nReceived by comms: Thu 18 Jun 10:30 BST\nSender: Digital Product' },
      { heading: 'SUMMARY', body: 'Final build approved for release in line with the launch window. Customers may be directed to the app journey once customer-facing messages are approved.' },
      { heading: 'SOURCE', body: 'SRC-010 · Digital approval — app release\nDigital Product · release approval\nAdded to Metis: Thu 18 Jun 10:30' },
      { heading: 'ISSUE RECORD IMPACT', body: 'Q-004 closed: App release approved.\nApp dependency gap closed in Issue Record.' },
    ],
  },

  {
    id: 'n_e12',
    lane: 'input',
    day: 'Thu 18 Jun',
    time: '11:45',
    badgeLabel: 'PRICING APPROVAL',
    title: 'Pricing committee confirms launch rate',
    summary: 'Pricing committee approves launch rate 4.25% gross/AER and eligibility wording for external use.',
    issueImpact: 'SRC-011 linked. CLM-009 added. Q-001 and Q-002 closed.',
    relatedIds: ['n_iss07', 'n_out05', 'n_out06'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Pricing committee minute\nReceived by comms: Thu 18 Jun 11:45 BST\nSender: Commercial Pricing' },
      { heading: 'SUMMARY', body: 'Launch rate 4.25% gross/AER approved for eligible customers within published limits. Eligibility wording approved for external use as per compliance pack v3. Effective from launch date subject to go/no-go.' },
      { heading: 'SOURCE', body: 'SRC-011 · Pricing committee minute — launch rate approved\nCommercial Pricing · committee minute\nAdded to Metis: Thu 18 Jun 11:45' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-009 added: Launch rate 4.25% gross/AER approved for eligible customers.\nQ-001 closed: Pricing formally approved.\nQ-002 closed: Eligibility wording approved for external use.' },
    ],
  },

  {
    id: 'n_e13',
    lane: 'input',
    day: 'Fri 19 Jun',
    time: '09:00',
    badgeLabel: 'GO / NO-GO',
    title: 'Launch approved for announcement',
    summary: 'Launch steering group records go/no-go decision. Launch can proceed subject to final circulation of approved brief and message variants.',
    issueImpact: 'SRC-012 linked. CLM-010 added. Q-007 opened.',
    relatedIds: ['n_iss08', 'n_out07', 'n_out08'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Launch steering group go/no-go record\nReceived by comms: Fri 19 Jun 09:00 BST\nSender: Launch Steering Group' },
      { heading: 'SUMMARY', body: 'Launch steering group decision: proceed to announcement in line with approved launch window. Conditions: Executive Brief V2, customer and stakeholder message variants, and press holding line circulated via Metis audit trail.' },
      { heading: 'SOURCE', body: 'SRC-012 · Launch steering group — go/no-go\nLaunch Steering Group · go/no-go record\nAdded to Metis: Fri 19 Jun 09:00' },
      { heading: 'ISSUE RECORD IMPACT', body: 'CLM-010 added: Launch approved for announcement in line with approved launch window.\nQ-007 opened: Post-launch watchlist — 72-hour monitoring.\nLaunch readiness gap closed.' },
    ],
  },

  {
    id: 'n_e14',
    lane: 'input',
    day: 'Fri 19 Jun',
    time: '10:15',
    badgeLabel: 'EXEC ACTION',
    title: 'Post-launch watchlist requested',
    summary: 'Corporate Affairs Director asks for a short watchlist covering media, customer confusion, vulnerable customers and digital journey issues for the first 72 hours after announcement.',
    issueImpact: 'Q-007 active. OBS-003 added.',
    relatedIds: ['n_iss09', 'n_out09'],
    fullRecord: [
      { heading: 'SUBMISSION', body: 'Channel: Corporate Affairs Director note\nReceived by comms: Fri 19 Jun 10:15 BST\nSender: Corporate Affairs Director' },
      { heading: 'REQUEST', body: 'Please provide a short leadership watchlist for the first 72 hours covering: trade and consumer media pickup, customer confusion on eligibility or environmental claims, vulnerable customer and assisted digital contacts, digital journey defects or complaints.' },
      { heading: 'ISSUE RECORD IMPACT', body: 'Q-007 remains active: Post-launch watchlist — 72-hour monitoring.\nOBS-003 added: Post-launch monitoring required for first 72 hours.' },
    ],
  },

  // ─── ISSUE RECORD ────────────────────────────────────────────

  {
    id: 'n_iss01',
    lane: 'issue',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'WORKSPACE',
    title: 'Issue workspace created',
    summary: 'Corporate Affairs opens launch readiness issue in Metis. Issue record: Northbank Green Saver — launch readiness.',
    relatedIds: ['n_e01', 'n_e02'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Corporate Affairs opens a launch readiness issue in Metis at 11:00 on Mon 8 Jun. Issue title: Northbank Green Saver — launch readiness. Issue record will track all incoming updates, claims, open questions, observations, and outputs through to go/no-go.' },
      { heading: 'METIS ACTION', body: 'Issue workspace created · Mon 8 Jun 11:00\nOpened by: Corporate Affairs · Launch Readiness Lead\nInitial status: Launch readiness issue opened' },
    ],
  },

  {
    id: 'n_iss02',
    lane: 'issue',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'RECORD POPULATED',
    title: 'Initial issue record populated from launch scope',
    summary: 'Operational sources linked · initial claims and questions logged',
    relatedIds: ['n_e01', 'n_iss01'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Issue record populated from the product launch scope (SRC-001). Initial claims and observations added to the record.' },
      { heading: 'METIS ACTION', body: 'Record populated · Mon 8 Jun 11:00\n1 source linked (SRC-001)\n2 claims added (CLM-001, CLM-002)\n2 observations added (OBS-002, OBS-003)' },
      { heading: 'CLAIMS ADDED', body: 'CLM-001: Green Saver is planned for launch in the stated launch window (week commencing 22 June 2026).\nCLM-002: The product is intended for eligible savings customers meeting published criteria.' },
      { heading: 'OBSERVATIONS ADDED', body: 'OBS-002: Positive product story needs caveats.\nOBS-003: Leadership needs readiness not a campaign plan.' },
    ],
  },

  {
    id: 'n_iss03',
    lane: 'issue',
    day: 'Tue 9 Jun',
    time: '10:15',
    badgeLabel: 'GAPS OPENED',
    title: 'Pricing, compliance and eligibility gaps opened',
    summary: 'Pricing recommendation received. Compliance and legal reviews flag eligibility and environmental wording gaps. Multiple open questions logged.',
    relatedIds: ['n_e02', 'n_e03', 'n_e04', 'n_e05', 'n_e06'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Pricing recommendation submitted (SRC-002). Compliance review flags eligibility wording (SRC-003). Legal approves headline subject to caveat (SRC-004). Customer operations requests agent line (SRC-005). Accessibility review flags support wording (SRC-006). Multiple gaps opened across the week.' },
      { heading: 'METIS ACTION', body: 'Gaps opened: Tue 9 Jun – Fri 12 Jun\n5 sources linked (SRC-002 to SRC-006)\n5 claims added (CLM-003 to CLM-007)\n5 open questions logged (Q-001 to Q-003, Q-005, Q-006)' },
      { heading: 'OPEN QUESTIONS', body: 'Q-001: Has pricing been formally approved?\nQ-002: What eligibility wording is approved for external use?\nQ-003: Are there any additional legal caveats on the environmental positioning?\nQ-005: What line should customer operations use before launch?\nQ-006: What support wording is needed for assisted digital and vulnerable customers?' },
    ],
  },

  {
    id: 'n_iss04',
    lane: 'issue',
    day: 'Mon 15 Jun',
    time: '09:00',
    badgeLabel: 'GAP OPENED',
    title: 'App dependency gap opened',
    summary: 'App release dependency logged. Comms must not reference app availability until approval is recorded.',
    relatedIds: ['n_e07', 'n_iss07'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Digital Product confirms app release is on track but final approval is not yet granted. App dependency gap opened in Issue Record. Comms must not state customers can apply via the app until release approval is recorded.' },
      { heading: 'METIS ACTION', body: 'Gap opened · Mon 15 Jun 09:00\nQ-004 opened: Is the app release approved?\nCLM-008 added: App release not yet approved.' },
    ],
  },

  {
    id: 'n_iss05',
    lane: 'issue',
    day: 'Mon 15 Jun',
    time: '11:15',
    badgeLabel: 'BRIEF REQUESTED',
    title: 'Executive brief requested — record snapshot taken',
    summary: 'Executive office requests readiness brief. Metis takes a snapshot of the current issue record state for brief generation.',
    relatedIds: ['n_e08', 'n_out03'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Executive office requests a concise launch readiness brief. Metis records the current issue state as the basis for Executive brief V1. At this point: pricing and app approvals are still outstanding.' },
      { heading: 'METIS ACTION', body: 'Record snapshot taken · Mon 15 Jun 11:15\nOpen questions at snapshot: Q-001, Q-002, Q-004, Q-005, Q-006\nCaveats at snapshot: Pricing committee and app release approvals not yet in Metis.' },
    ],
  },

  {
    id: 'n_iss06',
    lane: 'issue',
    day: 'Wed 17 Jun',
    time: '09:30',
    badgeLabel: 'SOURCE LINKED',
    title: 'Press enquiry logged as source',
    summary: 'Trade press enquiry logged as SRC-009. OBS-005 added: trade press may force holding line before go/no-go.',
    relatedIds: ['n_e10', 'n_out04'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Trade journalist enquiry logged as a source in the Issue Record. Press holding message variant generated immediately in response.' },
      { heading: 'METIS ACTION', body: 'Source linked · Wed 17 Jun 09:30\nSRC-009 linked: Media enquiry — trade press\nOBS-005 added: Trade press interest may require a holding line before final go/no-go.' },
    ],
  },

  {
    id: 'n_iss07',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '11:45',
    badgeLabel: 'GAPS CLOSED',
    title: 'App dependency and pricing gaps closed',
    summary: 'App release approved (SRC-010). Pricing committee approves launch rate (SRC-011). Q-001, Q-002, Q-004 closed.',
    relatedIds: ['n_e11', 'n_e12', 'n_out05', 'n_out06'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Two critical dependencies closed on Thu 18 Jun. App release approval recorded (SRC-010). Pricing committee approval recorded (SRC-011). Three open questions closed. Issue record updated to reflect approved position.' },
      { heading: 'METIS ACTION', body: 'Gaps closed · Thu 18 Jun 10:30 – 11:45\nSRC-010 linked: Digital approval — app release\nSRC-011 linked: Pricing committee minute — launch rate approved\nQ-001 closed: Pricing formally approved.\nQ-002 closed: Eligibility wording approved for external use.\nQ-004 closed: App release approved.' },
    ],
  },

  {
    id: 'n_iss08',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '09:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Launch approved — record updated',
    summary: 'Go/no-go decision recorded. Launch readiness gap closed. CLM-010 added. Q-007 opened: post-launch watchlist.',
    relatedIds: ['n_e13', 'n_out07', 'n_out08'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Launch steering group go/no-go decision recorded in Metis. Launch readiness gap closed. Issue record updated to reflect approved launch posture.' },
      { heading: 'METIS ACTION', body: 'Record updated · Fri 19 Jun 09:00\nSRC-012 linked: Launch steering group — go/no-go\nCLM-010 added: Launch approved for announcement.\nLaunch readiness gap closed.\nQ-007 opened: Post-launch watchlist — 72-hour monitoring.' },
    ],
  },

  {
    id: 'n_iss09',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '10:15',
    badgeLabel: 'GAP OPENED',
    title: 'Post-launch watchlist gap opened',
    summary: 'Post-launch monitoring gap opened. Q-007 active. OBS-003 added for 72-hour monitoring period.',
    relatedIds: ['n_e14', 'n_out09'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Post-launch watchlist gap opened following Corporate Affairs Director request. 72-hour monitoring period begins after announcement. Issue record remains active for post-launch monitoring.' },
      { heading: 'METIS ACTION', body: 'Gap opened · Fri 19 Jun 10:15\nQ-007 active: Post-launch watchlist — 72-hour monitoring.\nOBS-003 added: Post-launch monitoring required for first 72 hours.' },
    ],
  },

  {
    id: 'n_iss10',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '11:15',
    badgeLabel: 'AUDIT',
    title: 'Circulation audit recorded',
    summary: 'Governance log records circulation audit for Green Saver launch readiness outputs. Issue record closed.',
    relatedIds: ['n_out10'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Circulation audit recorded in governance log. All Green Saver launch readiness outputs circulated and recorded. Issue record closed following go/no-go and final export.' },
      { heading: 'METIS ACTION', body: 'Audit recorded · Fri 19 Jun 11:15\nChannel: Governance log\nAudience: Governance record\nPosture: Approved\nNote: Circulation audit for Green Saver launch readiness outputs.' },
    ],
  },

  // ─── METIS OUTPUTS ───────────────────────────────────────────

  {
    id: 'n_out01',
    lane: 'output',
    day: 'Thu 11 Jun',
    time: '15:00',
    badgeLabel: 'STAFF UPDATE',
    title: 'Internal staff message V1',
    summary: 'Safe internal line for customer-facing colleagues while pricing and app approvals are outstanding.',
    audience: 'Internal staff and customer-facing colleagues',
    outputStatus: 'Ready for review',
    doNotSay: [
      'Do not quote 4.25% or any launch rate.',
      'Do not say customers can apply via the app yet.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Has pricing been formally approved?',
      'Q-002: What eligibility wording is approved for external use? (partially answered)',
      'Q-005: What line should customer operations use before launch? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Pricing committee and app release approvals not yet in Metis.',
    ],
    relatedIds: ['n_e03', 'n_e05', 'n_iss03'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Internal staff message V1 — safe holding line for customer-facing colleagues. Generated while pricing committee approval and app release approval are still outstanding.' },
      { heading: 'AUDIENCE', body: 'Internal staff and customer-facing colleagues' },
      { heading: 'STATUS', body: 'Ready for review · Version 1' },
      { heading: 'FULL TEXT', body: 'If asked by customers:\n- Northbank is preparing a new savings product called Green Saver linked to greener home improvements.\n- It is intended for eligible savings customers — not all customers.\n- We cannot confirm the launch rate, final eligibility wording or app availability yet.\n- Direct customers to published channels once announcement is authorised.\n\nAssisted digital:\n- Include telephone and branch support routes; do not describe the journey as app-only.' },
      { heading: 'DO NOT SAY', body: 'Do not quote 4.25% or any launch rate.\nDo not say customers can apply via the app yet.' },
      { heading: 'OPEN QUESTIONS AT GENERATION', body: 'Q-001: Has pricing been formally approved?\nQ-002: What eligibility wording is approved for external use? (partially answered)\nQ-005: What line should customer operations use before launch? (partially answered)' },
      { heading: 'CAVEATS AT GENERATION', body: 'Pricing committee and app release approvals not yet in Metis.' },
    ],
  },

  {
    id: 'n_out02',
    lane: 'output',
    day: 'Thu 11 Jun',
    time: '12:00',
    badgeLabel: 'CUSTOMER MSG',
    title: 'Customer message variant V1',
    summary: 'Customer-facing holding message. Product described without rate or eligibility detail. Superseded by V2.',
    audience: 'Customers',
    outputStatus: 'Approved',
    supersededBy: 'n_out06',
    doNotSay: [
      'Do not quote the launch rate.',
      'Do not say the product is available now.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Has pricing been formally approved?',
      'Q-002: What eligibility wording is approved for external use? (partially answered)',
      'Q-005: What line should customer operations use before launch?',
    ],
    relatedIds: ['n_e01', 'n_e03', 'n_e04'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Customer message variant V1 — holding message while rate and eligibility approvals are outstanding. Superseded by V2 after pricing committee and app approvals.' },
      { heading: 'AUDIENCE', body: 'Customers' },
      { heading: 'STATUS', body: 'Approved · Version 1 · Superseded by V2' },
      { heading: 'FULL TEXT', body: 'We are preparing a new savings product called Green Saver, which will support savings linked to energy-efficient home improvements. It will be available to eligible customers — details will be confirmed before launch. We will share more information once our launch plans are finalised.' },
      { heading: 'DO NOT SAY', body: 'Do not quote the launch rate.\nDo not say the product is available now.' },
      { heading: 'OPEN QUESTIONS AT GENERATION', body: 'Q-001: Has pricing been formally approved?\nQ-002: What eligibility wording is approved for external use? (partially answered)\nQ-005: What line should customer operations use before launch?' },
    ],
  },

  {
    id: 'n_out03',
    lane: 'output',
    day: 'Mon 15 Jun',
    time: '11:45',
    badgeLabel: 'EXEC BRIEF',
    title: 'Executive brief V1',
    summary: 'Launch readiness brief for senior leadership. Pricing and app approvals still outstanding at generation. Superseded by V2.',
    audience: 'Senior leadership',
    outputStatus: 'Ready for review',
    supersededBy: 'n_out05',
    doNotSay: [
      'Do not state pricing committee approval.',
      'Do not state app release approval.',
      'Do not state launch is approved.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Has pricing been formally approved?',
      'Q-002: What eligibility wording is approved for external use? (partially answered)',
      'Q-004: Is the app release approved?',
      'Q-005: What line should customer operations use before launch? (partially answered)',
      'Q-006: What support wording is needed for assisted digital/vulnerable customers? (partially answered)',
    ],
    caveatsAtGeneration: [
      'Excludes pricing committee approval, digital approval and go/no-go (Thu–Fri week 2).',
    ],
    relatedIds: ['n_e01', 'n_e02', 'n_e07', 'n_e08', 'n_iss05'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Executive brief V1 — launch readiness note for senior leadership before pricing committee and digital approvals. Superseded by V2 after approvals recorded.' },
      { heading: 'AUDIENCE', body: 'Senior leadership' },
      { heading: 'STATUS', body: 'Ready for review · Version 1 · Superseded by V2' },
      { heading: 'FULL TEXT', body: 'Current position\n- Green Saver launch is targeted for the week commencing 22 June 2026, subject to dependencies.\n- Corporate Affairs is maintaining a source-backed readiness record in Metis.\n- Product story is positive but several approvals remain outstanding.\n\nWhat is confirmed\n- Launch scope and intended eligible customer group (SRC-001).\n- Proposed rate submitted — not committee-approved (SRC-002).\n- Compliance and legal caveats on eligibility and environmental wording (SRC-003, SRC-004).\n- Customer operations and accessibility requirements captured (SRC-005, SRC-006).\n- App release still a dependency (SRC-007).\n\nWhat is not yet confirmed\n- Formal pricing committee approval.\n- Final app release approval.\n- Go/no-go for announcement.\n\nDecisions needed\n- Confirm pricing committee and digital approval timeline.\n- Agree announcement timing after dependencies close.' },
      { heading: 'DO NOT SAY', body: 'Do not state pricing committee approval.\nDo not state app release approval.\nDo not state launch is approved.' },
      { heading: 'OPEN QUESTIONS AT GENERATION', body: 'Q-001: Has pricing been formally approved?\nQ-002: What eligibility wording is approved for external use? (partially answered)\nQ-004: Is the app release approved?\nQ-005: What line should customer operations use before launch? (partially answered)\nQ-006: What support wording is needed for assisted digital/vulnerable customers? (partially answered)' },
      { heading: 'CAVEATS AT GENERATION', body: 'Excludes pricing committee approval, digital approval and go/no-go (Thu–Fri week 2).' },
    ],
  },

  {
    id: 'n_out04',
    lane: 'output',
    day: 'Wed 17 Jun',
    time: '10:00',
    badgeLabel: 'PRESS LINE',
    title: 'Press holding message variant',
    summary: 'Holding line for trade press enquiry. No announcement authorised until go/no-go.',
    audience: 'Media / press office',
    outputStatus: 'Ready for review',
    doNotSay: [
      'Do not confirm Green Saver launch.',
      'Do not quote rate or eligibility.',
    ],
    openQuestionsAtGeneration: [
      'Q-001: Has pricing been formally approved?',
      'Q-004: Is the app release approved?',
    ],
    caveatsAtGeneration: [
      'Go/no-go not recorded in Metis at generation — holding line only.',
    ],
    relatedIds: ['n_e10', 'n_iss06'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Press holding message variant — generated in response to trade journalist enquiry. No announcement authorised until go/no-go is recorded.' },
      { heading: 'AUDIENCE', body: 'Media / press office' },
      { heading: 'STATUS', body: 'Ready for review · Version 1' },
      { heading: 'FULL TEXT', body: "Suggested line:\nNorthbank Building Society is always reviewing its savings range for customers. We do not comment on speculation about future products or pricing. When we have something to announce we will inform customers and media through our usual channels.\n\nBased on:\n- Media enquiry log (SRC-009).\n- Launch readiness position in Metis — go/no-go not yet recorded at time of generation." },
      { heading: 'DO NOT SAY', body: 'Do not confirm Green Saver launch.\nDo not quote rate or eligibility.' },
      { heading: 'CAVEATS AT GENERATION', body: 'Go/no-go not recorded in Metis at generation — holding line only.' },
    ],
  },

  {
    id: 'n_out05',
    lane: 'output',
    day: 'Thu 18 Jun',
    time: '12:15',
    badgeLabel: 'EXEC BRIEF',
    title: 'Executive brief V2',
    summary: 'Updated launch readiness brief after pricing committee and app approvals. Supersedes V1.',
    audience: 'Senior leadership',
    outputStatus: 'Approved',
    relatedIds: ['n_e11', 'n_e12', 'n_iss07'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Executive brief V2 — updated after pricing committee and digital approvals. Supersedes V1. Announcement still subject to steering group go/no-go.' },
      { heading: 'AUDIENCE', body: 'Senior leadership' },
      { heading: 'STATUS', body: 'Approved · Version 2 · Supersedes V1' },
      { heading: 'FULL TEXT', body: 'Current position\n- Pricing committee has approved launch rate (4.25% gross/AER) and eligibility wording.\n- App release approved; launch steering group go/no-go expected before public announcement.\n- Customer-facing V2 and press posture may reference approved rate and app readiness; announcement still subject to steering group sign-off.\n\nWhat changed since V1\n- Digital approval recorded (SRC-010).\n- Pricing committee approval recorded (SRC-011).\n\nDecisions needed\n- Launch steering group go/no-go before announcement.' },
      { heading: 'CAVEATS AT GENERATION', body: 'Go/no-go decision not yet recorded in Metis at generation — announcement posture still conditional.' },
    ],
  },

  {
    id: 'n_out06',
    lane: 'output',
    day: 'Thu 18 Jun',
    time: '13:00',
    badgeLabel: 'CUSTOMER MSG',
    title: 'Customer message variant V2',
    summary: 'Updated customer message with approved rate (4.25% gross/AER), eligibility wording, and app availability. Supersedes V1.',
    audience: 'Customers',
    outputStatus: 'Approved',
    doNotSay: [
      'Do not imply regulatory endorsement of green outcomes.',
    ],
    relatedIds: ['n_e11', 'n_e12', 'n_iss07'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Customer message variant V2 — updated with approved rate and eligibility wording after pricing committee and app approvals. Supersedes V1.' },
      { heading: 'AUDIENCE', body: 'Customers' },
      { heading: 'STATUS', body: 'Approved · Version 2 · Supersedes V1' },
      { heading: 'FULL TEXT', body: 'Green Saver is a new savings product from Northbank Building Society, designed for eligible customers who want to save towards energy-efficient home improvements. The launch rate is 4.25% gross/AER for eligible balances within product limits, subject to our terms. You can find full eligibility criteria and apply via our app, online banking, branch or telephone service when the product is available from launch day. Assisted digital and telephone support are available if you need help accessing our services.' },
      { heading: 'DO NOT SAY', body: 'Do not imply regulatory endorsement of green outcomes.' },
    ],
  },

  {
    id: 'n_out07',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '09:30',
    badgeLabel: 'STAKEHOLDER NOTE',
    title: 'Stakeholder message variant',
    summary: 'Post go/no-go stakeholder message for internal leadership and selected external stakeholders.',
    audience: 'Internal leadership and selected external stakeholders',
    outputStatus: 'Approved',
    relatedIds: ['n_e13', 'n_iss08'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Stakeholder message variant — generated after go/no-go decision. For internal leadership and selected external stakeholders.' },
      { heading: 'AUDIENCE', body: 'Internal leadership and selected external stakeholders' },
      { heading: 'STATUS', body: 'Approved · Version 1' },
      { heading: 'FULL TEXT', body: 'Northbank Building Society is launching Green Saver, a savings product for eligible customers linked to support for energy-efficient home improvements. The launch rate is 4.25% gross/AER for eligible balances within published limits. Launch proceeds in line with the approved launch window following steering group go/no-go. Environmental claims are framed to support green home improvements — no regulatory endorsement is implied.' },
    ],
  },

  {
    id: 'n_out08',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '10:00',
    badgeLabel: 'AGENT SCRIPT',
    title: 'Agent script V2',
    summary: 'Updated agent script for customer-facing colleagues after go/no-go. Includes approved rate and app availability.',
    audience: 'Customer-facing colleagues',
    outputStatus: 'Approved',
    relatedIds: ['n_e13', 'n_e05', 'n_iss08'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Agent script V2 — updated for customer-facing colleagues after go/no-go. Includes approved rate and app availability. Replaces internal staff message V1.' },
      { heading: 'AUDIENCE', body: 'Customer-facing colleagues' },
      { heading: 'STATUS', body: 'Approved · Version 2' },
      { heading: 'FULL TEXT', body: 'Green Saver is now available from today. The launch rate is 4.25% gross/AER for eligible customers within published limits. Customers can apply via the app, online banking, branch or telephone. Assisted digital and telephone support are available. Do not discuss post-launch monitoring or internal risk items with customers.' },
    ],
  },

  {
    id: 'n_out09',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '10:30',
    badgeLabel: 'POST-LAUNCH NOTE',
    title: 'Post-launch watchlist note',
    summary: 'Short leadership watchlist for the first 72 hours covering media, customer confusion, vulnerable customers and digital journey.',
    audience: 'Senior leadership',
    outputStatus: 'Approved',
    openQuestionsAtGeneration: [
      'Q-007: Post-launch watchlist — 72-hour monitoring active.',
    ],
    relatedIds: ['n_e14', 'n_iss09'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Post-launch watchlist note for senior leadership. Covers the first 72 hours after announcement.' },
      { heading: 'AUDIENCE', body: 'Senior leadership' },
      { heading: 'STATUS', body: 'Approved · Version 1' },
      { heading: 'FULL TEXT', body: 'Post-launch watchlist — Green Saver (first 72 hours)\n\nMonitor:\n- Trade and consumer media pickup\n- Customer confusion on eligibility or environmental claims\n- Vulnerable customer and assisted digital contacts\n- Digital journey defects or complaints\n\nUpdate Metis issue record as items are confirmed or closed.' },
    ],
  },

  {
    id: 'n_out10',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '11:15',
    badgeLabel: 'AUDIT',
    title: 'Circulation audit',
    summary: 'Governance log records circulation audit for all Green Saver launch readiness outputs.',
    audience: 'Governance record',
    outputStatus: 'Approved',
    relatedIds: ['n_iss10'],
    fullRecord: [
      { heading: 'SUMMARY', body: 'Circulation audit recorded in governance log. All Green Saver launch readiness outputs circulated and recorded. Issue record closed.' },
      { heading: 'AUDIENCE', body: 'Governance record' },
      { heading: 'STATUS', body: 'Approved · Final export' },
      { heading: 'CIRCULATION RECORD', body: 'Executive brief V1 — Leadership distribution · Mon 15 Jun 12:00\nPress holding variant — Press office · Wed 17 Jun 10:30\nExecutive brief V2 — Leadership distribution · Thu 18 Jun 12:30\nCustomer message V2 — Website/app · Thu 18 Jun 13:15\nAgent script V2 — Customer operations · Fri 19 Jun 10:15\nAudit recorded — Governance log · Fri 19 Jun 11:15' },
    ],
  },
];
