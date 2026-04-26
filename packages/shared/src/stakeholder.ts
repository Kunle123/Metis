import { z } from "zod";

export const StakeholderGroupSensitivitySchema = z.union([
  z.literal("Low"),
  z.literal("Medium"),
  z.literal("High"),
]);
export type StakeholderGroupSensitivity = z.infer<typeof StakeholderGroupSensitivitySchema>;

export const IssueStakeholderPrioritySchema = z.union([
  z.literal("High"),
  z.literal("Normal"),
  z.literal("Low"),
]);
export type IssueStakeholderPriority = z.infer<typeof IssueStakeholderPrioritySchema>;

export const StakeholderGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  defaultSensitivity: StakeholderGroupSensitivitySchema.nullable(),
  defaultChannels: z.string().nullable(),
  defaultToneGuidance: z.string().nullable(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StakeholderGroup = z.infer<typeof StakeholderGroupSchema>;

export const CreateStakeholderGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  defaultSensitivity: StakeholderGroupSensitivitySchema.nullable().optional(),
  defaultChannels: z.string().nullable().optional(),
  defaultToneGuidance: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type CreateStakeholderGroupInput = z.infer<typeof CreateStakeholderGroupInputSchema>;

export const PatchStakeholderGroupInputSchema = CreateStakeholderGroupInputSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Empty patch" },
);
export type PatchStakeholderGroupInput = z.infer<typeof PatchStakeholderGroupInputSchema>;

export const IssueStakeholderSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  stakeholderGroupId: z.string(),
  priority: IssueStakeholderPrioritySchema,
  needsToKnow: z.string(),
  issueRisk: z.string(),
  channelGuidance: z.string(),
  toneAdjustment: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IssueStakeholder = z.infer<typeof IssueStakeholderSchema>;

export const IssueStakeholderWithGroupSchema = IssueStakeholderSchema.extend({
  group: StakeholderGroupSchema,
});
export type IssueStakeholderWithGroup = z.infer<typeof IssueStakeholderWithGroupSchema>;

export const CreateIssueStakeholderInputSchema = z.object({
  stakeholderGroupId: z.string().min(1),
  priority: IssueStakeholderPrioritySchema.optional(),
  needsToKnow: z.string().optional(),
  issueRisk: z.string().optional(),
  channelGuidance: z.string().optional(),
  toneAdjustment: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CreateIssueStakeholderInput = z.infer<typeof CreateIssueStakeholderInputSchema>;

export const PatchIssueStakeholderInputSchema = z
  .object({
    priority: IssueStakeholderPrioritySchema.optional(),
    needsToKnow: z.string().optional(),
    issueRisk: z.string().optional(),
    channelGuidance: z.string().optional(),
    toneAdjustment: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });
export type PatchIssueStakeholderInput = z.infer<typeof PatchIssueStakeholderInputSchema>;

