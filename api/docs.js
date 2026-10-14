// Team-only governance documents. The build renders them into private/docs
// (bundled into this function via vercel.json includeFiles, never served
// statically); this hands them out only to a signed-in, allowlisted session.
import { readFile } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';
import { getSession, configured, isAllowed } from '../lib/workos.js';

const BASE = join(process.cwd(), 'private', 'docs');

// /docs/<p> → private/docs/<p>.html, or <p>/index.html for folder pages.
async function load(p) {
  const rel = normalize(p.replace(/^\/+|\/+$/g, ''));
  if (rel.startsWith('..')) return null;
  const candidates = rel === '.' ? ['index.html'] : [rel + '.html', join(rel, 'index.html')];
  for (const c of candidates) {
    const file = join(BASE, c);
    if (!file.startsWith(BASE + sep)) return null;
    try { return await readFile(file, 'utf8'); } catch { /* try next */ }
  }
  return null;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const p = (req.query && req.query.p) || url.searchParams.get('p') || '';
  const path = Array.isArray(p) ? p.join('/') : p;
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (!configured) {
    res.status(503).send('Documents are team-only and sign-in is not configured yet.');
    return;
  }
  const session = await getSession(req, res);
  if (!session.authenticated) {
    const back = '/docs/' + path.split('/').map(encodeURIComponent).join('/');
    res.writeHead(302, { Location: '/api/auth/login?returnTo=' + encodeURIComponent(back) });
    return res.end();
  }
  // The allowlist is checked at login; re-check so removing someone takes effect
  // even while their session cookie is still valid.
  if (!isAllowed(session.user)) {
    res.status(403).send('Not on the team allowlist. <a href="/api/auth/logout">Sign out</a>');
    return;
  }

  const html = await load(path);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (html == null) {
    res.status(404).send('<!doctype html><meta charset=utf-8><title>Not found</title><p style="font-family:system-ui;padding:2rem">No such document. <a href="/docs/">All documents</a></p>');
    return;
  }
  res.status(200).send(html);
}
