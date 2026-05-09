const fs = require('fs');
const path = require('path');

const ecosystemPath = path.join(__dirname, '..', 'data', 'seo-ecosystem.json');
const outputPath = path.join(__dirname, '..', 'data', 'seo-backlog.json');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleCase(value) {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}

const archetypeConfig = {
  'best-tool-list': {
    label: 'Best tool list',
    wordCountTarget: 3200,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'SoftwareApplication'],
  },
  comparison: {
    label: 'Comparison',
    wordCountTarget: 3400,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'SoftwareApplication'],
  },
  'self-host-guide': {
    label: 'Self-host guide',
    wordCountTarget: 3600,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'SoftwareApplication', 'HowTo'],
  },
  'workflow-stack': {
    label: 'Workflow stack',
    wordCountTarget: 3200,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'HowTo'],
  },
  'benchmark-study': {
    label: 'Benchmark study',
    wordCountTarget: 4200,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'Dataset'],
  },
  alternatives: {
    label: 'Alternatives',
    wordCountTarget: 3200,
    faqTarget: 100,
    schema: ['Article', 'BreadcrumbList', 'FAQPage', 'Speakable', 'ItemList', 'SoftwareApplication'],
  },
};

const faqDistribution = {
  beginner: 20,
  comparison: 20,
  operational: 20,
  deployment: 15,
  'privacy-security': 10,
  performance: 10,
  'advanced-workflows': 5,
};

function makeBrief({ pillar, title, archetype, keyword, audience, angle, tool, secondaryTool, index }) {
  const slug = slugify(title);
  const config = archetypeConfig[archetype];
  const relatedTools = [...new Set([
    tool,
    secondaryTool,
    ...pillar.toolTargets,
  ].filter(Boolean))].slice(0, 20);

  return {
    id: slug,
    title,
    slug: `/blog/${slug}`,
    nodeType: 'semantic-article',
    archetype,
    archetypeLabel: config.label,
    pillar: pillar.slug,
    cluster: angle,
    intent: archetype === 'comparison' ? 'commercial-investigation' : archetype === 'self-host-guide' ? 'setup' : 'informational',
    primaryKeyword: keyword,
    secondaryKeywords: [
      `${keyword} ${audience}`,
      `${keyword} ${angle}`,
      `${tool} alternative`,
      `free ${angle} tools`,
    ],
    targetAudience: audience,
    mappedTools: relatedTools,
    aeoSummary: {
      bestFor: angle,
      minimumRam: archetype === 'benchmark-study' ? '8GB to 16GB' : 'Varies by tool',
      gpuNeeded: angle.toLowerCase().includes('llm') || angle.toLowerCase().includes('ai') ? 'Optional' : 'None',
      bestTools: relatedTools.slice(0, 5),
      deployment: archetype === 'self-host-guide' || archetype === 'workflow-stack' ? ['Docker', 'VPS', 'local'] : ['Web', 'Desktop', 'Docker when available'],
      privacyScore: archetype === 'self-host-guide' ? 'High' : 'Medium',
    },
    requiredSections: [
      'Hero',
      'TLDR',
      'AI crawler optimized summary',
      'Comparison snapshot',
      'Operational matrix',
      'Tool deep-dives',
      'Workflow integrations',
      'Performance benchmarks',
      'Privacy/security analysis',
      'Deployment recommendations',
      'Alternatives',
      'FAQ engine',
      'Internal semantic rail',
    ],
    requiredInternalLinks: [
      `/${pillar.slug}`,
      '/directory',
      `/knowledge/${slugify(angle)}`,
      `/directory`,
      ...relatedTools.slice(0, 10).map((name) => `/tools/${slugify(name)}`),
      `/workflows/${slugify(`${angle} stack`)}`,
      secondaryTool ? `/compare/${slugify(tool)}-vs-${slugify(secondaryTool)}` : null,
      `/blog/${slugify(`${angle} tools ${audience}`)}`,
    ].filter(Boolean),
    linkQuotas: {
      pillars: { min: 2, max: 4 },
      tools: { min: 10, max: 20 },
      workflows: { min: 3, max: 6 },
      comparisons: { min: 2, max: 4 },
      docs: { min: 5, max: 10 },
      relatedArticles: { min: 5, max: 8 },
    },
    faqTarget: config.faqTarget,
    faqDistribution,
    wordCountTarget: config.wordCountTarget,
    schema: config.schema,
    embeddingText: [
      title,
      pillar.title,
      angle,
      audience,
      keyword,
      relatedTools.join(', '),
      `semantic node ${index}`,
    ].join('\n'),
    opportunity: {
      trendScore: 70,
      intentScore: archetype === 'comparison' || archetype === 'alternatives' ? 90 : 80,
      businessFit: 90,
      competitionScore: 35,
    },
  };
}

function generateBacklog(ecosystem) {
  const briefs = [];
  const seen = new Set();
  const distribution = ecosystem.blogGeneration.distribution;
  const modifiers = ecosystem.blogGeneration.modifiers;

  for (const [archetype, targetCount] of Object.entries(distribution)) {
    let createdForType = 0;
    let cursor = 0;

    while (createdForType < targetCount) {
      const pillar = ecosystem.pillars[cursor % ecosystem.pillars.length];
      const angle = pillar.contentAngles[Math.floor(cursor / 2) % pillar.contentAngles.length];
      const audience = pillar.audiences[Math.floor(cursor / 3) % pillar.audiences.length];
      const modifier = modifiers[cursor % modifiers.length];
      const tool = pillar.toolTargets[(cursor + angle.length) % pillar.toolTargets.length];
      const secondaryTool = pillar.toolTargets[(cursor + angle.length + 1) % pillar.toolTargets.length];
      const keyword = pillar.secondaryKeywords[(cursor + audience.length) % pillar.secondaryKeywords.length] || pillar.primaryKeyword;

      const titleByArchetype = {
        'best-tool-list': `Best ${keyword} for ${audience} ${modifier}`,
        comparison: `${tool} vs ${secondaryTool}: best ${angle} tool for ${audience}`,
        'self-host-guide': `How to self-host ${tool} for ${angle} ${modifier}`,
        'workflow-stack': `Complete ${angle} workflow stack for ${audience} ${modifier}`,
        'benchmark-study': `${titleCase(angle)} benchmark: ${tool} vs ${secondaryTool} ${modifier}`,
        alternatives: `Best open source alternatives to ${tool} for ${audience} ${modifier}`,
      };

      const title = titleByArchetype[archetype];
      const slug = slugify(title);
      cursor++;

      if (seen.has(slug)) {
        continue;
      }
      seen.add(slug);

      briefs.push(makeBrief({ pillar, title, archetype, keyword, audience, angle, tool, secondaryTool, index: briefs.length + 1 }));
      createdForType++;

      if (briefs.length >= ecosystem.blogGeneration.minimumBacklogSize) {
        return briefs;
      }
    }
  }

  if (briefs.length < ecosystem.blogGeneration.minimumBacklogSize) {
    for (const pillar of ecosystem.pillars) {
      for (const angle of pillar.contentAngles) {
        for (const audience of pillar.audiences) {
          for (const modifier of modifiers) {
            const title = `Best ${angle} tools for ${audience} ${modifier}`;
            const slug = slugify(title);
            if (seen.has(slug)) continue;
            seen.add(slug);
            briefs.push(makeBrief({
              pillar,
              title,
              archetype: 'best-tool-list',
              keyword: pillar.primaryKeyword,
              audience,
              angle,
              tool: pillar.toolTargets[0],
              secondaryTool: pillar.toolTargets[1],
              index: briefs.length + 1,
            }));

            if (briefs.length >= ecosystem.blogGeneration.minimumBacklogSize) {
              return briefs;
            }
          }
        }
      }
    }
  }

  return briefs;
}

function run() {
  const ecosystem = JSON.parse(fs.readFileSync(ecosystemPath, 'utf8'));
  const briefs = generateBacklog(ecosystem);
  fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: briefs.length, briefs }, null, 2)}\n`);
  console.log(`Generated ${briefs.length} SEO briefs at ${outputPath}`);
}

if (require.main === module) {
  run();
}

module.exports = { generateBacklog, slugify };
