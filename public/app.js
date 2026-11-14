const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playChime(type = 'send') {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'send') {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.1);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'done') {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {}
}

const STORAGE_KEY = 'f0undr_ai_threads';
const ACTIVE_KEY = 'f0undr_ai_active_id';

let threads = [];
let activeThreadId = null;
let isStreaming = false;
let latestCanvasCode = '';

const sidebar = document.getElementById('sidebar');
const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryList = document.getElementById('chatHistoryList');

const messagesContainer = document.getElementById('messagesContainer');
const welcomeHero = document.getElementById('welcomeHero');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const canvasWorkspace = document.getElementById('canvasWorkspace');
const canvasIframe = document.getElementById('canvasIframe');
const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');
const closeCanvasBtn = document.getElementById('closeCanvasBtn');
const refreshCanvasBtn = document.getElementById('refreshCanvasBtn');

function loadThreads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    threads = raw ? JSON.parse(raw) : [];
  } catch {
    threads = [];
  }
  activeThreadId = localStorage.getItem(ACTIVE_KEY);
  if (!threads.length) {
    createNewThread();
  } else if (!threads.some((t) => t.id === activeThreadId)) {
    activeThreadId = threads[0].id;
    localStorage.setItem(ACTIVE_KEY, activeThreadId);
  }
}

function saveThreads() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    if (activeThreadId) localStorage.setItem(ACTIVE_KEY, activeThreadId);
  } catch {}
}

function getActiveThread() {
  let found = threads.find((t) => t.id === activeThreadId);
  if (!found) {
    found = createNewThread();
  }
  return found;
}

function createNewThread() {
  const id = 'chat_' + Date.now();
  const newThread = {
    id,
    title: 'New chat',
    messages: [],
    updatedAt: Date.now()
  };
  threads.unshift(newThread);
  activeThreadId = id;
  saveThreads();
  renderSidebarHistory();
  renderActiveThread();
  return newThread;
}

function deleteThread(id, event) {
  if (event) event.stopPropagation();
  threads = threads.filter((t) => t.id !== id);
  if (activeThreadId === id) {
    if (threads.length) {
      activeThreadId = threads[0].id;
    } else {
      createNewThread();
      return;
    }
  }
  saveThreads();
  renderSidebarHistory();
  renderActiveThread();
}
window.deleteThread = deleteThread;

function switchThread(id) {
  if (isStreaming) return;
  activeThreadId = id;
  saveThreads();
  renderSidebarHistory();
  renderActiveThread();
}
window.switchThread = switchThread;

function renderSidebarHistory() {
  if (!chatHistoryList) return;
  chatHistoryList.innerHTML = '<div class="history-section-title">Recent Chats</div>';
  threads.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (t.id === activeThreadId ? ' active' : '');
    item.onclick = () => switchThread(t.id);

    const left = document.createElement('div');
    left.className = 'history-item-left';
    left.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>${escapeHtml(t.title || 'New chat')}</span>
    `;

    const delBtn = document.createElement('button');
    delBtn.className = 'history-delete-btn';
    delBtn.title = 'Delete conversation';
    delBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    delBtn.onclick = (e) => deleteThread(t.id, e);

    item.appendChild(left);
    item.appendChild(delBtn);
    chatHistoryList.appendChild(item);
  });
}

function renderActiveThread() {
  messagesContainer.innerHTML = '';
  const current = getActiveThread();
  if (!current.messages.length) {
    if (welcomeHero) {
      welcomeHero.style.display = 'block';
      messagesContainer.appendChild(welcomeHero);
    }
    toggleCanvas(false);
    return;
  }

  if (welcomeHero) welcomeHero.style.display = 'none';

  current.messages.forEach((msg) => {
    if (msg.role === 'user') {
      const row = document.createElement('div');
      row.className = 'message-row user';
      row.innerHTML = `<div class="user-bubble">${escapeHtml(msg.content)}</div>`;
      messagesContainer.appendChild(row);
    } else if (msg.role === 'assistant') {
      const row = document.createElement('div');
      row.className = 'message-row';

      const avatar = document.createElement('div');
      avatar.className = 'bot-avatar';
      avatar.textContent = '⚡';

      const content = document.createElement('div');
      content.className = 'bot-content';

      if (msg.thought) {
        const thoughtBox = document.createElement('details');
        thoughtBox.className = 'thought-box';
        thoughtBox.innerHTML = `
          <summary class="thought-summary">
            <span>🧠</span>
            <span>Thought Process</span>
          </summary>
          <div class="thought-content">${escapeHtml(msg.thought)}</div>
        `;
        content.appendChild(thoughtBox);
      }

      const textDiv = document.createElement('div');
      textDiv.className = 'bot-prose';
      textDiv.innerHTML = renderMarkdown(msg.content);
      content.appendChild(textDiv);

      row.appendChild(avatar);
      row.appendChild(content);
      messagesContainer.appendChild(row);
    }
  });

  scrollToBottom();
}

collapseSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.add('collapsed');
  openSidebarBtn.style.display = 'flex';
});

openSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.remove('collapsed');
  openSidebarBtn.style.display = 'none';
});

newChatBtn?.addEventListener('click', () => {
  if (isStreaming) return;
  createNewThread();
  chatInput.focus();
});

function toggleCanvas(forceOpen = null) {
  if (forceOpen !== null) {
    canvasWorkspace.classList.toggle('open', forceOpen);
  } else {
    canvasWorkspace.classList.toggle('open');
  }
}

toggleCanvasBtn?.addEventListener('click', () => toggleCanvas());
closeCanvasBtn?.addEventListener('click', () => toggleCanvas(false));
refreshCanvasBtn?.addEventListener('click', () => {
  if (latestCanvasCode) runInCanvas(latestCanvasCode);
});

window.runInCanvas = function(htmlCode) {
  latestCanvasCode = htmlCode;
  toggleCanvas(true);

  const polyfill = `
  <script>
  (function() {
    var _store = {};
    window.localStorage = {
      getItem: function(k) { return _store[k] || null; },
      setItem: function(k, v) { _store[k] = String(v); },
      removeItem: function(k) { delete _store[k]; },
      clear: function() { _store = {}; }
    };
  })();
  <\/script>`;

  const preparedHtml = htmlCode.includes('<head>')
    ? htmlCode.replace('<head>', '<head>' + polyfill)
    : polyfill + htmlCode;

  canvasIframe.srcdoc = preparedHtml;
};

window.copyCode = function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('pre code');
  const codeText = codeEl ? codeEl.textContent : '';
  navigator.clipboard.writeText(codeText).then(() => {
    const span = btn.querySelector('span');
    const prev = span ? span.textContent : 'Copy';
    if (span) span.textContent = 'Copied!';
    btn.style.color = '#10b981';
    setTimeout(() => {
      if (span) span.textContent = prev;
      btn.style.color = '';
    }, 2000);
  });
};

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

window.askQuick = function(question) {
  chatInput.value = question;
  chatForm.dispatchEvent(new Event('submit'));
};

function appendUserMessage(text) {
  if (welcomeHero) welcomeHero.style.display = 'none';

  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `<div class="user-bubble">${escapeHtml(text)}</div>`;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function createBotMessageContainer() {
  const row = document.createElement('div');
  row.className = 'message-row';

  const avatar = document.createElement('div');
  avatar.className = 'bot-avatar';
  avatar.textContent = '⚡';

  const content = document.createElement('div');
  content.className = 'bot-content';

  const statusPill = document.createElement('div');
  statusPill.className = 'status-pill';
  statusPill.innerHTML = '<span class="pulse-dot"></span><span class="status-text">Thinking</span>';

  const thoughtBox = document.createElement('details');
  thoughtBox.className = 'thought-box';
  thoughtBox.style.display = 'none';
  thoughtBox.innerHTML = `
    <summary class="thought-summary">
      <span>🧠</span>
      <span>Thought Process</span>
    </summary>
    <div class="thought-content"></div>
  `;

  const textDiv = document.createElement('div');
  textDiv.className = 'bot-prose';

  content.appendChild(statusPill);
  content.appendChild(thoughtBox);
  content.appendChild(textDiv);

  row.appendChild(avatar);
  row.appendChild(content);
  messagesContainer.appendChild(row);
  scrollToBottom();

  return { row, statusPill, thoughtBox, textDiv };
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeQuote(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function renderMarkdown(md) {
  let html = escapeHtml(md);

  html = html.replace(/```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/gi, (_, lang, code) => {
    const raw = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    const l = (lang || 'code').toLowerCase();
    const isHtmlApp = l === 'html' || raw.includes('<!DOCTYPE') || raw.includes('<canvas') || raw.includes('<table');

    const previewBtn = isHtmlApp
      ? `<button class="code-btn" onclick="runInCanvas(\`${escapeQuote(raw)}\`)">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
           <span>Run Canvas</span>
         </button>`
      : '';

    return `
      <div class="code-block-wrapper">
        <div class="code-header-bar">
          <span class="code-lang-label">${escapeHtml(l)}</span>
          <div class="code-actions">
            ${previewBtn}
            <button class="code-btn" onclick="copyCode(this)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
        <pre><code class="language-${escapeHtml(l)}">${code.trim()}</code></pre>
      </div>
    `;
  });

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    const headerCols = lines[0].split('|').filter((c) => c.trim());
    let tableHtml = '<table><thead><tr>' + headerCols.map((c) => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';

    for (let i = 2; i < lines.length; i++) {
      const cols = lines[i].split('|').filter((c) => c.trim());
      if (cols.length) {
        tableHtml += '<tr>' + cols.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>';
      }
    }
    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gim, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '<br/><br/>');

  return html;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  isStreaming = true;
  sendBtn.disabled = true;

  playChime('send');
  appendUserMessage(text);

  const currentThread = getActiveThread();
  if (currentThread.messages.length === 0 || currentThread.title === 'New chat') {
    currentThread.title = text.slice(0, 28) + (text.length > 28 ? '...' : '');
    renderSidebarHistory();
  }

  currentThread.messages.push({ role: 'user', content: text });
  currentThread.updatedAt = Date.now();
  saveThreads();

  const botUI = createBotMessageContainer();
  let accumulatedAnswer = '';
  let accumulatedThought = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: currentThread.messages,
        model: 'kortex-1',
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const ev of events) {
        if (!ev.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(ev.slice(6));
          const { event } = payload;

          if (event === 'status') {
            botUI.statusPill.querySelector('.status-text').textContent = payload.text;
          }

          if (event === 'thought' && payload.text) {
            accumulatedThought = payload.text;
            botUI.thoughtBox.style.display = 'block';
            botUI.thoughtBox.querySelector('.thought-content').textContent = accumulatedThought;
          }

          if (event === 'token' && payload.text) {
            accumulatedAnswer += payload.text;
            botUI.textDiv.innerHTML = renderMarkdown(accumulatedAnswer);
            scrollToBottom();
          }

          if (event === 'done') {
            botUI.statusPill.style.display = 'none';
            playChime('done');

            const matchHtml = accumulatedAnswer.match(/```(?:html)?\s*(<!DOCTYPE[\s\S]*?)```/i);
            if (matchHtml && matchHtml[1]) {
              runInCanvas(matchHtml[1].trim());
            }
          }
        } catch {}
      }
    }

    currentThread.messages.push({
      role: 'assistant',
      content: accumulatedAnswer,
      thought: accumulatedThought,
    });
    currentThread.updatedAt = Date.now();
    saveThreads();
  } catch (err) {
    botUI.statusPill.style.display = 'none';
    botUI.textDiv.innerHTML = `<span style="color:#ef4444">Error: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    botUI.statusPill.style.display = 'none';
  }
});

loadThreads();
renderSidebarHistory();
renderActiveThread();
