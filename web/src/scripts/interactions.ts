/**
 * Dawn Vision — Client Interactions (TypeScript)
 *
 * Native bilingual toggle (CN/EN) + new content notification + search + reading progress
 */

// ══════════════════════════════════════════════
// i18n — Native Bilingual Toggle (no Google Translate)
// ══════════════════════════════════════════════
const I18N = {
  zh: {
    lang_en: 'EN',
    lang_zh: '中',
    new_title: '有新内容发布',
    new_desc: '网站已更新，点击刷新查看最新文章。',
    new_refresh: '刷新页面',
    new_dismiss: '稍后',
    search_placeholder: '搜索文章...',
    search_empty: '输入关键词开始搜索',
    search_no_results: '未找到相关文章',
    search_loading: '搜索中...',
    search_error: '搜索出错',
    like: '喜欢',
    liked: '已喜欢',
    tip: '打赏',
    prev_article: '上一篇',
    next_article: '下一篇',
    sources: '信源',
    close: '关闭',
  },
  en: {
    lang_en: 'EN',
    lang_zh: '中',
    new_title: 'New content available',
    new_desc: 'The site has been updated. Click to refresh.',
    new_refresh: 'Refresh',
    new_dismiss: 'Later',
    search_placeholder: 'Search articles...',
    search_empty: 'Type to search',
    search_no_results: 'No results found',
    search_loading: 'Searching...',
    search_error: 'Search error',
    like: 'Like',
    liked: 'Liked',
    tip: 'Tip',
    prev_article: 'Previous',
    next_article: 'Next',
    sources: 'Sources',
    close: 'Close',
  },
};

let currentLang: 'zh' | 'en' = 'zh';
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

function applyLanguage(lang: 'zh' | 'en') {
  currentLang = lang;
  const html = document.documentElement;
  html.setAttribute('data-lang', lang);
  html.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
  try { localStorage.setItem(STORAGE_LANG_KEY, lang); } catch (_) { /* noop */ }
  updateLangSwitchBtn();
  updateDynamicContent();
}

function updateLangSwitchBtn() {
  const btn = document.getElementById('dv-lang-switch') as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = currentLang === 'zh' ? 'EN' : '中';
    btn.setAttribute('aria-label', currentLang === 'zh' ? 'Switch to English' : '切换到中文');
    btn.setAttribute('title', currentLang === 'zh' ? 'Switch to English' : '切换到中文');
  }
}

function updateDynamicContent() {
  // Update elements with data-i18n attributes
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n') as keyof typeof I18N.zh;
    if (key && I18N[currentLang][key]) {
      el.textContent = I18N[currentLang][key];
    }
  });
  // Update placeholder attributes
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder') as keyof typeof I18N.zh;
    if (key && I18N[currentLang][key]) {
      (el as HTMLInputElement).placeholder = I18N[currentLang][key];
    }
  });
}

function getOrCreateLangSwitchBtn(): HTMLButtonElement | null {
  let btn = document.getElementById('dv-lang-switch') as HTMLButtonElement | null;
  if (btn) return btn;
  btn = document.createElement('button');
  btn.id = 'dv-lang-switch';
  btn.className = 'dv-lang-switch';
  btn.setAttribute('aria-label', 'Switch language');
  btn.setAttribute('title', 'Switch language');
  btn.type = 'button';
  btn.textContent = currentLang === 'zh' ? 'EN' : '中';
  btn.addEventListener('click', () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    applyLanguage(newLang);
  });
  document.body.appendChild(btn);
  return btn;
}

// ══════════════════════════════════════════════
// New Content Notification
// ══════════════════════════════════════════════
function getVersionJsonUrl(): string {
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
  el.className = 'dv-new-content';
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
          if (lastVer && lastVer !== String(data.version)) showNewContentBanner(data);
          localStorage.setItem(STORAGE_VERSION_KEY, String(data.version));
        } catch (_) { /* noop */ }
      })
      .catch(() => { /* noop */ });
  }

  fetch(vUrl + '?t=' + Date.now(), { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => { try { localStorage.setItem(STORAGE_VERSION_KEY, String(data.version)); } catch (_) { /* noop */ } })
    .catch(() => { /* noop */ });

  setInterval(doCheck, 2 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(doCheck, 1000);
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
  return new Promise<any>((resolve) => {
    if ((window as any).__dv_pagefind) {
      pagefindInstance = (window as any).__dv_pagefind;
      resolve(pagefindInstance);
      return;
    }
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = `
      import { search, init, debouncedSearch, preload, filters } from '/pagefind/pagefind.js';
      window.__dv_pagefind = { search, init: async()=>{await init();}, debouncedSearch, preload, filters };
      window.__dv_pagefindReady = true;
      window.dispatchEvent(new CustomEvent('dv:pagefind-ready'));
    `;
    const onReady = () => {
      const pf = (window as any).__dv_pagefind;
      if (pf) {
        pagefindInstance = pf;
        resolve(pf);
      } else {
        resolve(null);
      }
    };
    window.addEventListener('dv:pagefind-ready', onReady, { once: true });
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    setTimeout(() => {
      if (!pagefindInstance) resolve(null);
    }, 8000);
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
    searchResultsEl.innerHTML = `<div class="search-modal__empty">${t('search_empty')}</div>`;
  }
  searchResults = [];
  selectedIndex = -1;
}

function renderResults(results: any[]) {
  if (!searchResultsEl) return;
  if (results.length === 0) {
    searchResultsEl.innerHTML = `<div class="search-modal__empty">${t('search_no_results')}</div>`;
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
    searchResultsEl.innerHTML = `<div class="search-modal__empty">${t('search_error')}</div>`;
    return;
  }
  if (!query.trim()) {
    searchResultsEl.innerHTML = `<div class="search-modal__empty">${t('search_empty')}</div>`;
    searchResults = [];
    selectedIndex = -1;
    return;
  }
  searchResultsEl.innerHTML = `<div class="search-modal__loading">${t('search_loading')}</div>`;
  try {
    const search = await pf.search(query, { pageSize: 20 });
    const rawResults = search?.results?.slice(0, 20) || [];
    const resolved = await Promise.all(
      rawResults.map(async (r: any) => {
        try {
          const data = await r.data();
          return {
            url: data.url,
            meta: data.meta,
            excerpt: data.excerpt,
          };
        } catch {
          return null;
        }
      })
    );
    searchResults = resolved.filter(Boolean) as any[];
    selectedIndex = searchResults.length > 0 ? 0 : -1;
    renderResults(searchResults);
  } catch (e) {
    console.warn('[DV] Search error:', e);
    searchResultsEl.innerHTML = `<div class="search-modal__empty">${t('search_error')}</div>`;
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

  // Set initial placeholder
  searchInput.placeholder = t('search_placeholder');

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

  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  searchInput.addEventListener('input', handleSearchInput);

  const searchBtns = document.querySelectorAll('[data-search-trigger], #nav-search-btn, #home-search-btn');
  searchBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  });

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
// Back Button — fade to 10% opacity on scroll
// ══════════════════════════════════════════════
function initBackButton() {
  const btn = document.querySelector('.dv-back-btn') as HTMLElement | null;
  if (!btn) return;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 100) {
      btn.classList.add('is-scrolled');
    } else {
      btn.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ══════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════
function init() {
  currentLang = detectLang();
  applyLanguage(currentLang);

  // Create floating language switch button
  getOrCreateLangSwitchBtn();

  // Record current version immediately
  checkForNewContent();

  initSearch();
  initReadingProgress();
  initBackButton();
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
  const labelEl = btn.querySelector('.article-action-btn__label');
  const liked = getLikedArticles();

  if (liked.has(slug)) {
    btn.classList.add('is-liked');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', 'currentColor');
  }

  let count = liked.has(slug) ? 1 : Math.floor(Math.random() * 5) + 1;
  if (countEl) countEl.textContent = String(count);
  if (labelEl) labelEl.setAttribute('data-i18n', liked.has(slug) ? 'liked' : 'like');

  btn.addEventListener('click', () => {
    const likedNow = getLikedArticles();
    if (likedNow.has(slug)) {
      likedNow.delete(slug);
      btn.classList.remove('is-liked');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'none');
      count = Math.max(0, count - 1);
      if (labelEl) {
        labelEl.setAttribute('data-i18n', 'like');
        labelEl.textContent = t('like');
      }
    } else {
      likedNow.add(slug);
      btn.classList.add('is-liked');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'currentColor');
      count++;
      if (labelEl) {
        labelEl.setAttribute('data-i18n', 'liked');
        labelEl.textContent = t('liked');
      }
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
