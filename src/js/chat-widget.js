document.addEventListener('DOMContentLoaded', () => {
  const widgetHtml = `
    <div id="ai-chat-widget" class="ai-widget">
        <div class="ai-header" id="ai-header-toggle">
            <div class="ai-dot"></div>
            <div class="ai-header-text">Claude AI Guide</div>
            <svg id="ai-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
        </div>
        <div class="ai-body" id="ai-chat-body">
            <div class="ai-message system-msg">
                Hi! I'm your AI guide powered by Claude. I can help you understand this tool, find alternatives, or guide you through self-hosting it on Docker or TurboQuant.
            </div>
        </div>
        <div class="ai-input-wrap">
            <input type="text" id="ai-chat-input" class="ai-input" placeholder="Ask about this tool...">
        </div>
    </div>
    <style>
      .ai-widget { position: fixed; bottom: 2rem; right: 2rem; background: var(--surface2, #1A2332); border: 1px solid var(--border, #1E2D40); border-radius: 16px; width: 350px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(calc(100% - 60px)); font-family: 'Inter', sans-serif; }
      .ai-widget.active { transform: translateY(0); }
      .ai-header { padding: 1rem 1.5rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border, #1E2D40); display: flex; align-items: center; cursor: pointer; }
      .ai-dot { width: 10px; height: 10px; background: var(--accent, #00D4FF); border-radius: 50%; margin-right: 1rem; box-shadow: 0 0 10px rgba(0, 212, 255, 0.5); animation: pulse 2s infinite; }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); } 70% { box-shadow: 0 0 0 10px rgba(0,212,255,0); } 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0); } }
      .ai-header-text { font-weight: 600; flex-grow: 1; color: #fff; font-size: 0.95rem; }
      .ai-body { padding: 1.5rem; height: 320px; background: rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
      .ai-message { padding: 1rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.5; }
      .system-msg { background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.2); color: #fff; }
      .user-msg { background: var(--surface, #141C26); color: #fff; align-self: flex-end; border: 1px solid var(--border, #1E2D40); }
      .ai-input-wrap { padding: 1rem; border-top: 1px solid var(--border, #1E2D40); background: var(--bg2, #0D1117); }
      .ai-input { width: 100%; padding: 0.85rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border, #1E2D40); color: #fff; outline: none; transition: border-color 0.2s; }
      .ai-input:focus { border-color: var(--accent, #00D4FF); }
      #ai-chevron { transition: transform 0.3s; color: #fff; }
      .ai-widget.active #ai-chevron { transform: rotate(180deg); }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const widget = document.getElementById('ai-chat-widget');
  const toggleBtn = document.getElementById('ai-header-toggle');
  const input = document.getElementById('ai-chat-input');
  const body = document.getElementById('ai-chat-body');

  toggleBtn.addEventListener('click', () => {
    widget.classList.toggle('active');
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
      const userText = input.value.trim();
      input.value = '';
      
      // Append user message
      body.insertAdjacentHTML('beforeend', \`<div class="ai-message user-msg">\${userText}</div>\`);
      body.scrollTop = body.scrollHeight;

      // Mock AI response
      setTimeout(() => {
        body.insertAdjacentHTML('beforeend', \`<div class="ai-message system-msg">I am a static demo right now, but in production, I would query the Claude API contextually aware that you are viewing this specific tool page!</div>\`);
        body.scrollTop = body.scrollHeight;
      }, 1000);
    }
  });
});
