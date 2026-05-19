import Link from "next/link";
import { ArrowRight, Link2, Lock, PencilLine, PlusCircle } from "lucide-react";

import { SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";

const operatorRules = [
  { icon: Link2, text: "Section link required" },
  { icon: Lock, text: "Visibility set" },
  { icon: PencilLine, text: "Attributable wording" },
] as const;

export function InputGuidanceRail({ issueId }: { issueId: string }) {
  return (
    <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden xl:sticky xl:top-8 xl:self-start">
      <div className="space-y-4 px-5 py-5">
        <ReviewRailCard
          title="Operator rules"
          tone="info"
          meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Output hygiene guidance for attributable notes.</p>}
        >
          <div className="space-y-3 text-sm leading-6 text-[--metis-paper-muted]">
            {operatorRules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.text}
                  className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-t border-[--metis-outline-subtle] pt-3 first:border-t-0 first:pt-0"
                >
                  <Icon className="mt-2 h-4 w-4 text-[--metis-brass]" />
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </ReviewRailCard>

        <ReviewRailCard
          title="Current effect"
          tone="info"
          meta={
            <div className="space-y-2">
              <p className="text-sm leading-6 text-[--metis-paper-muted]">
                Material you add is stored on this issue record for attribution and structuring into sources, claims, and open questions.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Status</span>
                <Badge
                  className={[
                    "rounded-lg border border-[--metis-status-info-border] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_52%,transparent)]",
                    "text-[--metis-status-info-fg] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]",
                    "px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] whitespace-nowrap",
                  ].join(" ")}
                  title="This issue has new or edited record material compared with the last saved revision."
                >
                  Updated since last version
                </Badge>
              </div>
            </div>
          }
        >
          <div />
        </ReviewRailCard>

        <ReviewRailCard
          title="Next step"
          tone="info"
          meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Jump to related registers and outputs.</p>}
        >
          <div className="grid gap-3">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}`}>
                Issue record
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/sources`}>
                Sources
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/brief?mode=full`}>
                <PlusCircle className="h-4 w-4" />
                Open brief
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/gaps`}>
                Open questions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ReviewRailCard>
      </div>
    </SurfaceCard>
  );
}
