// METIS TIMELINE — Northbank Building Society
// Scenario: Green Saver product launch readiness
// ============================================================
// SOURCE OF TRUTH: northbank-green-saver-demo-export.json → timelineProjection
// Timeline rule: cards appear at addedToMetisAt / generatedAt (BST = UTC+1)
// eventOccurredAt appears only inside the modal as context
// Every incoming update with issueRecordImpacts has a corresponding Issue Record
// impact card at the same timestamp (badge: RECORD UPDATED)
// ============================================================

export type Lane = 'input' | 'issue' | 'output';

export interface FullRecordSection {
  heading: string;
  body: string;
}

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
  issueImpact?: string;
  impactChips?: string[];
  linkedSource?: string;
  audience?: string;
  outputStatus?: string;
  supersededBy?: string;
  doNotSay?: string[];
  openQuestionsAtGeneration?: string[];
  caveatsAtGeneration?: string[];
  // AI-polish wording toggle (message-style outputs only)
  draftBody?: string;
  aiPolishedBody?: string;
  wordingModeDefault?: 'draft' | 'ai_polished';
  aiPolish?: AiPolish;
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

  // ─── MON 8 JUN ────────────────────────────────────────────────

  // INPUT: Product launch scope confirmed (Mon 8 Jun, 11:00)
  {
    id: 'n_in01',
    lane: 'input',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'PRODUCT UPDATE',
    title: 'Product launch scope confirmed',
    summary: 'Launch scope and product parameters added from project source. Northbank Green Saver product definition logged in Metis.',
    impactChips: ['+2 claims', '+1 observation'],
    relatedIds: ['n_iss01', 'n_iss02'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Added from project source · Event occurred 09:30 · Received by comms 11:00 · Added to Metis 11:00 · Route: Reconstructed from project source',
      },
      {
        heading: 'SUMMARY',
        body: 'Product launch scope confirmed for Northbank Green Saver. Key parameters including rate, eligibility criteria, and launch date logged in Metis as the foundational source for the issue record.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+2 claims added · +1 observation added\nClaims: Product rate and eligibility criteria confirmed · Launch date set\nObservation: Scope document received and logged as primary source',
      },
    ],
  },

  // ISSUE: Record updated from Launch scope (Mon 8 Jun, 11:00)
  {
    id: 'n_iss01',
    lane: 'issue',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Launch scope',
    summary: '+2 claims · +1 observations',
    relatedIds: ['n_in01'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following receipt of the product launch scope confirmation.',
      },
      {
        heading: 'IMPACT',
        body: '+2 claims added · +1 observation added\nLinked source: eeee1001 (project source)\nClaims added: Product rate confirmed (eeee2001) · Eligibility criteria confirmed (eeee2002)\nObservation added: Scope document logged (eeee4002)',
      },
    ],
  },

  // INPUT: Corporate Affairs opens launch readiness issue (Mon 8 Jun, 11:00)
  {
    id: 'n_in02',
    lane: 'input',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'COMMS INTAKE',
    title: 'Corporate Affairs opens launch readiness issue',
    summary: 'Corporate Affairs · Metis issue setup · Direct to comms. Launch readiness issue formally opened in Metis.',
    impactChips: ['+1 observation', 'status updated'],
    relatedIds: ['n_iss02'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Corporate Affairs · Route: Direct to comms · Received 11:00 · Added to Metis 11:00',
      },
      {
        heading: 'SUMMARY',
        body: 'Corporate Affairs formally opens the Northbank Green Saver launch readiness issue in Metis. This triggers the structured issue record and begins the evidence-gathering process.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 observation added · Status updated to: Launch readiness issue opened in Metis\nObservation: Issue formally opened (eeee4003)',
      },
    ],
  },

  // ISSUE: Record updated from Issue opened (Mon 8 Jun, 11:00)
  {
    id: 'n_iss02',
    lane: 'issue',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Issue opened',
    summary: '+1 observations · status updated',
    relatedIds: ['n_in02'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the formal opening of the launch readiness issue by Corporate Affairs.',
      },
      {
        heading: 'IMPACT',
        body: '+1 observation added · Status updated\nObservation added: Launch readiness issue opened (eeee4003)\nStatus note: Launch readiness issue opened in Metis',
      },
    ],
  },

  // ISSUE: Issue status — Launch readiness issue opened (Mon 8 Jun, 11:00)
  {
    id: 'n_iss03',
    lane: 'issue',
    day: 'Mon 8 Jun',
    time: '11:00',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Launch readiness issue opened',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'STATUS',
        body: 'Launch readiness issue opened in Metis. The issue record is now active and accepting incoming updates.',
      },
      {
        heading: 'ISSUE',
        body: 'Northbank Green Saver launch readiness — Issue ID: eeeeeeee-eeee-4eee-aeee-eeeeeeeeee01',
      },
    ],
  },

  // ─── TUE 9 JUN ────────────────────────────────────────────────

  // INPUT: Pricing recommendation submitted (Tue 9 Jun, 10:15)
  {
    id: 'n_in03',
    lane: 'input',
    day: 'Tue 9 Jun',
    time: '10:15',
    badgeLabel: 'PRICING UPDATE',
    title: 'Pricing recommendation submitted',
    summary: 'Commercial Pricing · pricing paper · Direct to comms. Recommended rate and pricing rationale submitted for comms review.',
    impactChips: ['+1 claim', '+1 open question', '+1 observation'],
    relatedIds: ['n_iss04'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Commercial Pricing · Document type: pricing paper · Route: Direct to comms · Received 10:15 · Added to Metis 10:15',
      },
      {
        heading: 'SUMMARY',
        body: 'Commercial Pricing team submits the recommended savings rate and supporting pricing rationale. The paper includes the proposed headline rate, eligibility conditions, and the basis for the rate-setting decision.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nClaim: Recommended rate confirmed (eeee2003)\nOpen question: Is the rate competitive with current market comparators? (eeee3001)\nObservation: Pricing paper received and logged (eeee4001)',
      },
    ],
  },

  // ISSUE: Record updated from Pricing proposed (Tue 9 Jun, 10:15)
  {
    id: 'n_iss04',
    lane: 'issue',
    day: 'Tue 9 Jun',
    time: '10:15',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Pricing proposed',
    summary: '+1 claims · +1 open questions · +1 observations',
    relatedIds: ['n_in03'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following receipt of the pricing recommendation from Commercial Pricing.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nLinked source: eeee1002 (pricing paper)\nClaim added: Recommended rate confirmed (eeee2003)\nGap opened: Rate competitiveness question (eeee3001)\nObservation added: Pricing paper logged (eeee4001)',
      },
    ],
  },

  // ─── WED 10 JUN ────────────────────────────────────────────────

  // INPUT: Compliance review flags eligibility wording (Wed 10 Jun, 09:45)
  {
    id: 'n_in04',
    lane: 'input',
    day: 'Wed 10 Jun',
    time: '09:45',
    badgeLabel: 'COMPLIANCE NOTE',
    title: 'Compliance review flags eligibility wording',
    summary: 'Compliance · compliance review · Direct to comms. Eligibility wording flagged as requiring clarification before publication.',
    impactChips: ['+1 claim', '+1 open question'],
    relatedIds: ['n_iss05'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Compliance · Document type: compliance review · Route: Direct to comms · Received 09:45 · Added to Metis 09:45',
      },
      {
        heading: 'SUMMARY',
        body: 'Compliance team flags that the current draft eligibility wording may not meet regulatory requirements. Specific concern relates to the description of qualifying account holders and the conditions for the promotional rate.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened\nClaim: Eligibility wording requires clarification (eeee2004)\nOpen question: What is the approved eligibility wording? (eeee3002)',
      },
    ],
  },

  // ISSUE: Record updated from Eligibility flag (Wed 10 Jun, 09:45)
  {
    id: 'n_iss05',
    lane: 'issue',
    day: 'Wed 10 Jun',
    time: '09:45',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Eligibility flag',
    summary: '+1 claims · +1 open questions',
    relatedIds: ['n_in04'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the compliance review flagging eligibility wording concerns.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened\nLinked source: eeee1003 (compliance review)\nClaim added: Eligibility wording requires clarification (eeee2004)\nGap opened: Approved eligibility wording needed (eeee3002)',
      },
    ],
  },

  // INPUT: Legal approves headline subject to caveat (Wed 10 Jun, 14:30)
  {
    id: 'n_in05',
    lane: 'input',
    day: 'Wed 10 Jun',
    time: '14:30',
    badgeLabel: 'LEGAL NOTE',
    title: 'Legal approves headline subject to caveat',
    summary: 'Legal · legal sign-off · Direct to comms. Headline rate approved with a required caveat on promotional terms.',
    impactChips: ['+1 claim', '+1 open question', '+1 observation'],
    relatedIds: ['n_iss06'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Legal · Document type: legal sign-off · Route: Direct to comms · Received 14:30 · Added to Metis 14:30',
      },
      {
        heading: 'SUMMARY',
        body: 'Legal team approves the headline rate for use in customer-facing communications, subject to the inclusion of a mandatory caveat regarding the promotional nature of the rate and the conditions under which it applies.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nClaim: Headline approved with caveat (eeee2005)\nOpen question: Is the caveat wording finalised? (eeee3003)\nObservation: Legal sign-off received (eeee4001)',
      },
    ],
  },

  // ISSUE: Record updated from Legal caveat (Wed 10 Jun, 14:30)
  {
    id: 'n_iss06',
    lane: 'issue',
    day: 'Wed 10 Jun',
    time: '14:30',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Legal caveat',
    summary: '+1 claims · +1 open questions · +1 observations',
    relatedIds: ['n_in05'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following legal sign-off on the headline rate with a required caveat.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nLinked source: eeee1004 (legal sign-off)\nClaim added: Headline approved with caveat (eeee2005)\nGap opened: Caveat wording to be finalised (eeee3003)\nObservation added: Legal sign-off received (eeee4001)',
      },
    ],
  },

  // ─── THU 11 JUN ────────────────────────────────────────────────

  // INPUT: Customer operations requests approved agent line (Thu 11 Jun, 10:00)
  {
    id: 'n_in06',
    lane: 'input',
    day: 'Thu 11 Jun',
    time: '10:00',
    badgeLabel: 'CUSTOMER OPS',
    title: 'Customer operations requests approved agent line',
    summary: 'Customer Operations · ops request · Direct to comms. Agent-facing holding line needed before customer message is published.',
    impactChips: ['+1 claim', '+1 open question', '+1 observation'],
    relatedIds: ['n_iss07'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Customer Operations · Document type: ops request · Route: Direct to comms · Received 10:00 · Added to Metis 10:00',
      },
      {
        heading: 'SUMMARY',
        body: 'Customer Operations requests that an approved agent line be prepared before the customer-facing message is published. Agents need a consistent holding response for enquiries about the new savings product.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nClaim: Agent line required before customer message (eeee2006)\nOpen question: What is the approved agent holding line? (eeee3005)\nObservation: Customer ops request received (eeee4004)',
      },
    ],
  },

  // ISSUE: Record updated from Agent line needed (Thu 11 Jun, 10:00)
  {
    id: 'n_iss07',
    lane: 'issue',
    day: 'Thu 11 Jun',
    time: '10:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Agent line needed',
    summary: '+1 claims · +1 open questions · +1 observations',
    relatedIds: ['n_in06'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the Customer Operations request for an approved agent holding line.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nLinked source: eeee1005 (ops request)\nClaim added: Agent line required before customer message (eeee2006)\nGap opened: Approved agent holding line needed (eeee3005)\nObservation added: Customer ops request received (eeee4004)',
      },
    ],
  },

  // OUTPUT: Customer message variant V1 (Thu 11 Jun, 12:00)
  {
    id: 'n_out01',
    lane: 'output',
    day: 'Thu 11 Jun',
    time: '12:00',
    badgeLabel: 'PASSENGER MESSAGE',
    title: 'Customer message variant V1',
    summary: 'Audience: Customers \u00b7 Status: Approved. First customer-facing message variant generated from the issue record.',
    audience: 'Customers',
    outputStatus: 'Approved',
    wordingModeDefault: 'ai_polished',
    draftBody: `We're preparing a new savings product called Green Saver. It will be available to eligible customers — we'll confirm details closer to launch. We'll share more information once plans are finalised.`,
    aiPolishedBody: `We're preparing a new savings product called Green Saver. It will be available to eligible customers — we'll confirm key details closer to launch. We'll share more information once plans are finalised.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-06-11T11:00:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: ['Do not quote the launch rate.', 'Do not say the product is available now.'],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not quote the launch rate.', 'Do not say the product is available now.'],
    relatedIds: ['n_in01', 'n_in04', 'n_in05'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Customer message variant V1 — generated from the issue record at Thu 11 Jun 12:00.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Customers',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'SOURCES USED',
        body: 'Product launch scope (eeee1001) · Compliance review (eeee1003) · Legal sign-off (eeee1004)\nClaims: Product rate confirmed (eeee2001) · Eligibility criteria confirmed (eeee2002) · Eligibility wording requires clarification (eeee2004) · Headline approved with caveat (eeee2005)',
      },
    ],
  },

  // OUTPUT: Internal staff message V1 (Thu 11 Jun, 15:00)
  {
    id: 'n_out02',
    lane: 'output',
    day: 'Thu 11 Jun',
    time: '15:00',
    badgeLabel: 'STAFF HOLDING UPDATE',
    title: 'Internal staff message V1',
    summary: 'Audience: Internal staff and customer-facing colleagues \u00b7 Status: Ready for review.',
    audience: 'Internal staff and customer-facing colleagues',
    outputStatus: 'Ready for review',
    wordingModeDefault: 'ai_polished',
    draftBody: `Internal staff message \u2014 Green Saver (V1)
If asked by customers / colleagues
- Northbank is preparing a new savings product called Green Saver linked to greener home improvements.
- It is intended for eligible savings customers \u2014 not all customers.
- We cannot confirm the launch rate, final eligibility wording or app availability yet.
- Direct customers to our published channels once the announcement is authorised.
Assisted digital
- Include telephone and branch support routes; do not describe this as app-only.
Do not say
- Quote a launch rate.
- That customers can apply today.`,
    aiPolishedBody: `Internal staff message \u2014 Green Saver (V1)
If asked by customers / colleagues
- Northbank is preparing a new savings product called Green Saver, linked to greener home improvements.
- It is intended for eligible savings customers \u2014 not all customers.
- We cannot confirm the launch rate, final eligibility wording or app availability yet.
- Direct customers to our published channels once the announcement is authorised.
Assisted digital
- Include telephone and branch support routes; do not describe this as app-only.
Do not say
- Quote a launch rate.
- That customers can apply today.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-06-11T14:00:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Pricing committee and app release approvals not yet in Metis.',
        'Do not quote 4.25% or any launch rate.',
        'Do not say customers can apply via the app yet.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not quote the launch rate.', 'Do not say customers can apply today.'],
    relatedIds: ['n_in01', 'n_in04', 'n_in05', 'n_in06'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Internal staff message V1 — generated from the issue record at Thu 11 Jun 15:00.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Internal staff and customer-facing colleagues',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'SOURCES USED',
        body: 'Product launch scope (eeee1001) · Compliance review (eeee1003) · Legal sign-off (eeee1004) · Customer ops request (eeee1005)\nClaims: Product rate confirmed (eeee2001) · Eligibility criteria confirmed (eeee2002) · Eligibility wording requires clarification (eeee2004) · Headline approved with caveat (eeee2005) · Agent line required (eeee2006)',
      },
    ],
  },

  // ─── FRI 12 JUN ────────────────────────────────────────────────

  // INPUT: Accessibility review asks for alternative support wording (Fri 12 Jun, 09:30)
  {
    id: 'n_in07',
    lane: 'input',
    day: 'Fri 12 Jun',
    time: '09:30',
    badgeLabel: 'ACCESSIBILITY REVIEW',
    title: 'Accessibility review asks for alternative support wording',
    summary: 'Accessibility and Inclusion · accessibility review · Direct to comms. Current draft wording does not meet accessibility standards.',
    impactChips: ['+1 claim', '+1 open question'],
    relatedIds: ['n_iss08'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Accessibility and Inclusion · Document type: accessibility review · Route: Direct to comms · Received 09:30 · Added to Metis 09:30',
      },
      {
        heading: 'SUMMARY',
        body: 'Accessibility and Inclusion team flags that the current draft customer message does not include adequate alternative support wording for customers who may need additional assistance. A revised version is required before publication.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened\nClaim: Alternative support wording required (eeee2007)\nOpen question: What is the approved accessibility wording? (eeee3006)',
      },
    ],
  },

  // ISSUE: Record updated from Accessibility wording (Fri 12 Jun, 09:30)
  {
    id: 'n_iss08',
    lane: 'issue',
    day: 'Fri 12 Jun',
    time: '09:30',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Accessibility wording',
    summary: '+1 claims · +1 open questions',
    relatedIds: ['n_in07'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the accessibility review flagging alternative support wording requirements.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened\nLinked source: eeee1006 (accessibility review)\nClaim added: Alternative support wording required (eeee2007)\nGap opened: Approved accessibility wording needed (eeee3006)',
      },
    ],
  },

  // ─── MON 15 JUN ────────────────────────────────────────────────

  // INPUT: App release dependency still open (Mon 15 Jun, 09:00)
  {
    id: 'n_in08',
    lane: 'input',
    day: 'Mon 15 Jun',
    time: '09:00',
    badgeLabel: 'DIGITAL READINESS',
    title: 'App release dependency still open',
    summary: 'Digital Product · release status · Direct to comms. App release not yet approved; dependency remains open.',
    impactChips: ['+1 claim', '+1 open question', '+1 observation'],
    relatedIds: ['n_iss09'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Digital Product · Document type: release status · Route: Direct to comms · Received 09:00 · Added to Metis 09:00',
      },
      {
        heading: 'SUMMARY',
        body: 'Digital Product team confirms that the app release required for the Green Saver product is not yet approved. The dependency remains open and may affect the launch timeline.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nClaim: App release dependency unresolved (eeee2008)\nOpen question: When will the app release be approved? (eeee3004)\nObservation: Digital readiness status received (eeee4006)',
      },
    ],
  },

  // ISSUE: Record updated from App dependency open (Mon 15 Jun, 09:00)
  {
    id: 'n_iss09',
    lane: 'issue',
    day: 'Mon 15 Jun',
    time: '09:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from App dependency open',
    summary: '+1 claims · +1 open questions · +1 observations',
    relatedIds: ['n_in08'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the Digital Product team\'s report that the app release dependency remains open.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · +1 open question opened · +1 observation added\nLinked source: eeee1007 (release status)\nClaim added: App release dependency unresolved (eeee2008)\nGap opened: App release approval needed (eeee3004)\nObservation added: Digital readiness status received (eeee4006)',
      },
    ],
  },

  // INPUT: Executive office requests launch readiness brief (Mon 15 Jun, 11:15)
  {
    id: 'n_in09',
    lane: 'input',
    day: 'Mon 15 Jun',
    time: '11:15',
    badgeLabel: 'EXEC REQUEST',
    title: 'Executive office requests launch readiness brief',
    summary: 'Executive Office · email to Corporate Affairs · Direct to comms. Senior leadership requests a consolidated readiness brief.',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Executive Office · Document type: email to Corporate Affairs · Route: Direct to comms · Received 11:15 · Added to Metis 11:15',
      },
      {
        heading: 'SUMMARY',
        body: 'The Executive Office requests that Corporate Affairs prepare a consolidated launch readiness brief for senior leadership, covering the current state of the issue record, open questions, and the controlled position.',
      },
    ],
  },

  // ISSUE: Issue status — Executive readiness brief requested (Mon 15 Jun, 11:15)
  {
    id: 'n_iss10',
    lane: 'issue',
    day: 'Mon 15 Jun',
    time: '11:15',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Executive readiness brief requested',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'STATUS',
        body: 'Executive readiness brief requested. Metis will generate a consolidated brief from the current issue record.',
      },
    ],
  },

  // OUTPUT: Executive brief V1 (Mon 15 Jun, 11:45)
  {
    id: 'n_out03',
    lane: 'output',
    day: 'Mon 15 Jun',
    time: '11:45',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Executive brief V1',
    summary: 'Audience: Senior leadership · Status: Ready for review. Pre-approval readiness position.',
    audience: 'Senior leadership',
    outputStatus: 'Ready for review',
    supersededBy: 'n_out05',
    relatedIds: ['n_in01', 'n_in03', 'n_in04', 'n_in05', 'n_in06', 'n_in07', 'n_in08'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Executive brief V1 — generated from the issue record at Mon 15 Jun 11:45. Pre-approval readiness position.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Senior leadership',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'NOTE',
        body: 'This version was superseded by Executive brief V2 following pricing committee and digital approvals on Thu 18 Jun.',
      },
      {
        heading: 'SOURCES USED',
        body: 'All sources logged to date: product scope · pricing paper · compliance review · legal sign-off · customer ops request · accessibility review · digital readiness status',
      },
    ],
  },

  // ISSUE: Circulation — Circulated (Mon 15 Jun, 12:00)
  {
    id: 'n_iss11',
    lane: 'issue',
    day: 'Mon 15 Jun',
    time: '12:00',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Circulated',
    summary: 'Executive brief V1 — pre-approval readiness position.',
    relatedIds: ['n_out03'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'Executive brief V1 circulated to senior leadership via leadership distribution channel.',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'NOTE',
        body: 'Executive brief V1 — pre-approval readiness position.',
      },
    ],
  },

  // ─── TUE 16 JUN ────────────────────────────────────────────────

  // INPUT: Green home partner content confirmed (Tue 16 Jun, 10:00)
  {
    id: 'n_in10',
    lane: 'input',
    day: 'Tue 16 Jun',
    time: '10:00',
    badgeLabel: 'PARTNER UPDATE',
    title: 'Green home partner content confirmed',
    summary: 'Partnerships · partner sign-off · Direct to comms. Partner content for the Green Saver campaign confirmed.',
    relatedIds: ['n_iss12'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Partnerships · Document type: partner sign-off · Route: Direct to comms · Received 10:00 · Added to Metis 10:00',
      },
      {
        heading: 'SUMMARY',
        body: 'Partnerships team confirms that the green home partner content for the Green Saver campaign has been approved and is ready for use in customer-facing communications.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: 'Issue record updated — partner content logged.',
      },
    ],
  },

  // ISSUE: Record updated from Partner copy (Tue 16 Jun, 10:00)
  {
    id: 'n_iss12',
    lane: 'issue',
    day: 'Tue 16 Jun',
    time: '10:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Partner copy',
    summary: 'Issue record updated',
    relatedIds: ['n_in10'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following confirmation of the green home partner content.',
      },
      {
        heading: 'IMPACT',
        body: 'Linked source: eeee1008 (partner sign-off)\nNo new claims, gaps, or observations — partner content logged as supporting source.',
      },
    ],
  },

  // ─── WED 17 JUN ────────────────────────────────────────────────

  // INPUT: Trade journalist asks about upcoming savings launch (Wed 17 Jun, 09:30)
  {
    id: 'n_in11',
    lane: 'input',
    day: 'Wed 17 Jun',
    time: '09:30',
    badgeLabel: 'MEDIA ENQUIRY',
    title: 'Trade journalist asks about upcoming savings launch',
    summary: 'Press Office · media enquiry log · Direct to comms. Trade journalist enquiry triggers a press holding line.',
    impactChips: ['+1 observation'],
    relatedIds: ['n_iss13'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Press Office · Document type: media enquiry log · Route: Direct to comms · Received 09:30 · Added to Metis 09:30',
      },
      {
        heading: 'SUMMARY',
        body: 'A trade journalist has contacted the Press Office asking about the upcoming savings product launch. The enquiry is logged in Metis and triggers the generation of a press holding line.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 observation added\nObservation: Trade press enquiry received (eeee4005)',
      },
    ],
  },

  // ISSUE: Record updated from Trade press enquiry (Wed 17 Jun, 09:30)
  {
    id: 'n_iss13',
    lane: 'issue',
    day: 'Wed 17 Jun',
    time: '09:30',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Trade press enquiry',
    summary: '+1 observations',
    relatedIds: ['n_in11'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the trade journalist enquiry logged by the Press Office.',
      },
      {
        heading: 'IMPACT',
        body: '+1 observation added\nLinked source: eeee1009 (media enquiry log)\nObservation added: Trade press enquiry received (eeee4005)',
      },
    ],
  },

  // OUTPUT: Press holding message variant (Wed 17 Jun, 10:00)
  {
    id: 'n_out04',
    lane: 'output',
    day: 'Wed 17 Jun',
    time: '10:00',
    badgeLabel: 'HOLDING PRESS LINE',
    title: 'Press holding message variant',
    summary: 'Audience: Media / press office \u00b7 Status: Ready for review.',
    audience: 'Media / press office',
    outputStatus: 'Ready for review',
    wordingModeDefault: 'ai_polished',
    draftBody: `Northbank Building Society is always reviewing its savings range for customers.
We do not comment on speculation about future products or pricing.
When we have something to announce we will inform customers and media through our usual channels.`,
    aiPolishedBody: `Northbank Building Society is always reviewing its savings range for customers.
We do not comment on speculation about future products or pricing.
When we have something to announce, we will inform customers and media through our usual channels.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-06-17T09:00:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Go/no-go not recorded in Metis at generation \u2014 holding line only.',
        'Do not confirm Green Saver launch.',
        'Do not quote rate or eligibility.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not confirm Green Saver launch.', 'Do not quote rate or eligibility.'],
    relatedIds: ['n_in11', 'n_in05', 'n_in04'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Press holding message variant — generated from the issue record at Wed 17 Jun 10:00.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Media / press office',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'SOURCES USED',
        body: 'Trade journalist enquiry (eeee1009) · Legal sign-off (eeee1004) · Compliance review (eeee1003)\nClaims: Eligibility wording requires clarification (eeee2004) · Headline approved with caveat (eeee2005)',
      },
    ],
  },

  // ISSUE: Circulation — Shared for review (Wed 17 Jun, 10:30)
  {
    id: 'n_iss14',
    lane: 'issue',
    day: 'Wed 17 Jun',
    time: '10:30',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Shared for review',
    summary: 'Press holding variant after trade journalist enquiry.',
    relatedIds: ['n_out04'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'Press holding variant shared for review with press office via press office channel.',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'NOTE',
        body: 'Press holding variant after trade journalist enquiry.',
      },
    ],
  },

  // ─── THU 18 JUN ────────────────────────────────────────────────

  // INPUT: App release approved for launch (Thu 18 Jun, 10:30)
  {
    id: 'n_in12',
    lane: 'input',
    day: 'Thu 18 Jun',
    time: '10:30',
    badgeLabel: 'DIGITAL APPROVAL',
    title: 'App release approved for launch',
    summary: 'Digital Product · release approval · Direct to comms. App release dependency resolved.',
    impactChips: ['1 question closed'],
    relatedIds: ['n_iss15'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Digital Product · Document type: release approval · Route: Direct to comms · Received 10:30 · Added to Metis 10:30',
      },
      {
        heading: 'SUMMARY',
        body: 'Digital Product team confirms that the app release has been approved. The open dependency from Mon 15 Jun is now resolved.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '1 question closed\nGap closed: App release approval needed (eeee3004) — now resolved',
      },
    ],
  },

  // ISSUE: Record updated from App approved (Thu 18 Jun, 10:30)
  {
    id: 'n_iss15',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '10:30',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from App approved',
    summary: '1 questions closed',
    relatedIds: ['n_in12'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the app release approval from Digital Product.',
      },
      {
        heading: 'IMPACT',
        body: '1 open question closed\nLinked source: eeee1010 (release approval)\nGap closed: App release approval needed (eeee3004)',
      },
    ],
  },

  // INPUT: Pricing committee confirms launch rate (Thu 18 Jun, 11:45)
  {
    id: 'n_in13',
    lane: 'input',
    day: 'Thu 18 Jun',
    time: '11:45',
    badgeLabel: 'PRICING APPROVAL',
    title: 'Pricing committee confirms launch rate',
    summary: 'Commercial Pricing · committee minute · Direct to comms. Final launch rate confirmed by pricing committee.',
    impactChips: ['+1 claim', '2 questions closed'],
    relatedIds: ['n_iss16', 'n_iss17'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Commercial Pricing · Document type: committee minute · Route: Direct to comms · Received 11:45 · Added to Metis 11:45',
      },
      {
        heading: 'SUMMARY',
        body: 'The Pricing Committee formally confirms the launch rate for the Green Saver product. This resolves the open pricing question and closes two outstanding gaps in the issue record.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · 2 questions closed\nClaim: Launch rate confirmed by committee (eeee2009)\nGaps closed: Rate competitiveness question (eeee3001) · Approved eligibility wording (eeee3002)',
      },
    ],
  },

  // ISSUE: Record updated from Pricing approved (Thu 18 Jun, 11:45)
  {
    id: 'n_iss16',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '11:45',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Pricing approved',
    summary: '+1 claims · 2 questions closed',
    relatedIds: ['n_in13'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the pricing committee confirmation of the launch rate.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · 2 open questions closed\nLinked source: eeee1011 (committee minute)\nClaim added: Launch rate confirmed by committee (eeee2009)\nGaps closed: Rate competitiveness question (eeee3001) · Approved eligibility wording (eeee3002)',
      },
    ],
  },

  // ISSUE: Issue status — Pricing and eligibility approved (Thu 18 Jun, 11:45)
  {
    id: 'n_iss17',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '11:45',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Pricing and eligibility approved',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'STATUS',
        body: 'Pricing and eligibility approved. The issue record now reflects confirmed rate and eligibility criteria.',
      },
    ],
  },

  // OUTPUT: Executive brief V2 (Thu 18 Jun, 12:15)
  {
    id: 'n_out05',
    lane: 'output',
    day: 'Thu 18 Jun',
    time: '12:15',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Executive brief V2',
    summary: 'Audience: Senior leadership · Status: Approved. Supersedes V1 after pricing and digital approvals.',
    audience: 'Senior leadership',
    outputStatus: 'Approved',
    relatedIds: ['n_in01', 'n_in12', 'n_in13', 'n_in11'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Executive brief V2 — generated from the issue record at Thu 18 Jun 12:15. Supersedes V1.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Senior leadership',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'CHANGES FROM V1',
        body: 'Updated following pricing committee approval and app release confirmation. Rate and eligibility now confirmed. Digital dependency resolved.',
      },
      {
        heading: 'SOURCES USED',
        body: 'Product scope (eeee1001) · Pricing approval (eeee1011) · App release (eeee1010) · Trade enquiry (eeee1009)\nKey claims: Launch rate confirmed (eeee2009) · App dependency resolved (eeee2008) · Headline approved (eeee2005)',
      },
    ],
  },

  // ISSUE: Compare executive brief versions (Thu 18 Jun, 12:20)
  {
    id: 'n_iss18',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '12:20',
    badgeLabel: 'COMPARE',
    title: 'Compare executive brief versions',
    summary: 'V1 → V2 after pricing and digital approvals',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'COMPARISON',
        body: 'V1 → V2: Updated following pricing committee approval (Thu 18 Jun) and app release confirmation (Thu 18 Jun). Rate and eligibility confirmed. Digital dependency resolved.',
      },
    ],
  },

  // ISSUE: Circulation — Circulated (Thu 18 Jun, 12:30)
  {
    id: 'n_iss19',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '12:30',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Circulated',
    summary: 'Executive brief V2 — supersedes V1 after pricing and digital approvals.',
    relatedIds: ['n_out05'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'Executive brief V2 circulated to senior leadership. Supersedes V1.',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'NOTE',
        body: 'Executive brief V2 — supersedes V1 after pricing and digital approvals.',
      },
    ],
  },

  // OUTPUT: Customer message variant V2 (Thu 18 Jun, 13:00)
  {
    id: 'n_out06',
    lane: 'output',
    day: 'Thu 18 Jun',
    time: '13:00',
    badgeLabel: 'PASSENGER MESSAGE',
    title: 'Customer message variant V2',
    summary: 'Audience: Customers \u00b7 Status: Approved. Updated with confirmed rate and approved accessibility wording.',
    audience: 'Customers',
    outputStatus: 'Approved',
    wordingModeDefault: 'ai_polished',
    draftBody: `Green Saver is a new savings product from Northbank Building Society, designed for eligible customers who want to save towards energy-efficient home improvements. The launch rate is 4.25% gross/AER for eligible balances within product limits, subject to our terms. Full eligibility details will be available at launch. Customers can apply via our app, online banking, branch or telephone service when the product is available. If you need support, telephone and branch routes are available.`,
    aiPolishedBody: `Green Saver is a new savings product from Northbank Building Society, designed for eligible customers saving towards energy-efficient home improvements. The launch rate is 4.25% gross/AER for eligible balances within product limits, subject to our terms. Full eligibility details will be available at launch. Customers can apply via our app, online banking, branch or telephone service when the product is available. Telephone and branch support routes are available if you need them.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-06-18T12:00:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: ['Do not imply regulatory endorsement of green outcomes.'],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not imply regulatory endorsement of green outcomes.'],
    relatedIds: ['n_in13', 'n_in12', 'n_in01', 'n_in07'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Customer message variant V2 — generated from the issue record at Thu 18 Jun 13:00.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Customers',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'CHANGES FROM V1',
        body: 'Updated with confirmed launch rate, approved eligibility wording, and accessibility support wording.',
      },
      {
        heading: 'SOURCES USED',
        body: 'Pricing approval (eeee1011) · App release (eeee1010) · Product scope (eeee1001) · Accessibility review (eeee1006)\nKey claims: Launch rate confirmed (eeee2009) · App dependency resolved (eeee2008) · Product rate confirmed (eeee2001) · Alternative support wording required (eeee2007)',
      },
    ],
  },

  // ISSUE: Circulation — Published (Thu 18 Jun, 13:15)
  {
    id: 'n_iss20',
    lane: 'issue',
    day: 'Thu 18 Jun',
    time: '13:15',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Published',
    summary: 'Customer message variant V2 with approved rate and channels.',
    relatedIds: ['n_out06'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'Customer message variant V2 published via website and app.',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'NOTE',
        body: 'Customer message variant V2 with approved rate and channels.',
      },
    ],
  },

  // ─── FRI 19 JUN ────────────────────────────────────────────────

  // INPUT: Launch approved for announcement (Fri 19 Jun, 09:00)
  {
    id: 'n_in14',
    lane: 'input',
    day: 'Fri 19 Jun',
    time: '09:00',
    badgeLabel: 'GO NO-GO',
    title: 'Launch approved for announcement',
    summary: 'Launch Steering Group · go/no-go record · Direct to comms. Go decision recorded. Launch approved for announcement.',
    impactChips: ['+1 claim', '1 question closed', 'status updated'],
    relatedIds: ['n_iss21', 'n_iss22'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Launch Steering Group · Document type: go/no-go record · Route: Direct to comms · Received 09:00 · Added to Metis 09:00',
      },
      {
        heading: 'SUMMARY',
        body: 'The Launch Steering Group records the go decision. The Northbank Green Saver product is approved for announcement. All outstanding dependencies have been resolved.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 claim added · 1 question closed · Status updated\nClaim: Launch approved for announcement (eeee2010)\nGap closed: Agent holding line question (eeee3005)\nStatus note: Launch approved for announcement',
      },
    ],
  },

  // ISSUE: Record updated from Go for launch (Fri 19 Jun, 09:00)
  {
    id: 'n_iss21',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '09:00',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Go for launch',
    summary: '+1 claims · 1 questions closed · status updated',
    relatedIds: ['n_in14'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the go/no-go decision from the Launch Steering Group.',
      },
      {
        heading: 'IMPACT',
        body: '+1 claim added · 1 open question closed · Status updated\nLinked source: eeee1012 (go/no-go record)\nClaim added: Launch approved for announcement (eeee2010)\nGap closed: Agent holding line question (eeee3005)\nStatus note: Launch approved for announcement',
      },
    ],
  },

  // ISSUE: Issue status — Launch approved for announcement (Fri 19 Jun, 09:00)
  {
    id: 'n_iss22',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '09:00',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Launch approved for announcement',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'STATUS',
        body: 'Launch approved for announcement. All outstanding dependencies resolved. Go decision recorded.',
      },
    ],
  },

  // OUTPUT: Stakeholder message variant (Fri 19 Jun, 09:30)
  {
    id: 'n_out07',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '09:30',
    badgeLabel: 'STAKEHOLDER NOTE',
    title: 'Stakeholder message variant',
    summary: 'Audience: Internal leadership and selected external stakeholders \u00b7 Status: Approved.',
    audience: 'Internal leadership and selected external stakeholders',
    outputStatus: 'Approved',
    wordingModeDefault: 'ai_polished',
    draftBody: `Stakeholder message \u2014 Green Saver launch (post go/no-go)

Northbank Building Society is launching Green Saver, a savings product for eligible customers linked to saving towards energy-efficient home improvements.
The launch rate is 4.25% gross/AER for eligible balances within published limits.
Launch proceeds in line with the agreed window following steering group go/no-go.
We will use careful, factual wording on the 'green' proposition and avoid overclaiming outcomes.
We will monitor customer, media and digital journey feedback during the first 72 hours after announcement.`,
    aiPolishedBody: `Stakeholder message \u2014 Green Saver launch (post go/no-go)

Northbank Building Society is launching Green Saver, a savings product for eligible customers to help them save towards energy-efficient home improvements.
The launch rate is 4.25% gross/AER for eligible balances within published limits.
Launch proceeds in line with the agreed window following steering group go/no-go.
We will use careful, factual wording on the 'green' proposition and avoid overclaiming outcomes.
We will monitor customer, media and digital journey feedback during the first 72 hours after announcement.`,
    aiPolish: {
      enabled: true,
      preparedAt: '2026-06-19T08:30:00.000Z',
      label: 'AI-polished wording',
      summary: 'Second-pass wording polish for clarity and tone, without changing facts or constraints.',
      preservedConstraints: [
        'Do not imply endorsement of individual suppliers or partners.',
        'Do not overclaim environmental outcomes; keep wording factual and caveated.',
      ],
      changed: ['Tightened phrasing', 'Improved readability', 'Kept point-in-time caveats and constraints'],
    },
    doNotSay: ['Do not imply endorsement of individual suppliers or partners.', 'Do not overclaim environmental outcomes.'],
    relatedIds: ['n_in14', 'n_in13', 'n_in01'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Stakeholder message variant — generated from the issue record at Fri 19 Jun 09:30.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Internal leadership and selected external stakeholders',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'SOURCES USED',
        body: 'Go/no-go record (eeee1012) · Pricing approval (eeee1011) · Product scope (eeee1001)\nKey claims: Launch approved (eeee2010) · Launch rate confirmed (eeee2009) · Product rate confirmed (eeee2001)',
      },
    ],
  },

  // INPUT: Post-launch watchlist requested (Fri 19 Jun, 10:15)
  {
    id: 'n_in15',
    lane: 'input',
    day: 'Fri 19 Jun',
    time: '10:15',
    badgeLabel: 'EXEC ACTION',
    title: 'Post-launch watchlist requested',
    summary: 'Corporate Affairs Director · director note · Direct to comms. Director requests a post-launch watchlist brief.',
    impactChips: ['+1 open question', '+1 observation'],
    relatedIds: ['n_iss23'],
    fullRecord: [
      {
        heading: 'SUBMISSION',
        body: 'Source: Corporate Affairs Director · Document type: director note · Route: Direct to comms · Received 10:15 · Added to Metis 10:15',
      },
      {
        heading: 'SUMMARY',
        body: 'The Corporate Affairs Director requests that a post-launch watchlist brief be prepared, covering the key risks and monitoring points for the period following the Green Saver announcement.',
      },
      {
        heading: 'ISSUE RECORD IMPACT',
        body: '+1 open question opened · +1 observation added\nOpen question: What are the post-launch monitoring priorities? (eeee3007)\nObservation: Director note received (eeee4003)',
      },
    ],
  },

  // ISSUE: Record updated from Watchlist requested (Fri 19 Jun, 10:15)
  {
    id: 'n_iss23',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '10:15',
    badgeLabel: 'RECORD UPDATED',
    title: 'Issue record updated from Watchlist requested',
    summary: '+1 open questions · +1 observations',
    relatedIds: ['n_in15'],
    fullRecord: [
      {
        heading: 'RECORD ACTION',
        body: 'Metis updated the issue record following the Corporate Affairs Director\'s request for a post-launch watchlist brief.',
      },
      {
        heading: 'IMPACT',
        body: '+1 open question opened · +1 observation added\nGap opened: Post-launch monitoring priorities (eeee3007)\nObservation added: Director note received (eeee4003)',
      },
    ],
  },

  // OUTPUT: Post-launch watchlist brief (Fri 19 Jun, 10:30)
  {
    id: 'n_out08',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '10:30',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Post-launch watchlist brief',
    summary: 'Audience: Corporate Affairs and leadership · Status: Ready for review.',
    audience: 'Corporate Affairs and leadership',
    outputStatus: 'Ready for review',
    relatedIds: ['n_in14'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Post-launch watchlist brief — generated from the issue record at Fri 19 Jun 10:30.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Corporate Affairs and leadership',
      },
      {
        heading: 'STATUS',
        body: 'Ready for review',
      },
      {
        heading: 'SOURCES USED',
        body: 'Go/no-go record (eeee1012) · Launch approved claim (eeee2010)',
      },
    ],
  },

  // OUTPUT: Exported executive brief (Fri 19 Jun, 11:00)
  {
    id: 'n_out09',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '11:00',
    badgeLabel: 'EXECUTIVE BRIEF',
    title: 'Exported executive brief',
    summary: 'Audience: Leadership circulation · Status: Approved. HTML export for leadership circulation.',
    audience: 'Leadership circulation',
    outputStatus: 'Approved',
    relatedIds: ['n_in14', 'n_in13'],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Exported executive brief — HTML export generated at Fri 19 Jun 11:00.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Leadership circulation',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'NOTE',
        body: 'HTML export of executive brief V2 for leadership circulation.',
      },
    ],
  },

  // ISSUE: Circulation — Exported (Fri 19 Jun, 11:05)
  {
    id: 'n_iss24',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '11:05',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Exported',
    summary: 'HTML export of executive brief V2 for leadership circulation.',
    relatedIds: ['n_out09'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'HTML export of executive brief V2 exported via leadership pack channel.',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
    ],
  },

  // ISSUE: Issue status — Circulation audit recorded (Fri 19 Jun, 11:15)
  {
    id: 'n_iss25',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '11:15',
    badgeLabel: 'DECISION',
    title: 'Issue status',
    summary: 'Circulation audit recorded',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'STATUS',
        body: 'Circulation audit recorded. All outputs and circulation events have been logged in the governance record.',
      },
    ],
  },

  // ISSUE: Circulation — Audit recorded (Fri 19 Jun, 11:15)
  {
    id: 'n_iss26',
    lane: 'issue',
    day: 'Fri 19 Jun',
    time: '11:15',
    badgeLabel: 'CIRCULATION',
    title: 'Circulation · Audit recorded',
    summary: 'Circulation audit for Green Saver launch readiness outputs.',
    relatedIds: ['n_out10'],
    fullRecord: [
      {
        heading: 'CIRCULATION',
        body: 'Circulation audit for Green Saver launch readiness outputs recorded in governance log.',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
    ],
  },

  // OUTPUT: Circulation audit (Fri 19 Jun, 11:15)
  {
    id: 'n_out10',
    lane: 'output',
    day: 'Fri 19 Jun',
    time: '11:15',
    badgeLabel: 'CIRCULATION AUDIT',
    title: 'Circulation audit',
    summary: 'Audience: Governance record · Status: Approved. Full audit of all outputs and circulation events.',
    audience: 'Governance record',
    outputStatus: 'Approved',
    relatedIds: [],
    fullRecord: [
      {
        heading: 'OUTPUT',
        body: 'Circulation audit — governance record generated at Fri 19 Jun 11:15.',
      },
      {
        heading: 'AUDIENCE',
        body: 'Governance record',
      },
      {
        heading: 'STATUS',
        body: 'Approved',
      },
      {
        heading: 'SCOPE',
        body: 'Full audit of all outputs and circulation events for the Northbank Green Saver launch readiness issue record.',
      },
    ],
  },

];
