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

function finishTranslating() {
  isTranslating = false;
  updateTranslateBtn();
}

function updateTranslateBtn() {
  const btn = document.getElementById('translate-btn') as HTMLButtonElement | null;
  if (!btn) return;
  if (isTranslating) {
    btn.textContent = t('translating');
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';
  } else {
    btn.textContent = currentLang === 'zh' ? I18N.zh.lang_en : I18N.en.lang_zh;
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
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
// Init
// ══════════════════════════════════════════════
function init() {
  currentLang = detectLang();
  document.documentElement.lang = 'zh-CN';
  updateTranslateBtn();

  const translateBtn = document.getElementById('translate-btn');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => {
      if (isTranslating) return;
      if (currentLang === 'zh') switchToEnglish();
      else switchToChinese();
    });
  }

  initGoogleTranslate();
  checkForNewContent();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { };
