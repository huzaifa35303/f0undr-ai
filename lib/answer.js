import { searchWeb } from './search.js';
import { splitSentences, tokenize, buildIdfTable } from './indexer.js';
import { scoreSentence, extractBestSentences } from './ranker.js';
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

export async function answer(question, emit = () => {}, options = {}) {
  const q = question.trim();
  const conversation = options.conversation || [];
  const isVerdant = options.model === 'verdant-1';
  const botName = isVerdant ? 'Verdant 1' : 'Kortex 1';

  const isNameOrIdentity =
    /(?:what(?:'s|\s+is)\s+(?:ur|your)\s+name|who\s+(?:are|made|created|built)\s+you|your\s+name|ur\s+name|tell\s+me\s+your\s+name|are\s+you\s+(?:kortex|verdant)|name\s+please)\b/i.test(q);

  if (isNameOrIdentity) {
    emit('status', { text: `${botName} responding` });
    const identityReply = isVerdant
      ? "My name is **Verdant 1**. I was created by **f0undr** and the **f0undr team** as an ecological, living-systems, and environmental AI model with real-time web grounding and interactive canvas tools. How can I help you today?"
      : "My name is **Kortex 1**. I was created by **f0undr** and the **f0undr team** as an autonomous, universal conversational and search intelligence engine with real-time web grounding. How can I help you today?";
    for (const chunk of identityReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return identityReply;
  }

  const isGreeting = /^(?:hi|hello|hey|heyy|salam|assalam|yo|good\s+(?:morning|afternoon|evening)|kya\s+haal\s+hai|how\s+are\s+you|sup)\b/i.test(q);
  if (isGreeting && q.split(/\s+/).length <= 4) {
    emit('status', { text: `${botName} responding` });
    const greetReply = `Hello! I'm **${botName}**, created by **f0undr** and the **f0undr team**. How can I help you today?`;
    for (const chunk of greetReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return greetReply;
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
    /(?:search|who\s+is|what\s+is|where\s+is|when\s+was|how\s+to|why|status|news|population|price|weather|latest|history|film|movie|song|stock|iucn|species)/i.test(resolvedQuery) &&
    !/(?:write|code|create|make|help|joke|poem|story|calculate)\b/i.test(resolvedQuery);

  let combinedContext = '';
  if (needsWebSearch) {
    emit('status', { text: `${botName} searching verified sources` });
    const topicMatch = resolvedQuery.match(/(?:about|on|for|status of|is|are|news on)\s+([a-zA-Z\s]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : resolvedQuery.slice(0, 45);

    const { results, summary } = await searchWeb(resolvedQuery, topic);

    const contextSnippets = [];
    if (summary && summary.text) contextSnippets.push(`[Wikipedia Fact]:\n${summary.text}`);
    for (const r of results.slice(0, 4)) {
      if (r.text) contextSnippets.push(`[${r.domain}]:\n${r.text}`);
    }
    combinedContext = contextSnippets.join('\n\n');
  }

  emit('status', { text: `${botName} synthesizing answer` });
  const aiResponse = await generateAI({
    question: resolvedQuery,
    context: combinedContext,
    conversation,
    model: options.model,
    onStatus: (s) => emit('status', s),
    onThought: (t) => emit('thought', { text: t }),
    onToken: (t) => emit('token', { text: t }),
  });

  if (aiResponse && aiResponse.trim().length > 30) {
    return unslop(aiResponse);
  }

  emit('status', { text: 'Formatting response' });
  const fallback = `I am **${botName}**, created by **f0undr** and the **f0undr team**. I'm here to help you explore any topic, search the live web, or write and analyze code. What would you like to explore?`;
  for (const chunk of fallback.match(/\S+\s*/g) || []) {
    emit('token', { text: chunk });
  }
  return fallback;
}
