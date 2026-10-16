(() => {
  'use strict';

  /* ===== SETTINGS ===== */
  const DATA_FILE = 'profiles.txt'; // your text file
  const DELIMITER = '$';            // a line containing only this symbol
  const BATCH     = 40;             // cards added per scroll step

  const $ = id => document.getElementById(id);
  const $list = $('list'), $status = $('status'), $count = $('count'), $sentinel = $('sentinel');
  const $q = $('q'), $topbar = $('topbar'), $btn = $('searchBtn'), $clear = $('clear');
  const $search = document.querySelector('.search');

  const CHEV = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';

  let all = [];   // every parsed profile
  let view = [];  // current (filtered) list
  let shown = 0;  // how many cards are rendered

  /* ---------- Parse text file ---------- */
  function parse(text){
    text = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
    const out = [];
    let buf = [];
    const flush = () => {
      if (buf.length >= 3){
        const name = buf[0], photo = buf[1], url = fixUrl(buf[2]);
        if (name && url) out.push({ name, photo, url, key: name.toLowerCase(), host: hostOf(url) });
      }
      buf = [];
    };
    for (const raw of text.split('\n')){
      const line = raw.trim();
      if (line === DELIMITER) flush();
      else if (line) buf.push(line);
    }
    flush();
    return out;
  }
  function fixUrl(u){
    u = u.trim();
    if (/^(javascript|data|vbscript):/i.test(u)) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
    if (/^\/\//.test(u)) return 'https:' + u;
    return 'https://' + u;
  }
  function hostOf(u){
    try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; }
  }
  function safeImg(p){ return /^(javascript|vbscript):/i.test(p) ? '' : p; }

  /* ---------- Render ---------- */
  function makeCard(p){
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'card';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', p.name);

    const av = document.createElement('div');
    av.className = 'avatar';
    const inn = document.createElement('div');
    inn.className = 'in';
    const initial = () => { inn.textContent = (Array.from(p.name)[0] || '?').toUpperCase(); };
    const src = safeImg(p.photo);
    if (src){
      const img = new Image();
      img.alt = '';
      img.width = 68; img.height = 68;
      img.decoding = 'async';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.remove(); initial(); };
      img.src = src;
      inn.appendChild(img);
    } else initial();
    av.appendChild(inn);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const n = document.createElement('div');
    n.className = 'name';
    n.textContent = p.name;
    const h = document.createElement('div');
    h.className = 'host';
    h.textContent = p.host;
    meta.append(n, h);

    a.append(av, meta);
    a.insertAdjacentHTML('beforeend', CHEV);
    li.appendChild(a);
    return li;
  }

  function renderMore(){
    if (shown >= view.length) return;
    const end = Math.min(shown + BATCH, view.length);
    const frag = document.createDocumentFragment();
    for (let i = shown; i < end; i++){
      const li = makeCard(view[i]);
      li.firstChild.style.animationDelay = Math.min((i - shown) * 18, 300) + 'ms';
      frag.appendChild(li);
    }
    $list.appendChild(frag);
    shown = end;
  }

  function fill(){ // keeps filling tall screens until the page can scroll
    requestAnimationFrame(() => {
      const r = $sentinel.getBoundingClientRect();
      if (shown < view.length && r.top < innerHeight + 700){ renderMore(); fill(); }
    });
  }

  function reset(){
    $list.replaceChildren();
    shown = 0;
    $status.innerHTML = '';
    if (!view.length){
      $status.innerHTML = '<div class="msg">' + (all.length ? 'No profile matches your search.' : 'No profiles yet.') + '</div>';
    }
    $count.textContent = !all.length ? '' :
      (view.length === all.length ? all.length + (all.length > 1 ? ' profiles' : ' profile') : view.length + ' of ' + all.length);
    renderMore();
    fill();
  }

  /* ---------- Infinite scroll ---------- */
  function observe(){
    if ('IntersectionObserver' in window){
      new IntersectionObserver(es => {
        if (es[0].isIntersecting){ renderMore(); fill(); }
      }, { rootMargin: '900px 0px' }).observe($sentinel);
    } else {
      addEventListener('scroll', () => {
        if (innerHeight + scrollY > document.documentElement.scrollHeight - 900) renderMore();
      }, { passive: true });
    }
  }

  /* ---------- Search (icon -> expands) ---------- */
  function openSearch(){
    $topbar.classList.add('open');
    $btn.setAttribute('aria-expanded', 'true');
    $btn.setAttribute('aria-label', 'Close search');
    $q.tabIndex = 0;
    setTimeout(() => $q.focus(), 60);
  }
  function closeSearch(){
    $topbar.classList.remove('open');
    $btn.setAttribute('aria-expanded', 'false');
    $btn.setAttribute('aria-label', 'Search');
    $q.tabIndex = -1;
    $q.blur();
    if ($q.value){ $q.value = ''; applySearch(); }
  }
  $btn.addEventListener('click', () => $topbar.classList.contains('open') ? closeSearch() : openSearch());
  $clear.addEventListener('click', () => { $q.value = ''; applySearch(); $q.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && $topbar.classList.contains('open')) closeSearch(); });
  $q.addEventListener('keydown', e => { if (e.key === 'Enter') $q.blur(); });

  function applySearch(){
    const s = $q.value.trim().toLowerCase();
    $search.classList.toggle('has-text', !!$q.value);
    view = s ? all.filter(p => p.key.includes(s)) : all;
    reset();
    scrollTo(0, 0);
  }
  let t;
  $q.addEventListener('input', () => {
    $search.classList.toggle('has-text', !!$q.value);
    clearTimeout(t);
    t = setTimeout(applySearch, 140);
  });

  /* ---------- Load ---------- */
  function skeletons(){
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 4; i++){ const d = document.createElement('div'); d.className = 'skeleton'; frag.appendChild(d); }
    $status.replaceChildren(frag);
  }

  async function load(){
    skeletons();
    try{
      const res = await fetch(DATA_FILE + '?v=' + Date.now(), { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      all = parse(await res.text());
      view = all;
      reset();
      observe();
    }catch(e){
      $status.innerHTML = '<div class="msg"><b>Could not load <code>' + DATA_FILE + '</code></b><br>Keep it in the same folder as <code>index.html</code> and open the site through GitHub Pages or a local server (browsers block reading text files from a <code>file://</code> page).</div>';
    }
  }
  load();
})();
