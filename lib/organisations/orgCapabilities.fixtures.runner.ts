import assert from "node:assert/strict";

import {
  membershipAllowsIssueDelete,
  membershipAllowsOrgWrite,
  organisationMembershipAllowsCapability,
} from "./orgCapabilities";

assert.equal(membershipAllowsOrgWrite("Admin"), true);
assert.equal(membershipAllowsOrgWrite("User"), true);
assert.equal(membershipAllowsOrgWrite("Viewer"), false);
assert.equal(membershipAllowsOrgWrite("Operator"), false);
assert.equal(membershipAllowsOrgWrite(""), false);

assert.equal(organisationMembershipAllowsCapability("Admin", "write"), true);
assert.equal(organisationMembershipAllowsCapability("User", "write"), true);
assert.equal(organisationMembershipAllowsCapability("Viewer", "write"), false);

assert.equal(organisationMembershipAllowsCapability("Admin", "manage_users"), true);
assert.equal(membershipAllowsIssueDelete("Admin"), true);
assert.equal(membershipAllowsIssueDelete("User"), false);
assert.equal(membershipAllowsIssueDelete("Viewer"), false);
assert.equal(organisationMembershipAllowsCapability("User", "manage_users"), false);
assert.equal(organisationMembershipAllowsCapability("Viewer", "manage_users"), false);

console.log("orgCapabilities fixtures: ok");
