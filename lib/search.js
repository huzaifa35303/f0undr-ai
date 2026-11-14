import { config } from './config.js';
import { decodeEntities, stripHtml } from './clean.js';

async function fetchWithTimeout(url, { timeout = 12000, headers = {}, accept = 'text/html' } = {}) {
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
  const res = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
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
    const title = encodeURIComponent(topic.trim().replace(/\s+/g, '_'));
    const res = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      accept: 'application/json',
      timeout: 8000,
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
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetchWithTimeout(url, { timeout: 8000 });
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

export async function fetchUrlText(url, maxChars = 5000) {
  try {
    const res = await fetchWithTimeout(url, { timeout: 10000 });
    const html = await res.text();
    const cleanText = stripHtml(html);
    return cleanText.slice(0, maxChars);
  } catch {
    return '';
  }
}

export async function searchWeb(query, topic = '') {
  const tasks = [
    duckduckgo(query),
    topic ? wikipediaSummary(topic) : Promise.resolve(null),
    googleNewsRss(query),
  ];

  const [ddgResults, wikiResult, newsResults] = await Promise.allSettled(tasks);

  const results = [];
  if (ddgResults.status === 'fulfilled' && Array.isArray(ddgResults.value)) {
    results.push(...ddgResults.value);
  }
  if (newsResults.status === 'fulfilled' && Array.isArray(newsResults.value)) {
    results.push(...newsResults.value);
  }

  const summary = wikiResult.status === 'fulfilled' ? wikiResult.value : null;

  return {
    results: results.slice(0, 10),
    summary,
  };
}
