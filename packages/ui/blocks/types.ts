import { z } from 'zod';

export const HeroBlockSchema = z.object({
  type: z.literal('hero'),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.optional(z.string()),
  ctaLink: z.optional(z.string()),
  backgroundImage: z.optional(z.string()),
  stats: z.optional(z.array(z.object({
    label: z.string(),
    value: z.string(),
  }))),
});

export const FAQBlockSchema = z.object({
  type: z.literal('faq'),
  title: z.optional(z.string()),
  items: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
});

export const ToolGridBlockSchema = z.object({
  type: z.literal('tool_grid'),
  title: z.optional(z.string()),
  category: z.optional(z.string()),
  filter: z.optional(z.enum(['all', 'self-hostable', 'open-source'])),
  limit: z.optional(z.number()),
});

export const OperationalSpecsBlockSchema = z.object({
  type: z.literal('operational_specs'),
  toolId: z.string(),
  specs: z.object({
    ramMin: z.number(),
    ramRecommended: z.number(),
    gpuRequired: z.boolean(),
    maintenanceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    scalingDifficulty: z.number().min(1).max(10),
  }),
});

export const WorkflowBlockSchema = z.object({
  type: z.literal('workflow'),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    label: z.string(),
    toolId: z.optional(z.string()),
    description: z.string(),
  })),
});

export const BlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  FAQBlockSchema,
  ToolGridBlockSchema,
  OperationalSpecsBlockSchema,
  WorkflowBlockSchema,
]);

export type BlockData = z.infer<typeof BlockSchema>;
