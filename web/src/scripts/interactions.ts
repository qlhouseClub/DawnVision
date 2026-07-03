/**
 * Dawn Vision — Client Interactions (TypeScript)
 *
 * Phase 1: Core translation (GT) + new content notification
 * Future phases will add: article interactions, issue filter, search, etc.
 */

// ══════════════════════════════════════════════
// GT Chrome Hiding — continuously suppress GT UI
// ══════════════════════════════════════════════
function forceBodyReset() {
  if (document.body) {
    document.body.style.setProperty('top', '0', 'important');
    document.body.style.setProperty('margin-top', '0', 'important');
    document.body.style.setProperty('position', 'static', 'important');
  }
  if (document.documentElement) {
    document.documentElement.style.setProperty('top', '0', 'important');
    document.documentElement.style.setProperty('margin-top', '0', 'important');
  }
}

function hideGTNodes() {
  const iframes = document.querySelectorAll('iframe');
  for (let i = 0; i < iframes.length; i++) {
    const f = iframes[i];
    const src = (f.src || '').toLowerCase();
    const cls = (f.className || '').toLowerCase();
    const id = (f.id || '').toLowerCase();
    if (
      cls.indexOf('goog-te') > -1 || id.indexOf('goog-te') > -1 ||
      src.indexOf('translate.google') > -1 || src.indexOf('translate.googleapis') > -1 ||
      src.indexOf('translate_p') > -1
    ) {
      f.style.setProperty('display', 'none', 'important');
      f.style.setProperty('visibility', 'hidden', 'important');
      f.style.setProperty('opacity', '0', 'important');
      f.style.setProperty('width', '0', 'important');
      f.style.setProperty('height', '0', 'important');
      f.style.setProperty('position', 'absolute', 'important');
      f.style.setProperty('top', '-9999px', 'important');
      f.style.setProperty('left', '-9999px', 'important');
      f.style.setProperty('pointer-events', 'none', 'important');
    }
  }
  const skip = document.querySelectorAll('.skiptranslate, .goog-te-spinner-pos, .goog-te-spinner');
  for (let j = 0; j < skip.length; j++) {
    (skip[j] as HTMLElement).style.setProperty('display', 'none', 'important');
    (skip[j] as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
  }
  forceBodyReset();
}

setInterval(hideGTNodes, 50);

if (typeof MutationObserver !== 'undefined') {
  const mo = new MutationObserver((mutations) => {
    let needsWork = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
        for (let n = 0; n < m.addedNodes.length; n++) {
          const node = m.addedNodes[n] as Element;
          if (node.nodeType === 1) {
            const tag = node.tagName;
            const cls2 = (node.className || '').toString().toLowerCase();
            const id2 = (node.id || '').toString().toLowerCase();
            const src2 = ((node as HTMLIFrameElement).src || '').toString().toLowerCase();
            if (
              tag === 'IFRAME' || cls2.indexOf('goog-te') > -1 || id2.indexOf('goog-te') > -1 ||
              src2.indexOf('translate.google') > -1 || src2.indexOf('translate.googleapis') > -1
            ) {
              needsWork = true;
              break;
            }
          }
        }
      }
      if (m.type === 'attributes' && (m.target === document.body || m.target === document.documentElement)) {
        needsWork = true;
      }
      if (needsWork) break;
    }
    if (needsWork) hideGTNodes();
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
}

window.addEventListener('load', hideGTNodes);

// ══════════════════════════════════════════════
// i18n — Language Switch via Google Translate
// ══════════════════════════════════════════════
const I18N = {
  zh: {
    lang_en: 'EN',
    lang_zh: 'CN',
    translating: '···',
    hint: '翻译加载中，如长时间未响应请右键页面选择"翻译"',
    failed: '翻译服务暂不可用，请使用浏览器右键翻译功能',
    new_title: '有新内容发布',
    new_desc: '网站已更新，点击刷新查看最新文章。',
    new_refresh: '刷新页面',
    new_dismiss: '稍后',
  },
  en: {
    lang_en: 'EN',
    lang_zh: 'CN',
    translating: '···',
    hint: 'Loading translation...',
    failed: 'Translation unavailable, please use browser translate',
    new_title: 'New content available',
    new_desc: 'The site has been updated.',
    new_refresh: 'Refresh',
    new_dismiss: 'Later',
  },
};

let currentLang: 'zh' | 'en' = 'zh';
let isTranslating = false;
let gtReady = false;
let gtLoadAttempted = false;
let gtLoadFailed = false;
const STORAGE_LANG_KEY = 'dawnvision_lang';
const STORAGE_VERSION_KEY = 'dawnvision_last_version';

function t(key: keyof typeof I18N.zh): string {
  const dict = I18N[currentLang] || I18N.zh;
  return dict[key] || key;
}

function detectLang(): 'zh' | 'en' {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch (_) { /* noop */ }
  return 'zh';
}

function getGTCombo(): HTMLSelectElement | null {
  return document.querySelector('.goog-te-combo');
}

function selectGTLanguage(lang: string): boolean {
  const combo = getGTCombo();
  if (combo) {
    combo.value = lang;
    let evt: Event;
    try {
      evt = new Event('change', { bubbles: true });
    } catch (_) {
      evt = document.createEvent('HTMLEvents');
      (evt as any).initEvent('change', true, true);
    }
    combo.dispatchEvent(evt);
    return true;
  }
  return false;
}

function waitForTranslationComplete(callback: (ok: boolean) => void) {
  let checks = 0;
  const maxChecks = 100;
  let foundTranslatedClass = false;
  function check() {
    checks++;
    const html = document.documentElement;
    const cls = html.className || '';
    const hasTransClass = cls.indexOf('translated-') > -1;
    if (hasTransClass) {
      if (!foundTranslatedClass) {
        foundTranslatedClass = true;
        setTimeout(() => callback && callback(true), 800);
        return;
      }
    }
    if (checks >= maxChecks) {
      callback && callback(true);
      return;
    }
    setTimeout(check, 100);
  }
  setTimeout(check, 200);
}

function waitForComboAndSelect(lang: string, callback: (ok: boolean) => void, attempts?: number) {
  attempts = attempts || 0;
  if (selectGTLanguage(lang)) {
    waitForTranslationComplete(callback);
    return;
  }
  if (attempts < 60) {
    setTimeout(() => waitForComboAndSelect(lang, callback, attempts! + 1), 150);
  } else {
    callback && callback(false);
  }
}

function getOrCreateTranslateBtn(): HTMLButtonElement | null {
  let btn = document.getElementById('dv-lang-switch') as HTMLButtonElement | null;
  if (btn) return btn;
  // Create floating button dynamically
  btn = document.createElement('button');
  btn.id = 'dv-lang-switch';
  btn.className = 'dv-lang-switch notranslate';
  btn.setAttribute('aria-label', 'Switch language');
  btn.setAttribute('title', 'Switch language');
  btn.setAttribute('translate', 'no');
  btn.type = 'button';
  btn.textContent = currentLang === 'zh' ? I18N.zh.lang_en : I18N.en.lang_zh;
  btn.addEventListener('click', () => {
    if (isTranslating) return;
    if (currentLang === 'zh') switchToEnglish();
    else switchToChinese();
  });
  document.body.appendChild(btn);
  return btn;
}

function finishTranslating() {
  isTranslating = false;
  updateTranslateBtn();
}

function updateTranslateBtn() {
  const btn = getOrCreateTranslateBtn();
  if (!btn) return;
  if (isTranslating) {
    btn.textContent = t('translating');
    btn.disabled = true;
  } else {
    btn.textContent = currentLang === 'zh' ? I18N.zh.lang_en : I18N.en.lang_zh;
    btn.disabled = false;
  }
}

function showTranslateHint(isError: boolean) {
  const existing = document.getElementById('dv-translate-hint');
  if (existing) existing.remove();
  const hint = document.createElement('div');
  hint.id = 'dv-translate-hint';
  hint.className = 'dv-translate-hint notranslate';
  hint.setAttribute('translate', 'no');
  hint.textContent = isError ? t('failed') : t('hint');
  document.body.appendChild(hint);
  requestAnimationFrame(() => hint.classList.add('dv-translate-hint--show'));
  setTimeout(() => {
    hint.classList.remove('dv-translate-hint--show');
    setTimeout(() => hint.remove(), 300);
  }, isError ? 4000 : 2500);
}

function switchToEnglish() {
  if (isTranslating) return;
  if (gtLoadFailed) { showTranslateHint(true); return; }
  isTranslating = true;
  updateTranslateBtn();
  if (!gtReady) {
    initGoogleTranslate();
    const check = setInterval(() => {
      if (gtReady) {
        clearInterval(check);
        waitForComboAndSelect('en', (ok) => {
          if (ok) {
            currentLang = 'en';
            try { localStorage.setItem(STORAGE_LANG_KEY, 'en'); } catch (_) { /* noop */ }
          } else {
            showTranslateHint(true);
          }
          finishTranslating();
        });
      }
      if (gtLoadFailed) {
        clearInterval(check);
        showTranslateHint(true);
        finishTranslating();
      }
    }, 200);
    return;
  }
  waitForComboAndSelect('en', (ok) => {
    if (ok) {
      currentLang = 'en';
      try { localStorage.setItem(STORAGE_LANG_KEY, 'en'); } catch (_) { /* noop */ }
    } else {
      showTranslateHint(true);
    }
    finishTranslating();
  });
}

function switchToChinese() {
  if (isTranslating) return;
  isTranslating = true;
  currentLang = 'zh';
  try { localStorage.setItem(STORAGE_LANG_KEY, 'zh'); } catch (_) { /* noop */ }
  updateTranslateBtn();
  if (gtReady) {
    selectGTLanguage('zh-CN');
    setTimeout(() => finishTranslating(), 800);
  } else {
    finishTranslating();
  }
}

function initGoogleTranslate() {
  if (gtLoadAttempted) return;
  gtLoadAttempted = true;
  (window as any).__dvAllowTranslate = true;

  window.googleTranslateElementInit = function () {
    try {
      if (!(window as any).google || !(window as any).google.translate || !(window as any).google.translate.TranslateElement) {
        gtLoadFailed = true;
        finishTranslating();
        return;
      }
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'zh-CN',
        includedLanguages: 'en,zh-CN',
        autoDisplay: false,
        layout: 0,
      }, 'google_translate_element');
      gtReady = true;
      setTimeout(() => {
        if (currentLang === 'en') {
          waitForComboAndSelect('en', (ok) => {
            finishTranslating();
          });
        }
      }, 300);
    } catch (_) {
      gtLoadFailed = true;
      finishTranslating();
    }
  };

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  script.onerror = () => {
    gtLoadFailed = true;
    finishTranslating();
  };
  document.head.appendChild(script);

  setTimeout(() => {
    if (!gtReady) {
      gtLoadFailed = true;
      finishTranslating();
    }
  }, 15000);
}

// ══════════════════════════════════════════════
// New Content Notification
// ══════════════════════════════════════════════
function getVersionJsonUrl(): string {
  const path = window.location.pathname;
  if (path.match(/\/(articles|cao|issues|article)\//)) return '../version.json';
  return '/version.json';
}

const STAR_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="dv-star-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></defs>
  <path d="M14 1 L16.5 11.5 L27 14 L16.5 16.5 L14 27 L11.5 16.5 L1 14 L11.5 11.5 Z" fill="#002FA7" filter="url(#dv-star-glow)"/>
  <path d="M14 5 L15.5 12.5 L23 14 L15.5 15.5 L14 23 L12.5 15.5 L5 14 L12.5 12.5 Z" fill="#3B6CF6" opacity="0.6"/>
</svg>`;

function showNewContentBanner(_data: any) {
  if (document.getElementById('dv-new-content')) return;
  const el = document.createElement('div');
  el.id = 'dv-new-content';
  el.className = 'dv-new-content notranslate';
  el.setAttribute('translate', 'no');
  el.innerHTML =
    `<div class="dv-new-content__inner">
      <div class="dv-new-content__icon">${STAR_SVG}</div>
      <div class="dv-new-content__body">
        <div class="dv-new-content__title">${t('new_title')}</div>
        <div class="dv-new-content__desc">${t('new_desc')}</div>
      </div>
      <div class="dv-new-content__actions">
        <button class="dv-new-content__btn dv-new-content__btn--primary" data-action="refresh">${t('new_refresh')}</button>
        <button class="dv-new-content__btn dv-new-content__btn--ghost" data-action="dismiss">${t('new_dismiss')}</button>
      </div>
      <button class="dv-new-content__close" data-action="dismiss" aria-label="close">×</button>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => {
    requestAnimationFrame(() => el.classList.add('dv-new-content--show'));
  }, 100);
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'refresh') location.reload();
    if (action === 'dismiss') {
      el.classList.remove('dv-new-content--show');
      setTimeout(() => el.remove(), 500);
    }
  });
}

function checkForNewContent() {
  const vUrl = getVersionJsonUrl();
  function doCheck() {
    fetch(vUrl + '?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        try {
          const lastVer = localStorage.getItem(STORAGE_VERSION_KEY);
          if (lastVer && lastVer !== data.version) showNewContentBanner(data);
          localStorage.setItem(STORAGE_VERSION_KEY, data.version);
        } catch (_) { /* noop */ }
      })
      .catch(() => { /* noop */ });
  }
  // Initial check to record current version
  fetch(vUrl + '?t=' + Date.now(), { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => { try { localStorage.setItem(STORAGE_VERSION_KEY, data.version); } catch (_) { /* noop */ } })
    .catch(() => { /* noop */ });
  setInterval(doCheck, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(doCheck, 2000);
  });
}

// ══════════════════════════════════════════════
// Search — Pagefind-powered modal search
// ══════════════════════════════════════════════
let pagefindInstance: any = null;
let searchResults: any[] = [];
let selectedIndex = -1;
let searchOverlay: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let searchResultsEl: HTMLElement | null = null;

async function loadPagefind() {
  if (pagefindInstance) return pagefindInstance;
  // Pagefind is generated by postbuild script — load it via script tag at runtime
  return new Promise<any>((resolve) => {
    // Check if already loaded
    if ((window as any).pagefind) {
      pagefindInstance = (window as any).pagefind;
      resolve(pagefindInstance);
      return;
    }
    const script = document.createElement('script');
    script.src = '/pagefind/pagefind.js';
    script.async = true;
    script.onload = () => {
      const pf = (window as any).pagefind;
      if (pf && typeof pf.init === 'function') {
        pf.init().then(() => {
          pagefindInstance = pf;
          resolve(pf);
        }).catch(() => resolve(null));
      } else {
        pagefindInstance = pf || null;
        resolve(pagefindInstance);
      }
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
    // Timeout after 5s
    setTimeout(() => {
      if (!pagefindInstance) resolve(null);
    }, 5000);
  });
}

function openSearch() {
  if (!searchOverlay) return;
  searchOverlay.hidden = false;
  requestAnimationFrame(() => {
    searchOverlay!.classList.add('is-open');
    searchInput?.focus();
  });
  document.body.style.overflow = 'hidden';
  loadPagefind();
}

function closeSearch() {
  if (!searchOverlay) return;
  searchOverlay.classList.remove('is-open');
  setTimeout(() => {
    searchOverlay!.hidden = true;
  }, 200);
  document.body.style.overflow = '';
  if (searchInput) searchInput.value = '';
  if (searchResultsEl) {
    searchResultsEl.innerHTML = '<div class="search-modal__empty">输入关键词开始搜索</div>';
  }
  searchResults = [];
  selectedIndex = -1;
}

function renderResults(results: any[]) {
  if (!searchResultsEl) return;
  if (results.length === 0) {
    searchResultsEl.innerHTML = '<div class="search-modal__empty">未找到相关文章</div>';
    return;
  }
  searchResultsEl.innerHTML = results.map((r, i) => {
    const title = r.meta?.title || '无标题';
    const excerpt = r.excerpt || '';
    const category = r.meta?.category || '';
    return `<a href="${r.url}" class="search-result ${i === selectedIndex ? 'is-selected' : ''}" data-index="${i}">
      ${category ? `<div class="search-result__category">${escapeHtml(category)}</div>` : ''}
      <div class="search-result__title">${title}</div>
      <div class="search-result__excerpt">${excerpt}</div>
    </a>`;
  }).join('');

  // Scroll selected into view
  const selected = searchResultsEl.querySelector('.search-result.is-selected');
  if (selected) {
    selected.scrollIntoView({ block: 'nearest' });
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function performSearch(query: string) {
  if (!searchResultsEl) return;
  const pf = await loadPagefind();
  if (!pf) {
    searchResultsEl.innerHTML = '<div class="search-modal__empty">搜索功能需要构建后可用</div>';
    return;
  }
  if (!query.trim()) {
    searchResultsEl.innerHTML = '<div class="search-modal__empty">输入关键词开始搜索</div>';
    searchResults = [];
    selectedIndex = -1;
    return;
  }
  searchResultsEl.innerHTML = '<div class="search-modal__loading">搜索中...</div>';
  try {
    const search = await pf.search(query);
    searchResults = search?.results?.slice(0, 20) || [];
    selectedIndex = searchResults.length > 0 ? 0 : -1;
    renderResults(searchResults);
  } catch (_) {
    searchResultsEl.innerHTML = '<div class="search-modal__empty">搜索出错</div>';
  }
}

let searchDebounce: number | null = null;
function handleSearchInput() {
  if (!searchInput) return;
  const query = searchInput.value;
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = window.setTimeout(() => performSearch(query), 200);
}

function initSearch() {
  searchOverlay = document.getElementById('search-overlay');
  searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  searchResultsEl = document.getElementById('search-results');
  if (!searchOverlay || !searchInput || !searchResultsEl) return;

  // Keyboard shortcut: Cmd/Ctrl+K or "/"
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey && e.key === 'k') {
      e.preventDefault();
      if (searchOverlay!.hidden) openSearch();
      else closeSearch();
      return;
    }

    if (e.key === '/' && searchOverlay!.hidden) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
        return;
      }
    }

    if (e.key === 'Escape' && !searchOverlay!.hidden) {
      closeSearch();
      return;
    }

    // Keyboard navigation in search results
    if (!searchOverlay!.hidden) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (searchResults.length > 0) {
          selectedIndex = (selectedIndex + 1) % searchResults.length;
          renderResults(searchResults);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (searchResults.length > 0) {
          selectedIndex = (selectedIndex - 1 + searchResults.length) % searchResults.length;
          renderResults(searchResults);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          window.location.href = searchResults[selectedIndex].url;
        }
      }
    }
  });

  // Click on overlay backdrop to close
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  // Input event
  searchInput.addEventListener('input', handleSearchInput);

  // Search buttons/triggers (multiple possible)
  const searchBtns = document.querySelectorAll('[data-search-trigger], #nav-search-btn, #home-search-btn');
  searchBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  });

  // Click on result to navigate (delegated)
  searchResultsEl.addEventListener('click', (e) => {
    const result = (e.target as HTMLElement).closest('.search-result') as HTMLElement | null;
    if (result) {
      e.preventDefault();
      const href = result.getAttribute('href');
      if (href) window.location.href = href;
    }
  });
}

// ══════════════════════════════════════════════
// Reading Progress Bar
// ══════════════════════════════════════════════
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;
  bar.hidden = false;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// ══════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════
function init() {
  currentLang = detectLang();
  document.documentElement.lang = 'zh-CN';

  // Create floating translate button immediately
  getOrCreateTranslateBtn();
  updateTranslateBtn();

  initGoogleTranslate();
  checkForNewContent();
  initSearch();
  initReadingProgress();
  initLikeButton();
  initTipModal();
}

// ══════════════════════════════════════════════
// Like Button — localStorage-based, prevents duplicate likes
// ══════════════════════════════════════════════
const STORAGE_LIKES_KEY = 'dawnvision_likes';

function getLikedArticles(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (_) {
    return new Set();
  }
}

function saveLikedArticles(liked: Set<string>) {
  try {
    localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify([...liked]));
  } catch (_) { /* noop */ }
}

function initLikeButton() {
  const btn = document.getElementById('article-like-btn') as HTMLButtonElement | null;
  if (!btn) return;

  const slug = btn.getAttribute('data-slug');
  if (!slug) return;

  const countEl = document.getElementById('like-count');
  const liked = getLikedArticles();

  // Restore liked state
  if (liked.has(slug)) {
    btn.classList.add('is-liked');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', 'currentColor');
  }

  // Initialize count (localStorage-based demo count)
  let count = liked.has(slug) ? 1 : Math.floor(Math.random() * 5) + 1;
  if (countEl) countEl.textContent = String(count);

  btn.addEventListener('click', () => {
    const likedNow = getLikedArticles();
    const label = btn.querySelector('.article-action-btn__label');
    if (likedNow.has(slug)) {
      // Unlike
      likedNow.delete(slug);
      btn.classList.remove('is-liked');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'none');
      count = Math.max(0, count - 1);
      if (label) label.textContent = '喜欢';
    } else {
      // Like
      likedNow.add(slug);
      btn.classList.add('is-liked');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'currentColor');
      count++;
      if (label) label.textContent = '已喜欢';
    }
    if (countEl) countEl.textContent = String(count);
    saveLikedArticles(likedNow);
  });
}

// ══════════════════════════════════════════════
// Tip Modal
// ══════════════════════════════════════════════
function initTipModal() {
  const modal = document.getElementById('tip-modal');
  const openBtn = document.getElementById('article-tip-btn');
  if (!modal || !openBtn) return;

  function openModal() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 200);
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);

  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-tip-close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { };
