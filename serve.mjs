import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([['/', ['index.html', 'text/html']], ['/style.css', ['style.css', 'text/css']], ['/app.mjs', ['app.mjs', 'text/javascript']], ['/compare.mjs', ['compare.mjs', 'text/javascript']]]);
createServer(async (req, res) => {
  const entry = files.get(req.url);
  if (!entry || req.method !== 'GET') { res.writeHead(404).end(); return; }
  const [path, type] = entry;
  try { res.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' }).end(await readFile(new URL(path, import.meta.url))); }
  catch { res.end(); }
}).listen(4394, '127.0.0.1', () => console.log('http://127.0.0.1:4394/'));
