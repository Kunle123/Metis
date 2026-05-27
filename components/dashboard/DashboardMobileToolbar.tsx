import Link from "next/link";

import { Button } from "@/components/ui/button";

export function DashboardMobileToolbar({
  prepareOutputHref,
  prepareDisabled,
}: {
  prepareOutputHref: string;
  prepareDisabled?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button asChild size="sm" className="min-h-10 rounded-full bg-[--metis-brass] px-5 text-[0.8rem] font-medium text-[--metis-dark] hover:bg-[--metis-brass-soft]">
        <Link href="/setup">New issue</Link>
      </Button>
      {prepareDisabled ? (
        <Button type="button" size="sm" variant="outline" disabled className="min-h-10 rounded-full border-[--metis-outline-subtle]">
          Prepare output
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline" className="min-h-10 rounded-full border-[--metis-outline-subtle]">
          <Link href={prepareOutputHref}>Prepare output</Link>
        </Button>
      )}
    </div>
  );
}
