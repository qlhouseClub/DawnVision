/**
 * Dawn Vision — Interaction Script v18
 *
 * Translation strategy (reliable approach):
 * - Default Chinese; button shows "EN"
 * - Google Translate widget is pre-loaded silently on page load (autoDisplay:false, hidden)
 * - Click EN → programmatically select 'en' from GT combo → page translates in-place
 * - Click 中 → select 'zh-CN' from GT combo → page restores to Chinese
 * - GT banner/gadget UI is hidden via CSS; we use our own button only
 * - If GT fails to load (network), button still toggles UI labels and shows a tooltip
 */

// Minimal GT chrome-hiding CSS injected immediately
(function() {
  var s = document.createElement('style');
  s.textContent =
    '.goog-te-banner-frame{display:none!important;}' +
    '.goog-te-gadget{display:none!important;}' +
    '.goog-te-gadget-icon{display:none!important;}' +
    '.goog-te-gadget-simple{display:none!important;}' +
    '.goog-te-spinner-pos{display:none!important;}' +
    'body{top:0!important;}' +
    'html{top:0!important;}' +
    '.goog-text-highlight{background-color:transparent!important;border:none!important;box-shadow:none!important;}' +
    '#goog-gt-tt{display:none!important;}' +
    '.goog-tooltip{display:none!important;}' +
    'iframe.goog-te-banner-frame{display:none!important;}';
  document.head.appendChild(s);
  // Continuously reset body top that GT adds
  setInterval(function() {
    if (document.body.style.top && document.body.style.top !== '0px') {
      document.body.style.top = '0';
    }
  }, 500);
})();

(function() {
  'use strict';

  // ══════════════════════════════════════════
  // i18n — UI Label Translation
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
      lang_switch_zh: '中',
      lang_switch_to_en: 'Translate to English',
      lang_switch_to_zh: '切回中文',
      reads_local_title: '本地计数（统计服务暂不可用）',
      reads_title: function(n) { return '总阅读量 ' + n; },
      new_content_title: '有新内容发布',
      new_content_desc: '网站已更新，点击刷新查看最新文章。',
      new_content_refresh: '刷新页面',
      new_content_dismiss: '稍后',
      translate_hint: '翻译加载中，如长时间未响应请右键页面选择"翻译"',
      translate_failed: '翻译服务暂不可用，请使用浏览器右键翻译功能',
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
      lang_switch_zh: '中',
      lang_switch_to_en: 'Translate to English',
      lang_switch_to_zh: 'Back to Chinese',
      reads_local_title: 'Local count (analytics unavailable)',
      reads_title: function(n) { return n + ' total reads'; },
      new_content_title: 'New content available',
      new_content_desc: 'The site has been updated. Click refresh to see the latest articles.',
      new_content_refresh: 'Refresh',
      new_content_dismiss: 'Later',
      translate_hint: 'Loading translation...',
      translate_failed: 'Translation unavailable, please use browser translate',
    }
  };

  let currentLang = 'zh';
  let gtReady = false;
  let gtLoadAttempted = false;
  let gtLoadFailed = false;
  const STORAGE_LANG_KEY = 'dawnvision_lang';
  const STORAGE_VERSION_KEY = 'dawnvision_last_version';

  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'zh') return saved;
    } catch(e) {}
    return 'zh';
  }

  function t(key) {
    const dict = I18N[currentLang] || I18N.zh;
    const val = dict[key];
    if (typeof val === 'function') return val.apply(null, Array.prototype.slice.call(arguments, 1));
    return val || key;
  }

  function applyUITranslations() {
    const dict = I18N[currentLang];
    document.documentElement.lang = 'zh-CN'; // Always keep zh-CN for GT compatibility

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      const key = el.getAttribute('data-i18n');
      const val = dict[key];
      if (typeof val === 'string') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.textContent = val;
        }
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      const key = el.getAttribute('data-i18n-html');
      const val = dict[key];
      if (typeof val === 'string') el.innerHTML = val;
    });

    document.querySelectorAll('.article-interactions__stat:nth-child(1) .article-interactions__stat-label').forEach(function(el) {
      el.textContent = t('reads');
    });
    document.querySelectorAll('.article-interactions__stat:nth-child(2) .article-interactions__stat-label').forEach(function(el) {
      el.textContent = t('likes');
    });
    const likeBtnLabel = document.querySelector('.like-btn__label');
    if (likeBtnLabel) likeBtnLabel.textContent = t('like_btn');

    document.querySelectorAll('.article-page__meta-row span').forEach(function(el) {
      const txt = el.textContent.trim();
      if (txt === 'Dawn Vision 编辑部' && currentLang === 'en') {
        el.textContent = t('meta_editorial');
      }
      if (txt === 'Dawn Vision Editorial' && currentLang === 'zh') {
        el.textContent = t('meta_editorial');
      }
    });

    const modal = document.getElementById('tip-modal');
    if (modal) {
      const closeBtn = modal.querySelector('.tip-modal__close');
      if (closeBtn) closeBtn.setAttribute('aria-label', t('tip_close'));
      const label = modal.querySelector('.tip-modal__label');
      if (label) label.textContent = t('tip_jar');
      const title = modal.querySelector('.tip-modal__title');
      if (title) title.textContent = t('tip_title');
      const desc = modal.querySelector('.tip-modal__desc');
      if (desc) desc.textContent = t('tip_desc');
      const text = modal.querySelector('.tip-modal__text');
      if (text) text.innerHTML = t('tip_scan');
    }
  }

  // ── Google Translate: preload silently ──
  function initGoogleTranslate() {
    if (gtLoadAttempted) return;
    gtLoadAttempted = true;

    // Allow GT through our guard
    window.__dvAllowTranslate = true;

    // Create hidden container (position off-screen, NOT display:none - GT needs layout)
    var container = document.getElementById('google_translate_element');
    if (!container) {
      container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:200px;height:50px;overflow:hidden;opacity:0;pointer-events:none;';
      document.body.appendChild(container);
    }

    // Define GT init callback
    window.googleTranslateElementInit = function() {
      try {
        if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) {
          gtLoadFailed = true;
          return;
        }
        new window.google.translate.TranslateElement({
          pageLanguage: 'zh-CN',
          includedLanguages: 'en,zh-CN',
          autoDisplay: false,
          layout: 0 // SIMPLE layout
        }, 'google_translate_element');
        gtReady = true;

        // Wait briefly for combo to appear, then apply saved language
        setTimeout(function() {
          applySavedLanguage();
        }, 500);
      } catch(e) {
        console.warn('GT init error:', e);
        gtLoadFailed = true;
      }
    };

    // Load GT script
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = function() {
      console.warn('GT script failed to load');
      gtLoadFailed = true;
    };
    document.head.appendChild(script);

    // Timeout: if GT not ready in 10s, mark as failed
    setTimeout(function() {
      if (!gtReady) gtLoadFailed = true;
    }, 10000);
  }

  function getGTCombo() {
    return document.querySelector('.goog-te-combo');
  }

  function selectGTLanguage(lang) {
    var combo = getGTCombo();
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
      // Reset body top after GT tries to add banner padding
      setTimeout(function() { document.body.style.top = '0'; }, 300);
      return true;
    }
    return false;
  }

  function waitForComboAndSelect(lang, callback, attempts) {
    attempts = attempts || 0;
    if (selectGTLanguage(lang)) {
      callback && callback(true);
      return;
    }
    if (attempts < 40) {
      setTimeout(function() { waitForComboAndSelect(lang, callback, attempts + 1); }, 150);
    } else {
      callback && callback(false);
    }
  }

  function applySavedLanguage() {
    if (currentLang === 'en') {
      waitForComboAndSelect('en', function(ok) {
        if (ok) {
          applyUITranslations();
          updateLangSwitch();
        }
      });
    }
  }

  function switchToEnglish() {
    if (gtLoadFailed) {
      showTranslateHint(true);
      return;
    }
    if (!gtReady) {
      // GT still loading, wait for it
      showTranslateHint(false);
      var check = setInterval(function() {
        if (gtReady) {
          clearInterval(check);
          waitForComboAndSelect('en', function(ok) {
            if (ok) {
              currentLang = 'en';
              try { localStorage.setItem(STORAGE_LANG_KEY, 'en'); } catch(e) {}
              applyUITranslations();
              updateLangSwitch();
            }
          });
        }
        if (gtLoadFailed) {
          clearInterval(check);
          showTranslateHint(true);
          updateLangSwitch();
        }
      }, 200);
      return;
    }
    waitForComboAndSelect('en', function(ok) {
      if (ok) {
        currentLang = 'en';
        try { localStorage.setItem(STORAGE_LANG_KEY, 'en'); } catch(e) {}
        applyUITranslations();
        updateLangSwitch();
      } else {
        showTranslateHint(true);
      }
    });
  }

  function switchToChinese() {
    currentLang = 'zh';
    try { localStorage.setItem(STORAGE_LANG_KEY, 'zh'); } catch(e) {}
    selectGTLanguage('zh-CN');
    applyUITranslations();
    updateLangSwitch();
  }

  function showTranslateHint(isError) {
    var existing = document.getElementById('dv-translate-hint');
    if (existing) existing.remove();
    var hint = document.createElement('div');
    hint.id = 'dv-translate-hint';
    hint.className = 'dv-translate-hint';
    hint.textContent = isError ? t('translate_failed') : t('translate_hint');
    document.body.appendChild(hint);
    requestAnimationFrame(function() { hint.classList.add('dv-translate-hint--show'); });
    setTimeout(function() {
      hint.classList.remove('dv-translate-hint--show');
      setTimeout(function() { hint.remove(); }, 300);
    }, isError ? 4000 : 2000);
    if (isError) updateLangSwitch();
  }

  function createLangSwitch() {
    if (document.getElementById('dv-lang-switch')) return;
    var sw = document.createElement('button');
    sw.id = 'dv-lang-switch';
    sw.className = 'dv-lang-switch';
    sw.type = 'button';
    sw.setAttribute('aria-label', 'Language');
    sw.addEventListener('click', function() {
      if (currentLang === 'zh') {
        switchToEnglish();
      } else {
        switchToChinese();
      }
    });
    document.body.appendChild(sw);
    updateLangSwitch();
  }

  function updateLangSwitch() {
    var sw = document.getElementById('dv-lang-switch');
    if (!sw) return;
    sw.textContent = currentLang === 'zh' ? I18N.zh.lang_switch_en : I18N.en.lang_switch_zh;
    sw.title = currentLang === 'zh' ? t('lang_switch_to_en') : t('lang_switch_to_zh');
  }

  window.DV_I18N = { t: t, setLang: function(l) { if (l==='en') switchToEnglish(); else switchToChinese(); }, currentLang: function() { return currentLang; } };


  // ══════════════════════════════════════════
  // Analytics & Interactions
  // ══════════════════════════════════════════
  const STORAGE_KEY = 'dawnvision_analytics';
  const STORAGE_VERSION = 2;
  const TIP_MODAL_ID = 'tip-modal';
  const BUSUANZI_TIMEOUT = 6000;

  function migrateStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const hasSeeds = Object.values(data).some(function(v) {
        return v && typeof v === 'object' && (v.viewsSeed !== undefined || v.likesSeed !== undefined);
      });
      if (hasSeeds || !data.__v || data.__v < STORAGE_VERSION) {
        const clean = { __v: STORAGE_VERSION };
        Object.keys(data).forEach(function(k) {
          if (k === '__v') return;
          const entry = data[k];
          if (entry && typeof entry === 'object') {
            clean[k] = { likes: 0, visited: false, localViews: 0 };
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      }
    } catch(e) {
      try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
    }
  }
  migrateStorage();

  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const d = raw ? JSON.parse(raw) : { __v: STORAGE_VERSION };
      if (!d.__v) d.__v = STORAGE_VERSION;
      return d;
    } catch(e) { return { __v: STORAGE_VERSION }; }
  }

  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  function getArticleId() {
    const path = window.location.pathname;
    const match = path.match(/\/((?:articles|cao)\/\d{4}-\d{2}-\d{2}-[^/]+\.html)$/);
    return match ? match[1] : null;
  }

  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  function getLikes(articleId) {
    const data = getData();
    return (data[articleId] && typeof data[articleId].likes === 'number') ? data[articleId].likes : 0;
  }

  function addLike(articleId) {
    const data = getData();
    if (!data[articleId]) data[articleId] = {};
    data[articleId].likes = (data[articleId].likes || 0) + 1;
    saveData(data);
    return data[articleId].likes;
  }

  function getLocalView(articleId) {
    const data = getData();
    if (!data[articleId]) data[articleId] = {};
    if (!data[articleId].visited) {
      data[articleId].visited = true;
      data[articleId].localViews = (data[articleId].localViews || 0) + 1;
      data[articleId].firstVisit = new Date().toISOString();
      saveData(data);
    }
    return data[articleId].localViews || 1;
  }

  function initBusuanzi(articleId, onCount) {
    const hiddenSpan = document.createElement('span');
    hiddenSpan.id = 'busuanzi_value_page_pv';
    hiddenSpan.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;';
    document.body.appendChild(hiddenSpan);

    let resolved = false;
    let checkInterval = null;

    function resolveLocal() {
      if (resolved) return;
      resolved = true;
      if (checkInterval) clearInterval(checkInterval);
      onCount(getLocalView(articleId), true);
    }

    function resolveRemote(count) {
      if (resolved) return;
      resolved = true;
      if (checkInterval) clearInterval(checkInterval);
      onCount(count, false);
    }

    const fallbackTimer = setTimeout(resolveLocal, BUSUANZI_TIMEOUT);

    const script = document.createElement('script');
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    script.async = true;
    script.referrerPolicy = 'no-referrer';

    script.onload = function() {
      let checks = 0;
      checkInterval = setInterval(function() {
        checks++;
        const val = hiddenSpan.textContent;
        const num = parseInt(val, 10);
        if (num > 0) {
          clearTimeout(fallbackTimer);
          resolveRemote(num);
        } else if (checks > 30) {
          clearTimeout(fallbackTimer);
          resolveLocal();
        }
      }, 500);
    };

    script.onerror = function() {
      clearTimeout(fallbackTimer);
      resolveLocal();
    };

    document.head.appendChild(script);
  }

  function createTipModal() {
    if (document.getElementById(TIP_MODAL_ID)) return;
    const overlay = document.createElement('div');
    overlay.id = TIP_MODAL_ID;
    overlay.className = 'tip-modal-overlay';
    overlay.innerHTML =
      '<div class="tip-modal" role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">' +
        '<button class="tip-modal__close" aria-label="' + t('tip_close') + '">×</button>' +
        '<div class="tip-modal__label">' + t('tip_jar') + '</div>' +
        '<h3 class="tip-modal__title" id="tip-modal-title">' + t('tip_title') + '</h3>' +
        '<p class="tip-modal__desc">' + t('tip_desc') + '</p>' +
        '<img src="' + getRelativePath() + 'assets/reward-qr.webp" alt="赞赏码" class="tip-modal__qr">' +
        '<p class="tip-modal__text">' + t('tip_scan') + '</p>' +
      '</div>';
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.tip-modal__close');
    closeBtn.addEventListener('click', closeTipModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeTipModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeTipModal();
    });
  }

  function getRelativePath() {
    const path = window.location.pathname;
    if (path.includes('/articles/') || path.includes('/cao/')) return '../';
    if (path.includes('/issues/')) return '../';
    return '';
  }

  function openTipModal() {
    createTipModal();
    applyUITranslations();
    const overlay = document.getElementById(TIP_MODAL_ID);
    requestAnimationFrame(function() {
      overlay.classList.add('tip-modal-overlay--open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeTipModal() {
    const overlay = document.getElementById(TIP_MODAL_ID);
    if (overlay) {
      overlay.classList.remove('tip-modal-overlay--open');
      setTimeout(function() { document.body.style.overflow = ''; }, 300);
    }
  }

  function initArticleInteractions() {
    const articleId = getArticleId();
    if (!articleId) return;
    const container = document.querySelector('.article-page__footnote');
    if (!container) return;

    const initialLikes = getLikes(articleId);
    const bar = document.createElement('div');
    bar.className = 'article-interactions';
    bar.innerHTML =
      '<div class="article-interactions__stats">' +
        '<div class="article-interactions__stat">' +
          '<span class="article-interactions__stat-icon">👁</span>' +
          '<span class="article-interactions__stat-value" id="dv-views">…</span>' +
          '<span class="article-interactions__stat-label">' + t('reads') + '</span>' +
        '</div>' +
        '<div class="article-interactions__stat">' +
          '<span class="article-interactions__stat-icon">♥</span>' +
          '<span class="article-interactions__stat-value" id="dv-likes">' + formatNumber(initialLikes) + '</span>' +
          '<span class="article-interactions__stat-label">' + t('likes') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="article-interactions__actions">' +
        '<button class="like-btn' + (initialLikes > 0 ? ' like-btn--liked' : '') + '" id="dv-like-btn" type="button" aria-label="点赞">' +
          '<span class="like-btn__heart">♥</span>' +
          '<span class="like-btn__label">' + t('like_btn') + '</span>' +
          '<span class="like-btn__count" id="dv-like-count">' + formatNumber(initialLikes) + '</span>' +
        '</button>' +
        '<button class="tip-btn" id="dv-tip-btn" type="button" aria-label="打赏">' +
          '<span>☕</span><span>' + t('tip_btn') + '</span>' +
        '</button>' +
      '</div>';

    container.parentNode.insertBefore(bar, container);

    const viewsEl = document.getElementById('dv-views');
    initBusuanzi(articleId, function(count, isLocal) {
      viewsEl.textContent = formatNumber(count);
      if (isLocal) {
        viewsEl.style.opacity = '0.5';
        viewsEl.title = t('reads_local_title');
      } else {
        viewsEl.style.opacity = '1';
        viewsEl.title = t('reads_title', count);
        viewsEl.style.transition = 'transform 0.3s ease';
        viewsEl.style.transform = 'scale(1.15)';
        setTimeout(function() { viewsEl.style.transform = 'scale(1)'; }, 300);
      }
    });

    const likeBtn = document.getElementById('dv-like-btn');
    const likeCountEl = document.getElementById('dv-like-count');
    const statsLikeEl = document.getElementById('dv-likes');

    likeBtn.addEventListener('click', function() {
      const newCount = addLike(articleId);
      const formatted = formatNumber(newCount);
      likeCountEl.textContent = formatted;
      statsLikeEl.textContent = formatted;
      likeBtn.classList.remove('like-btn--burst');
      void likeBtn.offsetWidth;
      likeBtn.classList.add('like-btn--burst', 'like-btn--liked');
      setTimeout(function() { likeBtn.classList.remove('like-btn--burst'); }, 400);
    });

    const tipBtn = document.getElementById('dv-tip-btn');
    tipBtn.addEventListener('click', openTipModal);
  }

  function initListingPage() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-tip-btn]');
      if (btn) { e.preventDefault(); openTipModal(); }
    });
  }

  function initIssueFilter() {
    const filterEl = document.querySelector('.issue-filter');
    if (!filterEl) return;
    let issues = [];
    try { issues = JSON.parse(filterEl.dataset.issues || '[]'); } catch(e) { return; }
    if (!issues.length) return;

    const yearSel = filterEl.querySelector('[data-filter="year"]');
    const monthSel = filterEl.querySelector('[data-filter="month"]');
    const halfSel = filterEl.querySelector('[data-filter="half"]');
    const issueSel = filterEl.querySelector('[data-filter="issue"]');

    function getSelected() {
      return { year: yearSel.value, month: monthSel.value, half: halfSel.value, issue: issueSel.value };
    }
    function filterIssues(filters) {
      return issues.filter(function(i) {
        if (filters.year && i.year !== filters.year) return false;
        if (filters.month && i.month !== filters.month) return false;
        if (filters.half && i.half !== filters.half) return false;
        return true;
      });
    }
    function updateOptions(sel, options, placeholder) {
      var currentVal = sel.value;
      sel.innerHTML = '<option value="">' + placeholder + '</option>';
      options.forEach(function(opt) {
        var optEl = document.createElement('option');
        optEl.value = opt.value;
        optEl.textContent = opt.label;
        if (opt.value === currentVal) optEl.selected = true;
        sel.appendChild(optEl);
      });
      sel.disabled = options.length === 0;
    }

    function cascade(changedLevel) {
      var sel = getSelected();
      if (changedLevel === 'year') { monthSel.value = ''; halfSel.value = ''; issueSel.value = ''; }
      if (changedLevel === 'month') { halfSel.value = ''; issueSel.value = ''; }
      if (changedLevel === 'half') { issueSel.value = ''; }
      sel = getSelected();

      var monthIssues = filterIssues({year: sel.year});
      var availableMonths = [...new Set(monthIssues.map(function(i) { return i.month; }))].sort();
      var monthOpts = availableMonths.map(function(m) { return {value: m, label: parseInt(m) + '月'}; });
      var prevMonth = sel.month;
      updateOptions(monthSel, monthOpts, '月');
      if (prevMonth && availableMonths.includes(prevMonth)) { monthSel.value = prevMonth; sel.month = prevMonth; }
      else if (monthOpts.length === 1) { monthSel.value = monthOpts[0].value; sel.month = monthOpts[0].value; }
      else { sel.month = monthSel.value; }

      var halfIssues = filterIssues({year: sel.year, month: sel.month});
      var availableHalves = [...new Set(halfIssues.map(function(i) { return i.half; }))].sort();
      var halfOpts = availableHalves.map(function(h) { return {value: h, label: h === 'H1' ? '上半月' : '下半月'}; });
      var prevHalf = sel.half;
      updateOptions(halfSel, halfOpts, '半');
      if (prevHalf && availableHalves.includes(prevHalf)) { halfSel.value = prevHalf; sel.half = prevHalf; }
      else if (halfOpts.length === 1) { halfSel.value = halfOpts[0].value; sel.half = halfOpts[0].value; }
      else { sel.half = halfSel.value; }

      var issueIssues = filterIssues({year: sel.year, month: sel.month, half: sel.half});
      issueIssues.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var issueOpts = issueIssues.map(function(i) {
        var label = 'Issue ' + parseInt(i.num);
        if (i.is_latest) label += ' (最新)';
        return {value: i.num, label: label};
      });
      var prevIssue = sel.issue;
      updateOptions(issueSel, issueOpts, '期');
      if (prevIssue && issueOpts.some(function(o) { return o.value === prevIssue; })) { issueSel.value = prevIssue; }
      else if (issueOpts.length >= 1 && !issueSel.value) { issueSel.value = issueOpts[0].value; }
    }

    yearSel.addEventListener('change', function() { cascade('year'); });
    monthSel.addEventListener('change', function() { cascade('month'); });
    halfSel.addEventListener('change', function() { cascade('half'); });
    issueSel.addEventListener('change', function() {
      var num = issueSel.value;
      if (!num) return;
      var match = issues.find(function(i) { return i.num === num; });
      if (match) window.location.href = match.url;
    });

    (function initCascade() {
      var sel = getSelected();
      var monthIssues = filterIssues({year: sel.year});
      var availableMonths = [...new Set(monthIssues.map(function(i) { return i.month; }))].sort();
      var monthOpts = availableMonths.map(function(m) { return {value: m, label: parseInt(m) + '月'}; });
      var curMonth = sel.month;
      updateOptions(monthSel, monthOpts, '月');
      if (curMonth && availableMonths.includes(curMonth)) monthSel.value = curMonth;

      sel = getSelected();
      var halfIssues = filterIssues({year: sel.year, month: sel.month});
      var availableHalves = [...new Set(halfIssues.map(function(i) { return i.half; }))].sort();
      var halfOpts = availableHalves.map(function(h) { return {value: h, label: h === 'H1' ? '上半月' : '下半月'}; });
      var curHalf = sel.half;
      updateOptions(halfSel, halfOpts, '半');
      if (curHalf && availableHalves.includes(curHalf)) halfSel.value = curHalf;

      sel = getSelected();
      var issueIssues = filterIssues({year: sel.year, month: sel.month, half: sel.half});
      issueIssues.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var issueOpts = issueIssues.map(function(i) {
        var label = 'Issue ' + parseInt(i.num);
        if (i.is_latest) label += ' (最新)';
        return {value: i.num, label: label};
      });
      updateOptions(issueSel, issueOpts, '期');
      var currentNum = filterEl.dataset.current || '';
      if (issueOpts.length >= 1) {
        var matchOpt = issueOpts.find(function(o) { return o.value === currentNum; });
        if (matchOpt) issueSel.value = matchOpt.value;
        else if (!issueSel.value) issueSel.value = issueOpts[0].value;
      }
    })();
  }

  function initCaoPagination() {
    var container = document.querySelector('.cao-pagination');
    if (!container) return;
    var items = document.querySelectorAll('.cao-list__item');
    if (!items.length) return;
    var PER_PAGE = 8;
    var total = items.length;
    var totalPages = Math.ceil(total / PER_PAGE);
    if (totalPages <= 1) { container.style.display = 'none'; return; }

    var params = new URLSearchParams(window.location.search);
    var currentPage = parseInt(params.get('page') || '1', 10);
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * PER_PAGE;
    var end = start + PER_PAGE;
    for (var i = 0; i < total; i++) {
      items[i].style.display = (i >= start && i < end) ? '' : 'none';
    }

    function buildPageUrl(p) {
      var url = window.location.pathname;
      if (p > 1) url += '?page=' + p;
      return url;
    }

    var html = '<nav class="pagination" role="navigation" aria-label="槽点分页">';
    if (currentPage > 1) {
      html += '<a href="' + buildPageUrl(currentPage - 1) + '" class="pagination__nav pagination__nav--prev">← 上一页</a>';
    } else {
      html += '<span class="pagination__nav pagination__nav--disabled">← 上一页</span>';
    }
    html += '<div class="pagination__pages">';
    for (var p = 1; p <= totalPages; p++) {
      var active = (p === currentPage) ? ' pagination__num--active' : '';
      html += '<a href="' + buildPageUrl(p) + '" class="pagination__num' + active + '">' + p + '</a>';
    }
    html += '</div>';
    if (currentPage < totalPages) {
      html += '<a href="' + buildPageUrl(currentPage + 1) + '" class="pagination__nav pagination__nav--next">下一页 →</a>';
    } else {
      html += '<span class="pagination__nav pagination__nav--disabled">下一页 →</span>';
    }
    html += '</nav>';
    container.innerHTML = html;
  }

  // ── New Content Notification ──
  function getVersionJsonUrl() {
    var path = window.location.pathname;
    if (path.match(/\/(articles|cao|issues)\//)) return '../version.json';
    return 'version.json';
  }

  function checkForNewContent() {
    var vUrl = getVersionJsonUrl();
    function doCheck() {
      fetch(vUrl + '?t=' + Date.now(), { cache: 'no-store' })
        .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function(data) {
          try {
            const lastVer = localStorage.getItem(STORAGE_VERSION_KEY);
            if (lastVer && lastVer !== data.version) showNewContentBanner(data);
            localStorage.setItem(STORAGE_VERSION_KEY, data.version);
          } catch(e) {}
        })
        .catch(function() {});
    }
    fetch(vUrl + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.json(); })
      .then(function(data) { try { localStorage.setItem(STORAGE_VERSION_KEY, data.version); } catch(e) {} })
      .catch(function() {});

    setInterval(doCheck, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) setTimeout(doCheck, 2000);
    });
  }

  var STAR_SVG = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<filter id="dv-star-glow" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="2" result="blur"/>' +
        '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
    '</defs>' +
    '<path d="M14 1 L16.5 11.5 L27 14 L16.5 16.5 L14 27 L11.5 16.5 L1 14 L11.5 11.5 Z" fill="#002FA7" filter="url(#dv-star-glow)"/>' +
    '<path d="M14 5 L15.5 12.5 L23 14 L15.5 15.5 L14 23 L12.5 15.5 L5 14 L12.5 12.5 Z" fill="#3B6CF6" opacity="0.6"/>' +
    '</svg>';

  function showNewContentBanner(data) {
    if (document.getElementById('dv-new-content')) return;
    const el = document.createElement('div');
    el.id = 'dv-new-content';
    el.className = 'dv-new-content';
    el.innerHTML =
      '<div class="dv-new-content__inner">' +
        '<div class="dv-new-content__icon">' + STAR_SVG + '</div>' +
        '<div class="dv-new-content__body">' +
          '<div class="dv-new-content__title">' + t('new_content_title') + '</div>' +
          '<div class="dv-new-content__desc">' + t('new_content_desc') + '</div>' +
        '</div>' +
        '<div class="dv-new-content__actions">' +
          '<button class="dv-new-content__btn dv-new-content__btn--primary" data-action="refresh">' + t('new_content_refresh') + '</button>' +
          '<button class="dv-new-content__btn dv-new-content__btn--ghost" data-action="dismiss">' + t('new_content_dismiss') + '</button>' +
        '</div>' +
        '<button class="dv-new-content__close" data-action="dismiss" aria-label="close">×</button>' +
      '</div>';
    document.body.appendChild(el);
    setTimeout(function() {
      requestAnimationFrame(function() { el.classList.add('dv-new-content--show'); });
    }, 100);

    el.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'refresh') location.reload();
      if (action === 'dismiss') {
        el.classList.remove('dv-new-content--show');
        setTimeout(function() { el.remove(); }, 500);
      }
    });
  }

  // ── DOM Ready ──
  function init() {
    currentLang = detectLang();
    document.documentElement.lang = 'zh-CN';
    createLangSwitch();
    applyUITranslations();

    // Preload Google Translate silently (autoDisplay: false, won't auto-translate)
    initGoogleTranslate();

    checkForNewContent();
    initArticleInteractions();
    initListingPage();
    initIssueFilter();
    initCaoPagination();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnVision = { openTipModal: openTipModal, closeTipModal: closeTipModal };

})();
