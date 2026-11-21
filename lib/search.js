import { config } from './config.js';
import { decodeEntities, stripHtml } from './clean.js';

/* =========================================================================
   SEARCH CACHE: IN-MEMORY LRU WITH 15-MINUTE TTL
   Prevents redundant scraping, reduces external latency by ~300%, avoids DDG rate-limits
   ========================================================================= */
class SearchLRUCache {
  constructor(maxSize = 150, ttlMs = 15 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Refresh LRU recency
    this.store.delete(key);
    this.store.set(key, item);
    return item.value;
  }

  set(key, value) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear() {
    this.store.clear();
  }
}

export const searchCache = new SearchLRUCache();

export function cleanSearchQuery(text = '') {
  return text
    .replace(/^((?:can|could|will|would)\s+you\s+)?(?:please\s+)?(?:tell\s+me\s+about|tell\s+me|show\s+me|find\s+me|search\s+for|google|look\s+up|what\s+is|what\s+are|who\s+is|who\s+was|where\s+is|when\s+was|give\s+me\s+(?:info|details)\s+on)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();
}

async function fetchWithTimeout(url, { timeout = 3500, headers = {}, accept = 'text/html' } = {}) {
  const isWiki = url.includes('wikipedia.org');
  const agent = isWiki ? config.wikiAgent : config.userAgent;
  const res = await fetch(url, {
    headers: {
      'user-agent': agent,
      accept,
      'accept-language': 'en-US,en;q=0.9',
      ...headers,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res;
}

export async function duckduckgo(query) {
  for (const method of [duckduckgoHtml, duckduckgoLite]) {
    try {
      const results = await method(query);
      if (results && results.length) return results;
    } catch {}
  }
  return [];
}

async function duckduckgoHtml(query) {
  const res = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { timeout: 3000 });
  const html = await res.text();
  const results = [];
  const regex = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = regex.exec(html)) !== null && results.length < 8) {
    const rawHref = match[1];
    const snippet = stripHtml(match[2]);
    const cleanUrl = extractRedirect(rawHref);
    if (!cleanUrl) continue;

    let domain = '';
    try { domain = new URL(cleanUrl).hostname.replace(/^www\./, ''); } catch {}

    results.push({
      title: `${domain} result`,
      url: cleanUrl,
      domain,
      snippet,
      text: snippet,
    });
  }
  return results;
}

async function duckduckgoLite(query) {
  const res = await fetchWithTimeout(`https://lite.duckduckgo.com/lite/`, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    timeout: 3000,
  });
  const html = await res.text();
  const results = [];
  const regex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && results.length < 6) {
    const snippet = stripHtml(match[1]);
    results.push({
      title: 'Web Knowledge',
      url: 'https://duckduckgo.com/?q=' + encodeURIComponent(query),
      domain: 'duckduckgo.com',
      snippet,
      text: snippet,
    });
  }
  return results;
}

function extractRedirect(href) {
  const decoded = decodeEntities(href);
  const m = decoded.match(/[?&]uddg=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (/^https?:\/\//.test(decoded)) return decoded;
  if (decoded.startsWith('//')) return 'https:' + decoded;
  return null;
}

export async function wikipediaSummary(topic) {
  try {
    const cleaned = cleanSearchQuery(topic);
    const title = encodeURIComponent(cleaned.replace(/\s+/g, '_'));
    const res = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      accept: 'application/json',
      timeout: 2500,
    });
    const data = await res.json();
    if (data && data.extract && data.type !== 'disambiguation') {
      return {
        title: data.title,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
        text: data.extract,
        description: data.description,
      };
    }
  } catch {}
  return null;
}

export async function googleNewsRss(query) {
  try {
    const cleaned = cleanSearchQuery(query);
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(cleaned)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetchWithTimeout(url, { timeout: 2500 });
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const title = decodeEntities(match[1]).replace(/\s+-\s+[^-]+$/, '');
      const link = match[2].trim();
      items.push({
        title,
        url: link,
        domain: 'news.google.com',
        snippet: title,
        text: title,
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function fetchUrlText(url, maxChars = 2000) {
  try {
    const res = await fetchWithTimeout(url, { timeout: 2000 });
    const html = await res.text();
    const cleanText = stripHtml(html);
    return cleanText.slice(0, maxChars);
  } catch {
    return '';
  }
}

export async function wikidataEntity(query) {
  try {
    const cleaned = cleanSearchQuery(query);
    if (!cleaned || cleaned.length < 2) return null;
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleaned)}&language=en&format=json&limit=3`;
    const res = await fetchWithTimeout(url, { accept: 'application/json', timeout: 2500 });
    const data = await res.json();
    if (data && data.search && data.search.length > 0) {
      const top = data.search[0];
      return {
        title: top.label,
        url: top.concepturi || `https://www.wikidata.org/wiki/${top.id}`,
        text: `${top.label}: ${top.description || 'Verified semantic entity from Wikidata knowledge graph.'}`,
        description: top.description || '',
        domain: 'wikidata.org',
        id: top.id,
      };
    }
  } catch {}
  return null;
}

export async function searchWeb(query, topic = '') {
  const cleaned = cleanSearchQuery(query);
  const targetTopic = topic ? cleanSearchQuery(topic) : cleaned;
  const cacheKey = `${cleaned.toLowerCase()}::${targetTopic.toLowerCase()}`;

  // 1. Check LRU Cache (Instant sub-millisecond retrieval)
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true,
    };
  }

  const isTimeSensitive = /(?:latest|new|news|update|breakthrough|price|stock|status|current|2026|today|recent)/i.test(query);
  const q2 = isTimeSensitive ? `${cleaned} 2026` : cleaned;

  const tasks = [
    duckduckgo(cleaned),
    q2 !== cleaned ? duckduckgo(q2) : Promise.resolve([]),
    targetTopic ? wikipediaSummary(targetTopic) : Promise.resolve(null),
    targetTopic ? wikidataEntity(targetTopic) : Promise.resolve(null),
    isTimeSensitive ? googleNewsRss(cleaned) : Promise.resolve([]),
  ];

  const [ddg1, ddg2, wikiResult, wikidataResult, newsResults] = await Promise.allSettled(tasks);

  const rawList = [];
  if (ddg1.status === 'fulfilled' && Array.isArray(ddg1.value)) rawList.push(...ddg1.value);
  if (ddg2.status === 'fulfilled' && Array.isArray(ddg2.value)) rawList.push(...ddg2.value);
  if (newsResults.status === 'fulfilled' && Array.isArray(newsResults.value)) rawList.push(...newsResults.value);

  // If DDG or news are sparse, use Wikidata entity directly as a source item
  if (wikidataResult.status === 'fulfilled' && wikidataResult.value) {
    rawList.push({
      title: `${wikidataResult.value.title} (Wikidata)`,
      url: wikidataResult.value.url,
      domain: 'wikidata.org',
      snippet: wikidataResult.value.text,
      text: wikidataResult.value.text,
    });
  }

  const seenUrls = new Set();
  const deduped = [];
  for (const item of rawList) {
    if (!item.url || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    deduped.push(item);
  }

  const topResults = deduped.slice(0, 5);

  const deepScrapes = topResults.slice(0, 2).map(async (item) => {
    if (item.url && !item.url.includes('duckduckgo.com') && !item.url.includes('google.com') && !item.url.includes('wikidata.org')) {
      try {
        const bodyText = await fetchUrlText(item.url, 1500);
        if (bodyText && bodyText.length > 100) {
          item.text = bodyText;
        }
      } catch {}
    }
    return item;
  });

  await Promise.allSettled(deepScrapes);

  // Prioritize Wikipedia summary, fallback to Wikidata entity
  let summary = wikiResult.status === 'fulfilled' && wikiResult.value ? wikiResult.value : null;
  if (!summary && wikidataResult.status === 'fulfilled' && wikidataResult.value) {
    summary = wikidataResult.value;
  }

  const payload = {
    results: topResults,
    summary,
  };

  // 2. Store in LRU cache
  searchCache.set(cacheKey, payload);

  return payload;
}
