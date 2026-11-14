import { searchWeb } from './search.js';
import { splitSentences, tokenize, buildIdfTable } from './indexer.js';
import { scoreSentence, extractBestSentences } from './ranker.js';
import { unslop } from './clean.js';
import { generateAI } from './ai.js';
import { generateConservationCanvas } from './conservation.js';

export async function answer(question, emit = () => {}, options = {}) {
  const q = question.trim();
  const conversation = options.conversation || [];

  // =========================================================================
  // 1. ABSOLUTE BULLETPROOF IDENTITY & NAME CHECK
  // Never search the web or let base model hallucinate for identity questions!
  // =========================================================================
  const isNameOrIdentity =
    /(?:what(?:'s|\s+is)\s+(?:ur|your)\s+name|who\s+(?:are|made|created|built)\s+you|your\s+name|ur\s+name|tell\s+me\s+your\s+name|are\s+you\s+verdant|name\s+please)\b/i.test(q);

  if (isNameOrIdentity) {
    emit('status', { text: 'Verdant 1 responding' });
    const identityReply = "My name is **Verdant 1**. I was created by **f0undr** and the **f0undr team** as an autonomous, universal conversational and ecological intelligence engine with real-time web search. How can I help you today?";
    for (const chunk of identityReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return identityReply;
  }

  // =========================================================================
  // 2. CASUAL GREETING & CONVERSATIONAL FILTER
  // Don't search web for simple hellos or conversational pleasantries!
  // =========================================================================
  const isGreeting = /^(?:hi|hello|hey|heyy|salam|assalam|yo|good\s+(?:morning|afternoon|evening)|kya\s+haal\s+hai|how\s+are\s+you|sup)\b/i.test(q);
  if (isGreeting && q.split(/\s+/).length <= 4) {
    emit('status', { text: 'Verdant 1 responding' });
    const greetReply = "Hello! I'm **Verdant 1**, created by **f0undr** and the **f0undr team**. How can I help you today?";
    for (const chunk of greetReply.match(/\S+\s*/g) || []) {
      emit('token', { text: chunk });
    }
    return greetReply;
  }

  // =========================================================================
  // 3. INTERACTIVE SIMULATOR SHORTCUTS
  // =========================================================================
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

  // =========================================================================
  // 4. LIVE WEB SEARCH & INTELLIGENT RETRIEVAL
  // Only search when the query actually requires facts, definitions, or research!
  // =========================================================================
  const needsWebSearch =
    /(?:search|who\s+is|what\s+is|where\s+is|when\s+was|how\s+to|why|status|news|population|price|weather|latest|history|film|movie|song|stock|iucn|species)/i.test(q) &&
    !/(?:write|code|create|make|help|joke|poem|story|explain|calculate)\b/i.test(q);

  let combinedContext = '';
  if (needsWebSearch) {
    emit('status', { text: 'Verdant 1 searching verified sources' });
    const topicMatch = q.match(/(?:about|on|for|status of|is|are|news on)\s+([a-zA-Z\s]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : q.slice(0, 45);

    const { results, summary } = await searchWeb(q, topic);

    const contextSnippets = [];
    if (summary && summary.text) contextSnippets.push(`[Wikipedia Fact]:\n${summary.text}`);
    for (const r of results.slice(0, 4)) {
      if (r.text) contextSnippets.push(`[${r.domain}]:\n${r.text}`);
    }
    combinedContext = contextSnippets.join('\n\n');
  }

  // =========================================================================
  // 5. VERDANT 1 AI SYNTHESIS
  // =========================================================================
  emit('status', { text: 'Verdant 1 synthesizing answer' });
  const aiResponse = await generateAI({
    question: q,
    context: combinedContext,
    conversation,
    onStatus: (s) => emit('status', s),
    onThought: (t) => emit('thought', { text: t }),
    onToken: (t) => emit('token', { text: t }),
  });

  if (aiResponse && aiResponse.trim().length > 30) {
    return unslop(aiResponse);
  }

  // =========================================================================
  // 6. HIGH-QUALITY STRUCTURED FALLBACK
  // =========================================================================
  emit('status', { text: 'Formatting response' });
  const fallback = "I am **Verdant 1**, created by **f0undr** and the **f0undr team**. I'm here to help you explore any topic, search the live web, or write and analyze code. What would you like to explore?";
  for (const chunk of fallback.match(/\S+\s*/g) || []) {
    emit('token', { text: chunk });
  }
  return fallback;
}
