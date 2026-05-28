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
  'Product launch scope confirmed': {
    fullText: 'Green Saver — launch scope note (fictional)\n\nProduct: Green Saver — savings product linked to funding energy-efficient home improvements.\nTarget launch window: week commencing 22 June 2026 (subject to dependencies).\nIntended customers: eligible existing and new savings customers meeting published criteria.\nHeadline proposition: support greener homes through a dedicated savings rate — final wording subject to compliance/legal.\n\nShared with Corporate Affairs from the product launch pack when the readiness workstream started.',
    metisImpact: {
      linkedSource: { code: 'SRC-001', title: 'Product launch scope — Green Saver' },
      claimsAdded: [
        { code: 'CLM-001', text: 'Green Saver is planned for launch in the stated launch window (week commencing 22 June 2026, subject to dependencies).' },
        { code: 'CLM-002', text: 'The product is intended for eligible savings customers meeting published criteria.' },
      ],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-002', title: 'Positive product story needs caveats' },
      ],
    },
  },
  'Corporate Affairs opens launch readiness issue': {
    fullText: 'Corporate Affairs — launch readiness issue opened\n\nPurpose: maintain a source-backed launch position for Green Saver across leadership, customer operations, digital and media.\nDiscipline: separate confirmed claims from open questions; no external line without approved message variant.\nDependencies tracked: pricing committee, compliance eligibility wording, legal environmental claims, app release, accessibility support.',
    metisImpact: {
      statusNote: 'Launch readiness issue opened in Metis',
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-003', title: 'Leadership needs readiness not a campaign plan' },
      ],
    },
  },
  'Pricing recommendation submitted': {
    fullText: 'Pricing recommendation — Green Saver (draft)\n\nProposed launch rate: 4.25% gross/AER (fictional) for eligible balances within product limits.\nAssumptions: launch window as per product note; funding costs and competitor set as modelled 5 June.\nStatus: recommendation only — pricing committee approval required before external use.\nComms must not quote the rate externally until formal approval is recorded.',
    metisImpact: {
      linkedSource: { code: 'SRC-002', title: 'Pricing recommendation — proposed rate' },
      claimsAdded: [
        { code: 'CLM-003', text: 'A launch rate of 4.25% gross/AER was proposed pending pricing committee approval.' },
      ],
      questionsOpened: [
        { code: 'Q-001', title: 'Has pricing been formally approved?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-001', title: 'Overclaiming risk before approvals' },
      ],
    },
  },
  'Compliance review flags eligibility wording': {
    fullText: 'Compliance review — eligibility and fair value\n\nDo not state that Green Saver is available to all customers.\nEligibility criteria and exclusions require approved wording before customer-facing or media use.\nFair value summary to be attached to committee papers — not for external circulation.',
    metisImpact: {
      linkedSource: { code: 'SRC-003', title: 'Compliance review — eligibility wording' },
      claimsAdded: [
        { code: 'CLM-004', text: 'Eligibility wording requires compliance approval before external customer or media use.' },
      ],
      questionsOpened: [
        { code: 'Q-002', title: 'What eligibility wording is approved for external use?' },
      ],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Legal approves headline subject to caveat': {
    fullText: 'Legal sign-off — Green Saver narrative (conditional)\n\nBroad launch narrative approved for internal readiness use.\nEnvironmental claims must avoid overclaiming — use \'support\' / \'linked to\' language, not guaranteed outcomes.\nDo not imply regulatory endorsement of green credentials.\nExternal materials remain subject to compliance-approved eligibility wording.',
    metisImpact: {
      linkedSource: { code: 'SRC-004', title: 'Legal sign-off — environmental claims caveat' },
      claimsAdded: [
        { code: 'CLM-005', text: 'Environmental wording must avoid overclaiming and must not imply guaranteed green outcomes.' },
      ],
      questionsOpened: [
        { code: 'Q-003', title: 'What can we safely say about the green proposition?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-001', title: 'Overclaiming risk before approvals' },
      ],
    },
  },
  'Customer operations requests approved agent line': {
    fullText: 'Customer operations — agent script request\n\nContact centre needs a short approved line for inbound calls once announcement is authorised.\nAgents must not speculate on rate, eligibility or launch date until approved message variants are circulated.\nEscalation path to product specialist team to be referenced in internal staff variant.',
    metisImpact: {
      linkedSource: { code: 'SRC-005', title: 'Customer operations — agent line request' },
      claimsAdded: [
        { code: 'CLM-006', text: 'Customer operations require an approved agent line before public announcement.' },
      ],
      questionsOpened: [
        { code: 'Q-005', title: 'What line should customer operations use before launch?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-004', title: 'Ops and accessibility are launch dependencies' },
      ],
    },
  },
  'Accessibility review asks for alternative support wording': {
    fullText: 'Accessibility and inclusion review\n\nCustomer-facing materials must include assisted digital and non-digital support routes.\nDo not present app-only journeys as the only way to apply or manage the product.\nVulnerable customer considerations to be reflected in internal staff and customer variants.',
    metisImpact: {
      linkedSource: { code: 'SRC-006', title: 'Accessibility review — assisted digital wording' },
      claimsAdded: [
        { code: 'CLM-007', text: 'Assisted digital and vulnerable customer support wording must be included in launch materials.' },
      ],
      questionsOpened: [
        { code: 'Q-006', title: 'What support wording is needed for assisted digital/vulnerable customers?' },
      ],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'App release dependency still open': {
    fullText: 'Digital readiness — mobile app release\n\nGreen Saver journey build on track for target launch window.\nFinal app store / release approval not yet granted.\nComms must not state that customers can apply via the app until release approval is recorded.',
    metisImpact: {
      linkedSource: { code: 'SRC-007', title: 'Digital readiness — app release pending' },
      claimsAdded: [
        { code: 'CLM-008', text: 'Mobile app release approval is a launch dependency until formally recorded.' },
      ],
      questionsOpened: [
        { code: 'Q-004', title: 'Is the app release approved?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-006', title: 'Version compare should show approval changes' },
      ],
    },
  },
  'Executive office requests launch readiness brief': {
    fullText: 'Executive office request\n\nPlease provide a concise launch readiness brief for the leadership meeting covering:\n- confirmed position and dependencies\n- open risks and caveats\n- media and customer handling posture\n- decision points before announcement\n\nLength: maximum two pages. Audience: executive committee.',
    metisImpact: {
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Green home partner content confirmed': {
    fullText: 'Partnerships — green home signposting\n\nPartner signposting copy approved for use on approved channels.\nMust not imply endorsement of individual installers or suppliers.\nComms to use approved partner wording only — no extension of environmental claims.',
    metisImpact: {
      linkedSource: { code: 'SRC-008', title: 'Partnerships — green home signposting copy' },
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [],
    },
  },
  'Trade journalist asks about upcoming savings launch': {
    fullText: 'Media enquiry — trade press (fictional)\n\nJournalist asks whether Northbank Building Society plans a new \'green\' savings product.\nQuestions: timing, rate, eligibility, environmental positioning.\nDeadline: response requested by 16:00 today for tomorrow\'s newsletter slot.\nNo announcement authorised until go/no-go — holding line required.',
    metisImpact: {
      linkedSource: { code: 'SRC-009', title: 'Media enquiry — trade journalist' },
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-005', title: 'Trade press may force holding line' },
      ],
    },
  },
  'App release approved for launch': {
    fullText: 'Digital approval — app release\n\nFinal build approved for release in line with launch window.\nCustomers may be directed to the app journey once customer-facing messages are approved.',
    metisImpact: {
      linkedSource: { code: 'SRC-010', title: 'Digital approval — app release' },
      claimsAdded: [],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-004', title: 'Is the app release approved?' },
      ],
      observationsAdded: [],
    },
  },
  'Pricing committee confirms launch rate': {
    fullText: 'Pricing committee minute extract (fictional)\n\nLaunch rate 4.25% gross/AER approved for eligible customers within published limits.\nEligibility wording approved for external use as per compliance pack v3.\nEffective from launch date subject to go/no-go.',
    metisImpact: {
      linkedSource: { code: 'SRC-011', title: 'Pricing committee — launch rate approved' },
      claimsAdded: [
        { code: 'CLM-009', text: 'Pricing committee approved the launch rate (4.25% gross/AER) and eligibility wording for external use.' },
      ],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-001', title: 'Has pricing been formally approved?' },
        { code: 'Q-002', title: 'What eligibility wording is approved for external use?' },
      ],
      observationsAdded: [],
    },
  },
  'Launch approved for announcement': {
    fullText: 'Launch steering group — go/no-go\n\nDecision: proceed to announcement in line with approved launch window.\nConditions: latest executive brief, approved customer and stakeholder message variants, and press holding line circulated with a full audit trail.\nPost-launch monitoring for media, customer confusion, vulnerable customers and digital journey.',
    metisImpact: {
      statusNote: 'Launch approved for announcement',
      linkedSource: { code: 'SRC-012', title: 'Launch steering group — go/no-go' },
      claimsAdded: [
        { code: 'CLM-010', text: 'Launch steering group approved proceeding to announcement subject to circulated approved outputs.' },
      ],
      questionsOpened: [],
      questionsClosed: [
        { code: 'Q-005', title: 'What line should customer operations use before launch?' },
      ],
      observationsAdded: [],
    },
  },
  'Post-launch watchlist requested': {
    fullText: 'Corporate Affairs Director — post-launch watchlist\n\nPlease maintain a short leadership watchlist for the first 72 hours covering:\n- trade and consumer media pickup\n- customer confusion on eligibility or environmental claims\n- vulnerable customer and assisted digital contacts\n- digital journey defects or complaints\n\nPlease update the launch readiness record as items are confirmed or closed.',
    metisImpact: {
      claimsAdded: [],
      questionsOpened: [
        { code: 'Q-007', title: 'What should be watched in the first 72 hours after launch?' },
      ],
      questionsClosed: [],
      observationsAdded: [
        { code: 'OBS-003', title: 'Leadership needs readiness not a campaign plan' },
      ],
    },
  },
};
