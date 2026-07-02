/**
 * Dawn Vision — Interaction Script v23
 *
 * Translation:
 * - GT widget loaded on demand (first EN click), banner suppressed by inline <head> script
 * - EN button: load+init GT → translate to English, button shows CN
 * - CN button: GT restore to Chinese, button shows EN
 * - "..." shown during translation loading
 * - All UI controls have notranslate class to prevent GT from translating our labels
 * - If GT fails, guide bubble shows browser-native translate instructions
 */

(function() {
  'use strict';

  function detectBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Edg/') > -1) return 'edge';
    if (ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1) return 'chrome';
    if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) return 'safari';
    if (ua.indexOf('Firefox/') > -1) return 'firefox';
    return 'other';
  }

  // ══════════════════════════════════════════
  // i18n
  // ══════════════════════════════════════════
  const I18N = {
    zh: {
      meta_editorial: 'Dawn Vision 编辑部',
      sources_label: 'Sources · 参考来源',
      sources_note: '声明：本文为 Dawn Vision 基于公开信息的二次创作与独立分析，标题、观点、行文均为原创，仅供参考，不构成任何投资建议或决策依据。如有侵权请联系删除。',
      sources_note_cao: '声明：本文为 Dawn Vision 基于公开信息的二次创作与独立分析，以幽默吐槽风格呈现，标题、观点、行文均为原创，仅供娱乐参考，不构成任何技术建议或决策依据。如有侵权请联系删除。',
      tomorrow: '明天见。',
      cao_end: '今天就槽到这里，明天继续。',
      prev_article: '← 上一篇',
      next_article: '下一篇 →',
      reads: '阅读',
      likes: '赞',
      like_btn: '点赞',
      tip_btn: '打赏',
      tip_jar: '打赏',
      tip_title: '请作者喝杯奶茶',
      tip_desc: '如果这篇文章对你有帮助，欢迎随意打赏。感谢支持！',
      tip_scan: '微信扫码 · <strong>谢谢老板</strong>',
      tip_close: '关闭',
      lang_switch_en: 'EN',
      lang_switch_cn: 'CN',
      reads_local_title: '本地计数（统计服务暂不可用）',
      reads_title: function(n) { return '总阅读量 ' + n; },
      new_content_title: '有新内容发布',
      new_content_desc: '网站已更新，点击刷新查看最新文章。',
      new_content_refresh: '刷新页面',
      new_content_dismiss: '稍后',
      translate_fail_title: '翻译加载失败',
      translate_fail_chrome: '请右键页面空白处，选择 <strong>"翻译为 English"</strong> 即可翻译全文。',
      translate_fail_edge: '请右键页面空白处，选择 <strong>"翻译为 English"</strong>。',
      translate_fail_other: '请使用浏览器自带的翻译功能（右键菜单）将页面翻译为英文。',
      translate_fail_gotit: '知道了',
    },
    en: {
      meta_editorial: 'Dawn Vision Editorial',
      sources_label: 'Sources',
      sources_note: 'Disclaimer: This article is original analysis by Dawn Vision based on public information. All views are our own. For reference only, not investment advice.',
      sources_note_cao: 'Disclaimer: This is a humor/rant piece by Dawn Vision. Original satire for entertainment purposes only.',
      tomorrow: 'See you tomorrow.',
      cao_end: "That's all for today. More rants tomorrow.",
      prev_article: '← Previous',
      next_article: 'Next →',
      reads: 'reads',
      likes: 'likes',
      like_btn: 'Like',
      tip_btn: 'Tip',
      tip_jar: 'Tip Jar',
      tip_title: 'Buy the author a coffee',
      tip_desc: 'If this article helped you, feel free to send a tip. Thanks for your support!',
      tip_scan: 'WeChat QR · <strong>Thanks!</strong>',
      tip_close: 'Close',
      lang_switch_en: 'EN',
      lang_switch_cn: 'CN',
      reads_local_title: 'Local count (analytics unavailable)',
      reads_title: function(n) { return n + ' total reads'; },
      new_content_title: 'New content available',
      new_content_desc: 'The site has been updated. Click refresh to see the latest articles.',
      new_content_refresh: 'Refresh',
      new_content_dismiss: 'Later',
      translate_fail_title: 'Translation unavailable',
      translate_fail_chrome: 'Right-click anywhere on the page and select <strong>"Translate to English"</strong>.',
      translate_fail_edge: 'Right-click anywhere on the page and select <strong>"Translate"</strong>.',
      translate_fail_other: 'Use your browser\'s built-in translation (right-click menu) to translate the page.',
      translate_fail_gotit: 'Got it',
    }
  };

  let currentLang = 'zh';
  let gtScriptLoaded = false;
  let gtWidgetReady = false;
  let gtInitInProgress = false;
  let gtLoadFailed = false;
  const STORAGE_LANG_KEY = 'dawnvision_lang';
  const STORAGE_GUIDE_KEY = 'dawnvision_tfail_dismissed';
  const STORAGE_VERSION_KEY = 'dawnvision_last_version';

  function detectLang() {
    try {
      // Reset stale prefs
      var rk = 'dv_lang_reset_v23';
      if (!localStorage.getItem(rk)) {
        localStorage.setItem(STORAGE_LANG_KEY, 'zh');
        localStorage.setItem(rk, '1');
      }
      var s = localStorage.getItem(STORAGE_LANG_KEY);
      if (s === 'en' || s === 'zh') return s;
    } catch(e) {}
    return 'zh';
  }

  function t(key) {
    var dict = I18N[currentLang] || I18N.zh;
    var val = dict[key];
    if (typeof val === 'function') return val.apply(null, Array.prototype.slice.call(arguments, 1));
    return val || key;
  }

  function applyUITranslations() {
    var dict = I18N[currentLang];
    document.documentElement.lang = 'zh-CN';

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var val = dict[key];
      if (typeof val === 'string') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
        else el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      var val = dict[key];
      if (typeof val === 'string') el.innerHTML = val;
    });

    var readsLabels = document.querySelectorAll('.article-interactions__stat:nth-child(1) .article-interactions__stat-label');
    readsLabels.forEach(function(el) { el.textContent = t('reads'); });
    var likesLabels = document.querySelectorAll('.article-interactions__stat:nth-child(2) .article-interactions__stat-label');
    likesLabels.forEach(function(el) { el.textContent = t('likes'); });
    var likeBtnLabel = document.querySelector('.like-btn__label');
    if (likeBtnLabel) likeBtnLabel.textContent = t('like_btn');

    document.querySelectorAll('.article-page__meta-row span').forEach(function(el) {
      var txt = el.textContent.trim();
      if ((txt === 'Dawn Vision 编辑部' || txt === 'Dawn Vision Editorial')) {
        el.textContent = t('meta_editorial');
      }
    });

    var modal = document.getElementById('tip-modal');
    if (modal) {
      var closeBtn = modal.querySelector('.tip-modal__close');
      if (closeBtn) closeBtn.setAttribute('aria-label', t('tip_close'));
      var label = modal.querySelector('.tip-modal__label');
      if (label) label.textContent = t('tip_jar');
      var title = modal.querySelector('.tip-modal__title');
      if (title) title.textContent = t('tip_title');
      var desc = modal.querySelector('.tip-modal__desc');
      if (desc) desc.textContent = t('tip_desc');
      var text = modal.querySelector('.tip-modal__text');
      if (text) text.innerHTML = t('tip_scan');
    }
  }

  // ══════════════════════════════════════════
  // Google Translate (on-demand, banner suppressed by head script)
  // ══════════════════════════════════════════

  function ensureGTContainer() {
    var c = document.getElementById('google_translate_element');
    if (!c) {
      c = document.createElement('div');
      c.id = 'google_translate_element';
      c.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }

  function preloadGTScript(cb) {
    if (gtScriptLoaded || (window.google && window.google.translate && window.google.translate.TranslateElement)) {
      gtScriptLoaded = true;
      cb && cb();
      return;
    }
    window.googleTranslateElementInit = function() {
      gtScriptLoaded = true;
      cb && cb();
    };
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = function() { gtLoadFailed = true; setButtonIdle(); showFailGuide(); };
    document.head.appendChild(script);
    setTimeout(function() { if (!gtScriptLoaded && !gtLoadFailed) { gtLoadFailed = true; setButtonIdle(); showFailGuide(); } }, 15000);
  }

  function initGTWidget(targetLang, cb) {
    if (gtWidgetReady) { selectGTLang(targetLang, cb); return; }
    if (gtInitInProgress) { return; }
    gtInitInProgress = true;
    ensureGTContainer();
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'zh-CN',
        includedLanguages: 'en,zh-CN',
        autoDisplay: false,
        multilanguagePage: false,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
      var att = 0;
      var wi = setInterval(function() {
        att++;
        var combo = document.querySelector('.goog-te-combo');
        if (combo) {
          clearInterval(wi);
          gtWidgetReady = true;
          gtInitInProgress = false;
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
          // Extra cleanup passes
          setTimeout(killGT, 50); setTimeout(killGT, 200); setTimeout(killGT, 500);
          cb && cb(true);
        } else if (att > 60) {
          clearInterval(wi); gtInitInProgress = false; gtLoadFailed = true; setButtonIdle(); showFailGuide(); cb && cb(false);
        }
      }, 100);
    } catch(e) {
      gtInitInProgress = false; gtLoadFailed = true; setButtonIdle(); showFailGuide(); cb && cb(false);
    }
  }

  function selectGTLang(lang, cb) {
    var combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
      setTimeout(killGT, 50); setTimeout(killGT, 200);
      cb && cb(true);
      return;
    }
    var att = 0;
    var wi = setInterval(function() {
      att++;
      combo = document.querySelector('.goog-te-combo');
      if (combo) {
        clearInterval(wi);
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
        setTimeout(killGT, 50); setTimeout(killGT, 200);
        cb && cb(true);
      } else if (att > 30) { clearInterval(wi); cb && cb(false); }
    }, 100);
  }

  function killGT() {
    // Expose for head script and use locally
    if (!document.body) return;
    var fc = document.body.firstChild;
    while (fc) {
      var nxt = fc.nextSibling;
      if (fc.nodeType === 1) {
        var c = (fc.className && typeof fc.className === 'string') ? fc.className : '';
        var i = (fc.id && typeof fc.id === 'string') ? fc.id : '';
        var sr = (fc.getAttribute && fc.getAttribute('src')) || '';
        var isBad = false;
        if (fc.tagName === 'IFRAME' && (/goog-te-banner/.test(c) || /translate\.google\.com\/translate/.test(sr))) {
          var inC = false; var p = fc.parentNode;
          while (p) { if (p.id === 'google_translate_element') { inC = true; break; } p = p.parentNode; }
          if (!inC) isBad = true;
        }
        if (/goog-te-spinner|goog-te-banner|goog-te-balloon/.test(c) || i === 'goog-gt-tt') isBad = true;
        if (isBad && fc.parentNode) fc.parentNode.removeChild(fc);
      }
      fc = nxt;
    }
    document.body.style.top = '0';
    document.body.style.marginTop = '0';
  }

  function setButtonLoading() {
    var sw = document.getElementById('dv-lang-switch');
    if (!sw) return;
    sw.textContent = '...';
    sw.disabled = true;
    sw.style.opacity = '0.6';
    sw.style.cursor = 'wait';
  }

  function setButtonIdle() {
    var sw = document.getElementById('dv-lang-switch');
    if (!sw) return;
    sw.disabled = false;
    sw.style.opacity = '';
    sw.style.cursor = '';
    updateLangSwitch();
  }

  function switchToEnglish() {
    if (gtLoadFailed) { showFailGuide(); return; }
    currentLang = 'en';
    try { localStorage.setItem(STORAGE_LANG_KEY, 'en'); } catch(e) {}
    applyUITranslations();
    setButtonLoading();

    if (gtWidgetReady) {
      selectGTLang('en', function(ok) { setButtonIdle(); if (!ok) { gtLoadFailed = true; showFailGuide(); } });
      return;
    }
    preloadGTScript(function() {
      initGTWidget('en', function(ok) {
        setButtonIdle();
        if (ok) updateLangSwitch();
        else { gtLoadFailed = true; showFailGuide(); }
      });
    });
  }

  function switchToChinese() {
    currentLang = 'zh';
    try { localStorage.setItem(STORAGE_LANG_KEY, 'zh'); } catch(e) {}
    applyUITranslations();
    if (gtWidgetReady) {
      setButtonLoading();
      selectGTLang('zh-CN', function() { setButtonIdle(); updateLangSwitch(); });
    } else {
      updateLangSwitch();
    }
    hideFailGuide();
  }

  function showFailGuide() {
    setButtonIdle();
    try { if (localStorage.getItem(STORAGE_GUIDE_KEY) === '1') return; } catch(e) {}
    hideFailGuide();
    var browser = detectBrowser();
    var dk = 'translate_fail_' + browser;
    if (!I18N.en[dk]) dk = 'translate_fail_other';

    var g = document.createElement('div');
    g.id = 'dv-translate-guide';
    g.className = 'dv-translate-guide notranslate';
    g.setAttribute('translate', 'no');
    g.innerHTML =
      '<div class="dv-translate-guide__arrow"></div>' +
      '<div class="dv-translate-guide__title">' + t('translate_fail_title') + '</div>' +
      '<div class="dv-translate-guide__desc">' + t(dk) + '</div>' +
      '<div class="dv-translate-guide__actions">' +
        '<button class="dv-translate-guide__btn dv-translate-guide__btn--primary" data-action="gotit">' + t('translate_fail_gotit') + '</button>' +
      '</div>';
    document.body.appendChild(g);
    requestAnimationFrame(function() { g.classList.add('dv-translate-guide--show'); });
    g.addEventListener('click', function(e) {
      var b = e.target.closest('[data-action]');
      if (!b) return;
      hideFailGuide();
    });
  }

  function hideFailGuide() {
    var g = document.getElementById('dv-translate-guide');
    if (g) { g.classList.remove('dv-translate-guide--show'); setTimeout(function() { if (g.parentNode) g.remove(); }, 300); }
  }

  function createLangSwitch() {
    if (document.getElementById('dv-lang-switch')) return;
    var sw = document.createElement('button');
    sw.id = 'dv-lang-switch';
    sw.className = 'dv-lang-switch notranslate';
    sw.type = 'button';
    sw.setAttribute('translate', 'no');
    sw.setAttribute('aria-label', 'Language');
    sw.addEventListener('click', function() {
      if (sw.disabled) return;
      if (currentLang === 'zh') switchToEnglish();
      else switchToChinese();
    });
    document.body.appendChild(sw);
    updateLangSwitch();
  }

  function updateLangSwitch() {
    var sw = document.getElementById('dv-lang-switch');
    if (!sw) return;
    sw.textContent = currentLang === 'zh' ? I18N.zh.lang_switch_en : I18N.en.lang_switch_cn;
    sw.title = currentLang === 'zh' ? 'Translate to English' : '切回中文';
  }

  window.DV_I18N = { t: t, currentLang: function() { return currentLang; } };


  // ══════════════════════════════════════════
  // Analytics & Interactions
  // ══════════════════════════════════════════
  const STORAGE_KEY = 'dawnvision_analytics';
  const STORAGE_VERSION = 2;
  const TIP_MODAL_ID = 'tip-modal';
  const BUSUANZI_TIMEOUT = 6000;

  function migrateStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      var hasSeeds = Object.values(data).some(function(v) { return v && typeof v === 'object' && (v.viewsSeed !== undefined || v.likesSeed !== undefined); });
      if (hasSeeds || !data.__v || data.__v < STORAGE_VERSION) {
        var clean = { __v: STORAGE_VERSION };
        Object.keys(data).forEach(function(k) { if (k !== '__v') { var e = data[k]; if (e && typeof e === 'object') clean[k] = { likes: 0, visited: false, localViews: 0 }; } });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      }
    } catch(e) { try { localStorage.removeItem(STORAGE_KEY); } catch(_) {} }
  }
  migrateStorage();

  function getData() { try { var r = localStorage.getItem(STORAGE_KEY); var d = r ? JSON.parse(r) : { __v: STORAGE_VERSION }; if (!d.__v) d.__v = STORAGE_VERSION; return d; } catch(e) { return { __v: STORAGE_VERSION }; } }
  function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e) {} }

  function getArticleId() {
    var p = window.location.pathname;
    var m = p.match(/\/((?:articles|cao)\/\d{4}-\d{2}-\d{2}-[^/]+\.html)$/);
    return m ? m[1] : null;
  }

  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  function getLikes(aid) { var d = getData(); return (d[aid] && typeof d[aid].likes === 'number') ? d[aid].likes : 0; }
  function addLike(aid) { var d = getData(); if (!d[aid]) d[aid] = {}; d[aid].likes = (d[aid].likes || 0) + 1; saveData(d); return d[aid].likes; }
  function getLocalView(aid) { var d = getData(); if (!d[aid]) d[aid] = {}; if (!d[aid].visited) { d[aid].visited = true; d[aid].localViews = (d[aid].localViews || 0) + 1; d[aid].firstVisit = new Date().toISOString(); saveData(d); } return d[aid].localViews || 1; }

  function initBusuanzi(aid, onCount) {
    var hs = document.createElement('span');
    hs.id = 'busuanzi_value_page_pv';
    hs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;';
    document.body.appendChild(hs);
    var resolved = false, ci = null;
    function rL() { if (resolved) return; resolved = true; if (ci) clearInterval(ci); onCount(getLocalView(aid), true); }
    function rR(c) { if (resolved) return; resolved = true; if (ci) clearInterval(ci); onCount(c, false); }
    var ft = setTimeout(rL, BUSUANZI_TIMEOUT);
    var sc = document.createElement('script');
    sc.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    sc.async = true; sc.referrerPolicy = 'no-referrer';
    sc.onload = function() {
      var chk = 0;
      ci = setInterval(function() {
        chk++;
        var v = hs.textContent, n = parseInt(v, 10);
        if (n > 0) { clearTimeout(ft); rR(n); }
        else if (chk > 30) { clearTimeout(ft); rL(); }
      }, 500);
    };
    sc.onerror = function() { clearTimeout(ft); rL(); };
    document.head.appendChild(sc);
  }

  function createTipModal() {
    if (document.getElementById(TIP_MODAL_ID)) return;
    var ov = document.createElement('div');
    ov.id = TIP_MODAL_ID; ov.className = 'tip-modal-overlay';
    ov.innerHTML =
      '<div class="tip-modal" role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">' +
        '<button class="tip-modal__close" aria-label="' + t('tip_close') + '">×</button>' +
        '<div class="tip-modal__label">' + t('tip_jar') + '</div>' +
        '<h3 class="tip-modal__title" id="tip-modal-title">' + t('tip_title') + '</h3>' +
        '<p class="tip-modal__desc">' + t('tip_desc') + '</p>' +
        '<img src="' + getRelativePath() + 'assets/reward-qr.webp" alt="赞赏码" class="tip-modal__qr">' +
        '<p class="tip-modal__text">' + t('tip_scan') + '</p>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('.tip-modal__close').addEventListener('click', closeTipModal);
    ov.addEventListener('click', function(e) { if (e.target === ov) closeTipModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeTipModal(); });
  }

  function getRelativePath() {
    var p = window.location.pathname;
    if (p.includes('/articles/') || p.includes('/cao/') || p.includes('/issues/')) return '../';
    return '';
  }

  function openTipModal() {
    createTipModal(); applyUITranslations();
    var ov = document.getElementById(TIP_MODAL_ID);
    requestAnimationFrame(function() { ov.classList.add('tip-modal-overlay--open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeTipModal() {
    var ov = document.getElementById(TIP_MODAL_ID);
    if (ov) { ov.classList.remove('tip-modal-overlay--open'); setTimeout(function() { document.body.style.overflow = ''; }, 300); }
  }

  function initArticleInteractions() {
    var aid = getArticleId(); if (!aid) return;
    var container = document.querySelector('.article-page__footnote'); if (!container) return;
    var il = getLikes(aid);
    var bar = document.createElement('div');
    bar.className = 'article-interactions notranslate'; bar.setAttribute('translate', 'no');
    bar.innerHTML =
      '<div class="article-interactions__stats">' +
        '<div class="article-interactions__stat"><span class="article-interactions__stat-icon">👁</span><span class="article-interactions__stat-value" id="dv-views">…</span><span class="article-interactions__stat-label">' + t('reads') + '</span></div>' +
        '<div class="article-interactions__stat"><span class="article-interactions__stat-icon">♥</span><span class="article-interactions__stat-value" id="dv-likes">' + formatNumber(il) + '</span><span class="article-interactions__stat-label">' + t('likes') + '</span></div>' +
      '</div>' +
      '<div class="article-interactions__actions">' +
        '<button class="like-btn' + (il > 0 ? ' like-btn--liked' : '') + '" id="dv-like-btn" type="button">' +
          '<span class="like-btn__heart">♥</span><span class="like-btn__label">' + t('like_btn') + '</span><span class="like-btn__count" id="dv-like-count">' + formatNumber(il) + '</span>' +
        '</button>' +
        '<button class="tip-btn" id="dv-tip-btn" type="button"><span>☕</span><span>' + t('tip_btn') + '</span></button>' +
      '</div>';
    container.parentNode.insertBefore(bar, container);
    var ve = document.getElementById('dv-views');
    initBusuanzi(aid, function(c, loc) {
      ve.textContent = formatNumber(c);
      if (loc) { ve.style.opacity = '0.5'; ve.title = t('reads_local_title'); }
      else { ve.style.opacity = '1'; ve.title = t('reads_title', c); ve.style.transition = 'transform 0.3s ease'; ve.style.transform = 'scale(1.15)'; setTimeout(function() { ve.style.transform = 'scale(1)'; }, 300); }
    });
    var lb = document.getElementById('dv-like-btn'), lce = document.getElementById('dv-like-count'), sle = document.getElementById('dv-likes');
    lb.addEventListener('click', function() {
      var nc = addLike(aid), fm = formatNumber(nc);
      lce.textContent = fm; sle.textContent = fm;
      lb.classList.remove('like-btn--burst'); void lb.offsetWidth;
      lb.classList.add('like-btn--burst', 'like-btn--liked');
      setTimeout(function() { lb.classList.remove('like-btn--burst'); }, 400);
    });
    document.getElementById('dv-tip-btn').addEventListener('click', openTipModal);
  }

  function initListingPage() {
    document.addEventListener('click', function(e) { var b = e.target.closest('[data-tip-btn]'); if (b) { e.preventDefault(); openTipModal(); } });
  }

  function initIssueFilter() {
    var fe = document.querySelector('.issue-filter'); if (!fe) return;
    var issues = []; try { issues = JSON.parse(fe.dataset.issues || '[]'); } catch(e) { return; } if (!issues.length) return;
    var ys = fe.querySelector('[data-filter="year"]'), ms = fe.querySelector('[data-filter="month"]'), hs = fe.querySelector('[data-filter="half"]'), is_ = fe.querySelector('[data-filter="issue"]');
    function gs() { return { year: ys.value, month: ms.value, half: hs.value, issue: is_.value }; }
    function fi(f) { return issues.filter(function(i) { if (f.year && i.year !== f.year) return false; if (f.month && i.month !== f.month) return false; if (f.half && i.half !== f.half) return false; return true; }); }
    function uo(sel, opts, ph) { var cv = sel.value; sel.innerHTML = '<option value="">' + ph + '</option>'; opts.forEach(function(o) { var oe = document.createElement('option'); oe.value = o.value; oe.textContent = o.label; if (o.value === cv) oe.selected = true; sel.appendChild(oe); }); sel.disabled = opts.length === 0; }
    function cas(lv) {
      var s = gs();
      if (lv === 'year') { ms.value = ''; hs.value = ''; is_.value = ''; }
      if (lv === 'month') { hs.value = ''; is_.value = ''; }
      if (lv === 'half') { is_.value = ''; }
      s = gs();
      var mi = fi({year: s.year}), am = [...new Set(mi.map(function(i) { return i.month; }))].sort(), mo = am.map(function(m) { return {value: m, label: parseInt(m) + '月'}; }), pm = s.month;
      uo(ms, mo, '月');
      if (pm && am.includes(pm)) { ms.value = pm; s.month = pm; } else if (mo.length === 1) { ms.value = mo[0].value; s.month = mo[0].value; } else { s.month = ms.value; }
      var hi = fi({year: s.year, month: s.month}), ah = [...new Set(hi.map(function(i) { return i.half; }))].sort(), ho = ah.map(function(h) { return {value: h, label: h === 'H1' ? '上半月' : '下半月'}; }), ph = s.half;
      uo(hs, ho, '半');
      if (ph && ah.includes(ph)) { hs.value = ph; s.half = ph; } else if (ho.length === 1) { hs.value = ho[0].value; s.half = ho[0].value; } else { s.half = hs.value; }
      var ii = fi({year: s.year, month: s.month, half: s.half});
      ii.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var io = ii.map(function(i) { var l = 'Issue ' + parseInt(i.num); if (i.is_latest) l += ' (最新)'; return {value: i.num, label: l}; }), pi = s.issue;
      uo(is_, io, '期');
      if (pi && io.some(function(o) { return o.value === pi; })) is_.value = pi;
      else if (io.length >= 1 && !is_.value) is_.value = io[0].value;
    }
    ys.addEventListener('change', function() { cas('year'); });
    ms.addEventListener('change', function() { cas('month'); });
    hs.addEventListener('change', function() { cas('half'); });
    is_.addEventListener('change', function() { var n = is_.value; if (!n) return; var m = issues.find(function(i) { return i.num === n; }); if (m) window.location.href = m.url; });
    (function() {
      var s = gs();
      var mi = fi({year: s.year}), am = [...new Set(mi.map(function(i) { return i.month; }))].sort(), mo = am.map(function(m) { return {value: m, label: parseInt(m) + '月'}; }), cm = s.month;
      uo(ms, mo, '月'); if (cm && am.includes(cm)) ms.value = cm;
      s = gs();
      var hi = fi({year: s.year, month: s.month}), ah = [...new Set(hi.map(function(i) { return i.half; }))].sort(), ho = ah.map(function(h) { return {value: h, label: h === 'H1' ? '上半月' : '下半月'}; }), ch = s.half;
      uo(hs, ho, '半'); if (ch && ah.includes(ch)) hs.value = ch;
      s = gs();
      var ii = fi({year: s.year, month: s.month, half: s.half});
      ii.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var io = ii.map(function(i) { var l = 'Issue ' + parseInt(i.num); if (i.is_latest) l += ' (最新)'; return {value: i.num, label: l}; });
      uo(is_, io, '期');
      var cn = fe.dataset.current || '';
      if (io.length >= 1) { var mt = io.find(function(o) { return o.value === cn; }); if (mt) is_.value = mt.value; else if (!is_.value) is_.value = io[0].value; }
    })();
  }

  function initCaoPagination() {
    var ct = document.querySelector('.cao-pagination'); if (!ct) return;
    var items = document.querySelectorAll('.cao-list__item'); if (!items.length) return;
    var PP = 8, total = items.length, tp = Math.ceil(total / PP);
    if (tp <= 1) { ct.style.display = 'none'; return; }
    var pr = new URLSearchParams(window.location.search), cp = parseInt(pr.get('page') || '1', 10);
    if (isNaN(cp) || cp < 1) cp = 1; if (cp > tp) cp = tp;
    var st = (cp - 1) * PP, en = st + PP;
    for (var i = 0; i < total; i++) items[i].style.display = (i >= st && i < en) ? '' : 'none';
    function bpu(p) { var u = window.location.pathname; if (p > 1) u += '?page=' + p; return u; }
    var h = '<nav class="pagination" role="navigation" aria-label="槽点分页">';
    h += cp > 1 ? '<a href="' + bpu(cp-1) + '" class="pagination__nav pagination__nav--prev">← 上一页</a>' : '<span class="pagination__nav pagination__nav--disabled">← 上一页</span>';
    h += '<div class="pagination__pages">';
    for (var p = 1; p <= tp; p++) h += '<a href="' + bpu(p) + '" class="pagination__num' + (p===cp?' pagination__num--active':'') + '">' + p + '</a>';
    h += '</div>';
    h += cp < tp ? '<a href="' + bpu(cp+1) + '" class="pagination__nav pagination__nav--next">下一页 →</a>' : '<span class="pagination__nav pagination__nav--disabled">下一页 →</span>';
    h += '</nav>';
    ct.innerHTML = h;
  }

  // ── New Content Notification ──
  function getVJUrl() { var p = window.location.pathname; return p.match(/\/(articles|cao|issues)\//) ? '../version.json' : 'version.json'; }
  function checkNewContent() {
    var vu = getVJUrl();
    function dc() { fetch(vu + '?t=' + Date.now(), {cache:'no-store'}).then(function(r) { if (!r.ok) throw 0; return r.json(); }).then(function(d) { try { var lv = localStorage.getItem(STORAGE_VERSION_KEY); if (lv && lv !== d.version) showNCBanner(d); localStorage.setItem(STORAGE_VERSION_KEY, d.version); } catch(e) {} }).catch(function() {}); }
    fetch(vu + '?t=' + Date.now(), {cache:'no-store'}).then(function(r) { return r.json(); }).then(function(d) { try { localStorage.setItem(STORAGE_VERSION_KEY, d.version); } catch(e) {} }).catch(function() {});
    setInterval(dc, 5*60*1000);
    document.addEventListener('visibilitychange', function() { if (!document.hidden) setTimeout(dc, 2000); });
  }

  var STAR = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><filter id="dv-sg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M14 1 L16.5 11.5 L27 14 L16.5 16.5 L14 27 L11.5 16.5 L1 14 L11.5 11.5 Z" fill="#002FA7" filter="url(#dv-sg)"/><path d="M14 5 L15.5 12.5 L23 14 L15.5 15.5 L14 23 L12.5 15.5 L5 14 L12.5 12.5 Z" fill="#3B6CF6" opacity="0.6"/></svg>';

  function showNCBanner() {
    if (document.getElementById('dv-new-content')) return;
    var el = document.createElement('div');
    el.id = 'dv-new-content'; el.className = 'dv-new-content notranslate'; el.setAttribute('translate', 'no');
    el.innerHTML = '<div class="dv-new-content__inner"><div class="dv-new-content__icon">' + STAR + '</div><div class="dv-new-content__body"><div class="dv-new-content__title">' + t('new_content_title') + '</div><div class="dv-new-content__desc">' + t('new_content_desc') + '</div></div><div class="dv-new-content__actions"><button class="dv-new-content__btn dv-new-content__btn--primary" data-action="refresh">' + t('new_content_refresh') + '</button><button class="dv-new-content__btn dv-new-content__btn--ghost" data-action="dismiss">' + t('new_content_dismiss') + '</button></div><button class="dv-new-content__close" data-action="dismiss" aria-label="close">×</button></div>';
    document.body.appendChild(el);
    setTimeout(function() { requestAnimationFrame(function() { el.classList.add('dv-new-content--show'); }); }, 100);
    el.addEventListener('click', function(e) {
      var b = e.target.closest('[data-action]'); if (!b) return;
      if (b.getAttribute('data-action') === 'refresh') location.reload();
      else { el.classList.remove('dv-new-content--show'); setTimeout(function() { el.remove(); }, 500); }
    });
  }

  function init() {
    currentLang = detectLang();
    document.documentElement.lang = 'zh-CN';
    createLangSwitch();
    applyUITranslations();
    checkNewContent();
    initArticleInteractions();
    initListingPage();
    initIssueFilter();
    initCaoPagination();
    // If saved pref is English, auto-translate
    if (currentLang === 'en') {
      setTimeout(switchToEnglish, 300);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.DawnVision = { openTipModal: openTipModal, closeTipModal: closeTipModal };
})();
