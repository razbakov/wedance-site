// AuthKit redirects here with ?code. Exchange it, seal the session into a cookie,
// then send the user to /team. Enforces the optional team allowlist.
import { workos, CLIENT_ID, COOKIE_PASSWORD, setSessionCookie, isAllowed } from '../../lib/workos.js';

function deniedPage(user) {
  const email = (user && user.email) || 'your account';
  return `<!doctype html><meta charset=utf-8><title>Access pending — WeDance</title>
<meta name=viewport content="width=device-width,initial-scale=1">
<style>body{font-family:Inter,system-ui,sans-serif;background:#fbf5ea;color:#3b1f0d;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}
.b{max-width:460px;padding:2rem}h1{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem}
a{color:#dc2626;font-weight:700}</style>
<div class=b><div style="font-size:2.4rem">🔒</div>
<h1>Not on the team list yet</h1>
<p>You're signed in as <b>${email}</b>, but that address isn't on the WeDance team allowlist.</p>
<p>Ask Alex to add you, then <a href="/api/auth/login">try again</a>.</p>
<p style="margin-top:1.5rem"><a href="/">← Back to the public doc</a></p></div>`;
}

export default async function handler(req, res) {
  const code = (req.query && req.query.code)
    || new URL(req.url, `https://${req.headers.host}`).searchParams.get('code');
  if (!code) { res.writeHead(302, { Location: '/api/auth/login' }); return res.end(); }
  try {
    const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: CLIENT_ID,
      session: { sealSession: true, cookiePassword: COOKIE_PASSWORD },
    });
    if (!isAllowed(user)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(403).send(deniedPage(user));
      return;
    }
    console.log('[callback] ok user=%s sealedLen=%d', user && user.email, (sealedSession || '').length);
    setSessionCookie(res, sealedSession);
    res.writeHead(302, { Location: '/team' });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: '/?auth_error=' + encodeURIComponent(e.message || 'failed') });
    res.end();
  }
}
