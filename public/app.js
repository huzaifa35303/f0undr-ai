/**
 * Verdant 1 - by f0undr
 * Clean, natural GPT/Gemini conversational controller.
 * Live Canvas Split-Screen, Web Audio, and zero noisy link pills.
 */

// Procedural Audio Synthesizer
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

// DOM References
const sidebar = document.getElementById('sidebar');
const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const newChatBtn = document.getElementById('newChatBtn');

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

let conversation = [];
let isStreaming = false;
let latestCanvasCode = '';

// Sidebar Toggle
collapseSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.add('collapsed');
  openSidebarBtn.style.display = 'flex';
});

openSidebarBtn?.addEventListener('click', () => {
  sidebar.classList.remove('collapsed');
  openSidebarBtn.style.display = 'none';
});

newChatBtn?.addEventListener('click', () => {
  conversation = [];
  messagesContainer.innerHTML = '';
  if (welcomeHero) {
    welcomeHero.style.display = 'block';
    messagesContainer.appendChild(welcomeHero);
  }
  toggleCanvas(false);
});

// Canvas Runner
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

// Auto-expand textarea
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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(md) {
  let html = escapeHtml(md);

  // HTML Code Blocks & Canvas execution trigger
  html = html.replace(/```(html|xml)?([\s\S]*?)```/gi, (_, lang, code) => {
    const raw = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    if (lang === 'html' || raw.includes('<!DOCTYPE') || raw.includes('<canvas') || raw.includes('<table')) {
      return `<pre><code>${code.trim()}</code></pre>
        <button class="open-canvas-pill" onclick="runInCanvas(\`${escapeQuote(raw)}\`)">
          <span>⚡</span> Open in Live Canvas
        </button>`;
    }
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Markdown tables
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

  // Bullet points
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gim, '<ul>$1</ul>');

  // Paragraph breaks
  html = html.replace(/\n\n/g, '<br/><br/>');

  return html;
}

function escapeQuote(str) {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// Form Submission
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
  conversation.push({ role: 'user', content: text });

  const botUI = createBotMessageContainer();
  let accumulatedAnswer = '';
  let accumulatedThought = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: conversation,
        model: 'verdant-1',
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

    conversation.push({ role: 'assistant', content: accumulatedAnswer });
  } catch (err) {
    botUI.statusPill.style.display = 'none';
    botUI.textDiv.innerHTML = `<span style="color:#ef4444">Error: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    botUI.statusPill.style.display = 'none';
  }
});
