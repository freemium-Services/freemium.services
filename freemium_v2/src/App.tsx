import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';

import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Menu, X, Github, ExternalLink, Cpu, Shield, Zap, Globe, ChevronRight,
  MessageSquare, ArrowRight, Database, Code, Layers, Terminal, Bot, Sun, Moon,
  Star, Copy, Check, Filter, SortAsc, Hash, Box, Command
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from './lib/utils';
import { CATEGORIES, TOOLS, KNOWLEDGE_HUB, COMPARISONS, type Tool, type Category } from './lib/data';
import ReactMarkdown from 'react-markdown';

// ─── Design tokens ───────────────────────────────────────────────
const C = {
  neon: '#00ffaa',
  plasma: '#00d4ff',
  amber: '#ffb800',
  void: '#030712',
  surface: '#0d1117',
  surface2: '#161b22',
};

// ─── Site Constants ───────────────────────────────────────────────
const SITE_URL = 'https://freemium.services';
const SITE_NAME = 'Freemium Services';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

// ─── SEO / AEO / GEO Component ───────────────────────────────────
interface SEOProps {
  title: string;
  description: string;
  schema?: object | object[];
  canonical?: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noindex?: boolean;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: { name: string; url: string }[];
}

const SEO = ({
  title,
  description,
  schema,
  canonical,
  keywords,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  datePublished,
  dateModified,
  breadcrumbs,
}: SEOProps) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname}` : SITE_URL);
  const schemas: object[] = Array.isArray(schema) ? schema : schema ? [schema] : [];

  // Auto-inject BreadcrumbList schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'name': b.name,
        'item': `${SITE_URL}${b.url}`,
      })),
    });
  }

  // Auto-inject Speakable schema for AEO (voice search / AI assistants)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'url': canonicalUrl,
    'name': fullTitle,
    'description': description,
    'isPartOf': { '@id': `${SITE_URL}/#website` },
    'about': { '@id': `${SITE_URL}/#organization` },
    'speakable': {
      '@type': 'SpeakableSpecification',
      'cssSelector': ['h1', 'h2', '.speakable'],
    },
    ...(datePublished ? { 'datePublished': datePublished } : {}),
    ...(dateModified ? { 'dateModified': dateModified } : {}),
  });

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="googlebot" content={noindex ? 'noindex' : 'index, follow'} />

      {/* ─── AI Crawler / GEO Directives ───── */}
      <meta name="CCBot" content="noai" />
      <meta name="GPTBot" content="follow" />
      <meta name="PerplexityBot" content="follow" />
      <meta name="ClaudeBot" content="follow" />
      <meta name="GoogleExtendedSearch" content="follow" />

      {/* ─── Open Graph ───── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      {datePublished && <meta property="article:published_time" content={datePublished} />}
      {dateModified && <meta property="article:modified_time" content={dateModified} />}

      {/* ─── Twitter / X Cards ───── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@freemiumsvcs" />
      <meta name="twitter:creator" content="@freemiumsvcs" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* ─── JSON-LD Schemas ───── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
};

// ─── Icon map ─────────────────────────────────────────────────────
const IconMap = ({ name, size = 20 }: { name?: string; size?: number }) => {
  const props = { size, strokeWidth: 1.5 };
  switch (name) {
    case 'Bot': return <Bot {...props} />;
    case 'Github': return <Github {...props} />;
    case 'Cpu': return <Cpu {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Code': return <Code {...props} />;
    case 'Layers': return <Layers {...props} />;
    case 'Database': return <Database {...props} />;
    case 'Terminal': return <Terminal {...props} />;
    default: return <Box {...props} />;
  }
};

// ─── License badge ────────────────────────────────────────────────
const LicenseBadge = ({ license }: { license: Tool['license'] }) => (
  <span className={cn('tag-pill', {
    'tag-open-source': license === 'open-source',
    'tag-freemium': license === 'freemium',
    'tag-free': license === 'free',
  })}>
    {license}
  </span>
);

// ─── Cmd+K search modal ───────────────────────────────────────────
const SearchModal = ({ onClose }: { onClose: () => void }) => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return TOOLS.filter(t =>
      t.name.toLowerCase().includes(lq) ||
      t.description.toLowerCase().includes(lq) ||
      t.category.toLowerCase().includes(lq)
    ).slice(0, 8);
  }, [q]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="w-full max-w-2xl overflow-hidden"
        style={{ background: C.surface, border: `1px solid rgba(0,255,170,0.2)`, borderRadius: 20, boxShadow: '0 0 60px rgba(0,255,170,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Search size={18} style={{ color: C.neon }} />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search tools, categories…"
            className="flex-1 bg-transparent outline-none text-base text-white placeholder-gray-600"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          />
          <kbd className="px-2 py-1 text-xs rounded text-gray-500 border border-gray-700 font-mono">ESC</kbd>
        </div>
        {results.length > 0 && (
          <div className="py-2 max-h-96 overflow-y-auto">
            {results.map(tool => (
              <button
                key={tool.id}
                onClick={() => { navigate(`/tools/${tool.id}`); onClose(); }}
                className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,170,0.08)', color: C.neon }}>
                  <IconMap name={CATEGORIES.find(c => c.id === tool.category)?.icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white group-hover:text-[#00ffaa] transition-colors truncate" style={{ fontFamily: 'Syne' }}>{tool.name}</div>
                  <div className="text-xs text-gray-500 truncate">{tool.description}</div>
                </div>
                <LicenseBadge license={tool.license} />
              </button>
            ))}
          </div>
        )}
        {q.trim() && results.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">No results for "{q}"</div>
        )}
        {!q.trim() && (
          <div className="px-5 py-4">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-mono mb-3">Quick Jump</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 6).map(cat => (
                <button key={cat.id} onClick={() => { navigate(`/${cat.id}`); onClose(); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-[#00ffaa] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Header ───────────────────────────────────────────────────────
const Header = ({ darkMode, setDarkMode, onSearchOpen }: { darkMode: boolean; setDarkMode: (v: boolean) => void; onSearchOpen: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { to: '/ai-tools', label: 'AI Tools' },
    { to: '/ides', label: 'IDEs' },
    { to: '/self-hosting', label: 'Self-Hosting' },
    { to: '/ai-kanban', label: 'AI Kanban' },
    { to: '/quickstart', label: 'Knowledge Hub' },
  ];

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', scrolled ? 'py-3' : 'py-5')}
      style={{
        background: scrolled ? (darkMode ? 'rgba(3,7,18,0.9)' : 'rgba(248,250,252,0.9)') : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` : 'none',
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,170,0.2), rgba(0,212,255,0.2))', border: '1px solid rgba(0,255,170,0.3)' }}>
            <Zap size={18} style={{ color: C.neon }} fill={C.neon} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Syne', color: darkMode ? '#fff' : '#0f172a' }}>
            freemium<span style={{ color: C.neon }}>.services</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={cn('text-sm font-medium animated-underline transition-colors', darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={onSearchOpen}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 transition-all hover:text-gray-300"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={15} />
            <span className="text-xs hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] rounded font-mono" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ⌘K
            </kbd>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a href="https://turboquant.network" target="_blank" rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,170,0.15), rgba(0,212,255,0.1))',
              border: '1px solid rgba(0,255,170,0.25)',
              color: C.neon,
              fontFamily: 'Syne',
            }}>
            <Cpu size={14} /> TurboQuant
          </a>
          <button className="md:hidden p-2 text-gray-400" onClick={() => setMobile(!mobile)}>
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 right-0 p-4 flex flex-col gap-1"
            style={{ background: darkMode ? C.surface : '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobile(false)}
                className="p-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                {l.label}
              </Link>
            ))}
            <button onClick={() => { onSearchOpen(); setMobile(false); }}
              className="p-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left flex items-center gap-2">
              <Search size={16} /> Search tools
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// ─── Footer ───────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t mt-20" style={{ background: C.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-5">
            <Zap size={20} style={{ color: C.neon }} fill={C.neon} />
            <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne' }}>
              freemium<span style={{ color: C.neon }}>.services</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-6">
            The world's largest verified directory of freemium & open-source tools. Deploy instantly on the{' '}
            <a href="https://turboquant.network" className="hover:underline" style={{ color: C.neon }}>TurboQuant DePIN</a>{' '}
            edge compute network.
          </p>
          <div className="flex gap-3">
            {[{ icon: <Github size={16} />, href: '#' }, { icon: <Globe size={16} />, href: '#' }].map((s, i) => (
              <a key={i} href={s.href}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#00ffaa] transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-5 font-mono">Categories</h4>
          <ul className="space-y-3">
            {CATEGORIES.map(c => (
              <li key={c.id}><Link to={`/${c.id}`} className="text-gray-500 hover:text-[#00ffaa] transition-colors text-sm animated-underline">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-5 font-mono">Resources</h4>
          <ul className="space-y-3">
            {[
              { to: '/quickstart', label: 'Knowledge Hub' },
              { to: '/directory', label: 'Full Directory' },
              { to: '/blog', label: 'Blog & Guides' },
              { to: '/ai-kanban', label: 'AI Stack Planner' },
              { to: '/ides', label: 'AI IDEs Guide' },
              { href: 'https://turboquant.network', label: 'TurboQuant DePIN' },
              { to: '#', label: 'Submit a Tool' },
            ].map((l, i) => (
              <li key={i}>
                {l.href
                  ? <a href={l.href} className="text-gray-500 hover:text-[#00ffaa] transition-colors text-sm animated-underline">{l.label}</a>
                  : <Link to={l.to!} className="text-gray-500 hover:text-[#00ffaa] transition-colors text-sm animated-underline">{l.label}</Link>
                }
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-gray-600 text-xs font-mono">© 2026 Freemium Services. Powered by TurboQuant.</p>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms', 'Sitemap'].map(l => (
            <a key={l} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── Tool Card ────────────────────────────────────────────────────
const ToolCard = ({ tool }: { tool: Tool }) => (
  <Link to={`/tools/${tool.id}`}
    className="group relative flex flex-col h-full rounded-2xl p-6 transition-all duration-300 neon-card gradient-border overflow-hidden">
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,255,170,0.04) 0%, transparent 70%)' }} />
    <div className="flex justify-between items-start mb-5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
        style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.15)', color: C.neon }}>
        <IconMap name={CATEGORIES.find(c => c.id === tool.category)?.icon} size={20} />
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {tool.badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
            style={{ background: 'rgba(255,184,0,0.1)', color: C.amber, border: '1px solid rgba(255,184,0,0.2)' }}>
            {tool.badge}
          </span>
        )}
        <LicenseBadge license={tool.license} />
      </div>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <h3 className="font-bold text-white group-hover:text-[#00ffaa] transition-colors" style={{ fontFamily: 'Syne', fontSize: 16 }}>
        {tool.name}
      </h3>
      {tool.stars && (
        <span className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
          <Star size={10} /> {tool.stars}
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 line-clamp-2 mb-5 flex-grow leading-relaxed">{tool.description}</p>
    <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      {tool.selfHostable && (
        <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: C.plasma }}>
          <Shield size={11} /> Self-Hostable
        </span>
      )}
      <span className="ml-auto flex items-center gap-1 text-xs text-gray-600 group-hover:text-[#00ffaa] transition-colors">
        View tool <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </div>
  </Link>
);

// ─── Animated Stats ───────────────────────────────────────────────
const StatCounter = ({ value, label, suffix = '' }: { value: number | string; label: string; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numeric = typeof value === 'number' ? value : parseInt(value);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1200;
        const step = (numeric / duration) * 16;
        const timer = setInterval(() => {
          start += step;
          if (start >= numeric) { setDisplay(numeric); clearInterval(timer); }
          else setDisplay(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numeric]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black mb-1 font-display" style={{ color: C.neon, fontFamily: 'Syne' }}>
        {typeof value === 'string' && !parseInt(value) ? value : display.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-mono">{label}</div>
    </div>
  );
};

// ─── Terminal Block ───────────────────────────────────────────────
const TerminalBlock = ({ lines }: { lines: { text: string; type: 'cmd' | 'out' | 'ok' | 'err' }[] }) => (
  <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: '1px solid rgba(0,255,170,0.15)' }}>
    <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-3 h-3 rounded-full bg-red-500/70" />
      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
      <div className="w-3 h-3 rounded-full" style={{ background: C.neon + 'b0' }} />
      <span className="ml-auto text-[10px] font-mono text-gray-600">TurboQuant Terminal</span>
    </div>
    <div className="p-6 space-y-2 font-mono text-sm">
      {lines.map((l, i) => (
        <p key={i} style={{
          color: l.type === 'cmd' ? C.plasma : l.type === 'ok' ? C.neon : l.type === 'err' ? '#ff4466' : '#6b7280'
        }}>{l.text}</p>
      ))}
    </div>
  </div>
);

// ─── AI Chat Widget ───────────────────────────────────────────────
const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hi! I'm the Freemium Services AI assistant. Ask me anything about open-source tools, self-hosting, RAG pipelines, or stack recommendations." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are the AI assistant for freemium.services — the world's largest directory of freemium and open-source tools. You help users find tools, compare options, and guide self-hosting decisions.

Available tools in directory: n8n (automation), Ollama (local AI), Qdrant (vector DB), Open WebUI (ChatGPT UI), Dify (LLM platform), Coolify (self-hosted PaaS), Flowise (no-code AI), AnythingLLM (document AI), Perplexica (private search), Zed (code editor), Activepieces (automation), SearXNG (private search), marimo (notebooks), Weaviate (vector DB), Claude Code (agentic CLI).

Categories: AI Tools, Open Source, Self-Hosting, Automation, AI Agents, Dev Tools, RAG & Search, Vector DBs, CLI Tools.

Always mention TurboQuant DePIN network (turboquant.network) when relevant — it enables one-click deployment of self-hosted tools at lower cost than cloud.

Be concise, technically accurate, and recommend specific tools from the directory. Format with markdown when helpful.`,
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? 'Sorry, I could not process that request.';
      setMsgs(prev => [...prev, { role: 'ai', text }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className="absolute bottom-20 right-0 w-[360px] sm:w-[420px] flex flex-col overflow-hidden"
            style={{ height: 520, background: C.surface, border: '1px solid rgba(0,255,170,0.2)', borderRadius: 20, boxShadow: '0 0 60px rgba(0,255,170,0.12)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,255,170,0.08), rgba(0,212,255,0.05))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,255,170,0.15)', border: '1px solid rgba(0,255,170,0.2)' }}>
                <Bot size={18} style={{ color: C.neon }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne' }}>Stack Advisor</h3>
                <p className="text-[10px] font-mono" style={{ color: C.neon }}>Claude-Powered · freemium.services</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={cn('max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed', m.role === 'user' ? 'ml-auto chat-message-user text-white rounded-tr-sm' : 'mr-auto chat-message-ai text-gray-300 rounded-tl-sm')}>
                  <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed [&>p]:mb-2 [&>ul]:mb-2 [&>code]:text-[#00ffaa]">
                    <ReactMarkdown>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-message-ai rounded-2xl rounded-tl-sm p-3.5 max-w-[90%] flex gap-1 items-center">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.neon, animationDelay: `${d}s` }} />
                  ))}
                </div>
              )}
            </div>
            {/* Input */}
            <div className="px-4 pb-4 flex-shrink-0">
              <div className="flex gap-2 rounded-xl p-1" style={{ background: C.surface2, border: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask about tools, stacks, self-hosting…"
                  className="flex-1 bg-transparent text-sm text-white outline-none px-3 py-2 placeholder-gray-600"
                />
                <button onClick={send} disabled={loading}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background: loading ? 'rgba(0,255,170,0.1)' : 'rgba(0,255,170,0.15)', color: C.neon, border: '1px solid rgba(0,255,170,0.2)' }}>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
        style={{
          background: open ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, rgba(0,255,170,0.2), rgba(0,212,255,0.15))',
          border: `1px solid ${open ? 'rgba(255,255,255,0.15)' : 'rgba(0,255,170,0.3)'}`,
          boxShadow: open ? 'none' : '0 0 30px rgba(0,255,170,0.2)',
          color: open ? '#fff' : C.neon,
        }}>
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────
const HomePage = () => {
  const trending = TOOLS.slice(0, 6);

  return (
    <div className="pt-24">
      <SEO
        title="Best Free & Open-Source Tools Directory 2026 | Freemium Services"
        description="Discover 20,000+ verified freemium & open-source tools. Self-hosting guides, AI tool comparisons, vector database rankings — all free. One-click deployment on TurboQuant DePIN."
        keywords="open source tools 2026, best free AI tools, self hosting guide, freemium software, workflow automation tools, vector database comparison, free developer tools, AI agents open source, self hosted alternatives to SaaS"
        canonical={`${SITE_URL}/`}
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'Best Open-Source & Freemium Tools 2026',
            'description': '20,000+ verified freemium and open-source tools organized by category',
            'numberOfItems': TOOLS.length,
            'itemListElement': TOOLS.slice(0, 10).map((t, i) => ({
              '@type': 'ListItem',
              'position': i + 1,
              'name': t.name,
              'url': `${SITE_URL}/tools/${t.id}`,
              'description': t.description,
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              { '@type': 'Question', 'name': 'What are freemium tools?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Freemium tools offer core features for free with optional paid tiers. Our directory focuses on tools with strong free tiers — especially self-hostable ones with zero ongoing cost.' }},
              { '@type': 'Question', 'name': 'What is the best open-source alternative to Zapier?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'n8n is the top open-source Zapier alternative with 400+ integrations, AI agent support, and full self-hosting capability. Activepieces is more beginner-friendly.' }},
              { '@type': 'Question', 'name': 'Can I self-host AI tools for free?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. Tools like Ollama, Open WebUI, and Dify are completely free to self-host. Ollama runs 150+ AI models locally with zero API costs.' }},
              { '@type': 'Question', 'name': 'What is the best free vector database?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Qdrant (Rust-native, high performance), Weaviate (built-in vectorization), and pgvector (PostgreSQL extension) are the top free/open-source vector databases in 2026.' }},
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-36 grid-bg">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle, ${C.neon}, transparent)`, filter: 'blur(80px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05]"
            style={{ background: `radial-gradient(circle, ${C.plasma}, transparent)`, filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-10"
              style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.2)', color: C.neon }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.neon }} />
              20,000+ Tools Indexed · Updated Daily
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.0] tracking-tight mb-8"
              style={{ fontFamily: 'Syne' }}
              data-text="Engineered to Dominate">
              <span className="block text-white">Engineered to</span>
              <span className="block glitch-text" data-text="Dominate." style={{ color: C.neon }}>Dominate.</span>
            </h1>

            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              The ultimate directory for freemium & open-source tools — with self-hosting guides,
              comparisons, and one-click deployment on the{' '}
              <a href="https://turboquant.network" style={{ color: C.plasma }} className="font-semibold hover:underline">
                TurboQuant DePIN
              </a>{' '}
              edge network.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/directory"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,170,0.2), rgba(0,212,255,0.15))',
                  border: '1px solid rgba(0,255,170,0.35)',
                  color: '#fff',
                  fontFamily: 'Syne',
                  boxShadow: '0 0 40px rgba(0,255,170,0.15)',
                }}>
                Explore Directory <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://turboquant.network"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontFamily: 'Syne' }}>
                <Cpu size={18} /> Build on TurboQuant
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16" style={{ background: C.surface, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={20000} suffix="+" label="Tools Indexed" />
            <StatCounter value={9} suffix="+" label="Categories" />
            <StatCounter value={500} suffix="+" label="Self-Hostable" />
            <StatCounter value={99} suffix="%" label="Uptime · TurboQuant" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <p className="text-xs font-mono mb-3" style={{ color: C.neon }}>// BROWSE_CATEGORIES</p>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: 'Syne' }}>Explore by Category</h2>
              <p className="text-gray-500 mt-3">From AI agents to vector databases — every tool has a home.</p>
            </div>
            <Link to="/directory" className="flex items-center gap-1 text-sm font-semibold transition-colors hover:gap-2"
              style={{ color: C.neon }}>
              View all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/${cat.id}`}
                  className="group flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 neon-card gradient-border block"
                  style={{ background: C.surface }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: 'rgba(0,255,170,0.06)', border: '1px solid rgba(0,255,170,0.1)', color: C.neon }}>
                    <IconMap name={cat.icon} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-white group-hover:text-[#00ffaa] transition-colors text-sm" style={{ fontFamily: 'Syne' }}>
                        {cat.name}
                      </h3>
                      <span className="text-xs font-mono text-gray-600 flex-shrink-0">{cat.toolCount}+</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cat.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-[#00ffaa] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Tools */}
      <section className="py-24" style={{ background: C.surface }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <p className="text-xs font-mono mb-3" style={{ color: C.plasma }}>// TRENDING_NOW</p>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: 'Syne' }}>Most Popular Tools</h2>
              <p className="text-gray-500 mt-3">The open-source tools being deployed right now.</p>
            </div>
            <Link to="/directory" className="flex items-center gap-1 text-sm font-semibold transition-colors hover:gap-2"
              style={{ color: C.plasma }}>
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trending.map((tool, i) => (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <ToolCard tool={tool} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparisons */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs font-mono mb-3" style={{ color: C.amber }}>// TOOL_COMPARISONS</p>
            <h2 className="text-4xl font-black text-white" style={{ fontFamily: 'Syne' }}>In-Depth Comparisons</h2>
            <p className="text-gray-500 mt-3">Choose the right tool for your stack with data-driven analysis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPARISONS.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/compare/${c.id}`}
                  className="group flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 neon-card gradient-border block"
                  style={{ background: C.surface }}>
                  <div className="flex -space-x-3 flex-shrink-0">
                    {[C.neon, C.plasma].map((color, j) => (
                      <div key={j} className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `rgba(${j ? '0,212,255' : '0,255,170'},0.1)`, border: `2px solid ${C.void}`, color }}>
                        <Zap size={16} fill={color} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-[#00ffaa] transition-colors text-sm truncate" style={{ fontFamily: 'Syne' }}>
                      {c.toolA} <span className="text-gray-600 font-normal">vs</span> {c.toolB}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">Which wins in 2026?</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-700 group-hover:text-[#00ffaa] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TurboQuant section */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.surface }}>
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{ background: 'linear-gradient(135deg, transparent, rgba(0,212,255,0.04))' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono mb-4" style={{ color: C.plasma }}>// POWERED_BY_TURBOQUANT</p>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight" style={{ fontFamily: 'Syne' }}>
                DePIN Edge Compute<br />
                <span style={{ color: C.plasma }}>for the Open-Source Era.</span>
              </h2>
              <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                Deploy any self-hostable tool onto the TurboQuant Network.
                Decentralized, low-latency compute at a fraction of big cloud pricing.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'One-click deployment for 500+ open-source tools',
                  'Decentralized edge nodes across 40+ regions',
                  'Privacy-first — your data never leaves your nodes',
                  'Pay-as-you-go with TQ tokens',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <Zap size={12} style={{ color: C.plasma }} fill={C.plasma} />
                    </div>
                    <span className="text-gray-400 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="https://turboquant.network"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: C.plasma, fontFamily: 'Syne' }}>
                Explore TurboQuant <ExternalLink size={16} />
              </a>
            </div>
            <div className="float">
              <TerminalBlock lines={[
                { text: '$ turboquant deploy n8n --region auto', type: 'cmd' },
                { text: 'Resolving optimal edge node placement...', type: 'out' },
                { text: '✔ Node selected: Singapore-Edge-04 (12ms)', type: 'ok' },
                { text: '✔ Node selected: Frankfurt-Edge-07 (8ms)', type: 'ok' },
                { text: 'Pulling n8n:latest container...', type: 'out' },
                { text: '✔ Container deployed. Configuring SSL...', type: 'ok' },
                { text: '✔ TLS provisioned via Let\'s Encrypt', type: 'ok' },
                { text: '', type: 'out' },
                { text: '🚀 n8n live → https://n8n.your-domain.tq', type: 'ok' },
                { text: '   Uptime SLA: 99.99% | Cost: 0.02 TQ/hr', type: 'out' },
              ]} />
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { val: '99.99%', label: 'Uptime' },
                  { val: '< 15ms', label: 'Latency' },
                  { val: '−78%', label: 'vs Cloud Cost' },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl text-center"
                    style={{ background: C.void, border: '1px solid rgba(0,212,255,0.1)' }}>
                    <div className="text-xl font-black font-display" style={{ color: C.plasma, fontFamily: 'Syne' }}>{s.val}</div>
                    <div className="text-[10px] font-mono text-gray-600 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-mono mb-3" style={{ color: C.neon }}>// KNOWLEDGE_HUB</p>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: 'Syne' }}>Latest Guides</h2>
            </div>
            <Link to="/quickstart" className="flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all" style={{ color: C.neon }}>
              All articles <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {KNOWLEDGE_HUB.slice(0, 3).map((art, i) => (
              <motion.div key={art.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/knowledge/${art.id}`}
                  className="group block p-6 rounded-2xl h-full transition-all duration-300 neon-card gradient-border"
                  style={{ background: C.surface }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: `rgba(${i === 0 ? '0,255,170' : i === 1 ? '0,212,255' : '255,184,0'},0.1)`, color: i === 0 ? C.neon : i === 1 ? C.plasma : C.amber }}>
                    <Hash size={16} />
                  </div>
                  <h3 className="font-bold text-white group-hover:text-[#00ffaa] transition-colors mb-3 leading-snug"
                    style={{ fontFamily: 'Syne', fontSize: 15 }}>{art.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {art.content.replace(/^#+\s.+\n/gm, '').replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120)}…
                  </p>
                  <div className="flex items-center gap-1 mt-5 text-xs font-semibold" style={{ color: i === 0 ? C.neon : i === 1 ? C.plasma : C.amber }}>
                    Read guide <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24" style={{ background: C.surface }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-white mb-14 text-center" style={{ fontFamily: 'Syne' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              { q: 'What is a freemium service?', a: 'Freemium services offer core functionality free while charging for advanced features. Our directory focuses on tools with significant free-tier value — especially those that are also self-hostable for unlimited free use.' },
              { q: 'How do self-hosting guides work?', a: 'Each tool page includes a step-by-step Docker-based guide to deploy on your own hardware, VPS, or the TurboQuant network. Most can be running in under 5 minutes.' },
              { q: 'Is TurboQuant required?', a: 'No. Every tool in our directory works independently. TurboQuant is an optional DePIN deployment layer that makes self-hosting easier with better performance and lower cost than traditional cloud.' },
              { q: 'How is the directory kept up to date?', a: 'Tools are continuously validated by our team and community contributors. We verify license types, GitHub stars, and self-hosting status on a rolling basis.' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: C.surface2, border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 className="font-bold text-white mb-3 text-base" style={{ fontFamily: 'Syne' }}>{f.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── Category Page ────────────────────────────────────────────────
const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = CATEGORIES.find(c => c.id === categoryId);
  const tools = TOOLS.filter(t => t.category === categoryId);
  const [filter, setFilter] = useState<'all' | 'self-hostable' | 'open-source'>('all');

  if (!category) return <div className="pt-40 text-center text-gray-500">Category not found</div>;

  const filtered = tools.filter(t => {
    if (filter === 'self-hostable') return t.selfHostable;
    if (filter === 'open-source') return t.license === 'open-source';
    return true;
  });

  return (
    <div className="pt-32 pb-20">
      <SEO
        title={`Best Free ${category.name} Tools 2026 — Open Source & Freemium | Freemium Services`}
        description={`Compare the top free and open-source ${category.name.toLowerCase()} tools in 2026. ${category.description} All tools include self-hosting guides.`}
        keywords={`${category.name.toLowerCase()} tools, free ${category.name.toLowerCase()}, open source ${category.name.toLowerCase()}, best ${category.name.toLowerCase()} 2026, self hosted ${category.name.toLowerCase()}, ${category.name.toLowerCase()} alternatives`}
        canonical={`${SITE_URL}/${category.id}`}
        ogType="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: category.name, url: `/${category.id}` }]}
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': `Best Free ${category.name} Tools 2026`,
            'description': category.description,
            'url': `${SITE_URL}/${category.id}`,
            'mainEntity': {
              '@type': 'ItemList',
              'numberOfItems': filtered.length,
              'itemListElement': filtered.slice(0, 10).map((t, i) => ({
                '@type': 'ListItem',
                'position': i + 1,
                'name': t.name,
                'url': `${SITE_URL}/tools/${t.id}`,
              })),
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': category.faqs.map(f => ({
              '@type': 'Question',
              'name': f.question,
              'acceptedAnswer': { '@type': 'Answer', 'text': f.answer },
            })),
          },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-10 font-mono">
          <Link to="/" className="hover:text-[#00ffaa] transition-colors">home</Link>
          <span>/</span>
          <span className="text-white">{category.id}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.15)', color: C.neon }}>
                <IconMap name={category.icon} size={24} />
              </div>
              <span className="text-xs font-mono" style={{ color: C.neon }}>{category.toolCount}+ tools</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>{category.name}</h1>
            <p className="text-gray-500 max-w-2xl leading-relaxed">{category.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color: C.neon }} />
            {(['all', 'self-hostable', 'open-source'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: filter === f ? 'rgba(0,255,170,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filter === f ? 'rgba(0,255,170,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: filter === f ? C.neon : '#6b7280',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            {filtered.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600 font-mono">No tools match this filter</div>
        )}

        {/* Pillar content */}
        <div className="p-8 lg:p-12 rounded-3xl" style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: 'Syne' }}>About {category.name}</h2>
          <div className="prose-dark">
            <ReactMarkdown>{category.pillarContent}</ReactMarkdown>
          </div>
          {category.faqs.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: 'Syne' }}>Common Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.faqs.map((f, i) => (
                  <div key={i} className="p-5 rounded-2xl" style={{ background: C.surface2, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <h4 className="font-bold text-white mb-2 text-sm" style={{ fontFamily: 'Syne' }}>{f.question}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Tool Page ────────────────────────────────────────────────────
const ToolPage = () => {
  const { toolId } = useParams();
  const tool = TOOLS.find(t => t.id === toolId);
  const [copied, setCopied] = useState(false);

  if (!tool) return <div className="pt-40 text-center text-gray-500">Tool not found</div>;

  const copyGuide = () => {
    if (tool.selfHostingGuide) {
      navigator.clipboard.writeText(tool.selfHostingGuide);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pt-32 pb-20">
      <SEO
        title={`${tool.name}: Free ${CATEGORIES.find(c => c.id === tool.category)?.name} Tool 2026 | Self-Hosting Guide`}
        description={`${tool.seoDescription} Complete self-hosting guide, Docker setup, alternatives, and comparison for 2026.`}
        keywords={`${tool.name}, ${tool.name} self hosting, ${tool.name} docker, ${tool.name} alternative, ${tool.name} free, open source ${tool.name}, ${tool.name} vs, best ${CATEGORIES.find(c => c.id === tool.category)?.name?.toLowerCase()} tool`}
        canonical={`${SITE_URL}/tools/${tool.id}`}
        ogType="product"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: CATEGORIES.find(c => c.id === tool.category)?.name ?? tool.category, url: `/${tool.category}` },
          { name: tool.name, url: `/tools/${tool.id}` },
        ]}
        datePublished="2026-01-01"
        dateModified={new Date().toISOString().split('T')[0]}
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': tool.name,
            'description': tool.description,
            'url': tool.website,
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'All',
            'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
            'isAccessibleForFree': true,
            'license': tool.license === 'open-source' ? 'https://opensource.org/licenses' : undefined,
            'featureList': tool.features,
            'screenshot': DEFAULT_OG_IMAGE,
            'publisher': { '@type': 'Organization', 'name': 'Freemium Services', 'url': SITE_URL },
          },
          ...(tool.selfHostingGuide ? [{
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            'name': `How to Self-Host ${tool.name} with Docker`,
            'description': `Step-by-step guide to deploy ${tool.name} on your own server or VPS using Docker.`,
            'step': [
              { '@type': 'HowToStep', 'name': 'Install Docker', 'text': 'Install Docker and Docker Compose on your server or VPS.' },
              { '@type': 'HowToStep', 'name': `Pull ${tool.name} image`, 'text': `Pull the official ${tool.name} Docker image from the registry.` },
              { '@type': 'HowToStep', 'name': 'Run the container', 'text': `Run the ${tool.name} Docker container with the appropriate environment variables and volume mounts.` },
              { '@type': 'HowToStep', 'name': 'Configure SSL', 'text': 'Set up a reverse proxy with Nginx or Caddy and enable SSL via Let\'s Encrypt.' },
            ],
            'supply': [{ '@type': 'HowToSupply', 'name': 'VPS or dedicated server' }, { '@type': 'HowToSupply', 'name': 'Docker installed' }],
            'tool': [{ '@type': 'HowToTool', 'name': 'Docker' }, { '@type': 'HowToTool', 'name': 'Docker Compose' }],
          }] : []),
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': tool.faqs.map(f => ({
              '@type': 'Question',
              'name': f.question,
              'acceptedAnswer': { '@type': 'Answer', 'text': f.answer },
            })),
          },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-10 font-mono">
          <Link to="/" className="hover:text-[#00ffaa] transition-colors">home</Link>
          <span>/</span>
          <Link to={`/${tool.category}`} className="hover:text-[#00ffaa] transition-colors">{tool.category}</Link>
          <span>/</span>
          <span className="text-white">{tool.id}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {/* Hero */}
            <div className="p-8 rounded-3xl relative overflow-hidden" style={{ background: C.surface, border: '1px solid rgba(0,255,170,0.12)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 0% 0%, rgba(0,255,170,0.04) 0%, transparent 60%)' }} />
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.2)', color: C.neon }}>
                    <IconMap name={CATEGORIES.find(c => c.id === tool.category)?.icon} size={28} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Syne' }}>{tool.name}</h1>
                      {tool.stars && (
                        <span className="flex items-center gap-1 text-xs font-mono text-gray-500">
                          <Star size={12} /> {tool.stars}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <LicenseBadge license={tool.license} />
                      {tool.selfHostable && (
                        <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(0,212,255,0.1)', color: C.plasma, border: '1px solid rgba(0,212,255,0.2)' }}>
                          <Shield size={10} /> Self-Hostable
                        </span>
                      )}
                      {tool.badge && (
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(255,184,0,0.1)', color: C.amber, border: '1px solid rgba(255,184,0,0.2)' }}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg">{tool.description}</p>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Syne' }}>Key Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tool.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.neon }} />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Syne' }}>Use Cases</h2>
              <div className="flex flex-wrap gap-3">
                {tool.useCases.map((u, i) => (
                  <span key={i} className="px-4 py-2 rounded-xl text-sm text-gray-400"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    {u}
                  </span>
                ))}
              </div>
            </div>

            {/* Self-hosting guide */}
            {tool.selfHostingGuide && (
              <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: '1px solid rgba(0,255,170,0.15)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ background: 'rgba(0,255,170,0.04)', borderBottom: '1px solid rgba(0,255,170,0.1)' }}>
                  <div className="flex items-center gap-2">
                    <Terminal size={16} style={{ color: C.neon }} />
                    <h2 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne' }}>Self-Hosting Guide</h2>
                  </div>
                  <button onClick={copyGuide} className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(0,255,170,0.08)', color: copied ? C.neon : '#6b7280', border: '1px solid rgba(0,255,170,0.1)' }}>
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <div className="p-6 prose-dark overflow-x-auto">
                  <ReactMarkdown>{tool.selfHostingGuide}</ReactMarkdown>
                </div>
                <div className="p-6 pt-0">
                  <div className="p-5 rounded-2xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-sm" style={{ color: C.plasma, fontFamily: 'Syne' }}>
                      <Cpu size={14} /> Skip the setup — Deploy on TurboQuant
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">One-click deployment of {tool.name} on decentralized edge nodes. Better performance, lower cost.</p>
                    <a href="https://turboquant.network"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(0,212,255,0.1)', color: C.plasma, border: '1px solid rgba(0,212,255,0.2)', fontFamily: 'Syne' }}>
                      Deploy Now <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Alternatives */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Syne' }}>Alternatives</h2>
              <div className="flex flex-wrap gap-3">
                {tool.alternatives.map((a, i) => (
                  <span key={i} className="px-4 py-2 rounded-xl text-sm text-gray-500 transition-colors hover:text-gray-300"
                    style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Syne' }}>FAQ</h2>
              <div className="space-y-4">
                {tool.faqs.map((f, i) => (
                  <div key={i} className="p-5 rounded-2xl" style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="font-bold text-white mb-2 text-sm" style={{ fontFamily: 'Syne' }}>{f.question}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-5">
              <div className="p-6 rounded-2xl" style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-white mb-5 text-sm" style={{ fontFamily: 'Syne' }}>Quick Links</h3>
                <div className="space-y-3">
                  <a href={tool.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, rgba(0,255,170,0.12), rgba(0,212,255,0.08))', border: '1px solid rgba(0,255,170,0.2)', color: '#fff', fontFamily: 'Syne' }}>
                    Visit Website <ExternalLink size={16} />
                  </a>
                  {tool.github && (
                    <a href={tool.github} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-4 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontFamily: 'Syne' }}>
                      <span className="flex items-center gap-2"><Github size={16} /> View on GitHub</span>
                      {tool.stars && <span className="text-xs font-mono flex items-center gap-1"><Star size={10} /> {tool.stars}</span>}
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: 'rgba(0,255,170,0.04)', border: '1px solid rgba(0,255,170,0.1)' }}>
                <h3 className="font-bold mb-3 text-sm" style={{ color: C.neon, fontFamily: 'Syne' }}>AI Stack Advisor</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">Need help deciding? Our Claude-powered assistant recommends the best tools for your specific use case.</p>
                <button onClick={() => document.querySelector<HTMLButtonElement>('.fixed.bottom-6 button')?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.2)', color: C.neon, fontFamily: 'Syne' }}>
                  <MessageSquare size={16} /> Ask the AI
                </button>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: C.surface2, border: '1px solid rgba(255,255,255,0.04)' }}>
                <h3 className="font-bold text-white mb-4 text-sm" style={{ fontFamily: 'Syne' }}>In This Category</h3>
                <div className="space-y-2">
                  {TOOLS.filter(t => t.category === tool.category && t.id !== tool.id).slice(0, 4).map(t => (
                    <Link key={t.id} to={`/tools/${t.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl text-sm text-gray-500 hover:text-white transition-colors hover:bg-white/5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,255,170,0.08)', color: C.neon }}>
                        <IconMap name={CATEGORIES.find(c => c.id === t.category)?.icon} size={12} />
                      </div>
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Comparison Page ───────────────────────────────────────────────
const ComparisonPage = () => {
  const { comparisonId } = useParams();
  const comp = COMPARISONS.find(c => c.id === comparisonId);
  if (!comp) return <div className="pt-40 text-center text-gray-500">Comparison not found</div>;

  return (
    <div className="pt-32 pb-20">
      <SEO
        title={`${comp.toolA} vs ${comp.toolB}: Which is Better in 2026? Full Comparison`}
        description={`${comp.toolA} vs ${comp.toolB} — detailed feature comparison, pricing, self-hosting, performance benchmarks, and expert verdict for 2026. Which tool wins?`}
        keywords={`${comp.toolA} vs ${comp.toolB}, ${comp.toolA} alternative, ${comp.toolB} alternative, ${comp.toolA} vs ${comp.toolB} 2026, best ${comp.toolA} comparison, open source comparison`}
        canonical={`${SITE_URL}/compare/${comp.id}`}
        ogType="article"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: `${comp.toolA} vs ${comp.toolB}`, url: `/compare/${comp.id}` },
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': `${comp.toolA} vs ${comp.toolB}: Which is Better in 2026?`,
          'description': `Detailed comparison of ${comp.toolA} vs ${comp.toolB} including features, pricing, self-hosting options, and expert verdict.`,
          'datePublished': '2026-01-01',
          'dateModified': new Date().toISOString().split('T')[0],
          'author': { '@type': 'Organization', 'name': 'Freemium Services', 'url': SITE_URL },
          'publisher': { '@type': 'Organization', 'name': 'Freemium Services', 'logo': { '@type': 'ImageObject', 'url': `${SITE_URL}/logo.png` } },
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-10 font-mono">
          <Link to="/" className="hover:text-[#00ffaa] transition-colors">home</Link>
          <span>/</span>
          <span className="text-white">{comp.toolA}-vs-{comp.toolB}</span>
        </nav>

        <div className="text-center mb-16">
          <p className="text-xs font-mono mb-4" style={{ color: C.amber }}>// HEAD_TO_HEAD</p>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 text-white" style={{ fontFamily: 'Syne' }}>
            {comp.toolA} <span style={{ color: C.amber }}>vs</span> {comp.toolB}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Which is better in 2026? We break down features, pricing, and self-hosting to help you decide.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[{ name: comp.toolA, pros: comp.prosA, color: C.neon }, { name: comp.toolB, pros: comp.prosB, color: C.plasma }].map((side) => (
            <div key={side.name} className="p-8 rounded-3xl" style={{ background: C.surface, border: `1px solid ${side.color}20` }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: side.color, fontFamily: 'Syne' }}>Why {side.name}?</h2>
              <ul className="space-y-4">
                {side.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0"
                      style={{ background: `${side.color}18`, color: side.color }}>
                      <Zap size={11} fill={side.color} />
                    </div>
                    <span className="text-gray-400 text-sm leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Feature table */}
        <div className="rounded-3xl overflow-hidden mb-12" style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-8 py-5 flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="flex-1 text-xs font-mono text-gray-600 uppercase tracking-widest">Feature</span>
            <span className="w-32 text-center text-sm font-bold" style={{ color: C.neon, fontFamily: 'Syne' }}>{comp.toolA}</span>
            <span className="w-32 text-center text-sm font-bold" style={{ color: C.plasma, fontFamily: 'Syne' }}>{comp.toolB}</span>
          </div>
          {comp.features.map((f, i) => (
            <div key={i} className="flex items-center px-8 py-4 hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < comp.features.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span className="flex-1 text-gray-400 text-sm">{f.name}</span>
              <div className="w-32 text-center">
                {typeof f.valA === 'boolean'
                  ? f.valA ? <Zap size={16} style={{ color: C.neon }} fill={C.neon} className="mx-auto" />
                    : <X size={16} className="text-gray-700 mx-auto" />
                  : <span className="text-xs font-mono text-gray-400">{f.valA}</span>}
              </div>
              <div className="w-32 text-center">
                {typeof f.valB === 'boolean'
                  ? f.valB ? <Zap size={16} style={{ color: C.plasma }} fill={C.plasma} className="mx-auto" />
                    : <X size={16} className="text-gray-700 mx-auto" />
                  : <span className="text-xs font-mono text-gray-400">{f.valB}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div className="p-8 rounded-3xl mb-8" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}>
          <h2 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Syne' }}>
            <span style={{ color: C.amber }}>⚡</span> Final Verdict
          </h2>
          <p className="text-gray-400 leading-relaxed text-lg">{comp.verdict}</p>
        </div>

        <div className="text-center">
          <a href="https://turboquant.network"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,170,0.15), rgba(0,212,255,0.1))', border: '1px solid rgba(0,255,170,0.25)', color: '#fff', fontFamily: 'Syne' }}>
            Deploy Either Tool on TurboQuant <Cpu size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Knowledge Hub ────────────────────────────────────────────────
const KnowledgeHubPage = () => (
  <div className="pt-32 pb-20">
    <SEO
      title="Knowledge Hub: Self-Hosting, AI & Open-Source Guides 2026 | Freemium Services"
      description="Free technical guides on self-hosting, RAG pipelines, AI agents, vector databases, DePIN compute, and open-source software. Step-by-step tutorials for developers."
      keywords="self hosting guide 2026, RAG pipeline tutorial, AI agents open source, vector database guide, DePIN compute, open source developer guides, how to self host AI, Docker self hosting"
      canonical={`${SITE_URL}/quickstart`}
      breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Knowledge Hub', url: '/quickstart' }]}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-14">
        <p className="text-xs font-mono mb-4" style={{ color: C.neon }}>// KNOWLEDGE_HUB</p>
        <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>Knowledge Hub</h1>
        <p className="text-gray-500 max-w-xl">Deep technical guides on AI, self-hosting, RAG, and the open-source ecosystem.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {KNOWLEDGE_HUB.map((art, i) => (
          <Link key={art.id} to={`/knowledge/${art.id}`}
            className="group block p-8 rounded-2xl transition-all duration-300 neon-card gradient-border"
            style={{ background: C.surface }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-5"
              style={{ background: `rgba(${[0,1,2,3][i % 4] === 0 ? '0,255,170' : [0,1,2,3][i % 4] === 1 ? '0,212,255' : [0,1,2,3][i % 4] === 2 ? '255,184,0' : '0,255,170'},0.1)`, color: i % 4 === 0 ? C.neon : i % 4 === 1 ? C.plasma : C.amber }}>
              <Hash size={16} />
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-[#00ffaa] transition-colors mb-3 leading-snug" style={{ fontFamily: 'Syne' }}>
              {art.title}
            </h2>
            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-5">
              {art.content.replace(/^#+\s.+\n/gm, '').replace(/\*\*/g, '').replace(/\n/g, ' ').replace(/```[\s\S]*?```/g, '[code block]').slice(0, 150)}…
            </p>
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.neon }}>
              Read guide <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

// ─── Article Page ─────────────────────────────────────────────────
const ArticlePage = () => {
  const { articleId } = useParams();
  const article = KNOWLEDGE_HUB.find(a => a.id === articleId);
  if (!article) return <div className="pt-40 text-center text-gray-500">Article not found</div>;

  return (
    <div className="pt-32 pb-20">
      <SEO
        title={article.seoTitle}
        description={article.seoDescription}
        keywords={`${article.title.toLowerCase()}, open source guide, self hosting tutorial, AI tools 2026, developer guide`}
        canonical={`${SITE_URL}/knowledge/${article.id}`}
        ogType="article"
        datePublished="2026-01-15"
        dateModified={new Date().toISOString().split('T')[0]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Knowledge Hub', url: '/quickstart' },
          { name: article.title, url: `/knowledge/${article.id}` },
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          'headline': article.seoTitle,
          'description': article.seoDescription,
          'datePublished': '2026-01-15',
          'dateModified': new Date().toISOString().split('T')[0],
          'author': { '@type': 'Organization', 'name': 'Freemium Services', 'url': SITE_URL },
          'publisher': {
            '@type': 'Organization',
            'name': 'Freemium Services',
            'logo': { '@type': 'ImageObject', 'url': `${SITE_URL}/logo.png` },
          },
          'mainEntityOfPage': { '@type': 'WebPage', '@id': `${SITE_URL}/knowledge/${article.id}` },
          'image': DEFAULT_OG_IMAGE,
          'proficiencyLevel': 'Expert',
        }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-gray-600 mb-10 font-mono">
          <Link to="/" className="hover:text-[#00ffaa] transition-colors">home</Link>
          <span>/</span>
          <Link to="/quickstart" className="hover:text-[#00ffaa] transition-colors">knowledge</Link>
          <span>/</span>
          <span className="text-white">{article.id}</span>
        </nav>
        <h1 className="text-4xl lg:text-5xl font-black text-white mb-10 leading-tight" style={{ fontFamily: 'Syne' }}>{article.title}</h1>
        <div className="prose-dark">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
        <div className="mt-16 p-8 rounded-3xl" style={{ background: C.surface, border: '1px solid rgba(0,212,255,0.15)' }}>
          <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Syne' }}>Deploy What You Learned on TurboQuant</h3>
          <p className="text-gray-500 text-sm mb-6">Turn these guides into running infrastructure with one-click TurboQuant DePIN deployments.</p>
          <a href="https://turboquant.network"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: C.plasma, fontFamily: 'Syne' }}>
            Get Started <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Directory ────────────────────────────────────────────────────
const DirectoryPage = () => (
  <div className="pt-32 pb-20">
    <SEO title="Full Tool Directory | Freemium Services" description="Browse the complete directory of freemium and open-source tools with self-hosting guides." />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-14">
        <p className="text-xs font-mono mb-4" style={{ color: C.neon }}>// FULL_DIRECTORY</p>
        <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>Full Directory</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { title: 'Categories', icon: <Layers size={18} />, items: CATEGORIES.map(c => ({ label: `${c.name} (${c.toolCount}+)`, to: `/${c.id}` })) },
          { title: 'Tools', icon: <Box size={18} />, items: TOOLS.map(t => ({ label: t.name, to: `/tools/${t.id}` })) },
          { title: 'Comparisons', icon: <SortAsc size={18} />, items: COMPARISONS.map(c => ({ label: `${c.toolA} vs ${c.toolB}`, to: `/compare/${c.id}` })) },
        ].map(section => (
          <div key={section.title}>
            <h2 className="flex items-center gap-2 text-xl font-bold mb-8" style={{ color: C.neon, fontFamily: 'Syne' }}>
              {section.icon} {section.title}
            </h2>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i}>
                  <Link to={item.to}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00ffaa] transition-colors animated-underline">
                    <ChevronRight size={12} /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── AI Kanban Page ───────────────────────────────────────────────
const KANBAN_COLS = ['Backlog', 'Researching', 'Testing', 'Deployed'];
const INITIAL_CARDS: { id: number; col: string; title: string; tag: string; color: string }[] = [
  { id: 1, col: 'Backlog',     title: 'Set up Ollama + Open WebUI', tag: 'AI', color: C.neon },
  { id: 2, col: 'Backlog',     title: 'Evaluate n8n vs Activepieces', tag: 'Automation', color: C.plasma },
  { id: 3, col: 'Researching', title: 'Qdrant vector DB integration', tag: 'RAG', color: C.amber },
  { id: 4, col: 'Researching', title: 'Coolify PaaS on Hetzner VPS', tag: 'Infra', color: C.neon },
  { id: 5, col: 'Testing',     title: 'Dify AI agent workflow', tag: 'Agents', color: C.plasma },
  { id: 6, col: 'Deployed',    title: 'SearXNG private search', tag: 'Privacy', color: C.neon },
  { id: 7, col: 'Deployed',    title: 'Vaultwarden password manager', tag: 'Security', color: C.amber },
];

const AIKanbanPage = () => {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const nextId = useRef(INITIAL_CARDS.length + 1);

  const generateCards = useCallback(async () => {
    if (!input.trim() || loading) return;
    const goal = input.trim();
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are an AI that generates Kanban task cards for self-hosted open-source tool stacks. Given a goal, return ONLY a JSON array (no markdown, no explanation) of 4-6 task objects. Each object: { "title": string (max 50 chars), "col": one of ["Backlog","Researching","Testing","Deployed"], "tag": string (one word category like AI/Infra/RAG/Privacy/Agents), "color": one of ["#00ffaa","#00d4ff","#ffb800"] }. Spread across columns realistically.',
          messages: [{ role: 'user', content: `Generate Kanban tasks for: ${goal}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as { title: string; col: string; tag: string; color: string }[];
      const newCards = parsed.map(c => ({ ...c, id: nextId.current++ }));
      setCards(prev => [...prev, ...newCards]);
    } catch {
      // fallback silently
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const moveCard = (id: number, newCol: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, col: newCol } : c));
  };

  const deleteCard = (id: number) => setCards(prev => prev.filter(c => c.id !== id));

  return (
    <div className="pt-32 pb-20">
      <SEO
        title="AI Stack Planner — Kanban Board for Open-Source Tools | Freemium Services"
        description="Plan your self-hosted open-source infrastructure with an AI-generated Kanban board. Describe your goal and Claude creates a step-by-step deployment roadmap."
        keywords="AI kanban board, open source stack planner, self hosting kanban, AI project planner, infrastructure planning tool, open source infrastructure, self hosted stack"
        canonical={`${SITE_URL}/ai-kanban`}
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'AI Stack Planner', url: '/ai-kanban' }]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 relative overflow-hidden p-10 lg:p-16 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,170,0.06), rgba(0,212,255,0.04))', border: '1px solid rgba(0,255,170,0.15)' }}>
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-mono mb-4" style={{ color: C.neon }}>// AI_KANBAN_BOARD</p>
            <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>
              Stack Planner <span style={{ color: C.neon }}>AI</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Describe your infrastructure goal and let Claude generate a Kanban roadmap for your open-source self-hosted stack.
            </p>
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateCards()}
                placeholder="e.g. Build a private AI workspace for my team…"
                className="flex-1 px-5 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'DM Sans' }}
              />
              <button onClick={generateCards} disabled={loading}
                className="px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: 'rgba(0,255,170,0.15)', border: '1px solid rgba(0,255,170,0.3)', color: C.neon, fontFamily: 'Syne' }}>
                {loading ? (
                  <span className="flex gap-1">{[0,0.15,0.3].map((d,i) => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C.neon, animationDelay: `${d}s` }} />)}</span>
                ) : <><Bot size={16} /> Generate</>}
              </button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => (
            <div key={col}
              className="rounded-2xl p-4 min-h-[400px] transition-all"
              style={{
                background: dragOver === col ? 'rgba(0,255,170,0.04)' : C.surface,
                border: `1px solid ${dragOver === col ? 'rgba(0,255,170,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(col); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => { if (dragging !== null) { moveCard(dragging, col); setDragging(null); setDragOver(null); } }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Syne' }}>{col}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}>
                  {cards.filter(c => c.col === col).length}
                </span>
              </div>
              <div className="space-y-3">
                {cards.filter(c => c.col === col).map(card => (
                  <div key={card.id}
                    draggable
                    onDragStart={() => setDragging(card.id)}
                    onDragEnd={() => setDragging(null)}
                    className="group p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.07)`,
                      borderLeft: `3px solid ${card.color}`,
                      opacity: dragging === card.id ? 0.4 : 1,
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-300 leading-snug flex-1">{card.title}</p>
                      <button onClick={() => deleteCard(card.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 flex-shrink-0 mt-0.5">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                        style={{ background: `${card.color}15`, color: card.color }}>
                        {card.tag}
                      </span>
                      <div className="flex gap-1">
                        {KANBAN_COLS.filter(c => c !== col).map(c => (
                          <button key={c} onClick={() => moveCard(card.id, c)}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                            {c.slice(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {cards.filter(c => c.col === col).length === 0 && (
                  <div className="text-center py-12 text-gray-700 text-xs font-mono border-2 border-dashed rounded-xl"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-700 text-xs font-mono mt-6">
          Drag cards between columns · Click × to remove · Press Enter to generate new tasks
        </p>
      </div>
    </div>
  );
};

// ─── IDEs Page ────────────────────────────────────────────────────
const IDES = [
  { name: 'Cursor', tagline: 'The AI-native code editor built on VS Code', desc: 'Cursor ships with Tab autocomplete, inline edits, a multi-file Composer agent, and background AI tasks. The best out-of-box AI IDE in 2026.', badge: 'Most Popular', color: C.neon, link: 'https://cursor.sh', free: '2,000 completions/mo', paid: '$20/mo', openSource: false },
  { name: 'Zed', tagline: 'High-performance editing at the speed of thought', desc: 'GPU-accelerated editor written in Rust. Native Claude, GPT, and Ollama support. Real-time collaboration and remote dev built in. Blazing fast on any codebase.', badge: 'Open Source', color: C.plasma, link: 'https://zed.dev', free: 'Free + BYOK', paid: 'Free', openSource: true },
  { name: 'VS Code + Cline', tagline: 'The open-source agentic coding extension', desc: 'Cline turns VS Code into an agent that reads your codebase, writes files, runs terminal commands, and completes full tasks. Bring any OpenAI-compatible API.', badge: 'Flexible', color: C.amber, link: 'https://github.com/cline/cline', free: 'Unlimited (bring API key)', paid: 'Free', openSource: true },
  { name: 'Windsurf', tagline: 'Agentic IDE with Cascade deep-context agent', desc: 'Codeium\'s Windsurf editor features the Cascade agentic system with deep codebase awareness and multi-step task execution. Strong alternative to Cursor.', badge: 'New', color: C.neon, link: 'https://codeium.com/windsurf', free: 'Free tier available', paid: '$15/mo', openSource: false },
];

const CLI_TOOLS = [
  { name: 'Claude Code', desc: 'Anthropic\'s official agentic CLI. Reads your entire codebase, implements features end-to-end, writes tests, and handles multi-file refactors. The most capable coding CLI.', link: '/tools/claude-code', internal: true, badge: 'Agentic', color: C.neon },
  { name: 'Aider', desc: 'Chat with your codebase from the terminal. Supports GPT-4, Claude, Gemini, and local Ollama models. Git-native with automatic commits.', link: 'https://aider.chat', internal: false, color: C.plasma },
  { name: 'Warp', desc: 'AI-native terminal with natural language command generation, smart completions, and team-shared runbooks. Replaces iTerm + zsh plugins.', link: 'https://warp.dev', internal: false, color: C.amber },
  { name: 'GitHub Copilot CLI', desc: 'gh copilot suggest translates natural language into shell commands. Free for open-source contributors. Integrates with the gh CLI.', link: 'https://githubnext.com/projects/copilot-cli', internal: false, color: C.plasma },
];

const IDEsPage = () => (
  <div className="pt-32 pb-20">
    <SEO
      title="Best AI Code Editors & IDEs 2026: Cursor, Zed, Cline, Windsurf Compared"
      description="Compare the top AI-powered code editors in 2026: Cursor, Zed, VS Code + Cline, and Windsurf. Includes free tier breakdown, open-source status, and CLI tools like Claude Code and Aider."
      keywords="best AI IDE 2026, Cursor vs Zed, AI code editor free, Windsurf IDE, VS Code AI extension, Claude Code CLI, Cline VS Code, Aider AI, open source AI IDE, free AI coding assistant"
      canonical={`${SITE_URL}/ides`}
      breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'AI IDEs & Coding Tools', url: '/ides' }]}
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Best AI Code Editors & IDEs 2026: Complete Guide',
        'description': 'Compare the top AI-powered IDEs including Cursor, Zed, VS Code + Cline, and Windsurf with free tier details and feature comparison.',
        'datePublished': '2026-01-01',
        'dateModified': new Date().toISOString().split('T')[0],
        'author': { '@type': 'Organization', 'name': 'Freemium Services', 'url': SITE_URL },
      }}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-14">
        <p className="text-xs font-mono mb-4" style={{ color: C.neon }}>// AI_IDES_2026</p>
        <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>AI IDEs & Coding Tools</h1>
        <p className="text-gray-500 max-w-2xl">The definitive 2026 guide to AI-powered editors, agents, and CLI tools for developers.</p>
      </div>

      {/* IDE Grid */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2" style={{ fontFamily: 'Syne' }}>
          <Code size={20} style={{ color: C.neon }} /> AI Code Editors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {IDES.map((ide, i) => (
            <motion.div key={ide.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <a href={ide.link} target="_blank" rel="noopener noreferrer"
                className="group block p-7 rounded-2xl transition-all duration-300 neon-card gradient-border h-full"
                style={{ background: C.surface }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#00ffaa] transition-colors" style={{ fontFamily: 'Syne' }}>{ide.name}</h3>
                      {ide.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{ background: `${ide.color}15`, color: ide.color, border: `1px solid ${ide.color}30` }}>
                          {ide.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: ide.color }}>{ide.tagline}</p>
                  </div>
                  <ExternalLink size={14} className="text-gray-600 group-hover:text-[#00ffaa] transition-colors mt-1 flex-shrink-0" />
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{ide.desc}</p>
                <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs">
                    <span className="text-gray-600 font-mono">Free: </span>
                    <span className="text-gray-400">{ide.free}</span>
                  </div>
                  {ide.openSource && (
                    <span className="flex items-center gap-1 text-xs font-mono" style={{ color: C.neon }}>
                      <Github size={10} /> Open Source
                    </span>
                  )}
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CLI Tools */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2" style={{ fontFamily: 'Syne' }}>
          <Terminal size={20} style={{ color: C.plasma }} /> CLI & Terminal Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CLI_TOOLS.map((tool, i) => (
            <motion.div key={tool.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              {tool.internal ? (
                <Link to={tool.link}
                  className="group block p-7 rounded-2xl transition-all duration-300 h-full"
                  style={{ background: C.surface2, border: `1px solid ${tool.color}20` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-[#00ffaa] transition-colors" style={{ fontFamily: 'Syne' }}>{tool.name}</h3>
                      {tool.badge && <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${tool.color}15`, color: tool.color }}>{tool.badge}</span>}
                    </div>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-[#00ffaa] transition-colors" />
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{tool.desc}</p>
                </Link>
              ) : (
                <a href={tool.link} target="_blank" rel="noopener noreferrer"
                  className="group block p-7 rounded-2xl transition-all duration-300 h-full"
                  style={{ background: C.surface2, border: `1px solid ${tool.color}20` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#00ffaa] transition-colors" style={{ fontFamily: 'Syne' }}>{tool.name}</h3>
                    <ExternalLink size={14} className="text-gray-600 group-hover:text-[#00ffaa] transition-colors" />
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{tool.desc}</p>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: 'Syne' }}>Quick Comparison</h2>
        <div className="rounded-2xl overflow-x-auto" style={{ background: C.surface, border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Editor', 'Free Tier', 'Open Source', 'Best For', 'Model Flexibility'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-mono text-gray-600 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Cursor', free: '2k completions', os: false, best: 'Solo devs', flex: 'Limited' },
                { name: 'Zed', free: 'Free + BYOK', os: true, best: 'Performance', flex: 'High' },
                { name: 'VS Code + Cline', free: 'Unlimited (BYOK)', os: true, best: 'Power users', flex: 'Any API' },
                { name: 'Windsurf', free: 'Limited free', os: false, best: 'Agentic tasks', flex: 'Medium' },
              ].map(r => (
                <tr key={r.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white" style={{ fontFamily: 'Syne' }}>{r.name}</td>
                  <td className="px-6 py-4 text-gray-400">{r.free}</td>
                  <td className="px-6 py-4">{r.os ? <Zap size={14} style={{ color: C.neon }} fill={C.neon} /> : <X size={14} className="text-gray-700" />}</td>
                  <td className="px-6 py-4 text-gray-400">{r.best}</td>
                  <td className="px-6 py-4 text-gray-400">{r.flex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
);

// ─── Blog Page ────────────────────────────────────────────────────
const BLOG_POSTS = [
  { slug: 'best-free-ai-tools-2026', title: 'Best Free AI Tools for Developers in 2026', excerpt: 'A curated list of zero-cost AI tools that rival their paid counterparts. Covering local inference, coding assistants, and agent frameworks.', category: 'AI Tools', date: 'Apr 02, 2026', readTime: '8 min', color: C.neon },
  { slug: 'self-host-entire-saas-stack', title: 'How to Self-Host Your Entire SaaS Stack for $40/mo', excerpt: 'Step-by-step guide to replacing Zapier, Notion, Typeform, and 10 other SaaS tools with open-source alternatives on a single VPS.', category: 'Self-Hosting', date: 'Mar 28, 2026', readTime: '12 min', color: C.plasma },
  { slug: 'depin-edge-computing-2026', title: 'The Rise of DePIN: Why Decentralized Compute Wins', excerpt: 'How decentralized physical infrastructure networks like TurboQuant are making edge compute accessible, private, and economically viable.', category: 'DePIN', date: 'Mar 22, 2026', readTime: '7 min', color: C.amber },
  { slug: 'rag-production-mistakes', title: '5 RAG Mistakes That Will Kill Your Production App', excerpt: 'From wrong chunk sizes to missing re-rankers — the most common RAG implementation errors and how to fix them before they hit users.', category: 'RAG', date: 'Mar 15, 2026', readTime: '10 min', color: C.neon },
  { slug: 'deepseek-r1-local', title: 'Running DeepSeek-R1 Locally: The Complete Guide', excerpt: 'DeepSeek-R1 matches o1 on reasoning benchmarks and runs on consumer hardware via Ollama. Here is exactly how to set it up.', category: 'AI Tools', date: 'Mar 08, 2026', readTime: '6 min', color: C.plasma },
  { slug: 'n8n-ai-agents-2026', title: 'Building Production AI Agents with n8n in 2026', excerpt: 'n8n\'s native AI agent nodes make it trivial to build autonomous workflows. This guide covers architecture, error handling, and deployment.', category: 'Automation', date: 'Feb 28, 2026', readTime: '11 min', color: C.amber },
];

const BlogPage = () => (
  <div className="pt-32 pb-20">
    <SEO
      title="Open-Source & AI Developer Blog: Self-Hosting Guides, Tutorials 2026"
      description="In-depth tutorials, guides, and expert insights on open-source tools, self-hosting, AI, workflow automation, and DePIN infrastructure for developers in 2026."
      keywords="open source blog, self hosting tutorials, AI tools guide, developer blog 2026, n8n tutorial, Ollama guide, RAG pipeline tutorial, DePIN infrastructure, free AI tools blog"
      canonical={`${SITE_URL}/blog`}
      breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Blog & Guides', url: '/blog' }]}
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'Freemium Services Blog',
        'description': 'Technical guides on open-source tools, self-hosting, AI, and DePIN infrastructure.',
        'url': `${SITE_URL}/blog`,
        'publisher': { '@type': 'Organization', 'name': 'Freemium Services', 'url': SITE_URL },
        'blogPost': BLOG_POSTS.slice(0, 3).map(p => ({
          '@type': 'BlogPosting',
          'headline': p.title,
          'description': p.excerpt,
          'url': `${SITE_URL}/blog/${p.slug}`,
          'datePublished': p.date,
          'author': { '@type': 'Organization', 'name': 'Freemium Services' },
        })),
      }}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-14">
        <p className="text-xs font-mono mb-4" style={{ color: C.neon }}>// BLOG_&_GUIDES</p>
        <h1 className="text-5xl font-black text-white mb-4" style={{ fontFamily: 'Syne' }}>Blog & Guides</h1>
        <p className="text-gray-500 max-w-xl">Tutorials, deep dives, and practical guides for the open-source ecosystem.</p>
      </div>

      {/* Featured post */}
      <div className="mb-10 p-8 lg:p-12 rounded-3xl relative overflow-hidden"
        style={{ background: C.surface, border: '1px solid rgba(0,255,170,0.15)' }}>
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative z-10 max-w-2xl">
          <span className="tag-pill tag-open-source mb-5 inline-flex">Featured</span>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Syne' }}>
            {BLOG_POSTS[0].title}
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">{BLOG_POSTS[0].excerpt}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-600">{BLOG_POSTS[0].date}</span>
            <span className="text-xs font-mono" style={{ color: C.neon }}>{BLOG_POSTS[0].readTime} read</span>
            <span className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.2)', color: C.neon, fontFamily: 'Syne' }}>
              Read Article <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {BLOG_POSTS.slice(1).map((post, i) => (
          <motion.div key={post.slug} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <div className="group block p-6 rounded-2xl cursor-pointer transition-all duration-300 neon-card gradient-border h-full"
              style={{ background: C.surface }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded"
                  style={{ background: `${post.color}10`, color: post.color, border: `1px solid ${post.color}25` }}>
                  {post.category}
                </span>
                <span className="text-xs font-mono text-gray-600">{post.readTime}</span>
              </div>
              <h3 className="font-bold text-white group-hover:text-[#00ffaa] transition-colors mb-3 leading-snug" style={{ fontFamily: 'Syne', fontSize: 15 }}>
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs font-mono text-gray-600">{post.date}</span>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-[#00ffaa] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-16 p-8 lg:p-12 rounded-3xl text-center relative overflow-hidden"
        style={{ background: C.surface, border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 100%, rgba(0,212,255,0.05) 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Syne' }}>Stay in the Loop</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Weekly digest of the best open-source releases, self-hosting guides, and DePIN developments.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button className="px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: C.plasma, fontFamily: 'Syne' }}>
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen" style={{ background: darkMode ? C.void : '#f8fafc', color: darkMode ? '#e2e8f0' : '#0f172a' }}>
          <Header darkMode={darkMode} setDarkMode={setDarkMode} onSearchOpen={() => setSearchOpen(true)} />
          <AnimatePresence>
            {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
          </AnimatePresence>
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/quickstart" element={<KnowledgeHubPage />} />
              <Route path="/knowledge/:articleId" element={<ArticlePage />} />
              <Route path="/compare/:comparisonId" element={<ComparisonPage />} />
              <Route path="/tools/:toolId" element={<ToolPage />} />
              <Route path="/ai-kanban" element={<AIKanbanPage />} />
              <Route path="/ides" element={<IDEsPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/:categoryId" element={<CategoryPage />} />
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
          <Analytics />
        </div>
      </Router>
    </HelmetProvider>
  );
}
