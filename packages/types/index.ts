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

/**
 * Canonical Search Entity
 * Normalized format for Typesense keyword search and pgvector semantic retrieval.
 */
export interface SearchEntity {
  id: string;
  type: 'tool' | 'workflow' | 'comparison' | 'category' | 'guide';
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
