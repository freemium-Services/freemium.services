// components/blocks/BlockRenderer.tsx

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { z } from 'zod';

// ======================================================
// PAGE BLOCK SCHEMA
// ======================================================

export const PageBlockSchema = z.object({
    id: z.string(),
    type: z.string(),
    order: z.number(),
    data: z.any(),
});

export type PageBlock = z.infer<typeof PageBlockSchema>;

// ======================================================
// BLOCK TYPES
// ======================================================

export type BlockType =
    | 'hero'
    | 'rich_text'
    | 'markdown'
    | 'tool_grid'
    | 'workflow_grid'
    | 'comparison_table'
    | 'faq_section'
    | 'pros_cons'
    | 'operational_specs'
    | 'deployment_matrix'
    | 'ai_capabilities'
    | 'related_tools'
    | 'workflow_steps'
    | 'stats'
    | 'cta'
    | 'quote'
    | 'video_embed'
    | 'table_of_contents'
    | 'breadcrumbs'
    | 'code_block'
    | 'feature_list'
    | 'timeline'
    | 'pricing_table';

// ======================================================
// DYNAMIC IMPORTS
// ======================================================

const HeroBlock = dynamic(() => import('./HeroBlock'));
const RichTextBlock = dynamic(() => import('./RichTextBlock'));
const MarkdownBlock = dynamic(() => import('./MarkdownBlock'));
const ToolGridBlock = dynamic(() => import('./ToolGridBlock'));
const WorkflowGridBlock = dynamic(() => import('./WorkflowGridBlock'));
const ComparisonTableBlock = dynamic(() => import('./ComparisonTableBlock'));
const FAQBlock = dynamic(() => import('./FAQBlock'));
const ProsConsBlock = dynamic(() => import('./ProsConsBlock'));
const OperationalSpecsBlock = dynamic(() => import('./OperationalSpecsBlock'));
const DeploymentMatrixBlock = dynamic(() => import('./DeploymentMatrixBlock'));
const AICapabilitiesBlock = dynamic(() => import('./AICapabilitiesBlock'));
const RelatedToolsBlock = dynamic(() => import('./RelatedToolsBlock'));
const WorkflowStepsBlock = dynamic(() => import('./WorkflowStepsBlock'));
const StatsBlock = dynamic(() => import('./StatsBlock'));
const CTABlock = dynamic(() => import('./CTABlock'));
const QuoteBlock = dynamic(() => import('./QuoteBlock'));
const VideoEmbedBlock = dynamic(() => import('./VideoEmbedBlock'));
const TOCBlock = dynamic(() => import('./TOCBlock'));
const BreadcrumbsBlock = dynamic(() => import('./BreadcrumbsBlock'));
const CodeBlock = dynamic(() => import('./CodeBlock'));
const FeatureListBlock = dynamic(() => import('./FeatureListBlock'));
const TimelineBlock = dynamic(() => import('./TimelineBlock'));
const PricingTableBlock = dynamic(() => import('./PricingTableBlock'));

// ======================================================
// BLOCK REGISTRY
// ======================================================

const BLOCK_REGISTRY: Record<string, React.ComponentType<any>> = {
    hero: HeroBlock,
    rich_text: RichTextBlock,
    markdown: MarkdownBlock,
    tool_grid: ToolGridBlock,
    workflow_grid: WorkflowGridBlock,
    comparison_table: ComparisonTableBlock,
    faq_section: FAQBlock,
    pros_cons: ProsConsBlock,
    operational_specs: OperationalSpecsBlock,
    deployment_matrix: DeploymentMatrixBlock,
    ai_capabilities: AICapabilitiesBlock,
    related_tools: RelatedToolsBlock,
    workflow_steps: WorkflowStepsBlock,
    stats: StatsBlock,
    cta: CTABlock,
    quote: QuoteBlock,
    video_embed: VideoEmbedBlock,
    table_of_contents: TOCBlock,
    breadcrumbs: BreadcrumbsBlock,
    code_block: CodeBlock,
    feature_list: FeatureListBlock,
    timeline: TimelineBlock,
    pricing_table: PricingTableBlock,
};

// ======================================================
// FALLBACK COMPONENT
// ======================================================

function UnknownBlock({
    type,
    data,
}: {
    type: string;
    data: any;
}) {
    return (
        <div className="my-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="mb-2 text-lg font-semibold text-red-500">
                Unknown Block Type
            </div>

            <div className="font-mono text-sm text-zinc-400">
                {type}
            </div>

            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

// ======================================================
// LOADING FALLBACK
// ======================================================

function BlockSkeleton() {
    return (
        <div className="my-8 animate-pulse rounded-3xl border border-zinc-800 p-8">
            <div className="mb-4 h-8 w-1/3 rounded bg-zinc-800" />
            <div className="space-y-3">
                <div className="h-4 rounded bg-zinc-800" />
                <div className="h-4 rounded bg-zinc-800" />
                <div className="h-4 w-5/6 rounded bg-zinc-800" />
            </div>
        </div>
    );
}

// ======================================================
// MAIN BLOCK RENDERER
// ======================================================

interface BlockRendererProps {
    blocks: PageBlock[];
    className?: string;
}

export default function BlockRenderer({
    blocks,
    className = '',
}: BlockRendererProps) {
    if (!blocks?.length) return null;

    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

    return (
        <div className={className}>
            {sortedBlocks.map((block) => {
                const parsed = PageBlockSchema.safeParse(block);

                if (!parsed.success) {
                    return (
                        <div
                            key={block.id}
                            className="my-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6"
                        >
                            <div className="font-semibold text-yellow-500">
                                Invalid Block Schema
                            </div>

                            <pre className="mt-4 overflow-x-auto text-xs text-zinc-400">
                                {JSON.stringify(parsed.error.flatten(), null, 2)}
                            </pre>
                        </div>
                    );
                }

                const BlockComponent = BLOCK_REGISTRY[block.type];

                if (!BlockComponent) {
                    return (
                        <UnknownBlock
                            key={block.id}
                            type={block.type}
                            data={block.data}
                        />
                    );
                }

                return (
                    <Suspense key={block.id} fallback={<BlockSkeleton />}>
                        <section
                            data-block-id={block.id}
                            data-block-type={block.type}
                            className="block-section"
                        >
                            <BlockComponent {...block.data} />
                        </section>
                    </Suspense>
                );
            })}
        </div>
    );
}