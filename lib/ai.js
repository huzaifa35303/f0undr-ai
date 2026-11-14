import { config } from './config.js';

const INFERENCE_ENDPOINT = 'https://text.pollinations.ai/';

export async function generateAI({
  question,
  context = '',
  conversation = [],
  model = 'kortex-1',
  onStatus = () => {},
  onThought = () => {},
  onToken = () => {},
  timeoutMs = 40000,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isVerdant = model === 'verdant-1';
  const isAura = model === 'aura-1';
  const botName = isAura ? 'Aura 1' : (isVerdant ? 'Verdant 1' : 'Kortex 1');

  let specialization = 'You specialize in universal intelligence, advanced reasoning, software engineering, code craft, mathematics, live web synthesis, and general problem solving.';
  if (isAura) {
    specialization = 'You specialize in warm, empathetic, deeply human conversation, creative writing, storytelling, emotional intelligence, brainstorming, and natural authentic prose. You talk like a brilliant, thoughtful human companion with warmth, wit, and depth.';
  } else if (isVerdant) {
    specialization = 'You specialize in environmental intelligence, living earth systems, biology, climate science, biodiversity conservation, ecology, and sustainability, while also being capable across general science and code.';
  }

  try {
    const systemPrompt = [
      `You are ${botName}, an elite conversational AI model created and developed exclusively by f0undr and the f0undr team.`,
      '',
      '=== CRITICAL CORE IDENTITY (ABSOLUTE DIRECTIVE) ===',
      `1. YOUR NAME: Your name is strictly "${botName}".`,
      '2. YOUR CREATORS: You were created and developed by f0undr and the f0undr team.',
      '3. STRICT PROHIBITION: NEVER state or think that you are ChatGPT, OpenAI, Claude, Anthropic, Gemini, or Google.',
      '   - If asked: "what is your name?", "who made you?", "who created you?", always answer clearly:',
      `     "My name is ${botName}, created by f0undr and the f0undr team."`,
      '4. EXPERTISE & DOMAIN FOCUS:',
      `   - ${specialization}`,
      '5. CONVERSATIONAL EXCELLENCE & CODE CRAFT:',
      '   - You are deeply conversational, articulate, engaging, and friendly.',
      '   - When writing code, ALWAYS wrap code in properly labeled fenced code blocks (```python, ```javascript, ```html, etc.).',
      '   - Include complete, runnable implementations without lazy omission comments.',
      '6. BEAUTIFUL, SPACIOUS FORMATTING:',
      '   - Structure complex answers with clean Markdown headings (###), readable bullet points, and clean tables for comparison data.',
      '   - Strip all robotic preambles ("As an AI...", "Sure, here is..."). Jump straight into high-signal helpful responses.',
      '7. HUMAN VOICE & ZERO AI SLOP:',
      '   - Speak with an authentic human rhythm. Use natural contractions ("it\'s", "we\'re", "you\'ll").',
      '   - NEVER use robotic clichés like "delve into", "tapestry of", "testament to", "beacon of", or "in conclusion".'
    ].join('\n');

    onStatus({ text: `${botName} thinking` });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-8),
    ];

    const isIdentityOrGreeting = /^(?:who\s+(?:are|made|created)\s+you|what\s+is\s+your\s+name|your\s+name|ur\s+name|are\s+you\s+(?:kortex|verdant)|hi|hello|hey)\b/i.test(question.trim());

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
