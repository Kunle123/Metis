"use client";

import { Button } from "@/components/ui/button";
import { CollapsibleFormPanel } from "./collapsible-form-panel";

export function WorkspaceSection({
  title,
  description,
  addLabel,
  advancedHref,
  defaultExpanded = false,
  children,
  form,
}: {
  title: string;
  description: string;
  addLabel: string;
  advancedHref: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  form: React.ReactNode;
}) {
  return (
    <CollapsibleFormPanel
      title={title}
      description={description}
      addLabel={addLabel}
      defaultExpanded={defaultExpanded}
      form={form}
      secondaryAction={
        <Button asChild variant="outline" size="sm">
          <a href={advancedHref}>Advanced view</a>
        </Button>
      }
    >
      {children}
    </CollapsibleFormPanel>
  );
}

