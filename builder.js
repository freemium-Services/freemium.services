const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { marked } = require('marked');
const { translateText } = require('./scripts/ingest');

const dataFile = path.join(__dirname, 'data', 'tools.json');
const translationCacheFile = path.join(__dirname, 'data', 'translation-cache.json');
const cssFile = path.join(__dirname, 'src', 'css', 'main.css');
const chatJsFile = path.join(__dirname, 'src', 'js', 'chat-widget.js');
const searchJsFile = path.join(__dirname, 'src', 'js', 'search.js');
const newsletterJsFile = path.join(__dirname, 'src', 'js', 'newsletter.js');
const glossaryFile = path.join(__dirname, 'data', 'glossary.json');
const outDir = path.join(__dirname, 'public');
const ogDir = path.join(outDir, 'og');
const verificationFiles = ['google04335a96bc295973.html'];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(ogDir)) fs.mkdirSync(ogDir, { recursive: true });

const SITE_URL = 'https://freemium.services';
const TQ_URL = 'https://turboquant.network';
const LANGUAGES = ['en', 'hi', 'ml', 'ta']; // Supported hreflang languages
const STARS_THRESHOLD = 5000; // Algorithmic Control: Only generate comparisons for popular tools
const MAX_PAGE_SIZE_KB = 150;

let translationCache = {};
if (fs.existsSync(translationCacheFile)) {
  try {
    translationCache = JSON.parse(fs.readFileSync(translationCacheFile, 'utf8'));
  } catch (e) {
    console.warn('⚠️ Could not load translation-cache.json');
  }
}

// --- Validation & Loading ---
let toolsData = {};
try {
  toolsData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
} catch (e) {
  console.error('❌ Could not load tools.json', e);
  process.exit(1);
}

function validateTool(tool) {
  const required = ['id', 'name', 'category', 'description', 'features', 'faq', 'alternatives'];
  for (const field of required) {
    if (!tool[field]) {
      throw new Error(`Build Failed: Missing required field '${field}' in tool '${tool.id || 'unknown'}'`);
    }
  }

  // Ensure alternatives is a non-empty array
  if (!Array.isArray(tool.alternatives) || tool.alternatives.length === 0) {
    throw new Error(`Build Failed: Tool '${tool.id}' must have an 'alternatives' array with at least one entry.`);
  }
  // Check for at least one alternative that actually exists in toolsData for the search suggestor
  const hasValidAlt = tool.alternatives.some(altId => toolsData[altId]);
  if (!hasValidAlt) {
    console.warn(`⚠️ Build Warning: Tool '${tool.id}' has no valid alternatives present in tools.json. Search suggestions for this tool will be limited.`);
  }

  // Inject freshness signal if missing
  if (!tool.lastUpdated) {
    tool.lastUpdated = new Date().toISOString().split('T')[0];
  }
}

// Validate all tools before proceeding
Object.values(toolsData).forEach(validateTool);

function validateCategories() {
  const toolCategories = new Set(Object.values(toolsData).map(t => t.category));
  Object.keys(categories).forEach(catId => {
    if (!toolCategories.has(catId)) {
      throw new Error(`Build Failed: Category '${catId}' defined in builder.js has no associated tools in tools.json.`);
    }
  });
}


let cssContent = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '';
let chatJsContent = fs.existsSync(chatJsFile) ? fs.readFileSync(chatJsFile, 'utf8') : '';
let searchJsContent = fs.existsSync(searchJsFile) ? fs.readFileSync(searchJsFile, 'utf8') : '';
let newsletterJsContent = fs.existsSync(newsletterJsFile) ? fs.readFileSync(newsletterJsFile, 'utf8') : '';
let glossary = {};
try { glossary = JSON.parse(fs.readFileSync(glossaryFile, 'utf8')); } catch (e) { }

function getLocalizedUrl(urlPath, lang) {
  return lang === 'en' ? urlPath : `/${lang}${urlPath}`;
}

async function getTranslated(text, lang, cache) {
  if (lang === 'en' || !text) return text;
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const cacheKey = `${lang}:${hash}`;
  if (cache[cacheKey]) return cache[cacheKey];
  const translated = await translateText(text, lang);
  cache[cacheKey] = translated;
  return translated;
}

async function getLocalizedTool(tool, lang, cache) {
  if (lang === 'en') return tool;
  return {
    ...tool,
    name: await getTranslated(tool.name, lang, cache),
    description: await getTranslated(tool.description, lang, cache), // Await this
    features: await Promise.all((tool.features || []).map(f => getTranslated(f, lang, cache))),
    faq: await Promise.all((tool.faq || []).map(async f => ({
      q: await getTranslated(f.q, lang, cache),
      a: await getTranslated(f.a, lang, cache)
    }))),
    install: tool.install // Commands usually stay in English for terminal use
  };
}

async function getLocalizedCategory(catInfo, lang, cache) {
  if (lang === 'en') return catInfo;
  return {
    ...catInfo,
    name: await getTranslated(catInfo.name, lang, cache),
    description: await getTranslated(catInfo.description, lang, cache), // Await this
    longDesc: await getTranslated(catInfo.longDesc, lang, cache)
  };
}

async function getLocalizedFaqBank(bank, lang, cache) {
  if (lang === 'en') return bank;
  return Promise.all(bank.map(async f => ({
    q: await getTranslated(f.q, lang, cache), // Await this
    a: await getTranslated(f.a, lang, cache) // Await this
  })));
}

async function getLocalizedGlossary(gloss, lang, cache) {
  if (lang === 'en') return gloss;
  const localized = {};
  for (const key in gloss) {
    localized[key] = {
      term: await getTranslated(gloss[key].term, lang, cache), // Await this
      def: await getTranslated(gloss[key].def, lang, cache) // Await this
    };
  }
  return localized;
}

function mapToolToSearchEntry(tool, lastmod, isFeatured) {
  return {
    slug: tool.id,
    title: tool.name,
    category: tool.category,
    lastmod: lastmod,
    description: tool.description.replace(/[#*`]/g, '').slice(0, 100),
    isFeatured: isFeatured,
    alternatives: tool.alternatives || [],
    install: tool.install || ''
  };
}

// --- SEO Internal Linking Engine (#8) ---
function linkify(text) {
  let linkedText = text;
  Object.keys(glossary).forEach(key => {
    const term = glossary[key].term;
    const regex = new RegExp(`\\b(${term})\\b`, 'i');
    // Only link the first occurrence to avoid over-optimization
    linkedText = linkedText.replace(regex, `<a href="/knowledge-hub.html#${key.toLowerCase()}" class="glossary-link">$1</a>`);
  });
  return linkedText;
}

let categories = {
  'ai-tools': {
    name: 'AI Tools',
    description: 'Local LLMs, inference engines, and platforms.',
    longDesc: `
## The Definitive Guide to Open-Source AI Stacks in 2026
Welcome to the ultimate hub for Open-Source Artificial Intelligence. In 2026, the landscape of AI has shifted from monolithic SaaS providers to modular, self-hosted stacks. This guide explores the semantic entities required to dominate the AI landscape, focusing on LLMs, RAG (Retrieval-Augmented Generation), and autonomous agents.

### 1. The Rise of Data Sovereignty in AI
Organizations are increasingly moving away from closed-source models to maintain control over their proprietary data. By utilizing tools like **Ollama** for local inference and **Qdrant** for vector storage, you can build production-grade AI systems that never leak sensitive information to third-party providers. This sovereignty is the cornerstone of modern enterprise AI strategy.

### 2. Mastering RAG (Retrieval-Augmented Generation)
RAG pipelines have become the standard for grounding LLMs in reality. Instead of relying solely on pre-trained knowledge, RAG allows your AI to query your internal documentation in real-time. Tools like **Dify** and **Onyx** simplify this orchestration, providing out-of-the-box support for vector embedding and context retrieval.

### 3. Autonomous Agents and Workflow Automation
The next frontier is agentic workflows. Autonomous agents can now use tools, execute bash commands, and iterate on complex multi-step goals. Integrating **Claude Code** with **n8n** allows developers to automate entire software development lifecycles (SDLC) with zero human intervention in the loop.`
  },
  'automation-tools': {
    name: 'Automation Tools',
    description: 'Open-source and freemium workflow automation.',
    longDesc: `
## Building Resilient Automation Architectures
Workflow automation is the glue of modern digital business. However, relying on proprietary platforms like Zapier creates significant risk through vendor lock-in and high task-based costs. Our directory focuses on fair-code and open-source alternatives that prioritize efficiency and flexibility.

### 1. The iPaaS Revolution
Modern Integration Platform as a Service (iPaaS) solutions like **n8n** provide a visual interface for connecting over 400 applications. Because these tools can be self-hosted on the **TurboQuant DePIN** network, you can run thousands of execution steps for the price of raw compute, rather than paying per-task premiums.

### 2. Event-Driven Architectures
Leveraging webhooks and cron triggers allows your infrastructure to react in real-time to external signals. Whether it is processing a new Stripe payment or reacting to a GitHub pull request, open-source automation nodes ensure your data flows smoothly across your entire tech stack.`
  },
  'self-hosting': {
    name: 'Self-Hosting',
    description: 'PaaS and deployment tools for your own infrastructure.',
    longDesc: `
## The Self-Hosting Handbook: From Homelab to Enterprise
Self-hosting is no longer just for enthusiasts; it is a strategic requirement for privacy-conscious organizations. This pillar page provides the technical scaffolding for deploying and maintaining your own software stack with zero reliance on the public cloud.

### 1. Containerization with Docker and Kubernetes
The standard for modern self-hosting is containerization. **Docker** allows you to package any application into an immutable unit that runs anywhere. For larger scales, **Kubernetes** provides the orchestration required for high-availability and elastic scaling.

### 2. Infrastructure as Code (IaC)
Managing servers manually is a thing of the past. Using tools like **Coolify** or custom Ansible playbooks, you can treat your hardware as code, ensuring that your deployments are reproducible, secure, and easily backable.`
  },
  'rag-tools': {
    name: 'RAG Tools',
    description: 'Retrieval-Augmented Generation visual builders and frameworks.',
    longDesc: `
## Mastering Retrieval-Augmented Generation (RAG)
RAG has emerged as the definitive architecture for grounding LLMs in proprietary data. By connecting your models to a live knowledge base, you eliminate hallucinations and ensure your AI provides cited, accurate information.

### 1. The RAG Pipeline Architecture
A production-ready RAG pipeline consists of several key stages: document ingestion, chunking strategies, embedding generation, and vector storage. Tools like **LlamaIndex** and **LangChain** provide the primitive building blocks, while platforms like **Dify** offer a visual orchestration layer.

### 2. Hybrid Search and Re-ranking
In 2026, simple semantic search is no longer enough. Leading RAG implementations use hybrid search—combining vector similarity with keyword matching (BM25). Integrating a re-ranker stage ensures that the most relevant context is injected into the LLM prompt, significantly improving output quality.`
  },
  'ai-agents': {
    name: 'AI Agents',
    description: 'Autonomous systems that plan, reason, and execute tasks.',
    longDesc: `
## The Era of Agentic Workflows
AI Agents represent the transition from "Chat" to "Do". These autonomous systems use LLMs to plan multi-step actions, call APIs, and browse the web to complete complex goals with minimal human intervention.

### 1. Autonomous Task Execution
Unlike simple chatbots, agents like **AutoGPT** or **Claude Code** can interact with their environment. They can read your codebase, write tests, and refactor files. This autonomy is powered by advanced reasoning capabilities and tool-calling protocols.

### 2. Multi-Agent Orchestration
The next frontier is teams of specialized agents working together. Frameworks like **CrewAI** allow you to define distinct roles (e.g., a "Researcher" and a "Writer") that collaborate to deliver high-quality results.`
  },
  'developer-tools': {
    name: 'Developer Tools',
    description: 'Essential utilities, frameworks, and platforms for modern engineering.',
    longDesc: `
## Building the Modern Developer Stack
The tools developers use daily have seen a massive performance revolution. From ultra-fast editors to local-first databases, the 2026 developer stack prioritizes speed, efficiency, and deep AI integration.

### 1. High-Performance Infrastructure
Tools like **Zed** and **Meilisearch** are rewriting the rules of software performance. By utilizing systems-level languages and GPU acceleration, these tools provide an instantaneous feedback loop that was previously impossible.

### 2. Open-Source Backend Platforms (BaaS)
Moving away from proprietary cloud services, developers are adopting self-hostable alternatives like **Supabase** and **Appwrite**. These platforms provide Postgres, Auth, and Storage out of the box.`
  },
  'vector-databases': {
    name: 'Vector Databases',
    description: 'The memory layer for modern AI and semantic search.',
    longDesc: `
## The Foundation of Semantic Memory
Vector databases are specialized storage engines designed to handle high-dimensional embeddings. They enable fast similarity search, making them the essential "memory" component for RAG pipelines.

### 1. Efficient Similarity Search
Standard SQL databases are not optimized for vector math. Dedicated engines like **Qdrant** and **Weaviate** use advanced indexing algorithms (like HNSW) to perform sub-millisecond searches across millions of vectors.

### 2. Choosing the Right Vector Store
When selecting a vector database, consider your scale and performance requirements. **pgvector** is excellent for teams already using PostgreSQL, while **Milvus** is preferred for billion-scale production workloads.`
  },
  'cli-tools': {
    name: 'CLI Tools',
    description: 'Terminal utilities and command-line interfaces for power users.',
    longDesc: `
## The Terminal Renaissance
The command line remains the most powerful interface for developers. Modern CLI tools, often written in Rust or Go, are replacing legacy Unix defaults with faster, more ergonomic alternatives.

### 1. AI-Powered Terminal Workflows
Command-line agents like **Ollama** and **Aider** allow you to bring generative AI directly into your shell. You can run models, edit code, and manage infrastructure without ever leaving the terminal.

### 2. Essential Productivity Utilities
Upgrade your terminal with modern replacements: use **ripgrep** for searching, **fzf** for fuzzy finding, and **lazygit** for visual git management.`
  },
  'assistants': {
    name: 'AI Assistants',
    description: 'Self-hosted and private alternatives to commercial chatbots.',
    longDesc: `
## Reclaiming Privacy with Self-Hosted AI
Commercial AI assistants often come with privacy concerns. The open-source community has responded with powerful, local-first alternatives that give you full control over your data and model choices.

### 1. Polished User Interfaces
Interfaces like **Open WebUI** provide a polished, ChatGPT-like experience while running entirely on your hardware. They support RAG, web search, and multi-user access control.

### 2. Local Inference Engines
By pairing a frontend with inference engines like **Ollama**, you can run the latest open-source models (like Llama 3 or Mistral) with zero API costs. This ensures your conversations remain private.`
  },
  'open-source': {
    name: 'Open Source',
    description: 'The definitive directory of community-backed, free-to-use software.',
    longDesc: `
## The Power of Community-Driven Software
Open-source software is the backbone of the internet. It offers transparency, security, and the freedom to modify and distribute code without the constraints of proprietary licensing.

### 1. Why Open Source Wins in 2026
In an era of vendor lock-in and rising SaaS costs, open source provides a sustainable path forward. Verified projects on Freemium.Services ensure that you have access to high-quality code.

### 2. Contributing to the Ecosystem
Open source thrives on contribution. Whether it's reporting bugs or writing documentation, being part of the community helps improve the tools we all rely on.`
  }
};

validateCategories();

let faqBank = [];
try {
  faqBank = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'faqs.json'), 'utf8'));
} catch (e) {
  console.warn('⚠️ Could not load faqs.json, using empty array');
}

// --- Helpers ---
function generateHreflangTags(pagePath) {
  return LANGUAGES.map(lang => {
    // The 'en' version is hosted at root, others in subdirectories
    const langPath = lang === 'en' ? pagePath : `/${lang}${pagePath}`;
    return `<link rel="alternate" hreflang="${lang}" href="${SITE_URL}${langPath}">`;
  }).join('\n  ');
}

function getBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

function generateSvgOgImage(title, category, filename) {
  // A simple programmatic SVG OG Image generator
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title} OG Image">
    <title>${title} - ${category}</title>
    <rect width="1200" height="630" fill="#080B10"/>
    <rect width="1200" height="630" fill="url(#grad)" opacity="0.2"/>
    <defs>
      <radialGradient id="grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00D4FF" stop-opacity="1"/>
        <stop offset="100%" stop-color="#080B10" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <text x="80" y="150" font-family="sans-serif" font-size="40" fill="#00D4FF" font-weight="bold" letter-spacing="2">FREEMIUM.SERVICES</text>
    <text x="80" y="320" font-family="sans-serif" font-size="80" fill="#FFFFFF" font-weight="bold">${title}</text>
    <text x="80" y="420" font-family="sans-serif" font-size="40" fill="#9BB0C8">${category}</text>
  </svg>`;
  fs.writeFileSync(path.join(ogDir, filename), svg);
  return `/og/${filename}`;
}

function getBaseLayout(title, desc, canonicalPath, content, lang = 'en', headInject = '', bodyInject = '', ogImagePath = '/og-default.png', lastUpdated = '') {
  const hreflangTags = generateHreflangTags(canonicalPath);
  const freshnessMeta = lastUpdated ? `<meta property="article:modified_time" content="${lastUpdated}">` : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="google-site-verification" content="Q4e3BbSfoLN1IFyXjIR4m4klvi1gXjKF_KdIdU4CJG0">
  <title>${title} | Freemium.Services</title>
  <meta name="description" content="${desc.slice(0, 160)}">
  <link rel="canonical" href="${SITE_URL}${canonicalPath}">
  ${hreflangTags}

  <script>
    (function() {
      const bucket = localStorage.getItem('fs_ab_bucket') || (Math.random() < 0.5 ? 'A' : 'B');
      localStorage.setItem('fs_ab_bucket', bucket);
      document.documentElement.setAttribute('data-ab-bucket', bucket);
    })();
  </script>

  <script defer src="/_vercel/insights/script.js"></script>
  
  <meta property="og:title" content="${title} | Freemium.Services">
  <meta property="og:description" content="${desc.slice(0, 200)}">
  <meta property="og:image" content="${SITE_URL}${ogImagePath}">
  <meta property="og:url" content="${SITE_URL}${canonicalPath}">
  <meta property="og:type" content="website">
  ${freshnessMeta}
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${SITE_URL}${ogImagePath}">
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Space+Mono&display=swap" rel="stylesheet">
  <style>${cssContent}</style>
  ${headInject}
  <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.basic.min.js"></script>
</head>
<body>
  <nav>
      <div class="nav-inner">
          <a href="${getLocalizedUrl('/', lang)}" class="logo" aria-label="Freemium Services Home">freemium<span style="color: #00ffaa;">.services</span></a>
          <div class="nav-links">
            <a href="${getLocalizedUrl('/category/ai-tools.html', lang)}">AI Tools</a>
            <a href="${getLocalizedUrl('/category/automation-tools.html', lang)}">Automation</a>
            <a href="${getLocalizedUrl('/knowledge-hub.html', lang)}">Docs</a>
            <a href="${TQ_URL}" target="_blank" class="tq-link">TurboQuant ↗</a>
          </div>
          <div class="nav-actions" style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="search-trigger" class="btn-search-trigger">
              <span>Search...</span>
              <span class="search-kbd">⌘K</span>
            </button>
            <button class="menu-toggle" onclick="document.querySelector('.nav-links').classList.toggle('active')">☰</button>
          </div>
      </div>
  </nav>
  ${content}
  <div id="search-modal">
    <div class="search-container">
      <div class="search-input-wrapper">
        <input type="text" id="search-input" placeholder="Search for tools (e.g. n8n)..." autocomplete="off">
      </div>
      <div id="search-results"></div>
    </div>
  </div>
  <footer>
    <p>© 2026 Freemium.Services. Empowering developers with open-source sovereignty.</p>
  </footer>
  ${bodyInject}
  <script>
    // Search Intent Analytics (#42)
    window.logSearchIntent = (query, resultCount) => {
      if (window.va) window.va('track', 'Search Intent', { query, resultCount });
      console.log('[Analytics] Search: "' + query + '" - Results: ' + resultCount);
    };
  </script>
  <script defer src="/js/search.js"></script>
  <script defer src="/js/newsletter.js"></script>

  <div id="newsletter-modal">
    <div class="newsletter-container">
      <button class="btn-newsletter-close" id="newsletter-close">&times;</button>
      <div class="newsletter-content">
        <h3>Stay in the Loop!</h3>
        <p>Get the latest open-source tools, self-hosting guides, and AI insights delivered weekly.</p>
        <div class="newsletter-input-group">
          <input type="email" id="newsletter-email" class="newsletter-input" placeholder="your@email.com" autocomplete="email">
          <button id="newsletter-subscribe" class="btn-subscribe">Subscribe</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// --- Generators ---
function renderToolPage(t, lang) {
  const breadcrumbItems = [
    { name: "Home", url: SITE_URL + getLocalizedUrl("/", lang) },
    { name: categories[t.category]?.name || t.category, url: SITE_URL + getLocalizedUrl(`/category/${t.category}.html`, lang) },
    { name: t.name, url: SITE_URL + getLocalizedUrl(`/tools/${t.id}.html`, lang) }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": t.name,
    "description": t.description,
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "dateModified": t.lastUpdated,
    "offers": { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" },
    "aggregateRating": {
      "@type": "AggregateRating", "ratingValue": "5", "ratingCount": t.stars || "100"
    }
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (t.faq || []).map(f => ({
      "@type": "Question", "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  // Internal Linking Intelligence
  const sameCategoryTools = Object.values(toolsData).filter(tool => tool.category === t.category && tool.id !== t.id).slice(0, 3);

  const alternativesHtml = sameCategoryTools.map(altTool => {
    return `<a href="${getLocalizedUrl(`/compare/${t.id}-vs-${altTool.id}.html`, lang)}" class="tool-card" data-analytics="compare-click" data-target="${altTool.id}">
      <h3>${altTool.emoji} ${altTool.name}</h3><p>Compare ${t.name} vs ${altTool.name} →</p>
    </a>`;
  }).join('');

  const relatedHtml = sameCategoryTools.map(rel => {
    return `<a href="${getLocalizedUrl(`/tools/${rel.id}.html`, lang)}" class="tool-card" data-analytics="related-click" data-target="${rel.id}">
      <h3>${rel.emoji} ${rel.name}</h3>
    </a>`;
  }).join('');

  const faqHtml = (t.faq || []).map(f => `<details><summary>${f.q}</summary><div class="prose" style="padding-top:0.5rem; color:var(--text2);">${marked.parse(f.a)}</div></details>`).join('');
  const featuresHtml = (t.features || []).map(f => `<li>✅ ${f}</li>`).join('');

  const ogImagePath = generateSvgOgImage(t.name, categories[t.category]?.name || t.category, `${t.id}-og.svg`);

  const content = `
    <div class="container">
      <nav class="breadcrumbs">
        <div class="breadcrumb-links">
          <a href="${getLocalizedUrl('/', lang)}">Home</a> › <a href="${getLocalizedUrl(`/category/${t.category}.html`, lang)}">${categories[t.category]?.name || t.category}</a> › <span>${t.name}</span>
        </div>
        <a href="https://github.com/freemium-Services/freemium.services/edit/main/data/tools.json" target="_blank" rel="noopener noreferrer" class="btn-github-edit">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit on GitHub
        </a>
      </nav>
      
      <h1>${t.emoji} ${t.name}</h1>
      <div class="tool-meta-bar">
        <span style="color: var(--plasma); font-weight: 700;">Last Updated: ${t.lastUpdated}</span> •
        <span>${t.stars.toLocaleString()} GitHub Stars</span> • 
        <span>License: ${t.license}</span>
        <span class="badge-verified">VERIFIED FOR 2026</span>
      </div>
      
      <div class="prose lead">${marked.parse(linkify(t.description))}</div>

      <section class="features">
        <h2>Key Features</h2>
        <ul>${featuresHtml}</ul>
      </section>

      <section class="install">
        <h2>One-Line Install</h2>
        <pre><code>${t.install}</code></pre>
      </section>

      <section class="alternatives">
        <h2>Compare Alternatives</h2>
        <div class="grid">${alternativesHtml}</div>
      </section>

      <section class="related">
        <h2>People Also Explore</h2>
        <div class="grid">${relatedHtml}</div>
      </section>

      <section class="faq">
        <h2>Frequently Asked Questions</h2>
        ${faqHtml}
      </section>

      <section class="cta-actions">
        <a href="${TQ_URL}" target="_blank" class="btn-primary" data-analytics="outbound-deploy" data-target="${t.id}">Deploy on TurboQuant →</a>
        <a href="/go/${t.id}" target="_blank" rel="nofollow" class="btn-secondary">Visit Official Site ↗</a>
      </section>
      
      <div class="consulting-card">
        <h4>Looking for a ${t.name} Expert?</h4>
        <p>Hire verified DevOps and Open Source specialists to deploy ${t.name} for your organization.</p>
        <a href="mailto:experts@freemium.services?subject=Hire ${t.name} Expert" class="btn-consulting">Contact Consulting Team →</a>
      </div>
    </div>
  `;

  const headInject = `
    <script type="application/ld+json">${JSON.stringify(getBreadcrumbSchema(breadcrumbItems))}</script>
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <script type="application/ld+json">${JSON.stringify(faq)}</script>
  `;

  return getBaseLayout(`${t.name} - Open Source Guide`, t.description, `/tools/${t.id}.html`, content, lang, headInject, `<script defer src="/js/chat-widget.js"></script>`, ogImagePath, t.lastUpdated);
}

function renderCategoryPage(catId, catInfo, lang) {
  const catTools = Object.values(toolsData).filter(t => t.category === catId);
  const toolsHtml = catTools.map(t => renderToolCard(t, lang)).join('');

  const faqBankHtml = faqBank.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": catTools.map((t, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${SITE_URL}/tools/${t.id}.html`
    }))
  };

  const breadcrumbItems = [
    { name: "Home", url: SITE_URL + getLocalizedUrl("/", lang) },
    { name: catInfo.name, url: SITE_URL + getLocalizedUrl(`/category/${catId}.html`, lang) }
  ];

  const ogImagePath = generateSvgOgImage(catInfo.name, 'Category Hub', `${catId}-og.svg`);

  const content = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="${getLocalizedUrl('/', lang)}">Home</a> › <span>${catInfo.name}</span>
      </nav>
      <h1>${catInfo.name}</h1>
      <p class="lead">${linkify(catInfo.description)}</p>

      ${catInfo.longDesc ? `<div class="prose" style="margin-top: 3rem; margin-bottom: 3rem;">${marked.parse(linkify(catInfo.longDesc))}</div>` : ''}

      <section>
        <h2 class="section-title">Verified ${catInfo.name}</h2>
        <div class="tool-grid">${toolsHtml}</div>
      </section>

      <section class="faq" style="margin-top: 6rem;">
        <h2>Expert FAQ — ${catInfo.name} & Open Source Mastery</h2>
        ${faqBankHtml}
      </section>
    </div>
  `;

  const headInject = `
    <script type="application/ld+json">${JSON.stringify(getBreadcrumbSchema(breadcrumbItems))}</script>
    <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  `;

  const canonicalPath = `/category/${catId}.html`;
  return getBaseLayout(`${catInfo.name} - Open Source Tools`, catInfo.description, canonicalPath, content, lang, headInject, '', ogImagePath);
}

function renderToolCard(t, lang, isFeatured = false) {
  return `
    <a href="${getLocalizedUrl(`/tools/${t.id}.html`, lang)}" class="tool-card ${isFeatured ? 'featured-card' : ''}">
      <div class="card-meta">
        <span class="stars">⭐ ${t.stars.toLocaleString()}</span>
        <span class="license">${t.license}</span>
      </div>
      <h3>${t.emoji} ${t.name}</h3>
      <p>${t.description.replace(/[#*`]/g, '').slice(0, 100)}...</p>
      <div class="card-footer">
        <span class="update">Updated: ${t.lastUpdated}</span>
      </div>
    </a>
  `;
}

function renderHomepage(featuredTools, lang) {
  const featuredHtml = featuredTools.map(t => renderToolCard(t, lang, true)).join('');

  const content = `
    <header class="hero">
      <div class="container">
        <h1>Discover, Build, & Dominate Workflows.</h1>
        <p class="lead">The world's largest verified directory of open-source tools — featuring step-by-step self-hosting guides and powered by DePIN-style edge compute networks.</p>
        <div class="hero-actions">
           <a href="#browse" class="btn-primary">Browse Categories</a>
           <a href="${getLocalizedUrl('/knowledge-hub.html', lang)}" class="btn-secondary">Technical Docs</a>
        </div>
      </div>
    </header>

    <main class="container">
      <section id="featured">
        <h2 class="section-title">✨ Tools of the Week</h2>
        <div class="tool-grid">
          ${featuredHtml}
        </div>
      </section>

      <section id="browse">
        <h2 class="section-title">Browse by Category</h2>
        <div class="tool-grid">
        ${Object.keys(categories).map(catId => `
          <a href="${getLocalizedUrl(`/category/${catId}.html`, lang)}" class="tool-card" data-analytics="home-category-click" data-target="${catId}">
            <h3>${categories[catId].name}</h3>
            <p>${categories[catId].description}</p>
          </a>
        `).join('')}
      </div>
    </div>

    <section style="margin-top: 5rem; text-align: center;">
      <h2 style="font-family: var(--font-display); font-size: 1.8rem; color: var(--accent); margin-bottom: 1rem;">Don't Miss Out!</h2>
      <p class="lead" style="max-width: 600px; margin: 0 auto 2rem;">Get the latest open-source news, guides, and tool updates directly in your inbox.</p>
      <button class="btn-primary" onclick="document.getElementById('newsletter-modal').classList.add('active');" style="background: var(--accent); color: var(--bg);">Subscribe to Newsletter</button>
    </section>
  `;

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Freemium Services",
    "description": "Verified directory of freemium & open-source tools."
  };

  const ogImagePath = generateSvgOgImage("Freemium Services", "Verified Open Source Directory", `home-og.svg`);

  return getBaseLayout('Home - Best Free & Open Source Tools', 'Verified directory of freemium & open-source tools with DePIN edge compute self-hosting guides.', '/index.html', content, lang, `<script type="application/ld+json">${JSON.stringify(webpageSchema)}</script>`, '', ogImagePath);
}

function renderComparisonPage(aId, bId, lang) {
  const a = toolsData[aId];
  const b = toolsData[bId];
  if (!a || !b) return null;

  const breadcrumbItems = [
    { name: "Home", url: SITE_URL + getLocalizedUrl("/", lang) },
    { name: categories[a.category]?.name || a.category, url: SITE_URL + getLocalizedUrl(`/category/${a.category}.html`, lang) },
    { name: `${a.name} vs ${b.name}`, url: SITE_URL + getLocalizedUrl(`/compare/${a.id}-vs-${b.id}.html`, lang) }
  ];

  const ogImagePath = generateSvgOgImage(`${a.name} vs ${b.name}`, 'Technical Comparison', `${a.id}-vs-${b.id}-og.svg`);

  const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this 2026 technical comparison: ${a.name} vs ${b.name} on Freemium.Services`)}&url=${encodeURIComponent(`${SITE_URL}/compare/${a.id}-vs-${b.id}.html`)}`;

  const content = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="${getLocalizedUrl('/', lang)}">Home</a> › <a href="${getLocalizedUrl(`/category/${a.category}.html`, lang)}">${categories[a.category]?.name || a.category}</a> › <span>${a.name} vs ${b.name}</span>
      </nav>
      <h1>${a.emoji} ${a.name} vs ${b.emoji} ${b.name}</h1>
      <p class="lead">Detailed 2026 technical comparison between ${a.name} and ${b.name} for self-hosting and enterprise deployment.</p>
      
      <section style="margin-top: 2rem;">
        <div class="grid">
          <div class="tool-card" style="border-color: var(--accent);">
            <h3>${a.emoji} Best for Advanced Logic</h3>
            <p>${a.name} excels when complex integrations are required. ${a.description.replace(/[#*`]/g, '').slice(0, 120)}...</p>
            <a href="${getLocalizedUrl(`/tools/${a.id}.html`, lang)}" class="btn-primary" style="margin-top:1rem;" data-analytics="compare-winner-click" data-target="${a.id}">View ${a.name}</a>
          </div>
          <div class="tool-card" style="border-color: var(--green);">
            <h3>${b.emoji} Best for Rapid Prototyping</h3>
            <p>${b.name} offers incredible speed to deployment. ${b.description.replace(/[#*`]/g, '').slice(0, 120)}...</p>
            <a href="${getLocalizedUrl(`/tools/${b.id}.html`, lang)}" class="btn-primary" style="margin-top:1rem; background:var(--green);" data-analytics="compare-winner-click" data-target="${b.id}">View ${b.name}</a>
          </div>
        </div>
      </section>

      <section style="margin-top: 4rem;">
        <h2>Feature Matrix</h2>
        <table style="width:100%; border-collapse:collapse; text-align:left; color:var(--text2); margin-top:2rem;">
          <tr style="border-bottom:1px solid var(--border);"><th style="padding:1rem;">Feature</th><th style="padding:1rem;">${a.name}</th><th style="padding:1rem;">${b.name}</th></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:1rem;">License</td><td style="padding:1rem;">${a.license}</td><td style="padding:1rem;">${b.license}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:1rem;">GitHub Stars</td><td style="padding:1rem;">${a.stars.toLocaleString()}</td><td style="padding:1rem;">${b.stars.toLocaleString()}</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:1rem;">Self-Hostable</td><td style="padding:1rem;">✅ Yes</td><td style="padding:1rem;">✅ Yes</td></tr>
        </table>
      </section>

      <section style="margin-top: 4rem; text-align: center;">
        <a href="${twitterIntent}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid var(--border); color: var(--text); font-weight: 600; transition: all 0.2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 7.717 8.502 11.25h-6.657l-5.214-6.817L4.99 21.25H1.68l7.73-8.235L1.254 2.25H8.08l4.713 6.231zm1.161 17.02h1.833L7.045 4.126H5.078z"/></svg>
          Share Comparison on X
        </a>
      </section>
    </div>
  `;

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${a.name} vs ${b.name} Comparison`,
    "description": `Technical comparison of ${a.name} and ${b.name}.`
  };

  return getBaseLayout(`${a.name} vs ${b.name} - Detailed Comparison`, `Compare ${a.name} and ${b.name} to see which open-source tool fits your self-hosting needs.`, `/compare/${a.id}-vs-${b.id}.html`, content, lang, `
    <script type="application/ld+json">${JSON.stringify(getBreadcrumbSchema(breadcrumbItems))}</script>
    <script type="application/ld+json">${JSON.stringify(webpageSchema)}</script>
  `, '', ogImagePath);
}

// --- Knowledge Hub Generator ---
function renderKnowledgeHub(lang) {
  const pillarHtml = Object.keys(categories)
    .filter(catId => categories[catId].longDesc)
    .map(catId => `
      <section id="${catId}-guide" style="margin-bottom: 4rem;">
        <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 1.5rem;">${categories[catId].name} Master Guide</h2>
        <div class="prose">${marked.parse(linkify(categories[catId].longDesc))}</div>
      </section>
    `).join('');

  const glossaryHtml = Object.keys(glossary).map(key => `
      <section id="${key.toLowerCase()}" style="margin-bottom: 2.5rem; border-left: 2px solid var(--accent); padding-left: 1.5rem;">
        <h3 style="color: var(--text); font-family: var(--font-display); margin-bottom: 0.5rem;">${glossary[key].term}</h3>
        <p style="color: var(--text2); font-size: 0.95rem; line-height: 1.6;">${glossary[key].def}</p>
      </section>
    `).join('');

  const faqHtml = faqBank.map(f => `
    <div class="faq-item" style="margin-bottom: 2.5rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem;">
      <h3 style="color: var(--text); margin-bottom: 1rem; font-family: var(--font-display); font-size: 1.25rem;">${f.q}</h3>
      <div class="prose" style="color:var(--text2);">${marked.parse(f.a)}</div>
    </div>
  `).join('');

  const breadcrumbItems = [
    { name: "Home", url: SITE_URL + getLocalizedUrl("/", lang) },
    { name: "Docs", url: SITE_URL + getLocalizedUrl("/knowledge-hub.html", lang) }
  ];

  const ogImagePath = generateSvgOgImage("Docs & Technical Glossary", "Expert Resource Bank", "knowledge-hub-og.svg");

  const content = `
    <div class="container">
      <nav class="breadcrumbs">
        <a href="${getLocalizedUrl('/', lang)}">Home</a> › <span>Docs</span>
      </nav>
      <h1 style="margin-bottom: 1.5rem;">Docs: Open Source & Self-Hosting Hub</h1>
      <p class="lead">The definitive master resource for decentralized infrastructure, privacy-first automation, and local AI stacks.</p>
      
      <div class="knowledge-hub-container">
        <aside class="sidebar">
          <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text3); margin-bottom: 1.5rem; font-family: var(--font-mono);">Navigation</h3>
          <ul style="list-style: none; font-size: 0.9rem; padding: 0;">
            ${Object.keys(categories)
      .filter(catId => categories[catId].longDesc)
      .map(catId => `<li style="margin-bottom: 1rem;"><a href="#${catId}-guide" style="color: var(--text2); text-decoration: none; display: block; transition: color 0.2s;">${categories[catId].name} Guide</a></li>`)
      .join('')}
            <li style="margin-bottom: 1rem;"><a href="#glossary" style="color: var(--text2); text-decoration: none; display: block; transition: color 0.2s;">Technical Glossary</a></li>
            <li><a href="#faq" style="color: var(--text2); text-decoration: none; display: block; transition: color 0.2s;">Global FAQ Bank</a></li>
          </ul>
        </aside>
        
        <div style="flex: 1; min-width: 0;">
          ${pillarHtml}

          <section id="glossary" style="margin-top: 6rem; padding-top: 6rem; border-top: 2px solid var(--border);">
            <h2 style="font-size: 2.5rem; margin-bottom: 3rem; font-family: var(--font-display);">Technical Glossary</h2>
            ${glossaryHtml}
          </section>
          
          <section id="faq" style="margin-top: 6rem; padding-top: 6rem; border-top: 2px solid var(--border);">
            <h2 style="font-size: 2.5rem; margin-bottom: 3rem; font-family: var(--font-display);">Global Knowledge FAQ Bank</h2>
            ${faqHtml}
          </section>
        </div>
      </div>
    </div>
  `;

  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqBank.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) };
  const headInject = `<script type="application/ld+json">${JSON.stringify(getBreadcrumbSchema(breadcrumbItems))}</script>\n  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;

  return getBaseLayout('Docs - Master Open Source Guides', 'The master resource for self-hosting, automation, and AI infrastructure. Aggregated expert guides and FAQs.', '/knowledge-hub.html', content, lang, headInject, '', ogImagePath);
}

// --- Main Build Execution ---
async function build() {
  console.log('🚀 Generating Freemium.Services v2...');

  const toolsDir = path.join(outDir, 'tools');
  const catDir = path.join(outDir, 'category');
  const compDir = path.join(outDir, 'compare');
  const jsDir = path.join(outDir, 'js');

  [toolsDir, catDir, compDir, jsDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Copy JS files for external linking
  fs.writeFileSync(path.join(jsDir, 'chat-widget.js'), chatJsContent);
  fs.writeFileSync(path.join(jsDir, 'search.js'), searchJsContent);
  fs.writeFileSync(path.join(jsDir, 'newsletter.js'), newsletterJsContent);
  verificationFiles.forEach(file => {
    const source = path.join(__dirname, file);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(outDir, file));
    }
  });

  const sitemaps = {
    core: [],
    knowledge: [],
    tools: [],
    categories: [],
    comparisons: []
  };
  const imageUrls = [];
  const searchIndex = [];

  // Calculate featured tools for freshness signals
  const featuredTools = Object.values(toolsData)
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 3);
  const featuredIds = new Set(featuredTools.map(t => t.id));

  // 1. Homepage
  fs.writeFileSync(path.join(outDir, 'index.html'), renderHomepage(featuredTools, 'en'));
  imageUrls.push({ loc: '/', img: '/og/home-og.svg', title: 'Freemium Services - Home' });
  sitemaps.core.push({ loc: '/index.html', lastmod: new Date().toISOString().split('T')[0] });

  // 1b. Knowledge Hub
  const hubHtml = renderKnowledgeHub('en');
  fs.writeFileSync(path.join(outDir, 'knowledge-hub.html'), hubHtml);
  sitemaps.knowledge.push({ loc: '/knowledge-hub.html', lastmod: new Date().toISOString().split('T')[0], priority: '1.0' });

  // Add Docs to search index with a priority boost
  searchIndex.push({
    slug: 'knowledge-hub',
    url: '/knowledge-hub.html',
    title: 'Docs: Open Source & Self-Hosting Hub',
    lastmod: new Date().toISOString().split('T')[0],
    category: 'Documentation',
    description: 'The definitive master resource for decentralized infrastructure, privacy-first automation, and local AI stacks.',
    isFeatured: true
  });
  imageUrls.push({ loc: '/knowledge-hub.html', img: '/og/knowledge-hub-og.svg', title: 'Docs' });

  // 2. Tool Pages
  let toolsCount = 0;
  Object.values(toolsData).forEach(t => {
    imageUrls.push({ loc: `/tools/${t.id}.html`, img: `/og/${t.id}-og.svg`, title: t.name });
    fs.writeFileSync(path.join(toolsDir, `${t.id}.html`), renderToolPage(t, 'en'));

    // Featured tools get the current build date to boost freshness signals
    const lastmod = featuredIds.has(t.id) ? new Date().toISOString().split('T')[0] : t.lastUpdated;
    sitemaps.tools.push({ loc: `/tools/${t.id}.html`, lastmod });

    searchIndex.push(mapToolToSearchEntry(t, lastmod, featuredIds.has(t.id)));
    toolsCount++;
  });

  // 3. Category Pages
  let catCount = 0;
  Object.keys(categories).forEach(catId => {
    imageUrls.push({ loc: `/category/${catId}.html`, img: `/og/${catId}-og.svg`, title: categories[catId].name });
    fs.writeFileSync(path.join(catDir, `${catId}.html`), renderCategoryPage(catId, categories[catId], 'en'));
    sitemaps.categories.push({ loc: `/category/${catId}.html`, lastmod: new Date().toISOString().split('T')[0] });

    // Index category hubs and apply priority boost for self-hosting guides
    searchIndex.push({
      slug: catId,
      url: `/category/${catId}.html`,
      title: `${categories[catId].name} Hub & Guides`,
      lastmod: new Date().toISOString().split('T')[0],
      category: 'Guides',
      description: categories[catId].description,
      isFeatured: catId === 'self-hosting'
    });

    catCount++;
  });

  // 4. Comparison Pages
  let compCount = 0;

  Object.keys(categories).forEach(catId => {
    const catTools = Object.values(toolsData).filter(t => t.category === catId && t.stars > STARS_THRESHOLD);
    for (let i = 0; i < catTools.length; i++) {
      for (let j = i + 1; j < catTools.length; j++) {
        const a = catTools[i].id;
        const b = catTools[j].id;
        const html = renderComparisonPage(a, b, 'en');
        if (html) {
          imageUrls.push({ loc: `/compare/${a}-vs-${b}.html`, img: `/og/${a}-vs-${b}-og.svg`, title: `${a} vs ${b}` });
          fs.writeFileSync(path.join(compDir, `${a}-vs-${b}.html`), html);
          sitemaps.comparisons.push({ loc: `/compare/${a}-vs-${b}.html`, lastmod: new Date().toISOString().split('T')[0] });
          compCount++;
        }
      }
    }
  });

  // 5. Multilingual Generation & Search Index
  const allSitemapUrls = [...sitemaps.core, ...sitemaps.knowledge, ...sitemaps.tools, ...sitemaps.categories, ...sitemaps.comparisons];

  for (const lang of LANGUAGES) {
    const langOutDir = lang === 'en' ? outDir : path.join(outDir, lang);
    if (lang !== 'en' && !fs.existsSync(langOutDir)) {
      fs.mkdirSync(langOutDir, { recursive: true });
      fs.mkdirSync(path.join(langOutDir, 'tools'), { recursive: true });
      fs.mkdirSync(path.join(langOutDir, 'category'), { recursive: true });
      fs.mkdirSync(path.join(langOutDir, 'compare'), { recursive: true });
    }

    if (lang === 'en') {
      fs.writeFileSync(path.join(outDir, `search-index-en.json`), JSON.stringify(searchIndex));
    } else {
      console.log(`🌍 Generating localized site for: ${lang}...`);

      // Localize Homepage
      fs.writeFileSync(path.join(langOutDir, 'index.html'), renderHomepage(featuredTools, lang));

      // Localize Knowledge Hub
      fs.writeFileSync(path.join(langOutDir, 'knowledge-hub.html'), renderKnowledgeHub(lang));

      // Localize Tools
      for (const t of Object.values(toolsData)) {
        const localizedTool = await getLocalizedTool(t, lang, translationCache);
        fs.writeFileSync(path.join(langOutDir, 'tools', `${t.id}.html`), renderToolPage(localizedTool, lang));
      }

      // Localize Categories
      for (const catId of Object.keys(categories)) {
        const localizedCat = await getLocalizedCategory(categories[catId], lang, translationCache);
        fs.writeFileSync(path.join(langOutDir, 'category', `${catId}.html`), renderCategoryPage(catId, localizedCat, lang));
      }

      // Localize Search Index
      const localizedIndex = [];
      const translationPromisesForIndex = searchIndex.map(item =>
        getTranslated(item.description, lang, translationCache)
      );
      const translatedDescriptions = await Promise.all(translationPromisesForIndex);

      for (let i = 0; i < searchIndex.length; i++) {
        localizedIndex.push({ ...searchIndex[i], description: translatedDescriptions[i] });
      }
      fs.writeFileSync(path.join(outDir, `search-index-${lang}.json`), JSON.stringify(localizedIndex));
    }
  }

  // Save updated cache to avoid re-translating on next build (Optional for CI/CD environments)
  try {
    fs.writeFileSync(translationCacheFile, JSON.stringify(translationCache, null, 2));
  } catch (e) {
    console.warn('⚠️ Could not save translation-cache.json (This is expected in some CI environments)');
  }
  fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify(searchIndex)); // Fallback

  // 6. Sitemaps
  const writeSitemap = (urls, filename, langPrefix = '') => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${langPrefix ? `/${langPrefix}` : ''}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
${u.priority ? `    <priority>${u.priority}</priority>\n` : ''}${LANGUAGES.map(lang => {
      const lp = lang === 'en' ? '' : `/${lang}`;
      return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${lp}${u.loc}" />`;
    }).join('\n')}
  </url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(outDir, filename), xml);
  };

  writeSitemap(sitemaps.core, 'sitemap-core.xml');
  writeSitemap(sitemaps.knowledge, 'sitemap-knowledge.xml');
  writeSitemap(sitemaps.tools, 'sitemap-tools.xml');
  writeSitemap(sitemaps.categories, 'sitemap-categories.xml');
  writeSitemap(sitemaps.comparisons, 'sitemap-comparisons.xml');
  writeSitemap(allSitemapUrls, 'sitemap.xml');

  // 6b. Image Sitemap
  const imgXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageUrls.map(item => `  <url>
    <loc>${SITE_URL}${item.loc}</loc>
    <image:image>
      <image:loc>${SITE_URL}${item.img}</image:loc>
      <image:title>${item.title}</image:title>
    </image:image>
  </url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(outDir, 'sitemap-images.xml'), imgXml);

  // 6e. Multilingual Sitemaps (Regional targeting for Indian developer market)
  LANGUAGES.filter(l => l !== 'en').forEach(lang => {
    // For multilingual sitemaps, we need to pass all URLs, not just a subset.
    writeSitemap(allSitemapUrls, `sitemap-${lang}.xml`, lang);
  });

  // 6f. Blog, Features, News Fallbacks (Copy static or generate placeholder)
  ['blog', 'features', 'news'].forEach(type => {
    const filename = `sitemap-${type}.xml`;
    const sourcePath = path.join(__dirname, filename);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(outDir, filename));
    } else {
      writeSitemap([], filename);
    }
  });

  // 6c. Sitemap Index (The Master Link for GSC)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-core.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-categories.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-tools.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-knowledge.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-comparisons.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-blog.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-features.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-news.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-images.xml</loc></sitemap>
  ${LANGUAGES.filter(l => l !== 'en').map(l => `<sitemap><loc>${SITE_URL}/sitemap-${l}.xml</loc></sitemap>`).join('\n  ')}
  <sitemap><loc>${SITE_URL}/sitemap.xml</loc></sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), sitemapIndex);

  // 6d. Expert Robots.txt Integration (Preventing Regression)
  const expertRobots = `# ============================================================
# freemium.services — robots.txt (Programmatically Generated)
# Strategy  : Maximum crawlability for ALL bots
# ============================================================

User-agent: *
Allow: /
Crawl-delay: 1

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Googlebot-Image
Allow: /img/
Allow: /og/
Allow: /tools/
Allow: /ai-tools/
Allow: /
Crawl-delay: 0

User-agent: GPTBot
Allow: /
Crawl-delay: 0

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 0

User-agent: Applebot
Allow: /
Crawl-delay: 0

User-agent: Bytespider
Allow: /
Crawl-delay: 2

User-agent: *
Disallow: /admin/
Disallow: /api/private/
Disallow: /auth/
Disallow: /_next/
Disallow: /cdn-cgi/
Disallow: /.env
Disallow: /.git/
Disallow: /*?ref=*
Disallow: /*?utm_source=*
Disallow: /search/?s=
Disallow: /404/

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap-core.xml
Sitemap: ${SITE_URL}/sitemap-categories.xml
Sitemap: ${SITE_URL}/sitemap-tools.xml
Sitemap: ${SITE_URL}/sitemap-knowledge.xml
Sitemap: ${SITE_URL}/sitemap-comparisons.xml
Sitemap: ${SITE_URL}/sitemap-blog.xml
Sitemap: ${SITE_URL}/sitemap-features.xml
Sitemap: ${SITE_URL}/sitemap-news.xml
Sitemap: ${SITE_URL}/sitemap-images.xml
Sitemap: ${SITE_URL}/sitemap-hi.xml
Sitemap: ${SITE_URL}/sitemap-ta.xml
Sitemap: ${SITE_URL}/sitemap-ml.xml
Sitemap: ${SITE_URL}/sitemap.xml

Host: freemium.services`;
  fs.writeFileSync(path.join(outDir, 'robots.txt'), expertRobots);

  // 7. Performance Budget Check
  const totalPages = allSitemapUrls.length;
  if (totalPages > 5000) {
    console.warn(`\x1b[33m⚠️ Warning: Total pages (${totalPages}) approaching crawl budget limits.\x1b[0m`);
  }

  allSitemapUrls.forEach(u => {
    const filePath = path.join(outDir, u.loc.replace(/^\//, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > (MAX_PAGE_SIZE_KB * 1024)) {
      console.warn(`\x1b[33m⚠️ Performance Alert: ${u.loc} exceeds ${MAX_PAGE_SIZE_KB}KB. Check content depth.\x1b[0m`);
    }
  });

  // 7. Build Report Metrics
  const buildReport = {
    tools: toolsCount, categories: catCount, comparisonPages: compCount,
    localizedPages: totalPages * LANGUAGES.length,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(outDir, 'build-report.json'), JSON.stringify(buildReport, null, 2));

  console.log('✅ Build Complete: 50+ Future-Proof Features Integrated.');
  console.log(`📊 Report generated at: public/build-report.json`);
}

if (require.main === module) {
  build().catch(err => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
}

module.exports = {
  mapToolToSearchEntry,
  validateTool,
  linkify
};
