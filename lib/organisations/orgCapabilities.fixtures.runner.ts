import assert from "node:assert/strict";

import { membershipAllowsOrgWrite, organisationMembershipAllowsCapability } from "./orgCapabilities";

assert.equal(membershipAllowsOrgWrite("Admin"), true);
assert.equal(membershipAllowsOrgWrite("User"), true);
assert.equal(membershipAllowsOrgWrite("Viewer"), false);
assert.equal(membershipAllowsOrgWrite("Operator"), false);
assert.equal(membershipAllowsOrgWrite(""), false);

assert.equal(organisationMembershipAllowsCapability("Admin", "write"), true);
assert.equal(organisationMembershipAllowsCapability("User", "write"), true);
assert.equal(organisationMembershipAllowsCapability("Viewer", "write"), false);

console.log("orgCapabilities fixtures: ok");
