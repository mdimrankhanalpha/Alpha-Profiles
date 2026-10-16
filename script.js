(() => {
  'use strict';

  /* ===== SETTINGS ===== */
  const DATA_FILES = ['Profiles.txt', 'profiles.txt', 'PROFILES.txt']; // tried in order (GitHub Pages is case-sensitive)
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

  /* ---------- Media helpers (photo or video) ---------- */
  const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|ogg|3gp)$/i;
  function fixMedia(u){
    u = (u || '').trim();
    if (!u || /^(javascript|vbscript|data:text)/i.test(u)) return '';
    // GitHub "blob" / "raw" page links -> real file link
    let m = u.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/(?:blob|raw)\/(.+?)(?:[?#].*)?$/i);
    if (m) return 'https://raw.githubusercontent.com/' + m[1] + '/' + m[2] + '/' + m[3];
    // Google Drive share link
    m = u.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^\/?#]+)/i);
    if (m) return 'https://drive.google.com/uc?export=view&id=' + m[1];
    return u;
  }
  function isVideo(u){ return VIDEO_EXT.test(u.split('#')[0].split('?')[0]); }

  // videos only load + play while near the screen (keeps weak phones smooth)
  const videoIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    for (const e of es){
      const v = e.target;
      if (e.isIntersecting){
        if (!v.getAttribute('src')){ v._off = false; v.src = v.dataset.src + '#t=0.001'; }
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      } else {
        v._off = true;
        v.pause();
        if (v.getAttribute('src')){ v.removeAttribute('src'); v.load(); }
      }
    }
  }, { rootMargin: '250px 0px' }) : null;

  function addImage(box, src, onFail){
    const img = new Image();
    img.className = 'media';
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { img.remove(); onFail(); };
    img.src = src;
    box.appendChild(img);
  }
  function addVideo(box, src, onFail){
    const v = document.createElement('video');
    v.className = 'media';
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', '');
    v.preload = 'metadata';
    v.dataset.src = src;
    v.onerror = () => {
      if (v._off || !v.getAttribute('src')) return;
      if (videoIO) videoIO.unobserve(v);
      v.remove(); onFail();
    };
    box.appendChild(v);
    if (videoIO) videoIO.observe(v);
    else { v.autoplay = true; v.src = src; }
  }

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
    const src = fixMedia(p.photo);
    if (!src) initial();
    else if (isVideo(src)) addVideo(inn, src, () => addImage(inn, src, initial));
    else addImage(inn, src, () => addVideo(inn, src, initial));
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
    $count.textContent = (all.length && view.length !== all.length) ? view.length + ' of ' + all.length : '';
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

  async function fetchText(){
    let lastErr;
    for (const f of DATA_FILES){
      try{
        const res = await fetch(f + '?v=' + Date.now(), { cache: 'no-cache' });
        if (res.ok) return await res.text();
        lastErr = new Error(f + ' ' + res.status);
      }catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  async function load(){
    skeletons();
    try{
      all = parse(await fetchText());
      view = all;
      reset();
      observe();
    }catch(e){
      $status.innerHTML = '<div class="msg"><b>Could not load <code>' + DATA_FILES[0] + '</code></b><br>Keep it in the same folder as <code>index.html</code> with exactly this name (capital P), and open the site through GitHub Pages or a local server (browsers block reading text files from a <code>file://</code> page).</div>';
    }
  }
  load();
})();
