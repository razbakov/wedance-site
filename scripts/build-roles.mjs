// Generate styled, shareable role pages from the canonical markdown in roles/.
// Source of truth = roles/*.md. Run `npm run build:roles` after editing them.
// Emits roles/<slug>.html — served at /roles/<slug> (cleanUrls in vercel.json).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROLES = join(ROOT, 'roles')

const STATUS = {
  'seeking-human': { label: 'Seeking people', fg: '#16a34a', bg: '#16a34a18' },
  'agent-run':     { label: 'Agent-run · open', fg: '#0891b2', bg: '#0891b218' },
  'dormant':       { label: 'Dormant', fg: '#9a5614', bg: '#9a561418' },
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// minimal inline markdown: **bold** and [text](url)
function inline(s) {
  let out = esc(s)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return out
}

// render a section body (paragraphs + `- ` lists) to HTML
function body(md) {
  const lines = md.split('\n')
  let html = '', list = [], para = []
  const flushP = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = [] } }
  const flushL = () => { if (list.length) { html += `<ul>${list.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`; list = [] } }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushP(); flushL(); continue }
    if (line.startsWith('- ')) { flushP(); list.push(line.slice(2)); continue }
    flushL(); para.push(line)
  }
  flushP(); flushL()
  return html
}

function parse(md) {
  const lines = md.split('\n')
  let title = 'Circle'
  const meta = {}
  const sections = []
  let cur = null // { heading, raw: [] }
  let inMeta = true
  for (const raw of lines) {
    const h1 = raw.match(/^#\s+(.+)$/)
    const h2 = raw.match(/^##\s+(.+)$/)
    if (h1) { title = h1[1].trim(); continue }
    if (h2) { inMeta = false; cur = { heading: h2[1].trim(), raw: [] }; sections.push(cur); continue }
    if (cur) { cur.raw.push(raw); continue }
    if (inMeta) {
      const m = raw.match(/^-\s+\*\*([^:]+):\*\*\s+(.+)$/)
      if (m) meta[m[1].trim().toLowerCase()] = m[2].trim()
    }
  }
  for (const s of sections) { s.text = s.raw.join('\n'); s.html = body(s.text) }
  return { title, meta, sections }
}

function ogDescription(parsed) {
  const driver = parsed.sections.find(s => /driver/i.test(s.heading))
  const text = (driver?.text || '').replace(/\n+/g, ' ')
    .replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
  return text.slice(0, 155)
}

function page({ title, meta, sections }, ogDesc) {
  const st = STATUS[(meta.status || '').toLowerCase()] || STATUS['dormant']
  const sectionsHtml = sections.map(s =>
    `<section class="rsec"><h2 class="serif">${esc(s.heading)}</h2>${s.html}</section>`
  ).join('\n')
  const phase = meta.phase ? `<span class="phase">${esc(meta.phase)}</span>` : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WeDance — ${esc(title)} circle</title>
<meta name="description" content="${esc(ogDesc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="WeDance — ${esc(title)} circle">
<meta property="og:description" content="${esc(ogDesc)}">
<meta property="og:url" content="https://org.wedance.vip/roles/${meta._slug}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Caveat:wght@400;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root{--cream:#fbf5ea;--cream-2:#f4ead6;--ink:#3b1f0d;--brown:#5b3a1d;--amber:#9a5614;--red:#dc2626;--border:#3b1f0d22}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--cream);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--red);text-decoration:none;transition:color .2s}
a:hover{color:#b91c1c}
.serif{font-family:'Playfair Display',serif}
.container{max-width:720px;margin:0 auto;padding:0 1.5rem}
.header{position:sticky;top:0;z-index:100;background:rgba(251,245,234,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:.9rem 0}
.header .container{display:flex;justify-content:space-between;align-items:center;max-width:980px}
.logo{display:flex;align-items:center;gap:.55rem;font-family:'Playfair Display',serif;font-weight:900;font-size:1.3rem;color:var(--ink)}
.logo .dot{width:26px;height:26px;border-radius:50%;background:conic-gradient(from 210deg,var(--red),#f97316,var(--amber),var(--red));box-shadow:2px 2px 0 -1px var(--red)}
.nav{display:flex;gap:1.4rem;align-items:center}
.nav a{color:var(--brown);font-size:.9rem;font-weight:600}
.nav a:hover{color:var(--red)}
.nav .app{color:#fff;background:linear-gradient(135deg,var(--red),#f97316);padding:.4rem .9rem;border-radius:999px}
.hero{padding:3.5rem 0 1.5rem}
.back{font-size:.85rem;font-weight:600;color:var(--amber);display:inline-block;margin-bottom:1.25rem}
.badge{display:inline-block;font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:.28rem .7rem;border-radius:999px}
.phase{display:block;font-family:'Caveat',cursive;color:var(--amber);font-size:1.15rem;margin-top:.6rem}
h1.title{font-family:'Playfair Display',serif;font-weight:900;font-size:2.6rem;letter-spacing:-.02em;margin:.9rem 0 .3rem}
.eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--amber)}
.body{padding:1rem 0 2rem}
.rsec{margin-bottom:2rem}
.rsec h2{font-family:'Playfair Display',serif;font-weight:700;font-size:1.4rem;margin-bottom:.6rem;color:var(--ink)}
.rsec p{color:var(--brown);margin-bottom:.75rem}
.rsec ul{list-style:none;margin:.25rem 0}
.rsec li{color:var(--brown);padding:.35rem 0 .35rem 1.4rem;position:relative}
.rsec li::before{content:'';position:absolute;left:0;top:.95rem;width:7px;height:7px;border-radius:50%;background:var(--red);opacity:.5}
.rsec strong{color:var(--ink)}
.cta{display:flex;gap:.8rem;flex-wrap:wrap;margin:1rem 0 2.5rem}
.btn{display:inline-block;padding:.7rem 1.4rem;border-radius:999px;font-weight:700;font-size:.92rem}
.btn-primary{background:linear-gradient(135deg,var(--red),#f97316);color:#fff;box-shadow:0 4px 0 -1px #b91c1c}
.btn-primary:hover{color:#fff}
.btn-secondary{border:1.5px solid var(--border);color:var(--ink);background:#fff}
.btn-secondary:hover{border-color:var(--red);color:var(--red)}
.footer{border-top:1px solid var(--border);padding:2.5rem 0;text-align:center}
.footer p{color:var(--brown);font-size:.88rem}
.footer .lic{margin-top:.4rem;font-size:.8rem;color:var(--amber)}
@media(max-width:768px){h1.title{font-size:2rem}.nav a:not(.app){display:none}}
</style>
</head>
<body>
<header class="header"><div class="container">
  <a class="logo" href="/"><span class="dot"></span>WeDance</a>
  <nav class="nav">
    <a href="/#circles">Open circles</a>
    <a href="/team">Team</a>
    <a class="app" href="https://2026.wedance.vip">Open the app</a>
  </nav>
</div></header>

<section class="hero"><div class="container">
  <a class="back" href="/#circles">← All circles</a>
  <div class="eyebrow">Open circle</div>
  <h1 class="title serif">${esc(title)}</h1>
  <span class="badge" style="background:${st.bg};color:${st.fg}">${st.label}</span>${phase}
</div></section>

<section class="body"><div class="container">
  <div class="cta">
    <a class="btn btn-primary" href="https://github.com/razbakov/wedance-2026/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22">Take a first issue →</a>
    <a class="btn btn-secondary" href="mailto:hello@wedance.vip?subject=${encodeURIComponent(title + ' circle')}">Say hello</a>
  </div>
  ${sectionsHtml}
</div></section>

<footer class="footer"><div class="container">
  <p>WeDance is a dance-community platform by <a href="https://razbakov.com">Alex Razbakov</a>, run in the open with Sociocracy 3.0.</p>
  <p class="lic">Circle spec · edit at <a href="https://github.com/razbakov/wedance-site/blob/main/roles/${meta._slug}.md">roles/${meta._slug}.md</a></p>
</div></footer>
</body>
</html>
`
}

const files = readdirSync(ROLES).filter(f => f.endsWith('.md') && f !== 'README.md')
let n = 0
for (const f of files) {
  const slug = f.replace(/\.md$/, '')
  const md = readFileSync(join(ROLES, f), 'utf8')
  const parsed = parse(md)
  parsed.meta._slug = slug
  const html = page(parsed, ogDescription(parsed))
  writeFileSync(join(ROLES, `${slug}.html`), html)
  console.log(`✓ roles/${slug}.html  (${parsed.title})`)
  n++
}
console.log(`\nGenerated ${n} role page(s).`)
