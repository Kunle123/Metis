import { NextResponse } from "next/server";
import type { Gap, Source, StakeholderGroup } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  CreateMessageVariantInputSchema,
  MessageVariantArtifactSchema,
  MessageVariantTemplateIdSchema,
  type MessageVariantArtifact,
  type MessageVariantTemplateId,
  type MessageVariantWordingPolish,
} from "@metis/shared/messageVariant";
import { cleanupMessageVariantsSections } from "@/lib/ai/cleanupMessageDraft";
import { prisma } from "@/lib/db/prisma";
import { requireMutation } from "@/lib/governance/requireMutation";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import {
  buildAudienceSnapshot,
  generateExternalCustomerResidentStudentArtifact,
  type ExternalAudienceInput,
} from "@/lib/messages/generateExternalCustomerUpdate";
import {
  generateInternalStaffUpdateArtifact,
  type AudienceInput as InternalAudienceInput,
} from "@/lib/messages/generateInternalStaffUpdate";
import {
  generateMediaHoldingLineArtifact,
  type AudienceInput as MediaAudienceInput,
} from "@/lib/messages/generateMediaHoldingLine";
import { revalidatePath } from "next/cache";

function readStoredWordingPolish(artifactUnknown: unknown): MessageVariantWordingPolish {
  const p = MessageVariantArtifactSchema.safeParse(artifactUnknown);
  if (!p.success) return "deterministic_only";
  return p.data.metadata.aiWordingPolish === "ai_polished" ? "ai_polished" : "deterministic_only";
}

function deterministicBodiesById(artifact: MessageVariantArtifact): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of artifact.sections) out[s.id] = s.body;
  return out;
}

/** Server flag: defaults OFF unless env is exactly `"true"`. */
function desiredWordingPolish(improveRequest: boolean | undefined): MessageVariantWordingPolish {
  const wants = Boolean(improveRequest);
  const enabled = typeof process.env.MESSAGES_AI_CLEANUP_ENABLED === "string" && process.env.MESSAGES_AI_CLEANUP_ENABLED === "true";
  const key = Boolean(process.env.OPENAI_API_KEY?.trim());
  return wants && enabled && key ? "ai_polished" : "deterministic_only";
}

function cleanSnippet(text: unknown, max: number) {
  let t = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";
  if (!t.length) return "";
  if (t.length > max) return `${t.slice(0, max - 1)}…`;
  return t;
}

function summarizeSourcesForAi(sources: Source[]) {
  return sources.slice(0, 12).map((s) => `${s.sourceCode} (${String(s.tier)}) — ${cleanSnippet(s.title, 240)}`).filter(Boolean);
}

function summarizeGapsForAi(gaps: Gap[]) {
  return gaps
    .filter((g) => g.status === "Open")
    .slice(0, 14)
    .map((g) => `${g.severity ? `[${String(g.severity)}] ` : ""}${cleanSnippet(g.prompt || g.title, 520)}`)
    .filter(Boolean);
}

function truncateIssueOpenQs(text: unknown) {
  const t = typeof text === "string" ? text.trim() : "";
  if (t.length <= 2800) return t;
  return `${t.slice(0, 2799)}…`;
}

const TEMPLATE_LABELS: Record<MessageVariantTemplateId, string> = {
  external_customer_resident_student: "External — customer/resident/student update",
  internal_staff_update: "Internal — staff update",
  media_holding_line: "Media — holding line",
};

function serializeMessageVariant(row: {
  id: string;
  issueId: string;
  templateId: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: Date;
  stakeholderGroupId: string | null;
  issueStakeholderId: string | null;
  audienceSnapshot: unknown;
  artifact: unknown;
  createdAt: Date;
}) {
  const artifact = MessageVariantArtifactSchema.parse(row.artifact);
  return {
    id: row.id,
    issueId: row.issueId,
    templateId: row.templateId,
    versionNumber: row.versionNumber,
    generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt.toISOString(),
    stakeholderGroupId: row.stakeholderGroupId,
    issueStakeholderId: row.issueStakeholderId,
    audienceSnapshot: row.audienceSnapshot as Record<string, unknown>,
    artifact,
    createdAt: row.createdAt.toISOString(),
  };
}

/** One audience bucket: null = setup note from issue; non-null = organisation StakeholderGroup. */
function whereForLens(stakeholderGroupId: string | null): { stakeholderGroupId: string | null } {
  return { stakeholderGroupId };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);
  const templateRaw = url.searchParams.get("templateId") ?? "external_customer_resident_student";
  const parsedTemplate = MessageVariantTemplateIdSchema.safeParse(templateRaw);
  if (!parsedTemplate.success) {
    return NextResponse.json({ error: "Invalid templateId", issues: parsedTemplate.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lensParam = url.searchParams.get("lens");
  let scopedGroupId: string | null | undefined;
  if (lensParam === "issue" || lensParam === "") {
    scopedGroupId = null;
  } else if (lensParam) {
    const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lensParam);
    if (!ok) {
      return NextResponse.json({ error: "Invalid lens (use issue or a StakeholderGroup id)" }, { status: 400 });
    }
    const activeGroup = await prisma.stakeholderGroup.findFirst({ where: { id: lensParam, isActive: true } });
    if (activeGroup) {
      scopedGroupId = lensParam;
    } else {
      const legacy = await prisma.issueStakeholder.findFirst({ where: { id: lensParam, issueId } });
      if (!legacy) {
        return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
      }
      const groupForLegacy = await prisma.stakeholderGroup.findFirst({
        where: { id: legacy.stakeholderGroupId, isActive: true },
      });
      if (!groupForLegacy) {
        return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
      }
      scopedGroupId = legacy.stakeholderGroupId;
    }
  }

  const history = url.searchParams.get("history") === "1";
  const whereBase: Prisma.MessageVariantWhereInput = { issueId, templateId: parsedTemplate.data };
  const whereScoped: Prisma.MessageVariantWhereInput =
    scopedGroupId === undefined ? whereBase : { ...whereBase, ...whereForLens(scopedGroupId) };

  if (history) {
    const items = await prisma.messageVariant.findMany({
      where: whereScoped,
      orderBy: [{ versionNumber: "desc" }],
      take: 30,
    });
    return NextResponse.json({ items: items.map(serializeMessageVariant) });
  }

  const latest = await prisma.messageVariant.findFirst({
    where: whereScoped,
    orderBy: [{ versionNumber: "desc" }],
  });

  return NextResponse.json({ latest: latest ? serializeMessageVariant(latest) : null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = CreateMessageVariantInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stakeholderGroupId = parsed.data.stakeholderGroupId ?? null;

  let audience: ExternalAudienceInput;
  let internalAudience: InternalAudienceInput;
  let mediaAudience: MediaAudienceInput;
  const issueLens = null;
  let group: StakeholderGroup | null = null;

  if (stakeholderGroupId) {
    group = await prisma.stakeholderGroup.findFirst({ where: { id: stakeholderGroupId, isActive: true } });
    if (!group) {
      return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
    }
    audience = { kind: "group", group, issueLens };
    internalAudience = { kind: "group", group, issueLens };
    mediaAudience = { kind: "group", group, issueLens };
  } else {
    audience = { kind: "setup" };
    internalAudience = { kind: "setup" };
    mediaAudience = { kind: "setup" };
  }

  const [sources, gaps, internalInputs] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
  ]);

  const latestForLens = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: parsed.data.templateId, ...whereForLens(stakeholderGroupId) },
    orderBy: [{ versionNumber: "desc" }],
  });

  const desiredPolish = desiredWordingPolish(parsed.data.improveWithAi);

  if (
    latestForLens &&
    latestForLens.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime() &&
    (latestForLens.stakeholderGroupId ?? null) === stakeholderGroupId &&
    readStoredWordingPolish(latestForLens.artifact) === desiredPolish
  ) {
    return NextResponse.json(serializeMessageVariant(latestForLens));
  }

  const globalLatest = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: parsed.data.templateId },
    orderBy: [{ versionNumber: "desc" }],
  });
  const versionNumber = (globalLatest?.versionNumber ?? 0) + 1;

  const deterministic = ((): MessageVariantArtifact => {
    if (parsed.data.templateId === "external_customer_resident_student") {
      return generateExternalCustomerResidentStudentArtifact({ issue, sources, gaps, audience });
    }
    if (parsed.data.templateId === "media_holding_line") {
      return generateMediaHoldingLineArtifact({ issue, gaps, audience: mediaAudience });
    }
    return generateInternalStaffUpdateArtifact({ issue, sources, gaps, internalInputs, audience: internalAudience });
  })();

  let mergedArtifact: MessageVariantArtifact = {
    ...deterministic,
    metadata: {
      ...deterministic.metadata,
      aiWordingPolish: "deterministic_only",
      aiComparisonAvailable: false,
    },
  };

  if (desiredPolish === "ai_polished") {
    const audiencePathLabel =
      stakeholderGroupId && group
        ? `Organisation audience group: ${group.name}`
        : "General — issue intake audience note only (no organisation audience group selected)";
    const audienceOrgDefaultsHint =
      group
        ? (() => {
            const joined = [group.defaultSensitivity, group.defaultToneGuidance, group.defaultChannels]
              .filter((x): x is string => typeof x === "string" && Boolean(String(x).trim()))
              .join(" · ");
            if (!joined) return null;
            const s = cleanSnippet(joined, 2400);
            return s.length ? s : null;
          })()
        : null;

    const payload = {
      templateId: parsed.data.templateId,
      templateLabel: TEMPLATE_LABELS[parsed.data.templateId],
      audiencePathLabel,
      audienceOrgDefaultsHint,
      issue: {
        title: cleanSnippet(issue.title, 520) || "Issue",
        summary: cleanSnippet(issue.summary, 4000),
        context: cleanSnippet(issue.context, 6000),
        confirmedFacts: cleanSnippet(issue.confirmedFacts, 8000),
        openQuestionsSummary: truncateIssueOpenQs(issue.openQuestions ?? ""),
      },
      evidenceSummaryLines: summarizeSourcesForAi(sources),
      openIssuesSummaryLines: summarizeGapsForAi(gaps),
      sectionsDeterministic: deterministic.sections.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
      })),
    };

    try {
      const polished = await cleanupMessageVariantsSections(payload);
      if (polished) {
        mergedArtifact = MessageVariantArtifactSchema.parse({
          ...mergedArtifact,
          sections: polished.sections,
          metadata: {
            ...mergedArtifact.metadata,
            aiWordingPolish: "ai_polished",
            aiComparisonAvailable: true,
            deterministicSectionBodiesById: deterministicBodiesById(deterministic),
          },
        });
      }
    } catch {
      mergedArtifact = MessageVariantArtifactSchema.parse(mergedArtifact);
    }
  } else {
    mergedArtifact = MessageVariantArtifactSchema.parse(mergedArtifact);
  }

  const audienceSnapshot = buildAudienceSnapshot(issue, audience);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.messageVariant.create({
      data: {
        issueId,
        templateId: parsed.data.templateId,
        versionNumber,
        generatedFromIssueUpdatedAt: issue.updatedAt,
        stakeholderGroupId,
        issueStakeholderId: null,
        audienceSnapshot: audienceSnapshot as Prisma.InputJsonValue,
        artifact: mergedArtifact as Prisma.InputJsonValue,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.message_variant_created,
      summary: `Message variant ${row.versionNumber} (${row.templateId})`,
      refType: "MessageVariant",
      refId: row.id,
      actorLabel: user.email ?? null,
    });

    return row;
  });

  revalidatePath(`/issues/${issueId}/messages`);
  revalidatePath(`/issues/${issueId}/export`);
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/");

  return NextResponse.json(serializeMessageVariant(created));
}
