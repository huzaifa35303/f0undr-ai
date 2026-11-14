import { tokenize, tokenOverlap } from './indexer.js';

const BOILERPLATE =
  /(cookie|javascript|enable js|sign in|sign up|log in|subscribe|newsletter|all rights reserved|privacy policy|terms of (use|service)|advertisement|©|skip to content|follow us|share this|read more|click here|image caption)/i;

const COMMERCIAL_PITCH =
  /^(get|find|read|see|click|browse|discover|explore|view|check|stay|learn|shop|buy|download|sign|join|follow|subscribe|track|compare)\b/i;

const NUMBER_OR_METRIC = /\b(\d+([.,]\d+)?%?|\$\d+|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\b)/i;

export function scoreSentence(sentence, { idf, wantsNumber = false, position = 0 }) {
  if (BOILERPLATE.test(sentence)) return 0;
  if (COMMERCIAL_PITCH.test(sentence)) return 0;
  if (sentence.length < 25 || sentence.length > 320) return 0;

  const words = tokenize(sentence);
  if (!words.length) return 0;

  let score = 0;
  for (const w of words) {
    score += idf.get(w) || 0.1;
  }

  if (wantsNumber && NUMBER_OR_METRIC.test(sentence)) {
    score *= 1.35;
  }

  const posDiscount = 1 / Math.sqrt(position + 1);
  return score * posDiscount;
}

export function extractBestSentences(pool, targetCount = 4) {
  if (!pool.length) return [];

  pool.sort((a, b) => b.score - a.score);

  const selected = [];
  const seenSets = [];

  for (const item of pool) {
    if (selected.length >= targetCount) break;
    const tokens = new Set(tokenize(item.sentence));

    if (seenSets.some((seen) => tokenOverlap(tokens, seen) > 0.5)) {
      continue;
    }

    seenSets.push(tokens);
    selected.push(item.sentence);
  }

  return selected;
}
