import assert from "node:assert/strict";

import { METIS_MEMBERSHIP_ROLE_ADMIN, wouldRemoveLastOrganisationAdmin } from "./membershipAdminPolicy";

assert.equal(
  wouldRemoveLastOrganisationAdmin({
    targetMembershipCurrentRole: METIS_MEMBERSHIP_ROLE_ADMIN,
    nextRole: "User",
    isDelete: false,
    totalAdminCount: 1,
  }),
  true,
);

assert.equal(
  wouldRemoveLastOrganisationAdmin({
    targetMembershipCurrentRole: METIS_MEMBERSHIP_ROLE_ADMIN,
    nextRole: "Admin",
    isDelete: false,
    totalAdminCount: 1,
  }),
  false,
);

assert.equal(
  wouldRemoveLastOrganisationAdmin({
    targetMembershipCurrentRole: METIS_MEMBERSHIP_ROLE_ADMIN,
    isDelete: true,
    totalAdminCount: 1,
  }),
  true,
);

assert.equal(
  wouldRemoveLastOrganisationAdmin({
    targetMembershipCurrentRole: METIS_MEMBERSHIP_ROLE_ADMIN,
    nextRole: "Viewer",
    isDelete: false,
    totalAdminCount: 2,
  }),
  false,
);

assert.equal(
  wouldRemoveLastOrganisationAdmin({
    targetMembershipCurrentRole: "User",
    nextRole: "Viewer",
    isDelete: false,
    totalAdminCount: 1,
  }),
  false,
);

console.log("membershipAdminPolicy fixtures: ok");
