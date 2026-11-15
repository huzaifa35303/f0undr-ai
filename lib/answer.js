import { searchWeb } from './search.js';
import { unslop } from './clean.js';
import { generateAI } from './ai.js';
import { generateConservationCanvas } from './conservation.js';

const PRONOUN = /\b(he|him|his|she|her|hers|it|its|they|them|their|that|this|those|these|there)\b/i;
const FRAGMENT = /^(and|also|what about|how about|why|and what|ok(ay)? and|so|then)\b/i;
const FOLLOWUP_QUESTION =
  /^(who\s+(make|made|created|founded|owns?|built|runs?)|when\s+(was\s+it\s+)?(launched|released|founded|born|created|started)|where\s+(is\s+it\s+)?(from|located|based)|how\s+(does\s+it\s+work|much|old|to\s+use)|what\s+(about|features?|version|price|cost|is\s+the\s+difference)|is\s+it\s+(free|open\s*source|safe|good|better)|can\s+it\s+|tell\s+me\s+more|give\s+examples?)\b/i;

function extractSubject(text = '') {
  return text
    .trim()
    .replace(/^((can|could|will|would) you\s+)?(please\s+)?(i\s+)?(just\s+)?(want(ed)? to know|need to know|would like to know|tell me( about)?|show me|find me|give me|explain|search( for)?|look up|google)\s+/i, '')
    .replace(/^(about|the|a|an)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();
}

function resolveFollowUp(question, conversation = []) {
  const q = question.trim();
  if (!conversation.length) return q;

  const prior = conversation.slice(-1)[0]?.content === q ? conversation.slice(0, -1) : conversation;
  let topic = '';
  for (let i = prior.length - 1; i >= 0; i--) {
    if (prior[i]?.role === 'user') {
      const sub = extractSubject(prior[i].content);
      if (sub && sub.length > 2 && !PRONOUN.test(sub)) {
        topic = sub;
        break;
      }
    }
  }

  if (!topic) return q;

  if (PRONOUN.test(q)) {
    const swapped = q.replace(PRONOUN, topic);
    return swapped === q ? `${q} ${topic}`.trim() : swapped;
  }

  if (FOLLOWUP_QUESTION.test(q) || FRAGMENT.test(q)) {
    return `${q} ${topic}`.trim();
  }

  return q;
}

function parseJarvisCommand(text = '') {
  const t = text.trim();

  const searchServiceMatch = t.match(/^(?:please\s+)?(?:jarvis\s+)?(?:search|look\s*up|find)\s+(?:on\s+)?(google|youtube|github|wikipedia|reddit|twitter|x|amazon)\s+(?:for\s+)?(.*)/i);
  if (searchServiceMatch) {
    const service = searchServiceMatch[1].toLowerCase();
    const query = searchServiceMatch[2].trim().replace(/[.!?]+$/, '');
    if (service === 'youtube') return { type: 'open_url', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, title: `YouTube Search: "${query}"`, name: 'YouTube' };
    if (service === 'github') return { type: 'open_url', url: `https://github.com/search?q=${encodeURIComponent(query)}`, title: `GitHub Search: "${query}"`, name: 'GitHub' };
    if (service === 'wikipedia') return { type: 'open_url', url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, title: `Wikipedia Search: "${query}"`, name: 'Wikipedia' };
    if (service === 'reddit') return { type: 'open_url', url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`, title: `Reddit Search: "${query}"`, name: 'Reddit' };
    if (service === 'amazon') return { type: 'open_url', url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`, title: `Amazon Search: "${query}"`, name: 'Amazon' };
    return { type: 'open_url', url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, title: `Google Search: "${query}"`, name: 'Google' };
  }

  const playMatch = t.match(/^(?:please\s+)?(?:jarvis\s+)?(?:play|watch)\s+(.*?)(?:\s+on\s+youtube)?$/i);
  if (playMatch && playMatch[1].trim() && !/^(?:game|quiz|roleplay|with\s+me)\b/i.test(playMatch[1].trim())) {
    const song = playMatch[1].trim().replace(/[.!?]+$/, '');
    return { type: 'open_url', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`, title: `Playing on YouTube: "${song}"`, name: 'YouTube' };
  }

  const openMatch = t.match(/^(?:please\s+)?(?:jarvis\s+)?(?:open|go\s+to|launch|visit|browse\s+to)\s+(.*)/i);
  if (openMatch) {
    const rawTarget = openMatch[1].trim().replace(/[.!?]+$/, '');
    const target = rawTarget.toLowerCase();

    const SITE_MAP = {
      'google': 'https://www.google.com',
      'youtube': 'https://www.youtube.com',
      'github': 'https://github.com',
      'gmail': 'https://mail.google.com',
      'mail': 'https://mail.google.com',
      'email': 'https://mail.google.com',
      'chatgpt': 'https://chatgpt.com',
      'twitter': 'https://x.com',
      'x': 'https://x.com',
      'reddit': 'https://www.reddit.com',
      'linkedin': 'https://www.linkedin.com',
      'spotify': 'https://open.spotify.com',
      'netflix': 'https://www.netflix.com',
      'amazon': 'https://www.amazon.com',
      'maps': 'https://maps.google.com',
      'google maps': 'https://maps.google.com',
      'f0undr': 'https://f0undrteam.site',
      'f0undr team': 'https://f0undrteam.site',
      'f0undr ai': 'https://ai.f0undrteam.site',
      'f0undr auth': 'https://auth.f0undrteam.site',
      'wikipedia': 'https://www.wikipedia.org',
      'instagram': 'https://www.instagram.com',
      'whatsapp': 'https://web.whatsapp.com',
      'discord': 'https://discord.com',
      'facebook': 'https://www.facebook.com',
      'twitch': 'https://www.twitch.tv',
      'calculator': 'https://www.google.com/search?q=calculator',
      'weather': 'https://www.google.com/search?q=weather',
      'notion': 'https://www.notion.so',
      'figma': 'https://www.figma.com',
      'canva': 'https://www.canva.com',
      'stackoverflow': 'https://stackoverflow.com',
      'stack overflow': 'https://stackoverflow.com'
    };

    if (SITE_MAP[target]) {
      const url = SITE_MAP[target];
      const capName = rawTarget.charAt(0).toUpperCase() + rawTarget.slice(1);
      return { type: 'open_url', url, title: `Opening ${capName}`, name: capName };
    }

    if (/^https?:\/\//i.test(rawTarget)) {
      return { type: 'open_url', url: rawTarget, title: `Opening ${rawTarget}`, name: rawTarget };
    }

    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(target)) {
      const url = 'https://' + rawTarget;
      return { type: 'open_url', url, title: `Opening ${rawTarget}`, name: rawTarget };
    }
  }

  return null;
}

export async function answer(question, emit = () => {}, options = {}) {
  const q = question.trim();
  const conversation = options.conversation || [];
  const isVerdant = options.model === 'verdant-1';
  const isAura = options.model === 'aura-1';
  const botName = isAura ? 'Aura 1' : (isVerdant ? 'Verdant 1' : 'Kortex 1');

  const jarvisAction = parseJarvisCommand(q);
  if (jarvisAction) {
    emit('status', { text: `JARVIS: ${jarvisAction.title}` });
    emit('action', jarvisAction);
    const reply = `⚡ **JARVIS Action Executed**\n\nOpening **${jarvisAction.name}** for you right now.\n\n[ACTION_CARD: ${jarvisAction.name} | ${jarvisAction.url}]`;
    for (const chunk of reply.match(/\S+\s*/g) || []) emit('token', { text: chunk });
    return reply;
  }

  const isNameOrIdentity =
    /(?:what(?:'s|\s+is)\s+(?:ur|your)\s+name|who\s+(?:are|made|created|built)\s+you|your\s+name|ur\s+name|tell\s+me\s+your\s+name|are\s+you\s+(?:kortex|verdant|aura)|name\s+please)\b/i.test(q);

  if (isNameOrIdentity) {
    emit('status', { text: `${botName} responding` });
    let identityReply = "I am **Kortex 1**, created by **f0undr** and the **f0undr team** as an ultra-fast, universal reasoning, action execution, and search intelligence model.";
    if (isAura) {
      identityReply = "I am **Aura 1**, created by **f0undr** and the **f0undr team**. I'm here with warmth, empathy, and deep human conversational understanding.";
    } else if (isVerdant) {
      identityReply = "I am **Verdant 1**, created by **f0undr** and the **f0undr team**, focused on living systems, environmental science, and mindful intelligence.";
    }
    for (const chunk of identityReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return identityReply;
  }

  const isGreeting = /^(?:hi|hello|hey|heyy|salam|assalam|yo|good\s+(?:morning|afternoon|evening)|kya\s+haal\s+hai|how\s+are\s+you|sup)\b/i.test(q);
  if (isGreeting && q.split(/\s+/).length <= 4) {
    emit('status', { text: `${botName} responding` });
    const greetReply = isAura
      ? "Hey! I'm **Aura 1**, created by **f0undr** and the **f0undr team**. It's great to connect with you."
      : (isVerdant
          ? "Hello! I'm **Verdant 1**, created by **f0undr** and the **f0undr team**. Wonderful to have you here."
          : `Hey there! I'm **Kortex 1**, created by **f0undr** and the **f0undr team**. Ready whenever you are.`);
    for (const chunk of greetReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return greetReply;
  }

  const memoryMatch = q.match(/^(?:please\s+)?(?:remember(?:\s+that)?|note\s+that|keep\s+in\s+mind(?:\s+that)?)\s+(.*)/i);
  if (memoryMatch && memoryMatch[1].trim().length > 2) {
    const fact = memoryMatch[1].trim().replace(/[.!?]+$/, '');
    emit('status', { text: `${botName} saving memory` });
    emit('memory', { fact });
    const reply = `I've memorized that: **"${fact}"**. I'll keep this in mind for all our future conversations.`;
    for (const chunk of reply.match(/\S+\s*/g) || []) emit('token', { text: chunk });
    return reply;
  }

  if (/(?:biodiversity\s+calculator|shannon\s+index|species\s+richness|simpson\s+index)/i.test(q)) {
    emit('status', { text: 'Launching Biodiversity Simulator' });
    const code = generateConservationCanvas('biodiversity');
    const msg = `### 🌿 Interactive Biodiversity Index Tool\n\nI have generated the interactive **Shannon-Wiener Biodiversity Index Calculator** in your side-by-side Canvas Split-Screen.\n\n\`\`\`html\n${code}\n\`\`\``;
    for (const chunk of msg.match(/\S+\s*/g) || []) emit('token', { text: chunk });
    return msg;
  }

  if (/(?:iucn\s+spectrum|threat\s+spectrum|iucn\s+categories|red\s+list\s+explorer)/i.test(q)) {
    emit('status', { text: 'Launching IUCN Red List Explorer' });
    const code = generateConservationCanvas('iucn');
    const msg = `### 🐾 IUCN Red List Threat Spectrum\n\nI have launched the **Interactive Global Threat Spectrum Explorer** in your side-by-side Canvas.\n\n\`\`\`html\n${code}\n\`\`\``;
    for (const chunk of msg.match(/\S+\s*/g) || []) emit('token', { text: chunk });
    return msg;
  }

  const resolvedQuery = resolveFollowUp(q, conversation);

  const needsWebSearch =
    /(?:search|search\s+for|latest|news|current|today|status\s+of|price\s+of|weather|score|who\s+won|release\s+date|population\s+of|founded\s+in|2026)/i.test(resolvedQuery) &&
    !/(?:write|code|create|make|help|joke|poem|story|calculate|fix|debug|refactor|explain|why|how)\b/i.test(resolvedQuery);

  let combinedContext = '';
  if (needsWebSearch) {
    emit('status', { text: `${botName} searching verified sources` });
    const topicMatch = resolvedQuery.match(/(?:about|on|for|status of|is|are|news on)\s+([a-zA-Z\s]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : resolvedQuery.slice(0, 40);

    const { results, summary } = await searchWeb(resolvedQuery, topic);

    const contextSnippets = [];
    const sourceRefs = [];

    if (summary && summary.text) {
      contextSnippets.push(`[Source 1 - Wikipedia]:\n${summary.text}`);
      sourceRefs.push({ id: 1, title: summary.title || 'Wikipedia', url: summary.url, domain: 'wikipedia.org' });
    }

    let sourceCounter = sourceRefs.length + 1;
    for (const r of results.slice(0, 4)) {
      if (r.text) {
        contextSnippets.push(`[Source ${sourceCounter} - ${r.domain}]:\n${r.text}`);
        sourceRefs.push({ id: sourceCounter, title: r.title || r.domain, url: r.url, domain: r.domain });
        sourceCounter++;
      }
    }

    combinedContext = contextSnippets.join('\n\n');
    if (sourceRefs.length) {
      emit('sources', { sources: sourceRefs });
    }
  }

  emit('status', { text: `${botName} synthesizing answer` });
  const aiResponse = await generateAI({
    question: resolvedQuery,
    context: combinedContext,
    conversation,
    model: options.model,
    tone: options.tone,
    memories: options.memories,
    onStatus: (s) => emit('status', s),
    onThought: (t) => emit('thought', { text: t }),
    onToken: (t) => emit('token', { text: t }),
  });

  if (aiResponse && aiResponse.trim().length > 10) {
    return unslop(aiResponse);
  }

  emit('status', { text: 'Formatting response' });
  const fallback = `I am **${botName}**, created by **f0undr** and the **f0undr team**. I'm here to help with code, deep reasoning, live web search, and problem solving.`;
  for (const chunk of fallback.match(/\S+\s*/g) || []) {
    emit('token', { text: chunk });
  }
  return fallback;
}
