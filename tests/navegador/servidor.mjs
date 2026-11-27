// Servidor estático mínimo (solo Node) para las pruebas de navegador: sirve la raíz del repo y se puede APAGAR (para probar sin internet).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
export function servir(puerto = 0) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(RAIZ, p);
    if (!f.startsWith(RAIZ) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('no existe'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  const sockets = new Set(); srv.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
  return new Promise(ok => srv.listen(puerto, '127.0.0.1', () => ok({
    url: `http://localhost:${srv.address().port}/`,
    cerrar: () => new Promise(r => { for (const s of sockets) s.destroy(); srv.close(() => r()); }),
  })));
}
