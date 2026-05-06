import { CreateCommsPlanItemInputSchema, type CreateCommsPlanItemInput } from "@metis/shared/commsPlan";
import type { MessageVariantTemplateId } from "@metis/shared/messageVariant";
import type { BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";

export type CommsPlanEventType =
  | "operational_incident"
  | "reputational_crisis"
  | "regulatory_legal"
  | "proactive_comms"
  | "media_inquiry"
  | "internal_change"
  | "leadership_only";

export type AudienceGroupLite = { id: string; name: string };

export type PlanSuggestion = {
  id: string;
  why: string;
  item: CreateCommsPlanItemInput;
};

export type ValidationRejectedRow = { why: string; item: unknown };

/** Stable key for comparing template-derived rows across suggestions and saved plan items. Order is fixed and deterministic. */
export function commsPlanTemplateFingerprint(item: CreateCommsPlanItemInput): string {
  const stakeholderGroupId = item.stakeholderGroupId ?? "";
  const messageTemplateId = item.messageTemplateId ?? "";
  const briefMode = item.briefMode ?? "";
  const exportFormat = item.exportFormat ?? "";
  const cadenceMinutes = item.cadenceMinutes ?? "";
  const triggerType = item.triggerType ?? "";
  return [
    item.outputType,
    stakeholderGroupId,
    messageTemplateId,
    briefMode,
    exportFormat,
    item.channel.trim(),
    item.scheduleType,
    String(cadenceMinutes),
    String(triggerType),
    item.title.trim(),
  ].join("\u0001");
}

function deterministicSuggestionId(fingerprint: string) {
  let h = 5381;
  for (let i = 0; i < fingerprint.length; i++) h = ((h << 5) + h) ^ fingerprint.charCodeAt(i);
  const u = (h >>> 0).toString(16);
  return `sugg-${u}`;
}

function includesAny(name: string, needles: string[]) {
  const n = name.toLowerCase();
  return needles.some((k) => n.includes(k));
}

function audienceHints(name: string) {
  const lower = name.toLowerCase();
  const isBoard = includesAny(lower, ["board", "trustee", "trustees", "governor", "governors"]);
  const isExec = includesAny(lower, ["exec", "executive", "leadership", "slt", "elt"]);
  const isStaff = includesAny(lower, ["staff", "internal", "colleague", "employees", "union"]);
  const isMedia = includesAny(lower, ["media", "press", "journalist", "news"]);
  const isExternalPublic = includesAny(lower, ["student", "students", "customer", "customers", "resident", "residents", "community", "public"]);
  return { isBoard, isExec, isStaff, isMedia, isExternalPublic };
}

function asMessage(opts: {
  title: string;
  stakeholderGroupId: string | null;
  channel: string;
  templateId: MessageVariantTemplateId;
  schedule: { type: "one_off"; nextDueAt?: string | null } | { type: "cadence"; minutes: number; nextDueAt?: string | null } | { type: "trigger"; triggerType: CreateCommsPlanItemInput["triggerType"]; nextDueAt?: string | null };
  owner?: string | null;
  notes?: string | null;
}): CreateCommsPlanItemInput {
  const scheduleType = opts.schedule.type;
  const cadenceMinutes = scheduleType === "cadence" ? opts.schedule.minutes : null;
  const triggerType = scheduleType === "trigger" ? opts.schedule.triggerType : null;
  const nextDueAt = opts.schedule.nextDueAt ?? null;
  return {
    stakeholderGroupId: opts.stakeholderGroupId,
    title: opts.title,
    outputType: "message",
    messageTemplateId: opts.templateId,
    briefMode: null,
    exportFormat: null,
    channel: opts.channel,
    scheduleType,
    cadenceMinutes,
    triggerType,
    nextDueAt,
    owner: opts.owner ?? null,
    notes: opts.notes ?? null,
  };
}

function asBrief(opts: {
  title: string;
  stakeholderGroupId: string | null;
  channel: string;
  mode: BriefMode;
  schedule: { type: "one_off"; nextDueAt?: string | null } | { type: "cadence"; minutes: number; nextDueAt?: string | null } | { type: "trigger"; triggerType: CreateCommsPlanItemInput["triggerType"]; nextDueAt?: string | null };
  owner?: string | null;
  notes?: string | null;
}): CreateCommsPlanItemInput {
  const scheduleType = opts.schedule.type;
  const cadenceMinutes = scheduleType === "cadence" ? opts.schedule.minutes : null;
  const triggerType = scheduleType === "trigger" ? opts.schedule.triggerType : null;
  const nextDueAt = opts.schedule.nextDueAt ?? null;
  return {
    stakeholderGroupId: opts.stakeholderGroupId,
    title: opts.title,
    outputType: "brief",
    messageTemplateId: null,
    briefMode: opts.mode,
    exportFormat: null,
    channel: opts.channel,
    scheduleType,
    cadenceMinutes,
    triggerType,
    nextDueAt,
    owner: opts.owner ?? null,
    notes: opts.notes ?? null,
  };
}

function asExport(opts: {
  title: string;
  stakeholderGroupId: string | null;
  channel: string;
  mode: BriefMode;
  format: ExportFormat;
  schedule: { type: "one_off"; nextDueAt?: string | null } | { type: "cadence"; minutes: number; nextDueAt?: string | null } | { type: "trigger"; triggerType: CreateCommsPlanItemInput["triggerType"]; nextDueAt?: string | null };
  owner?: string | null;
  notes?: string | null;
}): CreateCommsPlanItemInput {
  const scheduleType = opts.schedule.type;
  const cadenceMinutes = scheduleType === "cadence" ? opts.schedule.minutes : null;
  const triggerType = scheduleType === "trigger" ? opts.schedule.triggerType : null;
  const nextDueAt = opts.schedule.nextDueAt ?? null;
  return {
    stakeholderGroupId: opts.stakeholderGroupId,
    title: opts.title,
    outputType: "export",
    messageTemplateId: null,
    briefMode: opts.mode,
    exportFormat: opts.format,
    channel: opts.channel,
    scheduleType,
    cadenceMinutes,
    triggerType,
    nextDueAt,
    owner: opts.owner ?? null,
    notes: opts.notes ?? null,
  };
}

function nextDueFromCadence(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function dedupeByKeyWithDroppedCount<T>(rows: T[], key: (row: T) => string): { rows: T[]; droppedDuplicateCount: number } {
  const out: T[] = [];
  const seen = new Set<string>();
  let droppedDuplicateCount = 0;
  for (const r of rows) {
    const k = key(r);
    if (seen.has(k)) {
      droppedDuplicateCount++;
      continue;
    }
    seen.add(k);
    out.push(r);
  }
  return { rows: out, droppedDuplicateCount };
}

/** Exposed for deterministic fixture checks — counts how many trailing rows share a fingerprint with an earlier row. */
export function countDuplicateTemplateFingerprintsDropped(items: CreateCommsPlanItemInput[]): number {
  const pseudo = items.map((item) => ({ item }));
  return dedupeByKeyWithDroppedCount(pseudo, (r) => commsPlanTemplateFingerprint(r.item)).droppedDuplicateCount;
}

export function generateCommsPlanSuggestions(params: {
  eventType: CommsPlanEventType;
  selectedAudienceGroupIds: string[];
  audienceGroups: AudienceGroupLite[];
  now?: Date;
  defaultOwner?: string | null;
}): {
  suggestions: PlanSuggestion[];
  validationRejected: ValidationRejectedRow[];
  duplicateShapesHiddenInSuggestionBatch: number;
} {
  const now = params.now ?? new Date();
  const defaultOwner = params.defaultOwner ?? null;

  const selectedGroups = params.audienceGroups.filter((g) => params.selectedAudienceGroupIds.includes(g.id));
  const useGeneral = selectedGroups.length === 0;

  const wantBoardNote =
    selectedGroups.some((g) => audienceHints(g.name).isBoard) ||
    params.eventType === "reputational_crisis" ||
    params.eventType === "operational_incident" ||
    params.eventType === "regulatory_legal";
  const wantMedia = params.eventType === "media_inquiry" || selectedGroups.some((g) => audienceHints(g.name).isMedia);
  const wantStaff = params.eventType === "internal_change" || selectedGroups.some((g) => audienceHints(g.name).isStaff);
  const wantExternal = selectedGroups.some((g) => audienceHints(g.name).isExternalPublic);
  const wantExec = params.eventType !== "proactive_comms" || selectedGroups.some((g) => audienceHints(g.name).isExec);

  const base: { why: string; item: CreateCommsPlanItemInput }[] = [];

  // Executive / leadership cadence (default).
  if (wantExec || useGeneral) {
    base.push({
      why: "Leadership cadence: maintain a steady briefing rhythm during active work.",
      item: asBrief({
        title: "Executive update (cadence)",
        stakeholderGroupId: null,
        channel: "Email / Slack",
        mode: "executive",
        schedule: { type: "cadence", minutes: 120, nextDueAt: nextDueFromCadence(now, 120) },
        owner: defaultOwner,
        notes: params.eventType === "regulatory_legal" ? "Use approval gates and status changes to time updates." : null,
      }),
    });
  }

  // Board note (cadence daily, simple).
  if (wantBoardNote) {
    base.push({
      why: "Board-level visibility: a daily package keeps oversight aligned without flooding channels.",
      item: asExport({
        title: "Board note (daily)",
        stakeholderGroupId: null,
        channel: "Email",
        mode: "executive",
        format: "board-note",
        schedule: { type: "cadence", minutes: 24 * 60, nextDueAt: nextDueFromCadence(now, 24 * 60) },
        owner: defaultOwner,
      }),
    });
  }

  // Staff update gated on approval.
  if (wantStaff || params.eventType === "operational_incident" || params.eventType === "reputational_crisis") {
    base.push({
      why: "Internal alignment: staff updates often depend on sign-off (e.g. Legal/HR).",
      item: asMessage({
        title: "Staff update (after approval)",
        stakeholderGroupId: null,
        channel: "Intranet / Email",
        templateId: "internal_staff_update",
        schedule: { type: "trigger", triggerType: "on_approval" },
        owner: defaultOwner,
      }),
    });
  }

  // External update gated on confirmed impact.
  if (wantExternal || params.eventType === "operational_incident" || params.eventType === "reputational_crisis") {
    base.push({
      why: "External accuracy: wait for confirmed impact before publishing customer/student updates.",
      item: asMessage({
        title: "External update (after confirmed impact)",
        stakeholderGroupId: null,
        channel: "Email / Web",
        templateId: "external_customer_resident_student",
        schedule: { type: "trigger", triggerType: "on_confirmed_impact" },
        owner: defaultOwner,
      }),
    });
  }

  // Media holding line on inquiry.
  if (wantMedia || params.eventType === "operational_incident" || params.eventType === "reputational_crisis") {
    base.push({
      why: "Media readiness: prepare a holding line that can be used if inquiries arrive.",
      item: asMessage({
        title: "Media holding line (on press inquiry)",
        stakeholderGroupId: null,
        channel: "Press line",
        templateId: "media_holding_line",
        schedule: { type: "trigger", triggerType: "on_press_inquiry" },
        owner: defaultOwner,
      }),
    });
  }

  // Proactive comms: pre-announce brief + staff cascade + launch message.
  if (params.eventType === "proactive_comms") {
    base.push({
      why: "Proactive launch: align leadership lines before external release.",
      item: asBrief({
        title: "Leadership brief (before announcement)",
        stakeholderGroupId: null,
        channel: "Email",
        mode: "executive",
        schedule: { type: "one_off", nextDueAt: nextDueFromCadence(now, 6 * 60) },
        owner: defaultOwner,
      }),
    });
    base.push({
      why: "Internal cascade: staff should hear it before external audiences.",
      item: asMessage({
        title: "Staff cascade (before external release)",
        stakeholderGroupId: null,
        channel: "Intranet / Email",
        templateId: "internal_staff_update",
        schedule: { type: "one_off", nextDueAt: nextDueFromCadence(now, 8 * 60) },
        owner: defaultOwner,
      }),
    });
    base.push({
      why: "External release: schedule a single external update aligned to the launch milestone.",
      item: asMessage({
        title: "External update (launch)",
        stakeholderGroupId: null,
        channel: "Email / Web",
        templateId: "external_customer_resident_student",
        schedule: { type: "one_off", nextDueAt: nextDueFromCadence(now, 10 * 60) },
        owner: defaultOwner,
      }),
    });
  }

  // Media inquiry: ensure holding line + status-change exec update (trigger).
  if (params.eventType === "media_inquiry") {
    base.push({
      why: "Media inquiry: leadership updates track status changes rather than a fixed cadence.",
      item: asBrief({
        title: "Executive update (on status change)",
        stakeholderGroupId: null,
        channel: "Email / Slack",
        mode: "executive",
        schedule: { type: "trigger", triggerType: "on_status_change" },
        owner: defaultOwner,
      }),
    });
  }

  // Regulatory/legal: gate external updates on approval and key status changes.
  if (params.eventType === "regulatory_legal") {
    base.push({
      why: "Regulatory/legal: time external updates to approval gates.",
      item: asMessage({
        title: "External update (after approval)",
        stakeholderGroupId: null,
        channel: "Email / Web",
        templateId: "external_customer_resident_student",
        schedule: { type: "trigger", triggerType: "on_approval" },
        owner: defaultOwner,
      }),
    });
  }

  // Leadership-only: keep exec cadence; only include board note if board audience selected.
  if (params.eventType === "leadership_only" && !wantBoardNote) {
    // Already covered by exec cadence row; nothing else required.
  }

  // Audience-specific rows (lightweight): if a selected group strongly signals a type, add a group-scoped message.
  for (const g of selectedGroups) {
    const h = audienceHints(g.name);
    if (h.isStaff) {
      base.push({
        why: "Selected audience looks internal/staff; include a staff update draft for this group.",
        item: asMessage({
          title: `Staff update (${g.name})`,
          stakeholderGroupId: g.id,
          channel: "Intranet / Email",
          templateId: "internal_staff_update",
          schedule: { type: "trigger", triggerType: "on_approval" },
          owner: defaultOwner,
        }),
      });
    }
    if (h.isExternalPublic) {
      base.push({
        why: "Selected audience looks external/public; include an external update draft for this group.",
        item: asMessage({
          title: `External update (${g.name})`,
          stakeholderGroupId: g.id,
          channel: "Email / Web",
          templateId: "external_customer_resident_student",
          schedule: { type: "trigger", triggerType: "on_confirmed_impact" },
          owner: defaultOwner,
        }),
      });
    }
    if (h.isMedia) {
      base.push({
        why: "Selected audience looks media/press; include a holding line for this group.",
        item: asMessage({
          title: `Media holding line (${g.name})`,
          stakeholderGroupId: g.id,
          channel: "Press line",
          templateId: "media_holding_line",
          schedule: { type: "trigger", triggerType: "on_press_inquiry" },
          owner: defaultOwner,
        }),
      });
    }
  }

  const { rows: deduped, droppedDuplicateCount: duplicateShapesHiddenInSuggestionBatch } = dedupeByKeyWithDroppedCount(base, (r) =>
    commsPlanTemplateFingerprint(r.item),
  );

  const accepted: PlanSuggestion[] = [];
  const validationRejected: ValidationRejectedRow[] = [];
  const usedSuggestionIds = new Set<string>();

  for (const row of deduped) {
    const parsed = CreateCommsPlanItemInputSchema.safeParse(row.item);
    if (!parsed.success) {
      validationRejected.push({
        why: `Rejected by schema validation: ${parsed.error.issues.map((i) => i.message).join(" · ")}`,
        item: row.item,
      });
      continue;
    }
    const fp = commsPlanTemplateFingerprint(parsed.data);
    let id = deterministicSuggestionId(fp);
    if (usedSuggestionIds.has(id)) id = `${id}-${accepted.length}`;
    usedSuggestionIds.add(id);
    accepted.push({ id, why: row.why, item: parsed.data });
  }

  return { suggestions: accepted, validationRejected, duplicateShapesHiddenInSuggestionBatch };
}

