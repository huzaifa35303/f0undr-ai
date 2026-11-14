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
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function handleChat(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const question = lastUserMsg ? lastUserMsg.content : (body.question || '');

  if (!question || !question.trim()) {
    res.writeHead(400, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Question is required' }));
  }

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    'access-control-allow-origin': '*',
  });

  let isOpen = true;
  req.on('close', () => { isOpen = false; });

  const emit = (event, data) => {
    if (isOpen && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
    }
  };

  try {
    const finalAnswer = await answer(question, emit, {
      model: 'verdant-1',
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
    res.writeHead(200, {
      'content-type': mime,
      'access-control-allow-origin': '*',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
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

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405).end();
});

server.listen(config.port, config.host, () => {
  console.log(`\n🌿 Verdant 1 by f0undr running at http://${config.host}:${config.port}\n`);
});
