import { redirect } from "next/navigation";

/** Legacy path — Settings uses `/audience-groups` as canonical. */
export default function StakeholdersPathRedirectPage() {
  redirect("/audience-groups");
}
