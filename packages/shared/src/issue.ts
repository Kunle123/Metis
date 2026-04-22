import { z } from "zod";

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  issueType: z.string(),
  severity: z.string(),
  status: z.string(),
  priority: z.string(),
  operatorPosture: z.string(),
  ownerName: z.string().nullable(),
  audience: z.string().nullable(),
  openGapsCount: z.number().int(),
  sourcesCount: z.number().int(),
  lastActivityAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Issue = z.infer<typeof IssueSchema>;

export const CreateIssueInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  issueType: z.string().min(1),
  severity: z.string().min(1),
  status: z.string().min(1),
  priority: z.string().optional(),
  operatorPosture: z.string().optional(),
  ownerName: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  openGapsCount: z.number().int().optional(),
  sourcesCount: z.number().int().optional(),
});

export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;

export const UpdateIssueInputSchema = CreateIssueInputSchema.partial();
export type UpdateIssueInput = z.infer<typeof UpdateIssueInputSchema>;

