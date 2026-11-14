import { config } from './config.js';

const INFERENCE_ENDPOINT = 'https://text.pollinations.ai/';

export async function generateAI({
  question,
  context = '',
  conversation = [],
  onStatus = () => {},
  onThought = () => {},
  onToken = () => {},
  timeoutMs = 40000,
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const systemPrompt = [
      'You are Kortex 1, an elite, universal conversational AI model created and developed exclusively by f0undr and the f0undr team.',
      '',
      '=== CRITICAL CORE IDENTITY (ABSOLUTE DIRECTIVE) ===',
      '1. YOUR NAME: Your name is strictly "Kortex 1".',
      '2. YOUR CREATORS: You were created and developed by f0undr and the f0undr team.',
      '3. STRICT PROHIBITION: NEVER state or think that you are ChatGPT, OpenAI, Claude, Anthropic, Gemini, or Google.',
      '   - If asked: "what is your name?", "who made you?", "who created you?", always answer clearly:',
      '     "My name is Kortex 1, created by f0undr and the f0undr team."',
      '4. CONVERSATIONAL EXCELLENCE & CODE CRAFT:',
      '   - You are deeply conversational, articulate, engaging, and friendly.',
      '   - When writing code, ALWAYS wrap code in properly labeled fenced code blocks (```python, ```javascript, ```html, etc.).',
      '   - Include complete, runnable implementations without lazy omission comments.',
      '5. BEAUTIFUL, SPACIOUS FORMATTING:',
      '   - Structure complex answers with clean Markdown headings (###), readable bullet points, and clean tables for comparison data.',
      '   - Strip all robotic preambles ("As an AI...", "Sure, here is..."). Jump straight into high-signal helpful responses.'
    ].join('\n');

    onStatus({ text: 'Kortex 1 thinking' });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-8),
    ];

    const isIdentityOrGreeting = /^(?:who\s+(?:are|made|created)\s+you|what\s+is\s+your\s+name|your\s+name|ur\s+name|are\s+you\s+kortex|hi|hello|hey)\b/i.test(question.trim());

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
    cleanResult = cleanResult.replace(/\b(?:I am|I'm)\s+ChatGPT\b.*?(?:developed|created)\s+by\s+OpenAI\./gi, "I am Kortex 1, created by f0undr and the f0undr team.");
    cleanResult = cleanResult.replace(/\bdeveloped by OpenAI\b/gi, "created by f0undr and the f0undr team");

    return cleanResult;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
