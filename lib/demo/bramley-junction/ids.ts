/** Deterministic UUIDs for the Bramley Junction demo issue (fictional UK rail scenario). */

export const BRAMLEY_DEMO_SLUG = "demo-bramley-junction";

export const BRAMLEY_ISSUE_ID = "dddddddd-dddd-4ddd-addd-dddddddddd01";

export const BRAMLEY_INPUT_IDS = {
  /** Corporate Affairs logs overnight material from the 05:42 duty handover into Metis. */
  overnightPackLogged: "dddd0001-0000-4000-a000-000000000001",
  socialSignal: "dddd0008-0000-4000-a000-000000000008",
  pressCall: "dddd0009-0000-4000-a000-000000000009",
  stationUpdateFlow: "dddd0010-0000-4000-a000-000000000010",
  facilitiesNote: "dddd0011-0000-4000-a000-000000000011",
  accessibilityNote: "dddd0012-0000-4000-a000-000000000012",
  opsConfirmation: "dddd0013-0000-4000-a000-000000000013",
  dutyManagerCommsBrief: "dddd0015-0000-4000-a000-000000000015",
  execPositionRequest: "dddd0016-0000-4000-a000-000000000016",
  execAction: "dddd0014-0000-4000-a000-000000000014",
} as const;

export const BRAMLEY_SOURCE_IDS = {
  opsPlan: "dddd1001-0000-4000-a000-000000000001",
  worksUpdate: "dddd1002-0000-4000-a000-000000000002",
  contractorNote: "dddd1003-0000-4000-a000-000000000003",
  stationManagerEarly: "dddd1004-0000-4000-a000-000000000004",
  securityUpdate: "dddd1005-0000-4000-a000-000000000005",
  networkOps: "dddd1006-0000-4000-a000-000000000006",
  customerTeam: "dddd1007-0000-4000-a000-000000000007",
  socialSignal: "dddd1008-0000-4000-a000-000000000008",
  pressCall: "dddd1009-0000-4000-a000-000000000009",
  stationUpdateFlow: "dddd1010-0000-4000-a000-000000000010",
  facilitiesNote: "dddd1011-0000-4000-a000-000000000011",
  accessibilityNote: "dddd1012-0000-4000-a000-000000000012",
  opsConfirmation: "dddd1013-0000-4000-a000-000000000013",
} as const;

export const BRAMLEY_CLAIM_IDS = {
  c1: "dddd2001-0000-4000-a000-000000000001",
  c2: "dddd2002-0000-4000-a000-000000000002",
  c3: "dddd2003-0000-4000-a000-000000000003",
  c4: "dddd2004-0000-4000-a000-000000000004",
  c5: "dddd2005-0000-4000-a000-000000000005",
  c6: "dddd2006-0000-4000-a000-000000000006",
  c7: "dddd2007-0000-4000-a000-000000000007",
  c8: "dddd2008-0000-4000-a000-000000000008",
  c9: "dddd2009-0000-4000-a000-000000000009",
} as const;

export const BRAMLEY_GAP_IDS = {
  ceilingSafe: "dddd3001-0000-4000-a000-000000000001",
  sideEntranceFlow: "dddd3002-0000-4000-a000-000000000002",
  trainServices: "dddd3003-0000-4000-a000-000000000003",
  publicLineShut: "dddd3004-0000-4000-a000-000000000004",
  reopeningTime: "dddd3005-0000-4000-a000-000000000005",
  accessibility: "dddd3006-0000-4000-a000-000000000006",
  followUpWorks: "dddd3007-0000-4000-a000-000000000007",
} as const;

export const BRAMLEY_OBSERVATION_IDS = {
  o1: "dddd4001-0000-4000-a000-000000000001",
  o2: "dddd4002-0000-4000-a000-000000000002",
  o3: "dddd4003-0000-4000-a000-000000000003",
  o4: "dddd4004-0000-4000-a000-000000000004",
  o5: "dddd4005-0000-4000-a000-000000000005",
  o6: "dddd4006-0000-4000-a000-000000000006",
} as const;

export const BRAMLEY_OUTPUT_IDS = {
  staffHolding: "dddd5001-0000-4000-a000-000000000001",
  passengerV1: "dddd5002-0000-4000-a000-000000000002",
  socialLine: "dddd5003-0000-4000-a000-000000000003",
  pressLine: "dddd5004-0000-4000-a000-000000000004",
  executiveV1: "dddd5005-0000-4000-a000-000000000005",
  passengerV2: "dddd5006-0000-4000-a000-000000000006",
  stakeholderNote: "dddd5007-0000-4000-a000-000000000007",
  executiveV2: "dddd5008-0000-4000-a000-000000000008",
  postIncident: "dddd5009-0000-4000-a000-000000000009",
  circulationAudit: "dddd5010-0000-4000-a000-000000000010",
} as const;

export const BRAMLEY_BRIEF_VERSION_IDS = {
  executiveV1: "dddd6001-0000-4000-a000-000000000001",
  executiveV2: "dddd6002-0000-4000-a000-000000000002",
  fullPostIncident: "dddd6003-0000-4000-a000-000000000003",
} as const;

export const BRAMLEY_MESSAGE_VARIANT_IDS = {
  staffHolding: "dddd6101-0000-4000-a000-000000000001",
  passengerV1: "dddd6102-0000-4000-a000-000000000002",
  socialLine: "dddd6103-0000-4000-a000-000000000003",
  pressLine: "dddd6104-0000-4000-a000-000000000004",
  passengerV2: "dddd6105-0000-4000-a000-000000000005",
  stakeholderNote: "dddd6106-0000-4000-a000-000000000006",
} as const;

export const BRAMLEY_COMPARISON_ID = "dddd6201-0000-4000-a000-000000000001";

export const BRAMLEY_CIRCULATION_IDS = {
  pressDraft: "dddd7001-0000-4000-a000-000000000001",
  execV1: "dddd7002-0000-4000-a000-000000000002",
  passengerV2: "dddd7003-0000-4000-a000-000000000003",
  execV2: "dddd7004-0000-4000-a000-000000000004",
  auditSummary: "dddd7005-0000-4000-a000-000000000005",
} as const;
