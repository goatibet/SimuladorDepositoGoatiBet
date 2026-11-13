/* Servidor estático mínimo para desenvolvimento (Node 18+, sem dependências).
   Uso: node scripts/dev-server.mjs [raiz] [porta] */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 4321);

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = join(root, normalize(caminho).replace(/^(\.\.[/\\])+/, ''));
  try {
    const corpo = await readFile(arquivo);
    res.writeHead(200, {
      'content-type': types[extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(corpo);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 — não encontrado');
  }
}).listen(port, () => console.log(`Servindo ${root} em http://localhost:${port}`));
