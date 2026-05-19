import { Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { setupPlaceholderAttachments, setupPlaceholderTemplate } from "./setup-templates";

/** New-issue setup only — do not import on `/issues/:issueId/input`. */
export function SetupPlaceholderSidebar() {
  return (
    <div className="metis-surface metis-support-surface space-y-4 rounded-[1.45rem] border px-5 py-5 shadow-[var(--shadow-card)]">
      <div className="space-y-3">
        <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Attachments</p>
        {setupPlaceholderAttachments.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-[--metis-paper-muted]">
            <Paperclip className="h-4 w-4 shrink-0 text-[--metis-brass]" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[--metis-outline-subtle] pt-4">
        <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Template</p>
        <div className="mt-3 rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[--metis-paper]">{setupPlaceholderTemplate.name}</span>
            <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] text-[--metis-text-tertiary]">
              {setupPlaceholderTemplate.estimatedSetup}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{setupPlaceholderTemplate.issueType}</p>
        </div>
      </div>
    </div>
  );
}
