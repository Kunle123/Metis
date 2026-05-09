import assert from "node:assert/strict";

import { mapClerkOrgRoleToMetisMembershipRole, metisSlugFromClerkParts } from "./clerkOrgSync";

assert.equal(mapClerkOrgRoleToMetisMembershipRole("org:admin"), "Admin");
assert.equal(mapClerkOrgRoleToMetisMembershipRole("admin"), "Admin");
assert.equal(mapClerkOrgRoleToMetisMembershipRole("basic_member"), "User");
assert.equal(mapClerkOrgRoleToMetisMembershipRole("org:member"), "User");
assert.equal(mapClerkOrgRoleToMetisMembershipRole("org:viewer"), "Viewer");

assert.equal(metisSlugFromClerkParts({ clerkOrgId: "org_abc123", slug: "Acme Corp!" }), "acme-corp");
assert.equal(metisSlugFromClerkParts({ clerkOrgId: "org_xyz", slug: "", name: "" }).startsWith("org-"), true);

console.log("clerkSync fixtures: ok");
