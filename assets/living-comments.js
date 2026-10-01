// Living-document commenting for /docs pages. Hover a passage → comment →
// POST /api/comment with the source file, so triage knows exactly which file
// in razbakov/wedance-org a resulting PR should change.
(function () {
  var file = document.body.getAttribute('data-doc-file')
  if (!file) return
  var body = document.querySelector('.doc-body')
  if (!body) return

  body.querySelectorAll(':scope > p, :scope > ul > li, :scope > ol > li, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > blockquote, :scope > table, :scope > pre')
    .forEach(function (el) { el.setAttribute('data-c', '') })

  // nearest heading above a block = its section
  function sectionOf(el) {
    var n = el.closest('.doc-body > *') || el
    while (n) { if (/^H[1-4]$/.test(n.tagName)) return n.textContent.trim(); n = n.previousElementSibling }
    var t = document.querySelector('.doc .title')
    return t ? t.textContent.trim() : file
  }

  var btn = document.createElement('button'); btn.className = 'cbtn'; btn.textContent = '💬'; btn.title = 'Comment on this passage'; document.body.appendChild(btn)
  var toast = document.createElement('div'); toast.className = 'ctoast'; document.body.appendChild(toast)
  var cur = null, pop = null

  function place(el) { var r = el.getBoundingClientRect(); btn.style.top = (scrollY + r.top - 6) + 'px'; btn.style.left = (scrollX + Math.min(r.right + 4, innerWidth - 40)) + 'px' }
  document.addEventListener('mouseover', function (e) { var el = e.target.closest('[data-c]'); if (!el || pop) return; cur = el; place(el); btn.classList.add('show') })
  // touch: tap a passage to reveal the button
  document.addEventListener('click', function (e) { if (pop || e.target.closest('a,.cbtn,.cpop')) return; var el = e.target.closest('[data-c]'); if (el) { cur = el; place(el); btn.classList.add('show') } })
  addEventListener('scroll', function () { if (cur && !pop) place(cur) })

  function showToast(html, ms) { toast.innerHTML = html; toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove('show') }, ms || 6000) }
  function closePop() { if (pop) { pop.remove(); pop = null } btn.classList.remove('show'); if (cur) cur.classList.remove('c-hot') }
  function escHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  btn.addEventListener('click', function () {
    if (!cur) return
    var el = cur; el.classList.add('c-hot')
    var quote = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 280)
    var section = sectionOf(el)
    if (pop) pop.remove()
    pop = document.createElement('div'); pop.className = 'cpop'
    pop.innerHTML = '<div class="quote">' + escHtml(quote.slice(0, 140)) + (quote.length > 140 ? '…' : '') + '</div>' +
      '<input class="who" placeholder="Your name (optional)">' +
      '<textarea class="txt" placeholder="Your comment, question or objection…"></textarea>' +
      '<div class="row"><button class="x" type="button">Cancel</button><button class="send" type="button" disabled>Send →</button></div>' +
      '<div class="hint">Becomes a triage issue; accepted changes land as a PR to <code>' + escHtml(file) + '</code>.</div>'
    document.body.appendChild(pop)
    var r = el.getBoundingClientRect()
    var left = scrollX + Math.min(r.right + 10, innerWidth - 336); if (left < 8) left = 8
    pop.style.top = (scrollY + r.top) + 'px'; pop.style.left = left + 'px'
    var txt = pop.querySelector('.txt'), send = pop.querySelector('.send'), who = pop.querySelector('.who')
    try { who.value = localStorage.getItem('wd-commenter') || '' } catch (e) {}
    txt.focus()
    txt.addEventListener('input', function () { send.disabled = !txt.value.trim() })
    pop.querySelector('.x').addEventListener('click', closePop)
    send.addEventListener('click', function () {
      send.disabled = true; send.textContent = 'Sending…'
      try { localStorage.setItem('wd-commenter', who.value.trim()) } catch (e) {}
      fetch('/api/comment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: file, page: location.pathname, quote: quote, section: section, comment: txt.value.trim(), commenter: who.value.trim() || 'Anonymous' })
      })
        .then(function (r) { return r.json() })
        .then(function (d) {
          closePop()
          if (d && d.ok) showToast('✓ Filed — <a href="' + d.url + '" target="_blank" rel="noopener">' + d.identifier + '</a>')
          else showToast('Couldn’t file it: ' + escHtml((d && d.error) || 'error') + '. Try again shortly.', 7000)
        })
        .catch(function () { closePop(); showToast('Network error — please try again.', 6000) })
    })
    setTimeout(function () { document.addEventListener('mousedown', outside) }, 0)
    function outside(ev) { if (pop && !pop.contains(ev.target) && ev.target !== btn) { document.removeEventListener('mousedown', outside); closePop() } }
  })
})()
