export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  license: 'free' | 'freemium' | 'open-source';
  selfHostable: boolean;
  website: string;
  github?: string;
  features: string[];
  useCases: string[];
  selfHostingGuide?: string;
  alternatives: string[];
  stars?: string;
  badge?: string;
  faqs: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  pillarContent: string;
  toolCount: number;
  faqs: { question: string; answer: string }[];
  icon?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'ai-tools', name: 'AI Tools', icon: 'Bot', toolCount: 240, description: 'LLMs, image gen, coding assistants, and intelligent productivity tools.', pillarContent: '### The AI Tool Landscape in 2026\nGenerative AI has moved from novelty to necessity. Whether you are a developer needing a coding assistant or a team needing private AI chat, the open-source ecosystem offers incredible value.\n\n### Why Open-Source AI?\n1. **Privacy**: Your data never leaves your infrastructure\n2. **Cost**: Zero per-token costs at scale\n3. **Control**: Fine-tune and modify models as needed', faqs: [{ question: 'What is the best free AI tool for developers?', answer: 'Claude Code, Cursor free tier, and Ollama (local inference) are top picks for developers. Ollama is free forever with no token limits.' }, { question: 'Can I run LLMs locally for free?', answer: 'Yes. Ollama runs Llama 3.3, Mistral, DeepSeek-R1, and 150+ models completely free on your own hardware.' }] },
  { id: 'open-source', name: 'Open Source', icon: 'Github', toolCount: 580, description: 'Verified open-source software with full source code and community backing.', pillarContent: 'Open source is the backbone of modern technology. Full control, no vendor lock-in.', faqs: [{ question: 'Is open source software secure?', answer: 'Generally yes -- the many-eyes principle means more community review. Projects with active maintainers patch issues faster.' }] },
  { id: 'self-hosting', name: 'Self-Hosting', icon: 'Cpu', toolCount: 320, description: 'Privacy-first, self-hostable applications. Own your data, own your stack.', pillarContent: 'Self-hosting is the ultimate way to ensure privacy, reduce costs, and maintain full control of your data.', faqs: [{ question: 'What hardware do I need to self-host?', answer: 'A $20/mo VPS with 2 vCPUs and 4GB RAM handles most services. For AI inference, 16GB+ RAM is recommended.' }] },
  { id: 'automation-tools', name: 'Automation', icon: 'Zap', toolCount: 95, description: 'Workflow automation and integration platforms to eliminate repetitive work.', pillarContent: 'Automation platforms save thousands of hours. Explore alternatives to Zapier and Make with full self-hosting support.', faqs: [{ question: 'Best open-source Zapier alternative?', answer: 'n8n is the most powerful with 400+ integrations. Activepieces is more beginner-friendly. Both fully self-hostable.' }] },
  { id: 'ai-agents', name: 'AI Agents', icon: 'Bot', toolCount: 78, description: 'Autonomous agents that plan, reason, and execute complex multi-step tasks.', pillarContent: 'AI Agents handle entire workflows autonomously -- from research to code deployment.', faqs: [{ question: 'What is an AI agent?', answer: 'An autonomous system using an LLM to reason and take actions -- browsing, coding, calling APIs -- to complete goals without constant human input.' }] },
  { id: 'developer-tools', name: 'Dev Tools', icon: 'Code', toolCount: 210, description: 'Essential tools for modern software development, from AI IDEs to DevOps.', pillarContent: 'Build faster with AI-powered developer tools, modern terminals, and self-hosted CI/CD.', faqs: [{ question: 'Best free developer tools in 2026?', answer: 'VS Code, Zed editor, Warp terminal, Bun runtime, and Coolify for self-hosted PaaS are excellent free choices.' }] },
  { id: 'rag-tools', name: 'RAG & Search', icon: 'Layers', toolCount: 62, description: 'Retrieval-Augmented Generation stacks to ground AI in your private data.', pillarContent: 'RAG connects LLMs to your data for accurate, cited, up-to-date answers. The standard architecture for production AI.', faqs: [{ question: 'What is RAG?', answer: 'RAG (Retrieval-Augmented Generation) fetches relevant documents from your data store and injects them into the LLM prompt, preventing hallucination.' }] },
  { id: 'vector-databases', name: 'Vector DBs', icon: 'Database', toolCount: 28, description: 'High-performance vector databases for semantic search and AI memory.', pillarContent: 'Vector databases are the memory layer of modern AI systems -- storing and retrieving embeddings at scale.', faqs: [{ question: 'Best vector DB for production RAG?', answer: 'Qdrant for performance. Weaviate for features. pgvector for simplicity if you are already on PostgreSQL.' }] },
  { id: 'cli-tools', name: 'CLI Tools', icon: 'Terminal', toolCount: 145, description: 'Terminal utilities and shell tools for power users and automation.', pillarContent: 'Modern Rust-based CLI tools are dramatically faster and more ergonomic than traditional Unix defaults.', faqs: [{ question: 'Best modern CLI replacements for Unix tools?', answer: 'eza (ls), bat (cat), ripgrep (grep), fd (find), zoxide (cd), and starship (prompt) are the Rust-native upgrades.' }] },
];

export interface Comparison {
  id: string;
  toolA: string;
  toolB: string;
  verdict: string;
  prosA: string[];
  prosB: string[];
  features: { name: string; valA: string | boolean; valB: string | boolean }[];
}

export const COMPARISONS: Comparison[] = [
  {
    id: 'n8n-vs-zapier', toolA: 'n8n', toolB: 'Zapier',
    verdict: 'n8n wins for technical teams needing self-hosting and unlimited executions. Zapier wins for non-technical users who need its 6000+ integration catalog.',
    prosA: ['Fully self-hostable', 'No per-execution cost', 'Custom JS/Python nodes', 'Air-gapped possible'],
    prosB: ['6000+ integrations', 'Zero setup required', 'Best-in-class reliability', 'Non-technical friendly'],
    features: [{ name: 'Self-Hosting', valA: true, valB: false }, { name: 'Free Tier', valA: 'Unlimited (self-hosted)', valB: '100 tasks/mo' }, { name: 'Integrations', valA: '400+', valB: '6000+' }, { name: 'Custom Code', valA: true, valB: false }, { name: 'Open Source', valA: true, valB: false }]
  },
  {
    id: 'ollama-vs-lmstudio', toolA: 'Ollama', toolB: 'LM Studio',
    verdict: 'Ollama for CLI/Docker server deployments. LM Studio for desktop GUI model exploration and testing.',
    prosA: ['Docker-native', 'Great for servers', 'Simple CLI', 'Fast cold starts'],
    prosB: ['Full GUI', 'Model discovery', 'OpenAI API compatible', 'Great for beginners'],
    features: [{ name: 'Interface', valA: 'CLI + API', valB: 'GUI + API' }, { name: 'Docker Support', valA: true, valB: false }, { name: 'Model Library', valA: '150+', valB: '300+' }, { name: 'Best For', valA: 'Developers', valB: 'End Users' }]
  },
  {
    id: 'qdrant-vs-weaviate', toolA: 'Qdrant', toolB: 'Weaviate',
    verdict: 'Qdrant for raw performance and resource efficiency. Weaviate for built-in AI features and enterprise workflows.',
    prosA: ['Rust-native speed', 'Lower memory', 'Simple REST API', 'Excellent filtering'],
    prosB: ['Built-in vectorization', 'GraphQL API', 'Hybrid search', 'Multi-tenancy'],
    features: [{ name: 'Language', valA: 'Rust', valB: 'Go' }, { name: 'Built-in Vectorizer', valA: false, valB: true }, { name: 'Hybrid Search', valA: true, valB: true }, { name: 'Free Cloud', valA: '1GB', valB: 'Sandbox' }]
  },
  {
    id: 'cursor-vs-vscode-cline', toolA: 'Cursor', toolB: 'VS Code + Cline',
    verdict: 'Cursor for a polished out-of-box AI experience. VS Code + Cline for flexibility in model choice and full transparency.',
    prosA: ['Polished AI UX', 'Fast Tab completion', 'Composer for refactors', 'Background agents'],
    prosB: ['Any LLM provider', 'Open source', 'Claude API integration', 'Full extension ecosystem'],
    features: [{ name: 'Free Tier', valA: '2000 completions/mo', valB: 'Unlimited (bring API key)' }, { name: 'Open Source', valA: false, valB: true }, { name: 'Model Choice', valA: 'Limited', valB: 'Any OpenAI-compatible' }]
  },
  {
    id: 'dify-vs-flowise', toolA: 'Dify', toolB: 'Flowise',
    verdict: 'Dify for production LLM apps with enterprise features. Flowise for rapid prototyping and simpler LangChain pipelines.',
    prosA: ['Production-grade', 'Multi-tenant', '100+ model providers', 'Built-in monitoring'],
    prosB: ['Simpler setup', 'Visual LangChain', 'Quick prototyping', 'Embed as chat widget'],
    features: [{ name: 'Self-Hostable', valA: true, valB: true }, { name: 'Multi-tenant', valA: true, valB: false }, { name: 'Built-in Analytics', valA: true, valB: false }, { name: 'Setup Complexity', valA: 'Medium', valB: 'Low' }]
  },
];

export const TOOLS: Tool[] = [
  {
    id: 'n8n', name: 'n8n', description: 'Fair-code workflow automation with 400+ integrations and a visual builder. Custom code nodes, AI agents, and self-hostable.', category: 'automation-tools', license: 'freemium', selfHostable: true, website: 'https://n8n.io', github: 'https://github.com/n8n-io/n8n', stars: '47k', badge: "Editor's Pick",
    features: ['Visual workflow builder', 'Self-hostable', 'Custom JS/Python nodes', '400+ integrations', 'AI agent builder'],
    useCases: ['CRM data syncing', 'Social media automation', 'Internal ops tools', 'AI-powered pipelines'],
    selfHostingGuide: 'Run n8n with Docker:\n```bash\ndocker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n\n```',
    alternatives: ['Zapier', 'Make', 'Activepieces'],
    faqs: [{ question: 'Is n8n free to self-host?', answer: 'Yes. Unlimited workflows and executions with no cost when self-hosted.' }, { question: 'Can n8n run AI agents?', answer: 'Yes. Native AI agent nodes via LangChain connect to OpenAI, Claude, Ollama, and any LLM.' }],
    seoTitle: 'n8n: Best Self-Hosted Workflow Automation | Freemium Services', seoDescription: 'Automate workflows with n8n -- the open-source Zapier alternative with AI agent support.'
  },
  {
    id: 'ollama', name: 'Ollama', description: 'Run Llama 3.3, Mistral, DeepSeek-R1, Phi-4, and 150+ models locally with a single command. OpenAI API compatible.', category: 'ai-tools', license: 'open-source', selfHostable: true, website: 'https://ollama.ai', github: 'https://github.com/ollama/ollama', stars: '85k', badge: 'Most Popular',
    features: ['150+ models', 'OpenAI API compatible', 'GPU acceleration', 'Docker support', 'REST API'],
    useCases: ['Local AI inference', 'Private chatbots', 'Coding assistants', 'Offline AI apps'],
    selfHostingGuide: '```bash\ncurl -fsSL https://ollama.ai/install.sh | sh\nollama run llama3.3\n```',
    alternatives: ['LM Studio', 'LocalAI', 'Jan'],
    faqs: [{ question: 'Hardware needed for Ollama?', answer: '8GB RAM for 7B models, 16GB for 13B. GPU optional but 5-10x faster.' }, { question: 'Is Ollama OpenAI API compatible?', answer: 'Yes. Exposes OpenAI-compatible API at localhost:11434/v1.' }],
    seoTitle: 'Ollama: Run LLMs Locally for Free | Freemium Services', seoDescription: 'Run 150+ AI models locally with Ollama. Free, private, no API costs ever.'
  },
  {
    id: 'qdrant', name: 'Qdrant', description: 'High-performance vector database in Rust. Powers semantic search, RAG pipelines, and recommendation systems at scale.', category: 'vector-databases', license: 'open-source', selfHostable: true, website: 'https://qdrant.tech', github: 'https://github.com/qdrant/qdrant', stars: '20k', badge: 'Rust-Native',
    features: ['HNSW indexing', 'Payload filtering', 'Sparse vectors', 'Distributed mode', 'REST + gRPC'],
    useCases: ['Semantic search', 'RAG pipelines', 'Recommendation systems', 'AI memory stores'],
    selfHostingGuide: '```bash\ndocker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant\n```',
    alternatives: ['Weaviate', 'Milvus', 'Pinecone', 'pgvector'],
    faqs: [{ question: 'Qdrant vs Pinecone performance?', answer: 'Qdrant self-hosted is typically 2-5x faster due to Rust implementation and HNSW indexing.' }],
    seoTitle: 'Qdrant: High-Performance Vector Database | Freemium Services', seoDescription: 'Power AI search with Qdrant -- fast, open-source vector database for production RAG.'
  },
  {
    id: 'open-webui', name: 'Open WebUI', description: 'ChatGPT-like UI for Ollama and any OpenAI-compatible API. RAG, web search, image gen, multi-user, and full privacy.', category: 'ai-tools', license: 'open-source', selfHostable: true, website: 'https://openwebui.com', github: 'https://github.com/open-webui/open-webui', stars: '50k', badge: 'Hot Hot',
    features: ['Ollama integration', 'RAG with documents', 'Web browsing', 'Image generation', 'Multi-user auth'],
    useCases: ['Team AI interface', 'Document Q&A', 'Local LLM frontend', 'Private ChatGPT'],
    selfHostingGuide: '```bash\ndocker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data ghcr.io/open-webui/open-webui:main\n```',
    alternatives: ['AnythingLLM', 'Jan', 'Msty'],
    faqs: [{ question: 'Can Open WebUI connect to Claude?', answer: 'Yes. Any OpenAI-compatible API including Claude via OpenRouter or direct.' }],
    seoTitle: 'Open WebUI: Self-Hosted ChatGPT Interface | Freemium Services', seoDescription: 'Run a private ChatGPT with Open WebUI. Supports Ollama, OpenAI, Claude -- fully self-hosted.'
  },
  {
    id: 'dify', name: 'Dify', description: 'Open-source LLM app platform. Build RAG pipelines, AI agents, and chatbots visually with 100+ model providers.', category: 'ai-agents', license: 'open-source', selfHostable: true, website: 'https://dify.ai', github: 'https://github.com/langgenius/dify', stars: '40k', badge: 'LLMOps',
    features: ['Visual workflow editor', 'RAG pipeline builder', 'Multi-model support', 'Agent orchestration', 'Built-in analytics'],
    useCases: ['Customer support bots', 'Knowledge bases', 'Code review agents', 'Document processing'],
    selfHostingGuide: '```bash\ngit clone https://github.com/langgenius/dify.git\ncd dify/docker && docker compose up -d\n```',
    alternatives: ['Flowise', 'Langflow', 'n8n AI'],
    faqs: [{ question: 'What models does Dify support?', answer: '100+ including OpenAI, Claude, Gemini, Ollama, Azure OpenAI, and any OpenAI-compatible endpoint.' }],
    seoTitle: 'Dify: Open Source LLM App Platform | Freemium Services', seoDescription: 'Build AI apps with Dify -- self-hosted LLMOps platform supporting 100+ models.'
  },
  {
    id: 'coolify', name: 'Coolify', description: 'Self-hosted Heroku/Vercel alternative. Deploy any app, database, or Docker service from Git with auto-SSL and zero vendor lock-in.', category: 'self-hosting', license: 'open-source', selfHostable: true, website: 'https://coolify.io', github: 'https://github.com/coollabsio/coolify', stars: '24k', badge: 'PaaS',
    features: ['One-click deploy from Git', 'Auto SSL/HTTPS', '100+ one-click services', 'Preview deployments', 'Resource monitoring'],
    useCases: ['Hosting Next.js apps', 'Database management', 'CI/CD pipelines', 'Team staging environments'],
    selfHostingGuide: '```bash\ncurl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash\n```',
    alternatives: ['CapRover', 'Dokku', 'Render', 'Railway'],
    faqs: [{ question: 'Can Coolify host Next.js and Node.js?', answer: 'Yes. Node.js, PHP, Python, Ruby, Go, and any Dockerfile or Docker Compose project.' }],
    seoTitle: 'Coolify: Self-Hosted Heroku Alternative | Freemium Services', seoDescription: 'Deploy apps with Coolify -- open-source Heroku/Vercel alternative with auto-SSL.'
  },
  {
    id: 'flowise', name: 'Flowise', description: 'Drag-and-drop LangChain UI. Build AI workflows, chatbots, and agents visually -- no code required.', category: 'ai-agents', license: 'open-source', selfHostable: true, website: 'https://flowiseai.com', github: 'https://github.com/FlowiseAI/Flowise', stars: '32k',
    features: ['Visual LangChain builder', '100+ integrations', 'API export', 'Vector DB integration', 'Chat widget embed'],
    useCases: ['Chatbot prototyping', 'RAG apps', 'Agent workflows', 'Customer support'],
    selfHostingGuide: '```bash\nnpm install -g flowise && flowise start\n```',
    alternatives: ['Dify', 'Langflow', 'n8n AI'],
    faqs: [{ question: 'Do I need to code for Flowise?', answer: 'No. Drag-and-drop builds full LangChain pipelines. Code nodes available for advanced cases.' }],
    seoTitle: 'Flowise: No-Code LangChain Builder | Freemium Services', seoDescription: 'Build AI pipelines visually with Flowise. No-code LangChain UI that is fully self-hostable.'
  },
  {
    id: 'anythingllm', name: 'AnythingLLM', description: 'All-in-one AI that turns any document into a chatbot. Desktop app + self-hosted backend. Full privacy, no cloud required.', category: 'rag-tools', license: 'open-source', selfHostable: true, website: 'https://anythingllm.com', github: 'https://github.com/Mintplex-Labs/anything-llm', stars: '22k',
    features: ['Multi-LLM support', 'Document ingestion', 'Built-in vector DB', 'Desktop app', 'Team workspaces'],
    useCases: ['Document Q&A', 'Knowledge base', 'Research assistant', 'Code docs chat'],
    selfHostingGuide: '```bash\ndocker pull mintplexlabs/anythingllm\ndocker run -itd -p 3001:3001 mintplexlabs/anythingllm\n```',
    alternatives: ['Dify', 'Open WebUI', 'PrivateGPT'],
    faqs: [{ question: 'Does AnythingLLM work offline?', answer: 'Yes. Desktop app + Ollama = 100% offline. No data leaves your machine.' }],
    seoTitle: 'AnythingLLM: Private Document AI | Freemium Services', seoDescription: 'Turn any document into an AI chatbot with AnythingLLM. Self-hosted, private, any LLM.'
  },
  {
    id: 'perplexica', name: 'Perplexica', description: 'Open-source Perplexity AI. AI-powered search engine with real-time web results, citations, and Ollama support.', category: 'rag-tools', license: 'open-source', selfHostable: true, website: 'https://github.com/ItzCrazyKns/Perplexica', github: 'https://github.com/ItzCrazyKns/Perplexica', stars: '16k', badge: 'Perplexity Alt',
    features: ['Web search with citations', 'Ollama support', 'Multiple search modes', 'Image search', 'YouTube search'],
    useCases: ['Research with sources', 'Cited answers', 'News summarization', 'Technical research'],
    selfHostingGuide: '```bash\ngit clone https://github.com/ItzCrazyKns/Perplexica\ncd Perplexica && docker compose up -d\n```',
    alternatives: ['Perplexity AI', 'You.com', 'Phind'],
    faqs: [{ question: 'Perplexica + Ollama for 100% private search?', answer: 'Yes. Pair with SearXNG for search and Ollama for LLM -- completely private and self-hosted.' }],
    seoTitle: 'Perplexica: Self-Hosted Perplexity Alternative | Freemium Services', seoDescription: 'Build a private AI search engine with Perplexica. Cited answers, Ollama support, fully self-hosted.'
  },
  {
    id: 'zed', name: 'Zed', description: 'High-performance code editor built in Rust. Native AI chat, remote dev, collaborative editing, and GPU-accelerated rendering.', category: 'developer-tools', license: 'open-source', selfHostable: false, website: 'https://zed.dev', github: 'https://github.com/zed-industries/zed', stars: '47k', badge: 'Rust Native',
    features: ['GPU-accelerated', 'Native AI (Claude, GPT, Ollama)', 'Real-time collaboration', 'LSP support', 'Remote dev'],
    useCases: ['High-performance editing', 'Pair programming', 'AI coding', 'Large codebases'],
    alternatives: ['VS Code', 'Cursor', 'Neovim'],
    faqs: [{ question: 'Is Zed faster than VS Code?', answer: 'Significantly. GPU-accelerated via Rust GPUI framework. Starts instantly, handles huge files.' }],
    seoTitle: 'Zed: High-Performance AI Code Editor | Freemium Services', seoDescription: 'Zed is the fastest AI editor -- Rust-native, GPU-accelerated, with Claude and Ollama built in.'
  },
  {
    id: 'activepieces', name: 'Activepieces', description: 'The friendliest open-source Zapier alternative. 200+ integrations, intuitive UI, AI flow generator, fully self-hostable.', category: 'automation-tools', license: 'open-source', selfHostable: true, website: 'https://activepieces.com', github: 'https://github.com/activepieces/activepieces', stars: '12k',
    features: ['200+ integrations', 'Visual builder', 'AI flow generator', 'Team workspaces', 'Custom code pieces'],
    useCases: ['Marketing automation', 'Customer support', 'Lead management', 'Internal ops'],
    selfHostingGuide: '```bash\ngit clone https://github.com/activepieces/activepieces.git\ncd activepieces && docker compose up -d\n```',
    alternatives: ['Zapier', 'n8n', 'Make'],
    faqs: [{ question: 'Activepieces vs n8n?', answer: 'Activepieces is simpler and more beginner-friendly. n8n has more advanced features. Both fully self-hostable.' }],
    seoTitle: 'Activepieces: Open Source Zapier Alternative | Freemium Services', seoDescription: 'Automate workflows with Activepieces. 200+ integrations, open-source, fully self-hostable.'
  },
  {
    id: 'searxng', name: 'SearXNG', description: 'Privacy-respecting metasearch aggregating 70+ search engines. Zero tracking, JSON API for AI grounding, fully self-hosted.', category: 'self-hosting', license: 'open-source', selfHostable: true, website: 'https://docs.searxng.org', github: 'https://github.com/searxng/searxng', stars: '14k',
    features: ['70+ search engines', 'No tracking/profiling', 'JSON API', 'Custom theming', 'Safe search modes'],
    useCases: ['Private search', 'AI web grounding', 'Research portals', 'Team search'],
    selfHostingGuide: '```bash\ndocker run -d -p 8080:8080 -e "BASE_URL=http://localhost:8080/" searxng/searxng\n```',
    alternatives: ['Brave Search API', 'Tavily', 'DuckDuckGo'],
    faqs: [{ question: 'SearXNG as LLM web search tool?', answer: 'Yes. Open WebUI and Perplexica use SearXNG for web search -- completely free, private, no API limits.' }],
    seoTitle: 'SearXNG: Self-Hosted Private Search Engine | Freemium Services', seoDescription: 'Run your own private search engine with SearXNG. Perfect for AI web grounding with zero API costs.'
  },
  {
    id: 'marimo', name: 'marimo', description: 'Reactive Python notebooks as .py files. Git-friendly, reproducible, and deployable as web apps. The modern Jupyter replacement.', category: 'developer-tools', license: 'open-source', selfHostable: true, website: 'https://marimo.io', github: 'https://github.com/marimo-team/marimo', stars: '7k',
    features: ['Reactive execution', 'Git-friendly .py files', 'WASM browser mode', 'SQL support', 'Deploy as web app'],
    useCases: ['Data analysis', 'Interactive tutorials', 'ML experiments', 'Reporting dashboards'],
    selfHostingGuide: '```bash\npip install marimo\nmarimo edit notebook.py\n# Deploy as web app:\nmarimo run notebook.py\n```',
    alternatives: ['Jupyter', 'Streamlit', 'Observable'],
    faqs: [{ question: 'How is marimo different from Jupyter?', answer: 'marimo notebooks are pure Python scripts (no JSON), reactive, and deployable as web apps. Jupyter is JSON-based and requires manual re-runs.' }],
    seoTitle: 'marimo: Reactive Python Notebooks | Freemium Services', seoDescription: 'Modern Jupyter alternative. marimo notebooks are reactive, reproducible, and git-friendly.'
  },
  {
    id: 'weaviate', name: 'Weaviate', description: 'AI-native vector database with built-in vectorization, hybrid search, and GraphQL API for enterprise AI applications.', category: 'vector-databases', license: 'open-source', selfHostable: true, website: 'https://weaviate.io', github: 'https://github.com/weaviate/weaviate', stars: '12k',
    features: ['Built-in vectorization', 'Hybrid BM25+vector', 'GraphQL API', 'Multi-tenancy', 'Generative search'],
    useCases: ['Enterprise semantic search', 'Knowledge graphs', 'Multi-modal RAG', 'Product search'],
    selfHostingGuide: '```bash\ndocker run -d -p 8080:8080 cr.weaviate.io/semitechnologies/weaviate:latest\n```',
    alternatives: ['Qdrant', 'Milvus', 'Pinecone'],
    faqs: [{ question: 'Weaviate multimodal support?', answer: 'Yes. CLIP and other models enable cross-modal search across images, text, and audio.' }],
    seoTitle: 'Weaviate: AI-Native Vector Database | Freemium Services', seoDescription: 'Enterprise AI search with Weaviate. Hybrid search, built-in vectorization, GraphQL API.'
  },
  {
    id: 'claude-code', name: 'Claude Code', description: "Anthropic's agentic CLI coding assistant. Reads your codebase, writes code, runs tests, and handles features end-to-end.", category: 'developer-tools', license: 'free', selfHostable: false, website: 'https://claude.ai/code', badge: 'Agentic',
    features: ['Full codebase context', 'Multi-file edits', 'CLI native', 'Git integration', 'Task planning'],
    useCases: ['Feature implementation', 'Bug fixing', 'Code review', 'Refactoring'],
    alternatives: ['Cursor', 'Cline', 'Aider', 'GitHub Copilot'],
    faqs: [{ question: 'Is Claude Code free?', answer: 'Requires Claude Pro subscription or API key. Free tier allows limited usage via npm install.' }],
    seoTitle: 'Claude Code: Agentic AI Coding CLI | Freemium Services', seoDescription: 'Anthropic\'s Claude Code CLI for end-to-end AI coding -- handles features, tests, and multi-file edits.'
  },
];

export const KNOWLEDGE_HUB = [
  { id: 'quickstart', title: 'Quickstart: Building Your Open-Source Stack', content: `## The Modern Open-Source Stack in 2026\n\nBuilding a complete production stack without vendor lock-in is easier than ever. Here's the proven path.\n\n### Hosting Layer\nStart with Coolify on a $20/mo Hetzner VPS. It handles SSL, deployments, and monitoring for all your services.\n\n### AI Layer\n- **Ollama** for local model inference\n- **Open WebUI** for team AI chat\n- **Qdrant** for vector search\n\n### Automation Layer\n**n8n** handles 80% of integration needs visually. Add custom Python microservices for the remaining 20%.\n\n### The TurboQuant Advantage\nDeploy on TurboQuant DePIN for decentralized compute that is more resilient and cost-effective than single-provider cloud.`, seoTitle: 'Open-Source Stack Quickstart | Freemium Services', seoDescription: 'Build your complete open-source tech stack in 2026. AI, automation, hosting, and search covered.' },
  { id: 'cloud', title: 'Cloud vs Self-Hosting: The 2026 Cost Analysis', content: `## The Economics of Self-Hosting in 2026\n\nA typical SaaS stack for a 10-person team costs **$500-2000/month**.\n\nThe self-hosted equivalent on a $40/mo VPS costs **under $100/month total**.\n\n### When Cloud Wins\n- Zero DevOps capacity in-house\n- Strict compliance requirements\n- Sub-24-hour time-to-value needed\n\n### When Self-Hosting Wins\n- Data privacy is critical (healthcare, legal, finance)\n- High-volume predictable workloads\n- Technical team comfortable with Docker/Linux\n\n### The Hybrid Approach\nSelf-host stateful services (databases, AI inference). Use managed services for high-SLA requirements.`, seoTitle: 'Cloud vs Self-Hosting Cost Analysis 2026 | Freemium Services', seoDescription: '2026 comparison of cloud vs self-hosting costs and trade-offs for modern tech stacks.' },
  { id: 'rag-guide', title: 'Building Production RAG: The Complete Guide', content: `## RAG Architecture for Production\n\nRetrieval-Augmented Generation grounds LLMs in your data, eliminating hallucination.\n\n### The RAG Pipeline\n1. **Ingest**: Split docs -> embed -> store in vector DB\n2. **Retrieve**: Query -> embed -> similarity search -> top-k chunks\n3. **Generate**: Inject context into LLM prompt -> answer\n\n### Recommended Open-Source Stack\n- **Embedding**: nomic-embed-text via Ollama\n- **Vector DB**: Qdrant (self-hosted)\n- **LLM**: Llama 3.3 70B or Claude API\n- **Orchestration**: Dify or AnythingLLM\n\n### Evaluating RAG Quality\nUse RAGAS metrics: faithfulness, answer relevancy, context precision. Without evaluation, you are flying blind.`, seoTitle: 'Production RAG Architecture Guide 2026 | Freemium Services', seoDescription: 'Build production-grade RAG pipelines with open-source tools. Complete guide for 2026.' },
  { id: 'thinking', title: 'Thinking Models in 2026: What Actually Changed', content: `## The Reasoning Model Revolution\n\nThinking models -- those generating extended internal reasoning -- reshaped AI capability benchmarks in 2025-2026.\n\n### How They Work\nModels like DeepSeek-R1, QwQ-32B, and Claude with extended thinking use chain-of-thought reasoning internally. They spend compute on reasoning before generating an answer.\n\n### Self-Hosted Thinking Models\nDeepSeek-R1 distilled at 32B matches GPT-4o on many benchmarks. Runs via Ollama. Zero API costs.\n\n### When to Use Them\n- Complex multi-step reasoning\n- Math and science problems\n- Code generation with correctness requirements\n- Tasks where accuracy > speed`, seoTitle: 'Thinking Models & AI Reasoning 2026 | Freemium Services', seoDescription: 'Deep dive into thinking models -- DeepSeek-R1, QwQ, and more. Self-host them for free.' },
  { id: 'embeddings', title: 'Embeddings 101: The Foundation of Semantic AI', content: `## What Are Embeddings?\n\nEmbeddings convert text into vectors where semantically similar content clusters together. The invisible layer that makes AI search and memory work.\n\n### Best Open-Source Embedding Models (2026)\n- **nomic-embed-text**: Best general-purpose via Ollama\n- **BGE-M3**: Best multilingual performance\n- **mxbai-embed-large**: Excellent MTEB benchmarks\n- **jina-embeddings-v3**: Best for long documents\n\n### Qdrant Production Best Practices\nUse HNSW indexing, ef=128 for speed/recall balance. Enable payload indexing for filtered retrieval. Shard at 100k+ vectors.`, seoTitle: 'Embeddings Guide: Semantic Search Foundation | Freemium Services', seoDescription: 'Complete guide to text embeddings for RAG and semantic search. Best models, vector DBs, and tips.' },
  { id: 'ai-agents-guide', title: 'AI Agents: From Prototype to Production', content: `## The Agent Architecture\n\nEvery agent runs the same loop: Perceive -> Reason -> Act -> Observe -> Repeat.\n\n### Best Open-Source Agent Frameworks\n- **Dify**: Best for visual building\n- **n8n AI agents**: Best for automation-heavy workflows\n- **CrewAI**: Best for multi-agent collaboration\n- **AutoGen**: Best for research and complex chains\n\n### Production Requirements\nRate limiting, error recovery, cost management, and human-in-the-loop checkpoints are non-negotiable.\n\n### Agent Memory\nCombine Qdrant (long-term memory) with Redis (working memory) for agents that learn and remember across sessions.`, seoTitle: 'AI Agents Production Guide | Freemium Services', seoDescription: 'Build production AI agents with open-source tools. Architecture, frameworks, and best practices.' },
  { id: 'self-hosting-101', title: 'Self-Hosting 101: Your First Production Server', content: `## Getting Started with Self-Hosting\n\n### Recommended Hardware\n$20/mo VPS: 4 vCPU, 8GB RAM, 100GB SSD from Hetzner or DigitalOcean.\n\n### Base Stack\n- Ubuntu 22.04 LTS\n- Docker + Docker Compose\n- Coolify (deployments + SSL)\n- Cloudflare (DNS + CDN)\n\n### First 5 Services to Deploy\n1. **Uptime Kuma** -- Monitor everything\n2. **Vaultwarden** -- Private password manager\n3. **n8n** -- Workflow automation\n4. **Ollama + Open WebUI** -- Private AI chat\n5. **Qdrant** -- Vector search\n\n### Security Essentials\n- SSH keys only (disable passwords)\n- UFW firewall (80, 443, 22 only)\n- Fail2ban for brute-force protection\n- Automated daily backups to S3`, seoTitle: 'Self-Hosting 101: First Production Server | Freemium Services', seoDescription: 'Beginner guide to self-hosting. Setup Docker, SSL, and 5+ essential services on your own server.' },
    { id: 'tool-calling', title: 'LLM Tool Calling: Making AI Act in the Real World', content: 'Tool calling lets LLMs trigger real-world actions -- searching the web, querying databases, executing code, calling APIs. Define tools as JSON schemas with a name, description, and input_schema. The model decides when to call them. Stacks: Ollama + LangChain for local models, Dify for visual pipelines, n8n for automation-first agents.', seoTitle: 'LLM Tool Calling Guide 2026 | Freemium Services', seoDescription: 'Master LLM tool calling. Build agents that interact with real APIs and databases.' },
    { id: 'vision', title: 'Open-Source Computer Vision in 2026', content: 'Vision models are now accessible to everyone. Top models: YOLO v11 for real-time object detection (runs on CPU), SAM 2 from Meta for segmentation, Florence 2 as a versatile vision-language model, and Llama 3.2 Vision for multimodal chat via Ollama. Run vision models locally with zero cloud dependency using Ollama with llama3.2-vision. Applications include document OCR, defect detection, security analysis, and medical pre-screening.', seoTitle: 'Open-Source Computer Vision 2026 | Freemium Services', seoDescription: 'Best open-source vision models running locally via Ollama.' },
  { id: 'integrations', title: 'Integration Architecture for Self-Hosted Stacks', content: `## Connecting Your Open-Source Stack\n\n### The Integration Pyramid\n**Level 1 -- Webhooks**: HTTP callbacks. Every tool supports them. Simple, reliable.\n\n**Level 2 -- n8n/Activepieces**: Handles 80% of integration needs without code.\n\n**Level 3 -- Custom microservices**: FastAPI for complex logic that visual builders cannot express.\n\n### Event-Driven Architecture\nRedpanda (Kafka-compatible) as your event bus decouples services and enables reliable async processing at scale.\n\n### API Gateway\nTraefik handles internal routing. Kong or Nginx with API key validation for external-facing APIs.\n\n### The TurboQuant Integration Hub\nDeploy your integration middleware on TurboQuant for maximum uptime and global edge distribution.`, seoTitle: 'Integration Architecture for Open-Source Stacks | Freemium Services', seoDescription: 'Design resilient integrations for your self-hosted stack. n8n, webhooks, and event-driven patterns.' },
];
