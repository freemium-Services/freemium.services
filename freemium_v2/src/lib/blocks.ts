import { z } from 'zod';

// --- Block Validation Contracts ---

export const BlockTypeEnum = z.enum([
    'hero', 'rich_text', 'markdown', 'tool_grid', 'workflow_grid',
    'comparison_table', 'faq_section', 'pros_cons', 'operational_specs',
    'deployment_matrix', 'ai_capabilities', 'related_tools', 'workflow_steps',
    'stats', 'cta', 'quote', 'video_embed', 'table_of_contents',
    'breadcrumbs', 'code_block', 'schema_faq', 'schema_howto',
    'feature_list', 'timeline', 'pricing_table'
]);

export type BlockType = z.infer<typeof BlockTypeEnum>;

export const HeroBlockSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().optional(),
});

export const OperationalSpecsSchema = z.object({
    ramMin: z.number(),
    gpuRequired: z.boolean(),
    maintenanceLevel: z.enum(['low', 'medium', 'high']),
    scalingDifficulty: z.number().min(1).max(10),
});

export const FAQBlockSchema = z.object({
    items: z.array(z.object({
        q: z.string(),
        a: z.string(),
    })),
});

export const ToolGridSchema = z.object({
    categorySlug: z.string(),
    limit: z.number().default(6),
});

export const ProsConsSchema = z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
});

export const AICapabilitiesSchema = z.object({
    modelSupport: z.array(z.string()),
    contextWindow: z.number().optional(),
    ragOptimized: z.boolean(),
    agentic: z.boolean(),
});

// --- Universal Block Contract ---
export const BlockSchema = z.object({
    id: z.string().cuid(),
    type: BlockTypeEnum,
    order: z.number(),
    data: z.any(), // Further refined in sub-schemas
});

export type Block = z.infer<typeof BlockSchema>;