import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './lib/config.js';
import { answer } from './lib/answer.js';

const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/* =========================================================================
   SECURITY & PRODUCTION HARDENING: RATE LIMITING & HEADERS
   ========================================================================= */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(ip) {
  const now = Date.now();
  const history = (rateLimitMap.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  history.push(now);
  rateLimitMap.set(ip, history);
  return false;
}

function applySecurityHeaders(res, extraHeaders = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), display-capture=(self)');
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
}

async function handleChat(req, res) {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  if (isRateLimited(clientIp)) {
    applySecurityHeaders(res);
    res.writeHead(429, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Rate limit exceeded: Please wait a moment before sending another request.' }));
  }

  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    applySecurityHeaders(res);
    res.writeHead(400, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const question = lastUserMsg ? lastUserMsg.content : (body.question || '');

  if (!question || !question.trim()) {
    applySecurityHeaders(res);
    res.writeHead(400, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Question is required' }));
  }

  applySecurityHeaders(res, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    'access-control-allow-origin': '*',
  });
  res.writeHead(200);

  let isOpen = true;
  req.on('close', () => { isOpen = false; });

  const emit = (event, data) => {
    if (isOpen && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
    }
  };

  try {
    const selectedModel = ['kortex-1', 'verdant-1', 'aura-1'].includes(body.model) ? body.model : 'kortex-1';
    const selectedTone = ['casual', 'direct', 'expert', 'eli5', 'legal-guardian', 'seo-architect', 'code-reviewer'].includes(body.tone) ? body.tone : 'casual';
    const memories = Array.isArray(body.memories) ? body.memories : [];

    const finalAnswer = await answer(question, emit, {
      model: selectedModel,
      tone: selectedTone,
      memories,
      screenContext: typeof body.screenContext === 'string' ? body.screenContext : '',
      conversation: messages,
    });
    emit('done', { text: finalAnswer });
  } catch (err) {
    emit('error', { message: err.message });
  } finally {
    if (isOpen && !res.writableEnded) res.end();
  }
}

async function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const fullPath = join(PUBLIC_DIR, reqPath);
  try {
    const content = await readFile(fullPath);
    const mime = MIME_TYPES[extname(fullPath)] || 'text/plain';

    const headers = {
      'content-type': mime,
      'access-control-allow-origin': '*',
    };

    if (reqPath === '/sw.js') {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (reqPath.match(/\.(png|jpg|svg|ico|webmanifest)$/)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    applySecurityHeaders(res, headers);
    res.writeHead(200);
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  } catch {
    applySecurityHeaders(res, { 'content-type': 'text/plain' });
    res.writeHead(404);
    res.end('File not found');
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', engine: 'Verdant 1', author: 'f0undr' }));
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res);
  }

  res.writeHead(405).end();
});

server.listen(config.port, config.host, () => {
  console.log(`\n🌿 Verdant 1 by f0undr running at http://${config.host}:${config.port}\n`);
});
