// Render every document in the governance repo (razbakov/wedance-org) as a
// commentable page under /docs. The repo is the source of truth: governance
// changes land there as PRs; this site only mirrors it. Runs on every deploy
// (vercel.json buildCommand), and wedance-org pings a deploy hook on push.
//
//   npm run build:docs                 # clones the repo fresh
//   ORG_SRC=~/Orgs/WeDance npm run …   # render a local checkout instead

import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, posix } from 'node:path'
import { Marked } from 'marked'
import YAML from 'yaml'

const REPO = 'razbakov/wedance-org'
const BRANCH = 'main'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Vercel serves public/ (api/ functions stay at the repo root)
const PUBLIC = join(ROOT, 'public')
const OUT = join(PUBLIC, 'docs')
const STATIC = ['index.html', 'roles', 'assets']
const GH = `https://github.com/${REPO}`
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`

// Documents get their own page; every other tracked file is listed on its
// folder page and linked to GitHub.
const DOC_EXT = /\.(md|feature|ya?ml)$/i
// Not published here: personal data about individuals, and tool config.
const EXCLUDE = [/^contacts\//, /^\.gitignore$/, /^\.claude\/(settings[^/]*|launch)\.json$/]

// ---------- source ----------
function source() {
  if (process.env.ORG_SRC) return process.env.ORG_SRC.replace(/^~/, process.env.HOME)
  const dir = join(ROOT, '.org-src')
  rmSync(dir, { recursive: true, force: true })
  // blob:none keeps full history (for "last changed") without old blobs
  execFileSync('git', ['clone', '--quiet', '--filter=blob:none', '--branch', BRANCH, `${GH}.git`, dir], { stdio: 'inherit' })
  return dir
}
const SRC = source()
const git = (...a) => execFileSync('git', ['-C', SRC, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 })

const files = git('ls-files').split('\n').filter(Boolean).filter(f => !EXCLUDE.some(rx => rx.test(f)))
const head = git('log', '-1', '--format=%h|%cI').trim().split('|')

// last commit per file, from one log walk
const lastChange = {}
{
  let cur = null
  for (const line of git('log', '--name-only', '--format=@@%h|%cI|%an|%s').split('\n')) {
    if (line.startsWith('@@')) { const [h, d, a, ...s] = line.slice(2).split('|'); cur = { h, d, a, s: s.join('|') }; continue }
    if (line && cur && !lastChange[line]) lastChange[line] = cur
  }
}

// ---------- naming ----------
const docs = files.filter(f => DOC_EXT.test(f))
// dot-folders (.claude) get a dot-less URL — hosts tend to hide dot paths
const seg = s => encodeURIComponent(s.replace(/^\./, ''))
const urlOf = f => '/docs/' + f.replace(DOC_EXT, '').split('/').map(seg).join('/')
const dirUrl = d => '/docs/' + (d ? d.split('/').map(seg).join('/') + '/' : '')
// Friendlier names for paths whose file name says little on its own
const LABELS = { '.claude': 'AI agents & skills', 'CLAUDE.md': 'AI operating instructions', 'ops': 'Operations log' }
const pretty = seg => LABELS[seg] || seg
  .replace(DOC_EXT, '')
  .replace(/^\d{2,3}[_-]/, '')
  .replace(/^\./, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase())
  .trim() || seg
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fmtDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// ---------- tree ----------
function buildTree(paths) {
  const root = { name: '', path: '', dirs: {}, files: [] }
  for (const p of paths) {
    const parts = p.split('/')
    let n = root
    for (let i = 0; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join('/')
      n = n.dirs[parts[i]] ||= { name: parts[i], path, dirs: {}, files: [] }
    }
    n.files.push(p)
  }
  return root
}
const docTree = buildTree(docs)
const allTree = buildTree(files)
// dot-folders (tooling) after the governance folders
const sortDirs = n => Object.values(n.dirs).sort((a, b) => (a.name[0] === '.') - (b.name[0] === '.') || a.name.localeCompare(b.name))
const countDocs = n => n.files.length + sortDirs(n).reduce((s, d) => s + countDocs(d), 0)
const findNode = (tree, dir) => (dir ? dir.split('/') : []).reduce((n, s) => n?.dirs[s], tree)

function sidebar(active) {
  const walk = n => {
    const items = []
    for (const d of sortDirs(n)) {
      const open = active.startsWith(d.path + '/') ? ' open' : ''
      items.push(`<li><details${open}><summary><a href="${dirUrl(d.path)}">${esc(pretty(d.name))}</a></summary>${walk(d)}</details></li>`)
    }
    for (const f of n.files.sort()) {
      const cls = f === active ? ' class="on"' : ''
      items.push(`<li><a${cls} href="${urlOf(f)}">${esc(pretty(posix.basename(f)))}</a></li>`)
    }
    return `<ul>${items.join('')}</ul>`
  }
  return `<nav class="side" aria-label="All documents"><a class="side-home" href="/docs/">All documents <span>${docs.length}</span></a>${walk(docTree)}</nav>`
}

// ---------- markdown ----------
function resolveLink(fromFile, href) {
  if (!href || /^([a-z]+:|#|\/\/)/i.test(href)) return href
  const [path, hash = ''] = href.split('#')
  const target = posix.normalize(posix.join(posix.dirname(fromFile), decodeURIComponent(path)))
  if (target.startsWith('..')) return href
  const h = hash ? '#' + hash : ''
  if (DOC_EXT.test(target) && docs.includes(target)) return urlOf(target) + h
  if (findNode(allTree, target.replace(/\/$/, ''))) return dirUrl(target.replace(/\/$/, '')) + h
  if (files.includes(target)) return `${GH}/blob/${BRANCH}/${target}`
  return href
}

function render(file, text) {
  let fm = null
  let body = text
  if (/\.md$/i.test(file)) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
    if (m) { try { fm = YAML.parse(m[1]) } catch { fm = null } body = text.slice(m[0].length) }
  } else {
    const lang = /\.feature$/i.test(file) ? 'gherkin' : 'yaml'
    body = '```' + lang + '\n' + text + '\n```\n'
  }
  const md = new Marked({ gfm: true })
  md.use({
    walkTokens(t) {
      if (t.type === 'link') t.href = resolveLink(file, t.href)
      if (t.type === 'image' && !/^[a-z]+:/i.test(t.href)) {
        const target = posix.normalize(posix.join(posix.dirname(file), decodeURIComponent(t.href)))
        if (files.includes(target)) t.href = `${RAW}/${target.split('/').map(encodeURIComponent).join('/')}`
      }
    },
  })
  let html = md.parse(body)
  // first h1 becomes the page title
  let title = pretty(posix.basename(file))
  const h1 = html.match(/^\s*<h1[^>]*>([\s\S]*?)<\/h1>/)
  if (h1) { title = h1[1].replace(/<[^>]+>/g, '').trim(); html = html.slice(h1.index + h1[0].length) }
  if (fm && typeof fm === 'object' && !Array.isArray(fm)) {
    if (fm.title || fm.name) title = String(fm.title || fm.name)
    const rows = Object.entries(fm)
      .filter(([k]) => !['title'].includes(k))
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(typeof v === 'object' ? (Array.isArray(v) ? v.join(', ') : JSON.stringify(v)) : v)}</td></tr>`)
    if (rows.length) html = `<table class="fm">${rows.join('')}</table>` + html
  }
  return { title, html }
}

// ---------- page shell ----------
const FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Caveat:wght@400;700&family=Inter:wght@400;500;600;700&display=swap'

function shell({ title, desc, path, active, crumbs, main, file }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · WeDance org</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)} · WeDance org">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="https://org.wedance.vip${path}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/docs.css">
</head>
<body${file ? ` data-doc-file="${esc(file)}"` : ''}>
<header class="header"><div class="wrap">
  <a class="logo" href="/"><span class="dot"></span>WeDance</a>
  <nav class="nav">
    <a href="/">Overview</a>
    <a href="/docs/">Documents</a>
    <a href="/team">Team</a>
    <a class="app" href="https://2026.wedance.vip">Open the app</a>
  </nav>
</div></header>
<div class="wrap layout">
  <button class="side-toggle" type="button" onclick="document.body.classList.toggle('side-open')">☰ Documents</button>
  ${sidebar(active)}
  <main class="main">
    <div class="crumbs">${crumbs}</div>
    ${main}
  </main>
</div>
<footer class="footer"><div class="wrap">
  <p>Mirrored from <a href="${GH}">${REPO}</a> @ <a href="${GH}/commit/${head[0]}">${head[0]}</a> · ${fmtDate(head[1])}. The repo is the source of truth — governance changes land there as pull requests.</p>
</div></footer>
${file ? '<script src="/assets/living-comments.js" defer></script>' : ''}
</body>
</html>
`
}

function crumbsFor(parts, last) {
  const out = ['<a href="/docs/">Documents</a>']
  for (let i = 0; i < parts.length; i++) out.push(`<a href="${dirUrl(parts.slice(0, i + 1).join('/'))}">${esc(pretty(parts[i]))}</a>`)
  if (last) out.push(`<span>${esc(last)}</span>`)
  return out.join('<i>/</i>')
}

function write(urlPath, html) {
  const rel = decodeURIComponent(urlPath.replace(/^\/docs\/?/, ''))
  const target = rel === '' || rel.endsWith('/') ? join(OUT, rel, 'index.html') : join(OUT, rel + '.html')
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}

// ---------- emit ----------
rmSync(PUBLIC, { recursive: true, force: true })
for (const f of STATIC) cpSync(join(ROOT, f), join(PUBLIC, f), { recursive: true, filter: src => !src.endsWith('.md') })

for (const f of docs) {
  const { title, html } = render(f, readFileSync(join(SRC, f), 'utf8'))
  const c = lastChange[f]
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const meta = `<div class="docmeta">
    <span class="path">${esc(f)}</span>
    ${c ? `<span>Last changed <a href="${GH}/commit/${c.h}">${fmtDate(c.d)}</a> — ${esc(c.s)}</span>` : ''}
    <span class="actions">
      <a href="${GH}/edit/${BRANCH}/${f}">Propose a change</a>
      <a href="${GH}/commits/${BRANCH}/${f}">History</a>
      <a href="${GH}/blob/${BRANCH}/${f}">Source</a>
    </span>
  </div>`
  const main = `<article class="doc">
    <h1 class="title" data-c>${esc(title)}</h1>
    ${meta}
    <p class="chint">💬 Hover any passage to comment. Comments become triage issues, and accepted changes land as PRs to this file.</p>
    <div class="doc-body">${html}</div>
  </article>`
  const parts = f.split('/').slice(0, -1)
  write(urlOf(f), shell({ title, desc: plain.slice(0, 155), path: urlOf(f), active: f, crumbs: crumbsFor(parts, title), main, file: f }))
}

// folder pages (from the full tree so asset-only folders exist too)
function folderPages(n) {
  const parts = n.path ? n.path.split('/') : []
  const docNode = findNode(docTree, n.path)
  const subdirs = sortDirs(n).map(d => {
    const k = countDocs(findNode(docTree, d.path) || { files: [], dirs: {} })
    return `<a class="tile" href="${dirUrl(d.path)}"><b>${esc(pretty(d.name))}</b><span>${k ? `${k} document${k > 1 ? 's' : ''}` : 'assets'}</span></a>`
  }).join('')
  const docList = (docNode?.files || []).sort().map(f => {
    const c = lastChange[f]
    return `<li><a href="${urlOf(f)}">${esc(pretty(posix.basename(f)))}</a>${c ? `<span>${fmtDate(c.d)}</span>` : ''}</li>`
  }).join('')
  const assets = n.files.filter(f => !DOC_EXT.test(f)).sort()
  const imgs = assets.filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
  const other = assets.filter(f => !imgs.includes(f))
  const enc = f => f.split('/').map(encodeURIComponent).join('/')
  const gallery = imgs.map(f => `<a class="thumb" href="${GH}/blob/${BRANCH}/${enc(f)}"><img loading="lazy" src="${RAW}/${enc(f)}" alt="${esc(posix.basename(f))}"><span>${esc(posix.basename(f))}</span></a>`).join('')
  const otherList = other.map(f => `<li><a href="${GH}/blob/${BRANCH}/${enc(f)}">${esc(posix.basename(f))}</a></li>`).join('')

  const title = n.path ? pretty(n.name) : 'All documents'
  const intro = n.path ? '' : `<p class="lead">Every document in the WeDance governance repo, rendered live. This is a README-first, AI-first organization: the files <em>are</em> the organization. To change something, comment on a passage — or open a pull request against <a href="${GH}">${REPO}</a>.</p>`
  const main = `<h1 class="title">${esc(title)}</h1>${intro}
    ${subdirs ? `<div class="tiles">${subdirs}</div>` : ''}
    ${docList ? `<h2 class="h-sec">Documents</h2><ul class="doclist">${docList}</ul>` : ''}
    ${otherList ? `<h2 class="h-sec">Files</h2><ul class="doclist">${otherList}</ul>` : ''}
    ${gallery ? `<h2 class="h-sec">Images</h2><div class="gallery">${gallery}</div>` : ''}`
  const url = dirUrl(n.path)
  write(url, shell({ title, desc: `${title} — WeDance governance documents.`, path: url, active: n.path + '/', crumbs: n.path ? crumbsFor(parts.slice(0, -1), title) : '', main }))
  sortDirs(n).forEach(folderPages)
}
folderPages(allTree)

console.log(`✓ ${docs.length} documents from ${REPO}@${head[0]} → public/`)
