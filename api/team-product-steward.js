// Protected role page — Product Steward (Delegation Canvas).
// Same WorkOS gate as /team: a valid session is required, otherwise → login.
// Lives ONLY under the gated /team layer; never linked from the public doc.
import { getSession, configured } from '../lib/workos.js';

function page() {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>WeDance — Product Steward · role</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Caveat:wght@400;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root{--cream:#fbf5ea;--cream-2:#f4ead6;--ink:#3b1f0d;--brown:#5b3a1d;--amber:#9a5614;--red:#dc2626;--green:#16a34a;--border:#3b1f0d22;--max:820px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--cream);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--red);text-decoration:none;transition:color .2s}a:hover{color:#b91c1c}
.serif{font-family:'Playfair Display',serif}
.container{max-width:var(--max);margin:0 auto;padding:0 1.5rem}
.header{position:sticky;top:0;z-index:100;background:rgba(251,245,234,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:.85rem 0}
.header .container{display:flex;justify-content:space-between;align-items:center;gap:1rem;max-width:980px}
.logo{display:flex;align-items:center;gap:.55rem;font-family:'Playfair Display',serif;font-weight:900;font-size:1.25rem;color:var(--ink)}
.logo .dot{width:24px;height:24px;border-radius:50%;background:conic-gradient(from 210deg,var(--red),#f97316,var(--amber),var(--red));box-shadow:2px 2px 0 -1px var(--red)}
.logo .tag{font-family:'Caveat',cursive;font-weight:700;color:var(--red);font-size:1.15rem;margin-left:.15rem}
.nav{display:flex;gap:1.3rem;align-items:center}
.nav a{color:var(--brown);font-size:.9rem;font-weight:600}.nav a:hover{color:var(--red)}
.nav .app{color:#fff;background:linear-gradient(135deg,var(--red),#f97316);padding:.38rem .9rem;border-radius:999px}.nav .app:hover{color:#fff}
.hero{padding:3rem 0 1rem}
.back{font-size:.85rem;font-weight:600;color:var(--amber);display:inline-block;margin-bottom:1.1rem}
.eyebrow{font-family:'Caveat',cursive;font-size:1.35rem;color:var(--red)}
h1.title{font-family:'Playfair Display',serif;font-weight:900;font-size:2.4rem;letter-spacing:-.02em;margin:.15rem 0 .5rem}
.badges{display:flex;flex-wrap:wrap;gap:.5rem;margin:.4rem 0 .2rem}
.badge{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:.26rem .7rem;border-radius:999px}
.b-trial{background:#9a561418;color:var(--amber)}
.b-verify{background:#0891b218;color:#0891b2}
.callout{background:#fff;border:1px solid var(--border);border-left:4px solid var(--amber);border-radius:12px;padding:1rem 1.2rem;margin:1.25rem 0;color:var(--brown);font-size:.95rem}
.callout strong{color:var(--ink)}
.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem .9rem;background:var(--cream-2);border:1px solid var(--border);border-radius:14px;padding:1rem 1.2rem;margin:1rem 0 .5rem;font-size:.9rem}
.meta div{color:var(--brown)}.meta b{color:var(--ink);font-weight:600}
.body{padding:1rem 0 2rem}
.rsec{margin-bottom:2rem}
.rsec h2{font-family:'Playfair Display',serif;font-weight:700;font-size:1.4rem;margin:0 0 .6rem;color:var(--ink)}
.rsec p{color:var(--brown);margin-bottom:.75rem}
.rsec ul,.rsec ol{margin:.25rem 0 .5rem;padding-left:0;list-style:none;counter-reset:li}
.rsec ul li{color:var(--brown);padding:.35rem 0 .35rem 1.4rem;position:relative}
.rsec ul li::before{content:'';position:absolute;left:0;top:.95rem;width:7px;height:7px;border-radius:50%;background:var(--red);opacity:.5}
.rsec ol li{color:var(--brown);padding:.4rem 0 .4rem 2.1rem;position:relative;counter-increment:li}
.rsec ol li::before{content:counter(li);position:absolute;left:0;top:.5rem;width:1.4rem;height:1.4rem;border-radius:50%;background:#fff;border:1.5px solid var(--border);color:var(--amber);font-size:.78rem;font-weight:700;display:grid;place-items:center}
.rsec strong{color:var(--ink)}
.rsec code{background:#00000010;padding:.05rem .35rem;border-radius:5px;font-size:.88em}
.tbl-wrap{overflow-x:auto;margin:.4rem 0 .5rem}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;font-size:.9rem}
th,td{text-align:left;padding:.65rem .85rem;border-bottom:1px solid var(--border);color:var(--brown);vertical-align:top}
th{background:var(--cream-2);color:var(--ink);font-weight:700;font-size:.8rem;letter-spacing:.02em}
tr:last-child td{border-bottom:none}
td strong,th strong{color:var(--ink)}
.footer{border-top:1px solid var(--border);padding:2.25rem 0;text-align:center;color:var(--brown);font-size:.85rem;margin-top:1rem}
@media(max-width:768px){h1.title{font-size:1.85rem}.meta{grid-template-columns:1fr}.nav a:not(.app){display:none}}
</style></head><body>
<header class="header"><div class="container">
  <div class="logo"><span class="dot"></span>WeDance<span class="tag">team</span></div>
  <nav class="nav">
    <a href="/team">Team room</a>
    <a href="/api/auth/logout">Log out</a>
    <a class="app" href="https://2026.wedance.vip">Open the app</a>
  </nav>
</div></header>

<section class="hero"><div class="container">
  <a class="back" href="/team">← Team room</a>
  <div class="eyebrow">— Internal · team only · role</div>
  <h1 class="title serif">Product Steward — Role Description</h1>
  <div class="badges">
    <span class="badge b-trial">3-month trial · review 2026-11-01</span>
    <span class="badge b-verify">Verification layer</span>
  </div>
  <p style="color:var(--brown)">Delegation Canvas</p>

  <div class="callout">
    <strong>Entry title:</strong> Quality &amp; Platform Steward · <strong>Destination title:</strong> Product Steward (→ CTO).<br>
    This is a term-limited, graduation-based role. The keeper enters at the Quality &amp;
    Platform scope and grows into full Product Steward ownership when the graduation
    triggers below are met.
  </div>

  <div class="meta">
    <div><b>Role Keeper:</b> Vitaly (incoming — trial term)</div>
    <div><b>Date/Version:</b> 2026-08-01</div>
    <div><b>Delegator:</b> Alex Razbakov</div>
    <div><b>Term:</b> 3-month trial (entry scope)</div>
    <div><b>Review date:</b> 2026-11-01</div>
  </div>
</div></section>

<section class="body"><div class="container">

  <div class="rsec">
    <h2 class="serif">Why this role exists (the AI-native premise)</h2>
    <p>WeDance is built by AI agents against codified engineering best-practices. Coding-hours
    are no longer the scarce resource — <strong>generation is cheap, so trust is the bottleneck.</strong>
    When agents ship fast, the highest-leverage human job is <em>verification</em>: guaranteeing the
    output is correct, safe, and stays running. This role owns that gate. It is not a support
    function under engineering — in an AI-native org it <em>is</em> the senior engineering function.</p>
  </div>

  <div class="rsec">
    <h2 class="serif">The direction / verification boundary (read this first)</h2>
    <p>There are only two scarce human jobs left; the agents do the building between them.</p>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Job</th><th>Who owns it</th><th>Scope</th></tr></thead>
      <tbody>
        <tr><td><strong>Direction</strong> — <em>what to build, why, what "good" means</em></td><td><strong>Alex</strong> (stays)</td><td>Roadmap, user/market calls, product intent, priorities</td></tr>
        <tr><td><strong>Verification</strong> — <em>is the output correct, safe, and still working?</em></td><td><strong>Product Steward</strong> (this role)</td><td>Evals, tests, regression, health, uptime, maintenance, the build pipeline &amp; practices</td></tr>
      </tbody>
    </table></div>
    <p>The keeper points the agents <em>at correctness</em>; Alex points them <em>at the right thing</em>.
    Handing over Direction is a separate, later, founder-succession decision — explicitly
    <strong>not</strong> part of this role's entry or graduation scope.</p>
  </div>

  <div class="rsec">
    <h2 class="serif">Purpose</h2>
    <p><strong>Primary Driver:</strong> AI agents build everything, but nobody currently owns whether their
    output is trustworthy, healthy, and maintained over time. That accountability keeps
    falling back to Alex, who has a full-time job and cannot be the permanent quality gate.</p>
    <p><strong>Main Requirement:</strong> Own the verification layer end-to-end — the eval/test/regression
    harness, product health, maintenance, and the AI-engineering best-practices themselves —
    so the founder can trust what the agents ship without personally checking it.</p>
  </div>

  <div class="rsec">
    <h2 class="serif">Key Responsibilities (entry scope)</h2>
    <ul>
      <li>Own the automated test + eval harness across the WeDance codebases (start: wedance-2026)</li>
      <li>Build and maintain E2E + regression coverage for the <strong>12 CUJ funnel events</strong> already
      instrumented in PostHog (week_plan_add, year_plan_add, signup_completed,
      onboarding_completed, booking_request_submitted, festival_draft_submitted, etc.)</li>
      <li>Own product <strong>health &amp; uptime</strong> — monitoring, error surfacing, "is it actually working"</li>
      <li>Own <strong>maintenance</strong> — dependency health, tech-debt paydown, keeping deploys green</li>
      <li>Steward and <em>evolve</em> the AI-engineering best-practices that produce the code (the
      build pipeline, agent conventions, quality gates) — not just consume them</li>
      <li>Review and gate AI-agent (Engineer role) output before it ships</li>
      <li><strong>Learn the AI-build method by pairing with Alex on 1–2 live builds</strong> (explicit goal —
      this is why Vitaly is here; it doesn't happen by osmosis from testing alone)</li>
    </ul>
  </div>

  <div class="rsec">
    <h2 class="serif">Responsibilities gained at graduation (destination scope)</h2>
    <ul>
      <li>Full technical ownership of the product and its roadmap <em>execution</em> (not direction)</li>
      <li>Sole accountability for platform health, releases, and the AI-build system</li>
      <li>Title moves to <strong>Product Steward / CTO</strong></li>
    </ul>
  </div>

  <div class="rsec">
    <h2 class="serif">Customers and Deliverables</h2>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Customer</th><th>Deliverable</th></tr></thead>
      <tbody>
        <tr><td>Alex</td><td>A product he can trust without personally verifying agent output; green regression suite; health he doesn't have to watch</td></tr>
        <tr><td>Users (dancers/organizers)</td><td>A product that works and stays working across releases</td></tr>
        <tr><td>Engineer (AI agent)</td><td>Clear acceptance criteria + quality gates its output is measured against</td></tr>
      </tbody>
    </table></div>
  </div>

  <div class="rsec">
    <h2 class="serif">Dependencies</h2>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Provider</th><th>What they deliver</th></tr></thead>
      <tbody>
        <tr><td>Alex</td><td>Product direction, "what good means," architectural intent, pairing time on builds</td></tr>
        <tr><td>Engineer (AI agent)</td><td>Implementations, PRs, first-pass tests</td></tr>
        <tr><td>PostHog</td><td>The CUJ funnel event stream that regression is verified against</td></tr>
      </tbody>
    </table></div>
  </div>

  <div class="rsec">
    <h2 class="serif">External Constraints (what this role does NOT decide)</h2>
    <ul>
      <li>Cannot set product <strong>direction</strong> — what to build / why / priorities stay with Alex</li>
      <li>Cannot make roadmap or user/market calls — proposes; Alex decides</li>
      <li>Operates within the codified best-practices; may <em>evolve</em> them via consent, not override unilaterally</li>
    </ul>
  </div>

  <div class="rsec">
    <h2 class="serif">Graduation triggers (entry → destination)</h2>
    <p>Product Steward scope + title transfer when <strong>all</strong> hold:</p>
    <ol>
      <li>Regression + E2E suite is green and covers the 12 CUJ funnel events on wedance-2026</li>
      <li>Keeper has shipped and maintained ≥ 1 non-trivial feature end-to-end via the AI-build pipeline</li>
      <li>Keeper owns the build pipeline &amp; quality gates without Alex in the loop</li>
      <li>A clean review at the 2026-11-01 checkpoint with mutual consent to continue</li>
    </ol>
  </div>

  <div class="rsec">
    <h2 class="serif">Onboarding path (the first 3 months)</h2>
    <ol>
      <li><strong>Context</strong> — read <code>org.wedance.vip</code> (the living doc <em>is</em> the brief); understand the CUJ funnel and codebase layout</li>
      <li><strong>Alignment call</strong> — confirm appetite for <em>verification/health</em> ownership (not direction); confirm he understands the org is Alex + AI agents</li>
      <li><strong>Consent into entry role</strong> — this canvas, term-limited to 2026-11-01</li>
      <li><strong>First deliverable (~2 weeks):</strong> stand up the E2E + regression suite for the 12 CUJ funnel events on wedance-2026 — real, shippable value that also teaches the codebase deeply</li>
      <li><strong>Access follows proof</strong> — add his email to <code>TEAM_ALLOWED_EMAILS</code> for <code>/team</code>, Telegram, tooling <em>after</em> the first deliverable lands</li>
    </ol>
  </div>

  <div class="rsec">
    <h2 class="serif">Competencies, Qualities, and Skills</h2>
    <ul>
      <li>Professional QA + automated-testing depth (his stated love — the core fit)</li>
      <li>Regression/stability temperament — allergic to things silently breaking (ideal for maintenance)</li>
      <li>Willingness to learn AI-driven building, not just testing</li>
      <li>S3 governance awareness — understands the consent boundary vs founder direction</li>
    </ul>
  </div>

  <div class="rsec">
    <h2 class="serif">Key Metrics and Monitoring</h2>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Metric</th><th>How Measured</th><th>Frequency</th><th>Measured By</th></tr></thead>
      <tbody>
        <tr><td>CUJ regression coverage</td><td>% of the 12 funnel events covered by automated E2E/regression</td><td>Weekly</td><td>Vitaly</td></tr>
        <tr><td>Suite health</td><td>Regression suite green on every deploy</td><td>Per deploy</td><td>Vitaly</td></tr>
        <tr><td>Trust delegation</td><td>Alex ships agent output without personally verifying it</td><td>Monthly</td><td>Alex</td></tr>
        <tr><td>Product health</td><td>Uptime / error rate within target; no unowned incidents</td><td>Continuous</td><td>Vitaly</td></tr>
      </tbody>
    </table></div>
  </div>

  <div class="rsec">
    <h2 class="serif">Evaluation Schedule</h2>
    <p>Trial review at <strong>2026-11-01</strong>. Evaluate against the four graduation triggers. Outcomes:
    graduate to Product Steward, renew entry term, or part ways cleanly (term-limited by design —
    no awkward exit).</p>
  </div>

</div></section>

<footer class="footer"><div class="container">
  Team room · noindex · governed by Sociocracy 3.0 · <a href="/team">← Team room</a> · <a href="/">public doc</a>
</div></footer>
</body></html>`;
}

export default async function handler(req, res) {
  if (!configured) {
    res.writeHead(302, { Location: '/team' });
    return res.end();
  }
  const session = await getSession(req, res);
  if (!session.authenticated) {
    res.writeHead(302, { Location: '/api/auth/login' });
    return res.end();
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(page());
}
