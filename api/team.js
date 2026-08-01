// Protected team room. Requires a valid WorkOS session; otherwise → login.
import { getSession, allowlistActive, configured } from '../lib/workos.js';

function esc(s = '') {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function page(user) {
  const name = esc(user.firstName || (user.email || 'there').split('@')[0]);
  const email = esc(user.email || '');
  const openWarn = allowlistActive ? '' : `
    <div class="warn">⚠ Open access — <code>TEAM_ALLOWED_EMAILS</code> is unset, so anyone with a Google account can reach this room. Set the allowlist in Vercel to lock it down.</div>`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>WeDance — Team room</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Caveat:wght@700&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root{--cream:#fbf5ea;--cream-2:#f4ead6;--ink:#3b1f0d;--brown:#5b3a1d;--amber:#9a5614;--red:#dc2626;--green:#16a34a;--border:#3b1f0d22;--max:980px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,-apple-system,sans-serif;background:var(--cream);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--red);text-decoration:none}a:hover{color:#b91c1c}
.container{max-width:var(--max);margin:0 auto;padding:0 1.5rem}
.serif{font-family:'Playfair Display',serif}
.header{position:sticky;top:0;z-index:100;background:rgba(251,245,234,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:.85rem 0}
.header .container{display:flex;justify-content:space-between;align-items:center;gap:1rem}
.logo{display:flex;align-items:center;gap:.55rem;font-family:'Playfair Display',serif;font-weight:900;font-size:1.25rem;color:var(--ink)}
.logo .dot{width:24px;height:24px;border-radius:50%;background:conic-gradient(from 210deg,var(--red),#f97316,var(--amber),var(--red));box-shadow:2px 2px 0 -1px var(--red)}
.logo .tag{font-family:'Caveat',cursive;font-weight:700;color:var(--red);font-size:1.15rem;margin-left:.15rem}
.who{display:flex;align-items:center;gap:.8rem;font-size:.85rem;color:var(--brown)}
.who b{color:var(--ink)}
.who a.out{border:1.5px solid var(--border);border-radius:999px;padding:.32rem .8rem;color:var(--ink);font-weight:600}
.who a.out:hover{border-color:var(--red);color:var(--red)}
.who a.app{color:#fff;background:linear-gradient(135deg,var(--red),#f97316);border-radius:999px;padding:.34rem .9rem;font-weight:700;box-shadow:0 3px 0 -1px #b91c1c}
.who a.app:hover{color:#fff;transform:translateY(-1px)}
.hero{padding:3.5rem 0 1.5rem}
.eyebrow{font-family:'Caveat',cursive;font-size:1.4rem;color:var(--red)}
.hero h1{font-family:'Playfair Display',serif;font-weight:900;font-size:2.4rem;letter-spacing:-.02em;margin:.2rem 0 .5rem}
.hero p{color:var(--brown);max-width:640px}
.warn{background:#fff7ed;border:1px solid #f9741633;color:#9a3412;border-radius:12px;padding:.7rem 1rem;font-size:.85rem;margin:1.25rem 0 0}
.warn code{background:#00000010;padding:.05rem .35rem;border-radius:5px}
.section{padding:2.25rem 0}
.kicker{font-size:.7rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--amber);margin-bottom:.7rem}
.section h2{font-family:'Playfair Display',serif;font-weight:900;font-size:1.5rem;margin-bottom:1rem}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:1.4rem;box-shadow:0 8px 22px rgba(59,31,18,.04)}
.link-card{display:block}
.link-card:hover{border-color:var(--red);transform:translateY(-2px);transition:all .2s}
.card h3{font-family:'Playfair Display',serif;font-size:1.05rem;margin-bottom:.3rem;color:var(--ink)}
.card p{color:var(--brown);font-size:.9rem}
.team h4{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin-bottom:.5rem}
.team ul{list-style:none;font-size:.92rem;color:var(--brown)}
.team li{padding:.18rem 0;display:flex;justify-content:space-between;gap:.5rem;border-bottom:1px dashed var(--border)}
.team li b{color:var(--ink);font-weight:600}
.team li .hold{color:var(--amber);font-size:.82rem;white-space:nowrap}
.footer{border-top:1px solid var(--border);padding:2.25rem 0;text-align:center;color:var(--brown);font-size:.85rem;margin-top:1.5rem}
@media(max-width:768px){.grid,.grid-2{grid-template-columns:1fr}.hero h1{font-size:1.8rem}.who .em{display:none}}
</style></head><body>
<header class="header"><div class="container">
  <div class="logo"><span class="dot"></span>WeDance<span class="tag">team</span></div>
  <div class="who"><span class="em">Signed in as <b>${name}</b>${email ? ` · ${email}` : ''}</span>
    <a class="out" href="/api/auth/logout">Log out</a>
    <a class="app" href="https://2026.wedance.vip">Open the app</a></div>
</div></header>

<section class="hero"><div class="container">
  <div class="eyebrow">— Internal · team only</div>
  <h1 class="serif">The team room.</h1>
  <p>Not for the public doc. Live working state, role holders, and the links we actually run WeDance from. Same commenting: flag anything and it files to Linear triage.</p>
  ${openWarn}
</div></section>

<section class="section"><div class="container">
  <div class="kicker">Where the work lives</div>
  <h2 class="serif">Working links</h2>
  <div class="grid">
    <a class="card link-card" href="https://linear.app/wedance/team/WED/active" target="_blank" rel="noopener"><h3>Linear · WED →</h3><p>125-story backlog, 8 CUJ projects, cycle 1. The source of truth for what's next.</p></a>
    <a class="card link-card" href="https://docs.google.com/spreadsheets/d/12YiUIcBd02hIIj2ua1w2bMFJSJSuIf8a64CQP7E60mg/edit" target="_blank" rel="noopener"><h3>UX workbook →</h3><p>Landing Promises index — every claim linked to its Linear issue.</p></a>
    <a class="card link-card" href="https://github.com/razbakov/wedance-2026" target="_blank" rel="noopener"><h3>GitHub →</h3><p>The 2026 app + the story files (docs/issues). Open issues, open PRs.</p></a>
    <a class="card link-card" href="https://2026.wedance.vip" target="_blank" rel="noopener"><h3>The app →</h3><p>2026.wedance.vip — real migrated data, live.</p></a>
    <a class="card link-card" href="https://github.com/razbakov/wedance-2026/blob/main/docs/issues" target="_blank" rel="noopener"><h3>Story files →</h3><p>Per-promise user stories with CUJ / JTBD / status / WSJF.</p></a>
    <a class="card link-card" href="/"><h3>Public doc →</h3><p>The outward-facing living doc at org.wedance.vip.</p></a>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="kicker">Current focus</div>
  <h2 class="serif">Cycle 1 — prove the schedule</h2>
  <div class="grid-2">
    <div class="card"><h3>The one experiment</h3><p>Validate that dancers use a digital interactive festival schedule instead of static images. Everything else is dormant until this is proven at one real festival.</p></div>
    <div class="card"><h3>Cheapest high-WSJF wins first</h3><p>Cycle 1 is seeded with the highest value-vs-effort unblocked stories — no big not-built epics that block on backend work. Bank the quick wins, sequence the differentiators.</p></div>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="kicker">Who holds what</div>
  <h2 class="serif">Roles &amp; holders</h2>
  <p style="color:var(--brown);max-width:640px;margin-bottom:1.25rem;font-size:.95rem">Delegated by consent between the two co-founders. Several operational roles run day-to-day by AI agents. Unfilled = open, name it and claim it.</p>
  <div class="grid">
    <div class="team card"><h4>Alex's team</h4><ul>
      <li><b>Product Lead</b><span class="hold">Alex Razbakov</span></li>
      <li><b>Engineer</b><span class="hold">Alex + agents</span></li>
      <li><b><a href="/team/product-steward">Product Steward →</a></b><span class="hold">Vitaly · trial</span></li>
      <li><b>Operations Manager</b><span class="hold">Autopilot</span></li>
    </ul></div>
    <div class="team card"><h4>Kirill's team</h4><ul>
      <li><b>Designer</b><span class="hold">Kirill Korshikov</span></li>
      <li><b>Partnership Manager</b><span class="hold">unfilled</span></li>
      <li><b>Marketing Lead</b><span class="hold">unfilled</span></li>
    </ul></div>
    <div class="team card"><h4>Shared</h4><ul>
      <li><b>Analyst</b><span class="hold">Autopilot</span></li>
      <li><b>Coordinator</b><span class="hold">Autopilot</span></li>
      <li><b>Autopilot (AI ops)</b><span class="hold">agents</span></li>
    </ul></div>
  </div>
</div></section>

<footer class="footer"><div class="container">
  Team room · noindex · governed by Sociocracy 3.0 · <a href="/">public doc</a>
</div></footer>
</body></html>`;
}

export default async function handler(req, res) {
  if (!configured) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(503).send(`<!doctype html><meta charset=utf-8><title>Team room — setup pending</title>
<meta name=viewport content="width=device-width,initial-scale=1">
<style>body{font-family:Inter,system-ui,sans-serif;background:#fbf5ea;color:#3b1f0d;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}.b{max-width:420px;padding:2rem}h1{font-family:'Playfair Display',Georgia,serif}a{color:#dc2626;font-weight:700}</style>
<div class=b><div style="font-size:2.4rem">🔧</div><h1>Team room is being wired up</h1>
<p>Google SSO isn't connected yet. Check back shortly.</p>
<p style="margin-top:1.25rem"><a href="/">← Public doc</a></p></div>`);
    return;
  }
  const session = await getSession(req, res);
  if (!session.authenticated) {
    res.writeHead(302, { Location: '/api/auth/login' });
    return res.end();
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(page(session.user || {}));
}
