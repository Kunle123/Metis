import assert from "node:assert/strict";

import {
  MESSAGE_APPROVAL_STATUS_ORDER,
  MessageApprovalStatusSchema,
  approvalStatusDisplayLabel,
} from "@metis/shared/approvalStatus";

import { approvalStatusUiTone } from "./approvalStatusUi";

for (const s of MESSAGE_APPROVAL_STATUS_ORDER) {
  assert.ok(MessageApprovalStatusSchema.safeParse(s).success);
  const label = approvalStatusDisplayLabel(s);
  assert.ok(label.trim().length > 0);
  assert.match(approvalStatusUiTone(s), /^(draft|in_review|approved|ready|sent|superseded)$/);
}

assert.equal(MESSAGE_APPROVAL_STATUS_ORDER.length, 6);

assert.equal(MessageApprovalStatusSchema.safeParse("__nope__").success, false);

console.log("ok approvalStatus.fixtures.runner");
