import assert from "node:assert";

import {
  internalObservationReadableByViewer,
  normalizeObservationVisibility,
  organisationMembershipIsAdmin,
  prismaWhereInternalInputsVisibleToViewer,
} from "./internalObservationVisibility";

assert.equal(normalizeObservationVisibility(null), "Organisation");
assert.equal(normalizeObservationVisibility("Internal"), "Organisation");
assert.equal(normalizeObservationVisibility("Restricted"), "Restricted");

assert.equal(organisationMembershipIsAdmin("Admin"), true);
assert.equal(organisationMembershipIsAdmin("User"), false);

const restrictedUserAuthored = { visibility: "Restricted", createdByUserId: "u1" };

const adminViewer = { membershipRole: "Admin", userId: "any-id" };
const otherUserViewer = { membershipRole: "User", userId: "u-other" };
const authorViewer = { membershipRole: "User", userId: "u1" };
const viewerRole = { membershipRole: "Viewer", userId: "u-view" };

assert.equal(internalObservationReadableByViewer(adminViewer, restrictedUserAuthored), true);
assert.equal(internalObservationReadableByViewer(otherUserViewer, restrictedUserAuthored), false);
assert.equal(internalObservationReadableByViewer(authorViewer, restrictedUserAuthored), true);
assert.equal(internalObservationReadableByViewer(viewerRole, restrictedUserAuthored), false);

assert.equal(internalObservationReadableByViewer(viewerRole, { visibility: "Organisation", createdByUserId: null }), true);

const restrictedNoAuthor = { visibility: "Restricted", createdByUserId: null };
assert.equal(internalObservationReadableByViewer(adminViewer, restrictedNoAuthor), true);
assert.equal(internalObservationReadableByViewer(otherUserViewer, restrictedNoAuthor), false);

const whereUser = prismaWhereInternalInputsVisibleToViewer("issue-1", otherUserViewer);
assert.ok("OR" in whereUser);
const whereAdmin = prismaWhereInternalInputsVisibleToViewer("issue-1", adminViewer);
assert.equal(Object.keys(whereAdmin).length, 1);
assert.equal((whereAdmin as { issueId: string }).issueId, "issue-1");

console.log("internalObservationVisibility fixtures: OK");
