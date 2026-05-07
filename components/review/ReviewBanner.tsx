import { cn } from "@/lib/utils";

export type ReviewBannerTone = "warning" | "info" | "neutral";

const toneStyles: Record<ReviewBannerTone, { wrap: string; title: string; body: string }> = {
  warning: {
    wrap: "border-[--metis-status-warning-border] bg-[--metis-status-warning-bg]",
    title: "text-[--metis-status-warning-fg]",
    body: "text-[--metis-status-warning-muted]",
  },
  info: {
    wrap: "border-[--metis-info-border] bg-[--metis-info-bg]",
    title: "text-[--metis-info-soft]",
    body: "text-[--metis-paper-muted]",
  },
  neutral: {
    wrap: "border-white/10 bg-white/5",
    title: "text-[--metis-paper]",
    body: "text-[--metis-paper-muted]",
  },
};

/** Compact one-line title + body banner for review surfaces. */
export function ReviewBanner({
  title,
  body,
  tone = "warning",
  className,
}: {
  title: string;
  body: string;
  tone?: ReviewBannerTone;
  className?: string;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-full border px-4 py-2 text-xs leading-5",
        t.wrap,
        className,
      )}
    >
      <span className={cn("font-medium uppercase tracking-[0.16em]", t.title)}>{title}</span>
      <span className={cn("ml-1", t.body)}>· {body}</span>
    </div>
  );
}

