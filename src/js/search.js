(function () {
    // #39 Scroll Progress Bar
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) progressBar.style.width = scrolled + "%";
    });

    // #33 Keyboard Navigation Shortcuts
    let lastKey = null;
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key.toLowerCase();
        if (lastKey === 'g') {
            const routes = {
                'h': '/',
                'd': '/knowledge-hub.html',
                'a': '/category/ai-tools.html',
                's': '/category/self-hosting.html'
            };
            if (routes[key]) {
                e.preventDefault();
                window.location.href = routes[key];
            }
            lastKey = null;
        } else {
            lastKey = key;
            setTimeout(() => { if (lastKey === key) lastKey = null; }, 500);
        }
    });

    let searchIndex = null;
    let fuse = null;
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const trigger = document.getElementById('search-trigger');

    // Detect language from URL path (e.g., /hi/tools/...)
    const pathParts = window.location.pathname.split('/');
    const lang = ['hi', 'ml', 'ta'].includes(pathParts[1]) ? pathParts[1] : 'en';

    async function loadIndex() {
        if (!searchIndex) {
            resultsContainer.innerHTML = '<div class="search-spinner"></div>';
            try {
                const res = await fetch(`/search-index-${lang}.json`);
                searchIndex = await res.json();

                // Initialize Fuse.js for fuzzy search
                fuse = new Fuse(searchIndex, {
                    keys: [
                        { name: 'title', weight: 2.0 },
                        { name: 'category', weight: 0.3 },
                        { name: 'description', weight: 0.1 }
                    ],
                    threshold: 0.2, // Tighter matching (lower is stricter) to favor exact title matches
                    includeScore: true
                });
            } catch (e) {
                console.error('Failed to load search index', e);
            } finally {
                if (input.value === '') {
                    resultsContainer.innerHTML = '';
                }
            }
        }
    }

    function toggleModal(show) {
        if (show) {
            modal.classList.add('active');
            input.focus();
            loadIndex();
        } else {
            modal.classList.remove('active');
            input.value = '';
            resultsContainer.innerHTML = '';
        }
    }

    if (trigger) {
        trigger.addEventListener('click', () => toggleModal(true));
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleModal(true);
        }
        if (e.key === 'Escape') {
            toggleModal(false);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) toggleModal(false);
    });

    resultsContainer.addEventListener('click', (e) => {
        const link = e.target.closest('.search-result-item a');
        if (link) toggleModal(false);
    });

    resultsContainer.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-install');
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();
            const cmd = copyBtn.getAttribute('data-cmd');
            navigator.clipboard.writeText(cmd).then(() => {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                }, 2000);
            });
        }
    });

    let searchTimeout;
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const q = e.target.value.toLowerCase();
            if (!q || !fuse) {
                resultsContainer.innerHTML = '';
                return;
            }

            // Perform fuzzy search
            const results = fuse.search(q);
            if (window.logSearchIntent) window.logSearchIntent(q, results.length);

            const scoredMatches = results.map(result => {
                // Combine Fuse.js score (0-1, lower is better) with our featured boost
                // result.score of 0 means perfect match.
                let customScore = (1 - result.score) * 100;
                if (result.item.isFeatured) customScore += 100;
                // Priority boost for Documentation and category guides
                if (result.item.category === 'Documentation' || result.item.category === 'Guides') customScore += 80;

                return { item: result.item, finalScore: customScore };
            }).sort((a, b) => b.finalScore - a.finalScore);

            const topMatches = scoredMatches.slice(0, 8); // Take top 8

            resultsContainer.innerHTML = topMatches.map(m => {
                const dateStr = m.item.lastmod || '';
                const timeDiff = new Date() - new Date(dateStr);
                const isRecent = dateStr && timeDiff / 86400000 <= 7;
                const isNew = dateStr && timeDiff / 86400000 <= 2;
                const dateClass = isRecent ? 'search-date-recent' : '';
                const newBadge = isNew ? '<span style="background:var(--green); color:var(--bg); font-size:0.6rem; padding:0.1rem 0.4rem; border-radius:4px; font-weight:800; margin-left:0.5rem; vertical-align:middle; display:inline-block;">NEW</span>' : '';

                // Related comparisons suggestion logic
                let comparisonsHtml = '';
                if (!m.item.url && m.item.slug !== 'knowledge-hub') {
                    if (!m.item.alternatives || m.item.alternatives.length === 0) {
                        console.warn(`[Search Suggestor] No alternatives found for tool: ${m.item.slug}. Check tools.json.`);
                    }
                    // Find a competitor: prioritize explicit alternatives, fallback to featured tools in category
                    const competitor = searchIndex.find(other => {
                        if (other.url || other.slug === m.item.slug) return false;

                        const isExplicitAlt = (m.item.alternatives && m.item.alternatives.includes(other.slug)) ||
                            (other.alternatives && other.alternatives.includes(m.item.slug));

                        if (isExplicitAlt) return true;

                        // Fallback to featured in same category
                        return other.category === m.item.category && other.isFeatured;
                    });

                    if (competitor) {
                        const [first, second] = [m.item.slug, competitor.slug].sort();
                        comparisonsHtml = `
                    <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border); font-size: 0.7rem;">
                        <span style="color: var(--text3);">Compare:</span>
                        <a href="/compare/${first}-vs-${second}.html" style="color: var(--accent); text-decoration: none; margin-left: 0.4rem; font-weight: 600;">
                            ${m.item.title.split(' - ')[0]} vs ${competitor.title.split(' - ')[0]} →
                        </a>
                    </div>`;
                    }
                }

                // Quick Guide (Install Command) UI
                let installHtml = '';
                if (m.item.install) {
                    installHtml = `
                <div class="install-wrap" style="position: relative; margin-top: 0.5rem;">
                    <code title="Quick Guide: One-line installation command" style="font-size: 0.65rem; color: var(--green); background: rgba(0,255,136,0.05); padding: 0.4rem 2rem 0.4rem 0.4rem; border-radius: 4px; display: block; border: 1px dashed rgba(0,255,136,0.2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help; font-family: var(--font-mono);">$ ${m.item.install}</code>
                    <button class="copy-install" data-cmd="${m.item.install.replace(/"/g, '&quot;')}" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text3); cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>`;
                }

                return `
      <div class="search-result-item">
        <a href="${m.item.url || `/tools/${m.item.slug}.html`}" style="text-decoration: none; color: inherit; display: block;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4>${m.item.title}${newBadge}</h4>
                <span class="${dateClass}" style="font-size:0.65rem; color:var(--text3); font-family:var(--font-mono);">${dateStr}</span>
            </div>
            <p style="font-size:0.8rem; margin:0.25rem 0 0; color: var(--text2);">${m.item.description}</p>
            ${installHtml}
        </a>
        ${comparisonsHtml}
      </div>
    `}).join('');
        }, 100);
    });
})();