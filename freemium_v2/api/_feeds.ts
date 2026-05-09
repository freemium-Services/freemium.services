import { CATEGORIES, COMPARISONS, KNOWLEDGE_HUB, TOOLS } from '../src/lib/data';

export const WORKFLOW_FEEDS = [
  {
    id: 'private-ai-stack',
    title: 'Private AI Stack',
    description: 'Run local inference, team chat, and semantic memory with a fully self-hosted AI stack.',
    tools: ['ollama', 'open-webui', 'qdrant', 'anythingllm'],
    category: 'ai-tools',
    costModel: 'self-hosted',
    deployment: ['Docker', 'local GPU optional', 'private network'],
  },
  {
    id: 'automation-os',
    title: 'Open Automation Operating System',
    description: 'Replace hosted automation suites with a self-hosted workflow and integration layer.',
    tools: ['n8n', 'activepieces', 'coolify'],
    category: 'automation-tools',
    costModel: 'freemium',
    deployment: ['Docker', 'VPS', 'webhooks'],
  },
  {
    id: 'developer-productivity',
    title: 'AI Developer Productivity Stack',
    description: 'Combine fast editors, coding agents, local search, and deploy tooling for software teams.',
    tools: ['zed', 'claude-code', 'perplexica', 'coolify'],
    category: 'developer-tools',
    costModel: 'mixed',
    deployment: ['desktop', 'CLI', 'self-hosted services'],
  },
];

export function buildToolsFeed() {
  return {
    generatedAt: new Date().toISOString(),
    count: TOOLS.length,
    tools: TOOLS.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      license: tool.license,
      selfHostable: tool.selfHostable,
      website: tool.website,
      github: tool.github,
      stars: tool.stars,
      features: tool.features,
      useCases: tool.useCases,
      alternatives: tool.alternatives,
      operational: {
        ramMinMb: tool.ramMin,
        gpuRequired: tool.gpuRequired ?? false,
        dockerSupport: tool.dockerSupport ?? false,
        k8sSupport: tool.k8sSupport ?? false,
        privacyScore: tool.privacyScore,
        maintenanceLevel: tool.maintenanceLevel,
        scalingDifficulty: tool.scalingDifficulty,
      },
      seo: {
        title: tool.seoTitle,
        description: tool.seoDescription,
      },
    })),
  };
}

export function buildWorkflowsFeed() {
  return {
    generatedAt: new Date().toISOString(),
    count: WORKFLOW_FEEDS.length,
    workflows: WORKFLOW_FEEDS,
  };
}

export function buildGraphFeed() {
  const categoryNodes = CATEGORIES.map((category) => ({
    id: category.id,
    type: 'category' as const,
    label: category.name,
    description: category.description,
    toolCount: category.toolCount,
  }));

  const toolNodes = TOOLS.map((tool) => ({
    id: tool.id,
    type: 'tool' as const,
    label: tool.name,
    category: tool.category,
    selfHostable: tool.selfHostable,
    license: tool.license,
  }));

  const workflowNodes = WORKFLOW_FEEDS.map((workflow) => ({
    id: workflow.id,
    type: 'workflow' as const,
    label: workflow.title,
    category: workflow.category,
  }));

  const guideNodes = KNOWLEDGE_HUB.map((guide) => ({
    id: guide.id,
    type: 'guide' as const,
    label: guide.title,
  }));

  const comparisonNodes = COMPARISONS.map((comparison) => ({
    id: comparison.id,
    type: 'comparison' as const,
    label: `${comparison.toolA} vs ${comparison.toolB}`,
    verdict: comparison.verdict,
  }));

  return {
    generatedAt: new Date().toISOString(),
    nodes: [...categoryNodes, ...toolNodes, ...workflowNodes, ...guideNodes, ...comparisonNodes],
    edges: [
      ...TOOLS.map((tool) => ({
        source: tool.category,
        target: tool.id,
        type: 'contains',
      })),
      ...TOOLS.flatMap((tool) =>
        tool.alternatives.map((alternative) => ({
          source: tool.id,
          target: alternative.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          type: 'alternative',
          label: alternative,
        })),
      ),
      ...WORKFLOW_FEEDS.flatMap((workflow) =>
        workflow.tools.map((toolId) => ({
          source: workflow.id,
          target: toolId,
          type: 'uses',
        })),
      ),
      ...COMPARISONS.flatMap((comparison) => [
        {
          source: comparison.id,
          target: comparison.toolA.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          type: 'compares',
          label: comparison.toolA,
        },
        {
          source: comparison.id,
          target: comparison.toolB.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          type: 'compares',
          label: comparison.toolB,
        },
      ]),
    ],
  };
}
