import { type Tool } from './data';

export interface SearchEntity {
    id: string;
    type: 'tool' | 'workflow' | 'guide';
    title: string;
    description: string;
    tags: string[];
    operationalContext: string;
    embeddingText: string;
    // Production Hybrid Search Weights
    popularityScore: number;
    readinessScore: number;
}

/**
 * Normalizes a Tool entity into a search-optimized format.
 * Enriches embedding text with operational metadata to improve semantic retrieval.
 */
export function normalizeToolForSearch(tool: Tool): SearchEntity {
    const operationalStr = [
        tool.selfHostable ? 'Self-Hostable' : 'Cloud Only',
        tool.ramMin ? `${tool.ramMin}MB RAM` : '',
        tool.gpuRequired ? 'GPU Required' : 'CPU Optimized',
        tool.dockerSupport ? 'Docker Support' : '',
        `Privacy Score: ${tool.privacyScore || 'N/A'}`
    ].filter(Boolean).join(', ');

    // Enriched text for vector embedding (Strategic Blueprint Layer 5)
    const embeddingText = `
Tool: ${tool.name}
Category: ${tool.category}
Description: ${tool.description}
Capabilities: ${tool.features.join(', ')}
Operational Context: ${operationalStr}
Alternatives: ${tool.alternatives.join(', ')}
  `.trim();

    return {
        id: tool.id,
        type: 'tool',
        title: tool.name,
        description: tool.description,
        tags: [...tool.features, tool.license, tool.category],
        operationalContext: operationalStr,
        embeddingText,
        popularityScore: (tool.starsCount || 0) / 100000, // Normalized 0-1
        readinessScore: calculateOperationalReadiness(tool) / 100,
    };
}

export function calculateOperationalReadiness(tool: Tool): number {
    let score = (tool.starsCount || 0) / 1000;
    if (tool.k8sSupport) score += 5;
    if (tool.maintenanceLevel === 'low') score += 10;
    return Math.min(score, 100);
}