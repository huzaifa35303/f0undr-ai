const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playChime(type = 'send') {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator ? audioCtx.createOscillator() : null;
    const gain = audioCtx.createGain();
    if (!osc) return;
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
const MODEL_STORAGE_KEY = 'f0undr_ai_model';
const TONE_STORAGE_KEY = 'f0undr_tone';
const MEMORY_STORAGE_KEY = 'f0undr_memories';

const MODELS = {
  'kortex-1': {
    name: 'Kortex 1',
    icon: '⚡',
    badge: 'by f0undr',
    tier: 'Kortex 1 Flagship',
    placeholder: 'Ask Kortex 1 anything, search the web, or write code...',
    disclaimer: 'Kortex 1 by f0undr. Built from first principles with zero API keys.'
  },
  'aura-1': {
    name: 'Aura 1',
    icon: '✨',
    badge: 'by f0undr',
    tier: 'Aura 1 Human AI',
    placeholder: 'Talk with Aura 1, brainstorm ideas, or ask anything...',
    disclaimer: 'Aura 1 by f0undr. Built from first principles with zero API keys.'
  },
  'verdant-1': {
    name: 'Verdant 1',
    icon: '🌿',
    badge: 'by f0undr',
    tier: 'Verdant 1 Earth AI',
    placeholder: 'Ask Verdant 1 about living earth systems, science, or simulations...',
    disclaimer: 'Verdant 1 by f0undr. Built from first principles with zero API keys.'
  }
};

const TONES = {
  casual: { name: 'Casual', icon: '💬' },
  direct: { name: 'Direct', icon: '⚡' },
  expert: { name: 'Expert', icon: '🎓' },
  eli5: { name: 'ELI5', icon: '👶' },
  'legal-guardian': { name: 'Legal Guardian', icon: '⚖️' },
  'seo-architect': { name: 'Open SEO', icon: '🌐' },
  'code-reviewer': { name: 'Code Reviewer', icon: '🛠️' }
};

let currentModel = localStorage.getItem(MODEL_STORAGE_KEY) || 'kortex-1';
if (!MODELS[currentModel]) currentModel = 'kortex-1';

let currentTone = localStorage.getItem(TONE_STORAGE_KEY) || 'casual';
if (!TONES[currentTone]) currentTone = 'casual';

let memories = [];
function loadMemories() {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    memories = raw ? JSON.parse(raw) : [];
  } catch {
    memories = [];
  }
  updateMemoryBadge();
}

function saveMemories() {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch {}
  updateMemoryBadge();
}

function updateMemoryBadge() {
  const badge = document.getElementById('memoryCountBadge');
  if (badge) badge.textContent = String(memories.length);
}

let threads = [];
let activeThreadId = null;
let isStreaming = false;
let latestCanvasCode = '';
let activeUtterance = null;
let currentSpeechBtn = null;

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
const voiceInputBtn = document.getElementById('voiceInputBtn');
const disclaimerText = document.querySelector('.disclaimer-text');
const userTier = document.querySelector('.user-tier');

const modelPickerContainer = document.getElementById('modelPickerContainer');
const modelSelectorBtn = document.getElementById('modelSelectorBtn');
const currentModelIcon = document.getElementById('currentModelIcon');
const currentModelName = document.getElementById('currentModelName');

const tonePickerContainer = document.getElementById('tonePickerContainer');
const toneSelectorBtn = document.getElementById('toneSelectorBtn');
const currentToneIcon = document.getElementById('currentToneIcon');
const currentToneName = document.getElementById('currentToneName');

const canvasWorkspace = document.getElementById('canvasWorkspace');
const canvasIframe = document.getElementById('canvasIframe');
const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');
const closeCanvasBtn = document.getElementById('closeCanvasBtn');
const refreshCanvasBtn = document.getElementById('refreshCanvasBtn');

const memoryModal = document.getElementById('memoryModal');
const memoryItemsList = document.getElementById('memoryItemsList');

function applyModelUI(modelKey) {
  currentModel = modelKey;
  localStorage.setItem(MODEL_STORAGE_KEY, modelKey);
  const cfg = MODELS[modelKey] || MODELS['kortex-1'];

  if (currentModelIcon) currentModelIcon.textContent = cfg.icon;
  if (currentModelName) currentModelName.textContent = cfg.name;
  if (chatInput) chatInput.placeholder = cfg.placeholder;
  const disclaimerPrimary = document.querySelector('.disclaimer-primary');
  if (disclaimerPrimary) {
    disclaimerPrimary.textContent = `${cfg.name} by f0undr. Built from first principles with zero API keys. Verify sensitive facts.`;
  } else if (disclaimerText) {
    disclaimerText.textContent = cfg.disclaimer;
  }
  if (userTier) userTier.textContent = cfg.tier;

  document.querySelectorAll('.model-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.model === modelKey);
  });
}

window.selectModel = function(modelKey) {
  applyModelUI(modelKey);
  modelPickerContainer?.classList.remove('open');
};

modelSelectorBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  tonePickerContainer?.classList.remove('open');
  modelPickerContainer?.classList.toggle('open');
});

function applyToneUI(toneKey) {
  currentTone = toneKey;
  localStorage.setItem(TONE_STORAGE_KEY, toneKey);
  const cfg = TONES[toneKey] || TONES.casual;

  if (currentToneIcon) currentToneIcon.textContent = cfg.icon;
  if (currentToneName) currentToneName.textContent = cfg.name;

  document.querySelectorAll('.tone-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.tone === toneKey);
  });
}

window.selectTone = function(toneKey) {
  applyToneUI(toneKey);
  tonePickerContainer?.classList.remove('open');
};

toneSelectorBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  modelPickerContainer?.classList.remove('open');
  tonePickerContainer?.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (modelPickerContainer && !modelPickerContainer.contains(e.target)) {
    modelPickerContainer.classList.remove('open');
  }
  if (tonePickerContainer && !tonePickerContainer.contains(e.target)) {
    tonePickerContainer.classList.remove('open');
  }
});

window.toggleMemoryModal = function(forceOpen = null) {
  if (forceOpen === false) {
    memoryModal?.classList.remove('open');
  } else if (forceOpen === true) {
    renderMemoriesList();
    memoryModal?.classList.add('open');
  } else {
    const willOpen = !memoryModal?.classList.contains('open');
    if (willOpen) renderMemoriesList();
    memoryModal?.classList.toggle('open');
  }
};

window.closeMemoryModal = function(e) {
  if (e) e.stopPropagation();
  memoryModal?.classList.remove('open');
};

function renderMemoriesList() {
  if (!memoryItemsList) return;
  if (!memories.length) {
    memoryItemsList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No memories stored yet. Mention <em>"Remember that..."</em> in any conversation to save a fact.</div>';
    return;
  }

  memoryItemsList.innerHTML = memories.map((m, idx) => `
    <div class="memory-item">
      <span class="memory-item-text">${escapeHtml(m)}</span>
      <button class="memory-delete-btn" onclick="deleteMemory(${idx})" title="Delete memory">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
}

window.deleteMemory = function(idx) {
  memories.splice(idx, 1);
  saveMemories();
  renderMemoriesList();
};

window.clearAllMemories = function() {
  memories = [];
  saveMemories();
  renderMemoriesList();
};

/* =========================================================================
   20-POINT COMPLIANCE, LOCAL-FIRST EXPORT & DATA PURGE (SHIELDS 1-20)
   ========================================================================= */

const COOKIE_CONSENT_KEY = 'f0undr_cookie_consent';
const cookieConsentBanner = document.getElementById('cookieConsentBanner');
const legalModal = document.getElementById('legalModal');
const exportModal = document.getElementById('exportModal');

window.checkCookieConsent = function() {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent && cookieConsentBanner) {
      cookieConsentBanner.style.display = 'flex';
    }
  } catch {}
};

window.acceptAllCookies = function() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, telemetry: false, date: Date.now() }));
    if (cookieConsentBanner) cookieConsentBanner.style.display = 'none';
    closeLegalModal();
  } catch {}
};

window.declineNonEssentialCookies = function() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, telemetry: false, declined: true, date: Date.now() }));
    if (cookieConsentBanner) cookieConsentBanner.style.display = 'none';
    closeLegalModal();
  } catch {}
};

window.openLegalModal = function(tabName = 'safeguards') {
  if (legalModal) {
    switchLegalTab(tabName);
    legalModal.classList.add('open');
  }
};

window.closeLegalModal = function(e) {
  if (e) e.stopPropagation();
  legalModal?.classList.remove('open');
};

window.switchLegalTab = function(tabName) {
  document.querySelectorAll('.legal-tab-btn').forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  document.querySelectorAll('.legal-tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });
};

window.openExportModal = function() {
  exportModal?.classList.add('open');
};

window.closeExportModal = function(e) {
  if (e) e.stopPropagation();
  exportModal?.classList.remove('open');
};

window.exportCurrentChat = function(format = 'markdown') {
  if (!currentThread || !currentThread.messages || !currentThread.messages.length) {
    alert('No messages to export in the current conversation.');
    return;
  }

  const title = (currentThread.title || 'Conversation').replace(/[^a-zA-Z0-9_-]/g, '_');
  let blob, filename;

  if (format === 'markdown') {
    let md = `# ${currentThread.title || 'f0undr AI Conversation'}\n\n`;
    md += `*Exported from f0undr AI (${currentModel}) on ${new Date().toLocaleString()}*\n\n---\n\n`;
    currentThread.messages.forEach((m) => {
      const role = m.role === 'user' ? '🧑 **User**' : `🤖 **${m.model || 'f0undr AI'}**`;
      md += `### ${role}\n\n${m.content}\n\n`;
      if (m.sources && m.sources.length) {
        md += `**Verified Sources:**\n`;
        m.sources.forEach((s) => {
          md += `- [${s.title || s.domain}](${s.url})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });
    blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    filename = `f0undr_${title}.md`;
  } else {
    blob = new Blob([JSON.stringify(currentThread, null, 2)], { type: 'application/json;charset=utf-8' });
    filename = `f0undr_${title}.json`;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  closeExportModal();
};

window.exportAllChatsJSON = function() {
  const data = {
    exportedAt: new Date().toISOString(),
    engine: 'f0undr AI / Kortex 1',
    threads,
    memories
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `f0undr_all_conversations_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  closeExportModal();
};

window.confirmPurgeAllData = function() {
  const ok = confirm('⚠️ Are you sure you want to permanently delete all conversations, memories, and preferences from this device? This action cannot be undone.');
  if (!ok) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MEMORY_STORAGE_KEY);
    localStorage.removeItem(MODEL_STORAGE_KEY);
    localStorage.removeItem(TONE_STORAGE_KEY);
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {}

  threads = [];
  memories = [];
  currentThread = createNewThread();
  threads = [currentThread];
  saveThreads();

  renderSidebarHistory();
  renderActiveThread();
  renderMemoriesList();
  applyModelUI('kortex-1');
  applyToneUI('casual');

  closeLegalModal();
  closeMemoryModal();
  closeExportModal();

  alert('✓ All conversations, memories, and local settings have been permanently deleted from your browser.');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLegalModal();
    closeExportModal();
    toggleMemoryModal(false);
    modelPickerContainer?.classList.remove('open');
    tonePickerContainer?.classList.remove('open');
  }
});

function stripMarkdownForSpeech(md = '') {
  return md
    .replace(/\[FOLLOW_UPS:[\s\S]*?\]/gi, '')
    .replace(/```[\s\S]*?```/g, ' [Code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+(.*$)/gm, '$1. ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|[^\n]+\|/g, ' ')
    .replace(/^\s*[-*]\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

window.toggleSpeech = function(btn, rawText) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported in this browser.');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (currentSpeechBtn) {
      currentSpeechBtn.classList.remove('speaking');
      currentSpeechBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Listen</span>
      `;
    }
    if (currentSpeechBtn === btn) {
      currentSpeechBtn = null;
      return;
    }
  }

  const plainText = stripMarkdownForSpeech(rawText);
  if (!plainText) return;

  const utter = new SpeechSynthesisUtterance(plainText);
  utter.rate = 1.02;
  utter.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const naturalEn = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('David')));
  if (naturalEn) utter.voice = naturalEn;

  currentSpeechBtn = btn;
  btn.classList.add('speaking');
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
    <span>Stop</span>
  `;

  utter.onend = () => {
    btn.classList.remove('speaking');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>Listen</span>
    `;
    currentSpeechBtn = null;
  };

  utter.onerror = () => {
    btn.classList.remove('speaking');
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>Listen</span>
    `;
    currentSpeechBtn = null;
  };

  activeUtterance = utter;
  window.speechSynthesis.speak(utter);
};

window.copyMessageText = function(btn) {
  const row = btn.closest('.message-row');
  const prose = row?.querySelector('.bot-prose');
  const text = prose ? prose.innerText : '';
  navigator.clipboard.writeText(text).then(() => {
    const span = btn.querySelector('span');
    const prev = span ? span.textContent : 'Copy';
    if (span) span.textContent = 'Copied!';
    setTimeout(() => {
      if (span) span.textContent = prev;
    }, 2000);
  });
};

let currentScreenCapture = null;
let currentScreenText = '';

window.startScreenCapture = async function() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert('Screen sharing is not supported in this browser.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always', displaySurface: 'monitor' },
      audio: false
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1600 / (video.videoWidth || 1600));
    canvas.width = (video.videoWidth || 1280) * scale;
    canvas.height = (video.videoHeight || 720) * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stream.getTracks().forEach((track) => track.stop());

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    currentScreenCapture = { dataUrl, timestamp: Date.now() };

    const previewBar = document.getElementById('screenPreviewBar');
    const previewThumb = document.getElementById('screenPreviewThumb');
    const ocrStatus = document.getElementById('screenOcrStatus');

    if (previewBar && previewThumb) {
      previewThumb.src = dataUrl;
      previewBar.style.display = 'flex';
      if (ocrStatus) ocrStatus.textContent = 'Extracting visible screen text...';
    }

    if (window.Tesseract && typeof window.Tesseract.recognize === 'function') {
      window.Tesseract.recognize(dataUrl, 'eng')
        .then(({ data: { text } }) => {
          currentScreenText = (text || '').trim();
          if (ocrStatus) {
            const count = currentScreenText ? currentScreenText.split(/\s+/).length : 0;
            ocrStatus.textContent = count > 0 ? `✓ ${count} words recognized from screen` : '✓ Screen frame ready';
          }
        })
        .catch(() => {
          currentScreenText = 'Screen captured without OCR text.';
          if (ocrStatus) ocrStatus.textContent = '✓ Screen frame ready';
        });
    } else {
      currentScreenText = 'Screen frame captured.';
      if (ocrStatus) ocrStatus.textContent = '✓ Screen frame ready';
    }

    chatInput.focus();
    if (!chatInput.value.trim()) {
      chatInput.placeholder = 'Ask anything about what is on your screen...';
    }
  } catch (err) {
    if (err.name !== 'NotAllowedError') {
      console.error(err);
    }
  }
};

window.clearScreenCapture = function() {
  currentScreenCapture = null;
  currentScreenText = '';
  const previewBar = document.getElementById('screenPreviewBar');
  if (previewBar) previewBar.style.display = 'none';
  const cfg = MODELS[currentModel] || MODELS['kortex-1'];
  chatInput.placeholder = cfg.placeholder;
};

window.viewScreenFull = function(dataUrl) {
  const win = window.open('');
  if (win) {
    win.document.write(`<html><head><title>Screen Capture Preview</title><style>body{margin:0;background:#0a0a0c;display:flex;align-items:center;justify-content:center;height:100vh;}img{max-width:98vw;max-height:98vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.8);}</style></head><body><img src="${dataUrl}" alt="Full Screen Capture" /></body></html>`);
  }
};

let activeLiveStream = null;
let liveSessionTimer = null;
let liveSessionExpiresAt = null;
let liveContinuousSpeech = null;

window.toggleContinuousLiveSession = function() {
  if (activeLiveStream) {
    window.stopContinuousLiveSession();
  } else {
    window.startContinuousLiveSession(60);
  }
};

window.startContinuousLiveSession = async function(minutes = 60) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert('Screen sharing is not supported in this browser.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always', displaySurface: 'monitor' },
      audio: false
    });

    activeLiveStream = stream;
    liveSessionExpiresAt = Date.now() + minutes * 60 * 1000;

    const hud = document.getElementById('jarvisLiveHud');
    const hudVideo = document.getElementById('liveHudVideo');
    const liveBtn = document.getElementById('liveCopilotBtn');

    if (hud && hudVideo) {
      hudVideo.srcObject = stream;
      hud.style.display = 'flex';
    }
    if (liveBtn) liveBtn.classList.add('active');

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        window.stopContinuousLiveSession();
      };
    }

    if (liveSessionTimer) clearInterval(liveSessionTimer);
    liveSessionTimer = setInterval(() => {
      const remainingMs = liveSessionExpiresAt - Date.now();
      if (remainingMs <= 0) {
        window.stopContinuousLiveSession();
        return;
      }
      const totalSec = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const timerElem = document.getElementById('liveHudTimer');
      if (timerElem) {
        timerElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);

    startLiveContinuousSpeech();

    if ('speechSynthesis' in window) {
      const intro = new SpeechSynthesisUtterance('Live Copilot activated. I am watching your screen and listening for the next hour.');
      intro.rate = 1.05;
      window.speechSynthesis.speak(intro);
    }
  } catch (err) {
    if (err.name !== 'NotAllowedError') {
      console.error(err);
    }
  }
};

window.stopContinuousLiveSession = function() {
  if (activeLiveStream) {
    activeLiveStream.getTracks().forEach((t) => t.stop());
    activeLiveStream = null;
  }
  if (liveSessionTimer) {
    clearInterval(liveSessionTimer);
    liveSessionTimer = null;
  }
  if (liveContinuousSpeech) {
    try { liveContinuousSpeech.stop(); } catch {}
    liveContinuousSpeech = null;
  }

  const hud = document.getElementById('jarvisLiveHud');
  const liveBtn = document.getElementById('liveCopilotBtn');
  if (hud) hud.style.display = 'none';
  if (liveBtn) liveBtn.classList.remove('active');

  const hudVideo = document.getElementById('liveHudVideo');
  if (hudVideo) hudVideo.srcObject = null;
};

function startLiveContinuousSpeech() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  try {
    const recognizer = new SpeechRec();
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.lang = 'en-US';

    recognizer.onresult = async (event) => {
      const last = event.results[event.results.length - 1];
      if (last && last.isFinal) {
        const query = last[0].transcript.trim();
        if (query && !isStreaming) {
          const statusElem = document.getElementById('liveHudStatus');
          if (statusElem) statusElem.textContent = `Processing: "${query}"`;
          chatInput.value = query;
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
    };

    recognizer.onerror = () => {};
    recognizer.onend = () => {
      if (activeLiveStream) {
        try { recognizer.start(); } catch {}
      }
    };

    recognizer.start();
    liveContinuousSpeech = recognizer;
  } catch {}
}

window.captureCurrentLiveFrame = function() {
  const hudVideo = document.getElementById('liveHudVideo');
  if (!hudVideo || !hudVideo.videoWidth) return null;

  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1600 / (hudVideo.videoWidth || 1600));
  canvas.width = hudVideo.videoWidth * scale;
  canvas.height = hudVideo.videoHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(hudVideo, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
};

window.triggerLiveAnalysis = async function() {
  const frame = window.captureCurrentLiveFrame();
  if (!frame) return;

  currentScreenCapture = { dataUrl: frame, timestamp: Date.now() };
  chatInput.value = 'Inspect my screen, explain what is happening, and tell me what actions or next steps to take.';
  chatForm.dispatchEvent(new Event('submit'));
};

if (voiceInputBtn) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    const recognizer = new SpeechRec();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    let isListening = false;

    voiceInputBtn.addEventListener('click', () => {
      if (!isListening) {
        recognizer.start();
      } else {
        recognizer.stop();
      }
    });

    recognizer.onstart = () => {
      isListening = true;
      voiceInputBtn.classList.add('listening');
      chatInput.placeholder = 'Listening... Speak now';
    };

    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      chatInput.value = transcript;
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    };

    recognizer.onend = () => {
      isListening = false;
      voiceInputBtn.classList.remove('listening');
      const cfg = MODELS[currentModel] || MODELS['kortex-1'];
      chatInput.placeholder = cfg.placeholder;
      if (chatInput.value.trim()) {
        chatInput.focus();
      }
    };

    recognizer.onerror = () => {
      isListening = false;
      voiceInputBtn.classList.remove('listening');
      const cfg = MODELS[currentModel] || MODELS['kortex-1'];
      chatInput.placeholder = cfg.placeholder;
    };
  } else {
    voiceInputBtn.style.display = 'none';
  }
}

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
    model: currentModel,
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
      let imgHtml = '';
      if (msg.image) {
        imgHtml = `<div class="user-screen-thumb"><img src="${msg.image}" alt="Captured Screen" onclick="viewScreenFull('${msg.image}')" /><span class="screen-badge">🖥️ Screen</span></div>`;
      }
      row.innerHTML = `<div class="user-bubble">${imgHtml}<div>${escapeHtml(msg.content)}</div></div>`;
      messagesContainer.appendChild(row);
    } else if (msg.role === 'assistant') {
      const row = document.createElement('div');
      row.className = 'message-row';

      const avatar = document.createElement('div');
      avatar.className = 'bot-avatar';
      const mKey = msg.model || current.model || currentModel;
      avatar.textContent = MODELS[mKey]?.icon || '⚡';

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
      textDiv.innerHTML = renderMarkdown(cleanFollowUps(msg.content));
      content.appendChild(textDiv);

      const followUps = extractFollowUps(msg.content);
      if (followUps.length) {
        const pillBox = document.createElement('div');
        pillBox.className = 'follow-up-container';
        pillBox.innerHTML = followUps.map((fu) => `
          <button class="follow-up-pill" onclick="askQuick(\`${escapeQuote(fu)}\`)">
            <span>💡</span>
            <span>${escapeHtml(fu)}</span>
          </button>
        `).join('');
        content.appendChild(pillBox);
      }

      if (msg.sources && msg.sources.length) {
        const sourcesBox = document.createElement('details');
        sourcesBox.className = 'sources-container';
        sourcesBox.innerHTML = `
          <summary class="sources-summary">
            <span>🔍</span>
            <span>Verified Sources (${msg.sources.length})</span>
          </summary>
          <div class="sources-list">
            ${msg.sources.map((s) => `
              <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="source-item-chip" title="${escapeHtml(s.title)}">
                <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.domain || '')}&sz=16" width="14" height="14" alt="" />
                <span>${escapeHtml(s.domain || s.title)}</span>
              </a>
            `).join('')}
          </div>
        `;
        content.appendChild(sourcesBox);
      }

      const actionsRow = document.createElement('div');
      actionsRow.className = 'bot-actions-row';
      actionsRow.innerHTML = `
        <button class="msg-action-btn" onclick="toggleSpeech(this, \`${escapeQuote(msg.content)}\`)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <span>Listen</span>
        </button>
        <button class="msg-action-btn" onclick="copyMessageText(this)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </button>
      `;
      content.appendChild(actionsRow);

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

function appendUserMessage(text, image = null) {
  if (welcomeHero) welcomeHero.style.display = 'none';

  const row = document.createElement('div');
  row.className = 'message-row user';
  let imgHtml = '';
  if (image) {
    imgHtml = `<div class="user-screen-thumb"><img src="${image}" alt="Captured Screen" onclick="viewScreenFull('${image}')" /><span class="screen-badge">🖥️ Screen</span></div>`;
  }
  row.innerHTML = `<div class="user-bubble">${imgHtml}<div>${escapeHtml(text)}</div></div>`;
  messagesContainer.appendChild(row);
  scrollToBottom();
}

function createBotMessageContainer(modelKey = currentModel) {
  const row = document.createElement('div');
  row.className = 'message-row';

  const avatar = document.createElement('div');
  avatar.className = 'bot-avatar';
  avatar.textContent = MODELS[modelKey]?.icon || '⚡';

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

  const actionsRow = document.createElement('div');
  actionsRow.className = 'bot-actions-row';
  actionsRow.style.display = 'none';

  content.appendChild(statusPill);
  content.appendChild(thoughtBox);
  content.appendChild(textDiv);
  content.appendChild(actionsRow);

  row.appendChild(avatar);
  row.appendChild(content);
  messagesContainer.appendChild(row);
  scrollToBottom();

  return { row, content, statusPill, thoughtBox, textDiv, actionsRow };
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

function cleanFollowUps(text = '') {
  return text.replace(/\[FOLLOW_UPS:[\s\S]*?\]/gi, '').trim();
}

function extractFollowUps(text = '') {
  const m = text.match(/\[FOLLOW_UPS:\s*(.*?)\]/i);
  if (!m || !m[1]) return [];
  return m[1]
    .split('|')
    .map((s) => s.replace(/^["'\s]+|["'\s]+$/g, '').trim())
    .filter(Boolean);
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

  html = html.replace(/\[ACTION_CARD:\s*([^|]+)\|\s*([^\]]+)\]/gi, (_, name, url) => {
    const cleanName = name.trim();
    const cleanUrl = url.trim().replace(/&amp;/g, '&');
    return `
      <div class="jarvis-action-card">
        <div class="jarvis-action-header">
          <div class="jarvis-pulse-ring">
            <span class="jarvis-pulse-dot"></span>
          </div>
          <span class="jarvis-badge">⚡ JARVIS ACTION</span>
          <span class="jarvis-status">ACTIVE</span>
        </div>
        <div class="jarvis-action-body">
          <div class="jarvis-action-info">
            <div class="jarvis-service-name">${cleanName}</div>
            <div class="jarvis-service-url">${cleanUrl}</div>
          </div>
          <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="jarvis-launch-btn">
            <span>Launch ${cleanName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    `;
  });

  html = html.replace(/^>\s*(.*?)$/gim, '<blockquote>$1</blockquote>');
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
  let text = chatInput.value.trim();
  if ((!text && !currentScreenCapture) || isStreaming) return;

  const isScreenQuery = /^(?:can\s+you\s+)?(?:see|look\s+at|read|check|view|inspect)\s+(?:my\s+)?screen\b/i.test(text) || /^(?:what(?:'s|\s+is)\s+on\s+my\s+screen)\b/i.test(text);

  if (isScreenQuery && !currentScreenCapture) {
    await window.startScreenCapture();
    if (!currentScreenCapture) return;
  }

  if (!text && currentScreenCapture) {
    text = 'Please inspect what is on my screen and summarize or help me with it.';
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';
  isStreaming = true;
  sendBtn.disabled = true;

  playChime('send');

  let capturedImage = currentScreenCapture ? currentScreenCapture.dataUrl : null;
  let capturedText = currentScreenText;

  if (activeLiveStream && !capturedImage) {
    const liveFrame = window.captureCurrentLiveFrame();
    if (liveFrame) {
      capturedImage = liveFrame;
      capturedText = 'Screen frame captured live during 1-hour Copilot session.';
    }
  }

  appendUserMessage(text, capturedImage);

  const currentThread = getActiveThread();
  if (currentThread.messages.length === 0 || currentThread.title === 'New chat') {
    currentThread.title = text.slice(0, 28) + (text.length > 28 ? '...' : '');
    currentThread.model = currentModel;
    renderSidebarHistory();
  }

  currentThread.messages.push({ role: 'user', content: text, image: capturedImage });
  currentThread.updatedAt = Date.now();
  saveThreads();

  window.clearScreenCapture();

  const botUI = createBotMessageContainer(currentModel);
  let accumulatedAnswer = '';
  let accumulatedThought = '';
  let collectedSources = [];

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: currentThread.messages,
        model: currentModel,
        tone: currentTone,
        memories,
        screenContext: capturedText,
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

          if (event === 'action') {
            if (payload.type === 'start_live_copilot') {
              window.startContinuousLiveSession(payload.duration || 60);
            } else if (payload.type === 'stop_live_copilot') {
              window.stopContinuousLiveSession();
            } else if (payload.type === 'request_screen') {
              window.startScreenCapture();
            } else if (payload.url) {
              try {
                window.open(payload.url, '_blank');
              } catch {}
            }
          }

          if (event === 'memory' && payload.fact) {
            if (!memories.includes(payload.fact)) {
              memories.push(payload.fact);
              saveMemories();
            }
          }

          if (event === 'sources' && Array.isArray(payload.sources)) {
            collectedSources = payload.sources;
          }

          if (event === 'thought' && payload.text) {
            accumulatedThought = payload.text;
            botUI.thoughtBox.style.display = 'block';
            botUI.thoughtBox.querySelector('.thought-content').textContent = accumulatedThought;
          }

          if (event === 'token' && payload.text) {
            accumulatedAnswer += payload.text;
            botUI.textDiv.innerHTML = renderMarkdown(cleanFollowUps(accumulatedAnswer));
            scrollToBottom();
          }

          if (event === 'done') {
            botUI.statusPill.style.display = 'none';
            playChime('done');

            const cleanText = cleanFollowUps(accumulatedAnswer);
            botUI.textDiv.innerHTML = renderMarkdown(cleanText);

            if (activeLiveStream && 'speechSynthesis' in window) {
              const plainSpeech = stripMarkdownForSpeech(cleanText);
              const utter = new SpeechSynthesisUtterance(plainSpeech.slice(0, 450));
              utter.rate = 1.05;
              window.speechSynthesis.speak(utter);
            }

            const followUps = extractFollowUps(accumulatedAnswer);
            if (followUps.length) {
              const pillsBox = document.createElement('div');
              pillsBox.className = 'follow-up-container';
              pillsBox.innerHTML = followUps.map((fu) => `
                <button class="follow-up-pill" onclick="askQuick(\`${escapeQuote(fu)}\`)">
                  <span>💡</span>
                  <span>${escapeHtml(fu)}</span>
                </button>
              `).join('');
              botUI.content.appendChild(pillsBox);
            }

            if (collectedSources.length) {
              const sourcesBox = document.createElement('details');
              sourcesBox.className = 'sources-container';
              sourcesBox.innerHTML = `
                <summary class="sources-summary">
                  <span>🔍</span>
                  <span>Verified Sources (${collectedSources.length})</span>
                </summary>
                <div class="sources-list">
                  ${collectedSources.map((s) => `
                    <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="source-item-chip" title="${escapeHtml(s.title)}">
                      <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.domain || '')}&sz=16" width="14" height="14" alt="" />
                      <span>${escapeHtml(s.domain || s.title)}</span>
                    </a>
                  `).join('')}
                </div>
              `;
              botUI.content.appendChild(sourcesBox);
            }

            botUI.actionsRow.style.display = 'flex';
            botUI.actionsRow.innerHTML = `
              <button class="msg-action-btn" onclick="toggleSpeech(this, \`${escapeQuote(cleanText)}\`)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Listen</span>
              </button>
              <button class="msg-action-btn" onclick="copyMessageText(this)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              </button>
            `;

            const matchHtml = cleanText.match(/```(?:html)?\s*(<!DOCTYPE[\s\S]*?)```/i);
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
      model: currentModel,
      sources: collectedSources
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

applyModelUI(currentModel);
applyToneUI(currentTone);
loadMemories();
loadThreads();
renderSidebarHistory();
renderActiveThread();
checkCookieConsent();

/* =========================================================================
   PWA SERVICE WORKER REGISTRATION & INSTALL PROMPT
   ========================================================================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('✓ f0undr AI PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const pwaBtn = document.getElementById('pwaInstallBtn');
  if (pwaBtn) pwaBtn.style.display = 'flex';
});

window.installPWA = function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        const pwaBtn = document.getElementById('pwaInstallBtn');
        if (pwaBtn) pwaBtn.style.display = 'none';
      }
      deferredPrompt = null;
    });
  } else {
    alert('To install f0undr AI, open your browser menu and choose "Install App" or "Add to Home Screen".');
  }
};
