export type License = 'FREE' | 'FREEMIUM' | 'OPEN_SOURCE';
export type MaintenanceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface OperationalSpecs {
  ramMin?: number;
  ramRecommended?: number;
  gpuRequired: boolean;
  gpuMemoryMin?: number;
  maintenanceLevel: MaintenanceLevel;
  scalingDifficulty: number;
  dockerSupport: boolean;
  k8sSupport: boolean;
  privacyScore: number;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  order: number;
  content: any;
}

export type BlockType =
  | 'HERO'
  | 'FAQ'
  | 'TOOL_GRID'
  | 'WORKFLOW_VIZ'
  | 'COMPARISON_MATRIX'
  | 'TOC'
  | 'RICH_TEXT'
  | 'RELATED_CONTENT'
  | 'OPERATIONAL_SPECS';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

export type PageType =
  | 'TOOL'
  | 'WORKFLOW'
  | 'PILLAR'
  | 'COMPARISON'
  | 'ARTICLE'
  | 'GUIDE'
  | 'DIRECTORY';

export type ArticleArchetype =
  | 'BEST_TOOL_LIST'
  | 'COMPARISON'
  | 'SELF_HOST_GUIDE'
  | 'WORKFLOW_STACK'
  | 'BENCHMARK_STUDY'
  | 'ALTERNATIVES';

export type FAQIntent =
  | 'BEGINNER'
  | 'COMPARISON'
  | 'OPERATIONAL'
  | 'DEPLOYMENT'
  | 'PRIVACY_SECURITY'
  | 'PERFORMANCE'
  | 'ADVANCED_WORKFLOWS';

export interface AEOSummary {
  bestFor: string;
  minimumRam?: string;
  gpuNeeded?: 'Required' | 'Optional' | 'None';
  bestTools: string[];
  deployment: string[];
  privacyScore?: 'Low' | 'Medium' | 'High';
}

export interface BlogFAQ {
  id: string;
  question: string;
  answer: string;
  source: string;
  intentType: FAQIntent;
  sourceUrl?: string;
  embeddingText?: string;
  order: number;
}

export interface InternalLink {
  id: string;
  sourcePageId: string;
  targetType: 'PILLAR' | 'TOOL' | 'WORKFLOW' | 'COMPARISON' | 'DOC' | 'ARTICLE' | 'GUIDE' | 'EXTERNAL';
  targetId: string;
  anchorText: string;
  semanticRole:
    | 'PARENT_PILLAR'
    | 'SUPPORTING_TOOL'
    | 'WORKFLOW_STEP'
    | 'COMPARISON_TARGET'
    | 'DOC_REFERENCE'
    | 'RELATED_ENTITY'
    | 'ALTERNATIVE'
    | 'SOURCE';
  weight: number;
}

export interface SemanticArticleNode {
  id: string;
  slug: string;
  title: string;
  pillar: string;
  cluster: string;
  archetype: ArticleArchetype;
  intent: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  aeoSummary: AEOSummary;
  faqTarget: number;
  faqDistribution: Record<FAQIntent, number>;
  requiredInternalLinks: InternalLink[];
  embeddingText: string;
}

/**
 * Canonical Search Entity
 * Normalized format for Typesense keyword search and pgvector semantic retrieval.
 */
export interface SearchEntity {
  id: string;
  type: 'tool' | 'workflow' | 'comparison' | 'category' | 'guide' | 'article' | 'faq';
  title: string;
  description: string;
  tags: string[];
  categories: string[];
  
  // Enriched text for semantic embeddings
  embeddingText: string;
  
  // Operational Intelligence Signals
  operationalScore?: number;
  privacyScore?: number;
  complexityScore?: number;
  
  // Metadata for filtering
  metadata: Record<string, any>;
}
