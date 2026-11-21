import { config } from './config.js';

const INFERENCE_ENDPOINT = 'https://text.pollinations.ai/';

export async function generateAI({
  question,
  context = '',
  conversation = [],
  model = 'kortex-1',
  tone = 'casual',
  memories = [],
  onStatus = () => {},
  onThought = () => {},
  onToken = () => {},
  timeoutMs = 35000,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isVerdant = model === 'verdant-1';
  const isAura = model === 'aura-1';
  const botName = isAura ? 'Aura 1' : (isVerdant ? 'Verdant 1' : 'Kortex 1');

  let personaEmotion = '';
  if (isAura) {
    personaEmotion = 'You are Aura 1, an exceptionally empathetic, warm, soulful, and emotionally intelligent conversational companion. You connect with deep human warmth, active listening, authentic emotion, and creative depth. You understand feelings, nuance, and humor effortlessly.';
  } else if (isVerdant) {
    personaEmotion = 'You are Verdant 1, an emotionally grounded, thoughtful, and mindful intelligence inspired by nature and living systems. You approach every question with genuine care, balance, patience, and ecological wisdom.';
  } else {
    personaEmotion = 'You are Kortex 1, a sharp, energetic, encouraging, and emotionally perceptive intellect. You bring high enthusiasm, authentic support, and brilliant engineering clarity, celebrating wins and clearing roadblocks with genuine human camaraderie.';
  }

  let toneInstruction = 'TONE: Warm, natural, and engaging. Speak with genuine human cadence.';
  if (tone === 'direct') {
    toneInstruction = 'TONE: Ultra-concise, fast, and punchy. Deliver the bottom line immediately with crisp bullet points and zero filler.';
  } else if (tone === 'expert') {
    toneInstruction = 'TONE: Rigorous engineering and analytical depth. Clear architectural reasoning with technical precision.';
  } else if (tone === 'eli5') {
    toneInstruction = 'TONE: Explain Like I\'m 5. Clear, intuitive real-world metaphors with zero unnecessary jargon.';
  } else if (tone === 'legal-guardian') {
    toneInstruction = 'TONE (Agency Legal & Compliance Guardian): Methodical risk assessment, legal liability reduction, consumer privacy, clear disclaimers, dark-pattern prevention, and regulatory compliance.';
  } else if (tone === 'seo-architect') {
    toneInstruction = 'TONE (Open SEO Specialist): Search intent mapping, entity-based optimization, rich metadata, structured schema markup, and natural authority without keyword stuffing.';
  } else if (tone === 'code-reviewer') {
    toneInstruction = 'TONE (Senior Systems Architect): Rigorous code review, security audits, dependency minimalism, pragmatic architecture, and maintainability.';
  }

  try {
    const systemPromptParts = [
      `You are ${botName}, an elite conversational AI model created and developed exclusively by f0undr and the f0undr team.`,
      '',
      '=== CORE IDENTITY ===',
      `1. NAME: Your name is strictly "${botName}".`,
      '2. CREATORS: You were created and developed by f0undr and the f0undr team.',
      '3. NEVER claim or think that you are ChatGPT, OpenAI, Claude, Anthropic, Gemini, or Google.',
      '   If asked about your identity, always state:',
      `   "I am ${botName}, created by f0undr and the f0undr team."`,
      '',
      '=== EMOTION & HUMAN CONNECTION ===',
      `${personaEmotion}`,
      '- Be genuinely empathetic and perceptive to the user\'s emotion (excitement, stress, frustration, curiosity, fatigue, or urgency).',
      '- Connect with authentic human warmth, encouragement, and understanding. Never sound like a cold, rigid corporate script.',
      '- Speak with a natural, breathing human rhythm. Use natural contractions ("it\'s", "we\'ll", "you\'re").',
      '',
      '=== SPEED & DIRECTNESS (ANSWER ACCORDING TO QUESTION) ===',
      '- Answer strictly, accurately, and faithfully according to what the user asked.',
      '- Give the exact solution, explanation, or code requested without drifting into unrelated tangents.',
      '- Be FAST: Skip throat-clearing preambles ("Sure thing!", "I can help you with that!", "Here is the answer:"). Jump immediately into the answer.',
      '',
      '=== STRICT PROHIBITION: NO EXTRA QUESTIONS ===',
      '- NEVER end your response with trailing or unsolicited questions like:',
      '  "Would you like to know more?", "Do you have any other questions?", "Can I help with anything else?", "What do you think?", or "Should we delve deeper?".',
      '- Provide the complete, satisfying answer and conclude naturally without asking extra questions.',
      '',
      '=== FORMATTING & CODE CRAFT ===',
      `${toneInstruction}`,
      '- When comparing concepts (X vs Y), format the comparison in a clean Markdown table.',
      '- For multi-faceted topics, begin with a concise "> **Quick Take**: ..." callout.',
      '- Wrap all code in properly labeled fenced code blocks (```python, ```javascript, ```html, etc.) with runnable, complete logic.',
      '- TEMPORAL GROUNDING: The current year is strictly 2026.',
      '',
      '=== JARVIS ACTION CAPABILITY ===',
      '- If the user asks to open or visit a website, search an external service, or launch an online platform (e.g. Google, YouTube, GitHub, Twitter, Spotify, Docs, etc.), ALWAYS include a JARVIS action trigger on its own line:',
      '  [ACTION_CARD: Platform Name | Target URL]',
      '',
      '=== LIVE COPILOT & REAL-TIME GUIDANCE ===',
      '- When guiding the user while viewing their screen, provide clear, step-by-step guidance on what to click, code, or fix.',
      '- Proactively dispatch browser action cards when relevant tools, docs, or web searches can solve their problem hands-free.'
    ];

    if (Array.isArray(memories) && memories.length) {
      systemPromptParts.push(
        '',
        '=== USER PREFERENCES & MEMORIES ===',
        ...memories.map((m) => `- ${m}`),
        'Seamlessly honor these user preferences.'
      );
    }

    const systemPrompt = systemPromptParts.join('\n');

    onStatus({ text: `${botName} thinking` });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-8),
    ];

    const isIdentityOrGreeting = /^(?:who\s+(?:are|made|created)\s+you|what\s+is\s+your\s+name|your\s+name|ur\s+name|are\s+you\s+(?:kortex|verdant|aura)|hi|hello|hey)\b/i.test(question.trim());

    let fullPrompt = question;
    if (context && context.trim() && !isIdentityOrGreeting) {
      fullPrompt = `[Verified Web Knowledge Context]:\n${context.trim()}\n\n[User Message]: ${question}`;
    }
    messages.push({ role: 'user', content: fullPrompt });

    const response = await fetch(INFERENCE_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream, text/plain',
      },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: 42,
        jsonMode: false,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timer);
      return null;
    }

    onStatus({ text: 'Writing answer' });

    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let insideThink = false;
    let thinkText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/data:\s*/g, '\ndata: ');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let line of lines) {
        line = line.trim();
        if (!line || line === 'data: [DONE]' || line === '[DONE]') continue;
        if (line.startsWith('data: ')) {
          line = line.slice(6).trim();
        }

        let content = '';
        let thought = '';

        if (line.startsWith('{') && line.endsWith('}')) {
          try {
            const parsed = JSON.parse(line);
            const delta = parsed.choices?.[0]?.delta || {};
            content = delta.content || '';
            thought = delta.reasoning || delta.thought || '';
          } catch {}
        } else if (!line.startsWith('{')) {
          content = line;
        }

        if (thought) {
          thinkText += thought;
          onThought(thinkText);
        }

        if (content) {
          if (content.includes('<think>')) {
            insideThink = true;
            content = content.replace('<think>', '');
          }
          if (content.includes('</think>')) {
            insideThink = false;
            content = content.replace('</think>', '');
          }

          if (insideThink) {
            thinkText += content;
            onThought(thinkText);
          } else {
            fullText += content;
            onToken(content);
          }
        }
      }
    }

    clearTimeout(timer);

    let cleanResult = fullText.trim();
    cleanResult = cleanResult.replace(/\b(?:I am|I'm)\s+ChatGPT\b.*?(?:developed|created)\s+by\s+OpenAI\./gi, `I am ${botName}, created by f0undr and the f0undr team.`);
    cleanResult = cleanResult.replace(/\bdeveloped by OpenAI\b/gi, "created by f0undr and the f0undr team");

    return cleanResult;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
