/**
 * Dawn Vision — Interaction Script
 * Handles: read count, like count, tip modal
 * Storage: localStorage (per-browser persistence)
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'dawnvision_analytics';
  const TIP_MODAL_ID = 'tip-modal';
  const SITE_URL = 'https://qlhouseclub.github.io/DawnVision/';

  // ── Storage helpers ──
  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch(e) {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) { /* storage full or disabled */ }
  }

  function getArticleId() {
    const path = window.location.pathname;
    const match = path.match(/\/((?:articles|cao)\/\d{4}-\d{2}-\d{2}-[^/]+\.html)$/);
    return match ? match[1] : null;
  }

  // Seed initial counts for articles (pseudo-random but deterministic-feeling)
  function getSeedCount(articleId, type) {
    let hash = 0;
    const str = articleId + type;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const base = Math.abs(hash);
    if (type === 'views') {
      return 120 + (base % 380); // 120-499 views
    } else {
      return 8 + (base % 42); // 8-49 likes
    }
  }

  function getCount(articleId, type) {
    const data = getData();
    if (!data[articleId]) data[articleId] = {};
    if (typeof data[articleId][type + 'Seed'] === 'undefined') {
      data[articleId][type + 'Seed'] = getSeedCount(articleId, type);
      data[articleId][type] = 0; // user-contributed count
      saveData(data);
    }
    return data[articleId][type + 'Seed'] + data[articleId][type];
  }

  function incrementCount(articleId, type) {
    const data = getData();
    if (!data[articleId]) data[articleId] = {};
    if (typeof data[articleId][type] !== 'number') data[articleId][type] = 0;
    data[articleId][type]++;
    saveData(data);
    return data[articleId][type + 'Seed'] + data[articleId][type];
  }

  function hasVisited(articleId) {
    const data = getData();
    return !!(data[articleId] && data[articleId].visited);
  }

  function markVisited(articleId) {
    const data = getData();
    if (!data[articleId]) data[articleId] = {};
    data[articleId].visited = true;
    data[articleId].firstVisit = data[articleId].firstVisit || new Date().toISOString();
    saveData(data);
  }

  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // ── Tip Modal ──
  function createTipModal() {
    if (document.getElementById(TIP_MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = TIP_MODAL_ID;
    overlay.className = 'tip-modal-overlay';
    overlay.innerHTML = `
      <div class="tip-modal" role="dialog" aria-modal="true" aria-labelledby="tip-modal-title">
        <button class="tip-modal__close" aria-label="关闭">×</button>
        <div class="tip-modal__label">Tip Jar</div>
        <h3 class="tip-modal__title" id="tip-modal-title">请作者喝杯奶茶</h3>
        <p class="tip-modal__desc">如果这篇文章对你有帮助，欢迎随意打赏。感谢支持！</p>
        <img src="${getRelativePath()}assets/reward-qr.webp" alt="赞赏码" class="tip-modal__qr">
        <p class="tip-modal__text">微信扫码 · <strong>谢谢老板</strong></p>
      </div>
    `;
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
    if (path.includes('/articles/') || path.includes('/cao/')) {
      return '../';
    }
    if (path.includes('/issues/')) {
      return '../';
    }
    return '';
  }

  function openTipModal() {
    createTipModal();
    const overlay = document.getElementById(TIP_MODAL_ID);
    requestAnimationFrame(() => {
      overlay.classList.add('tip-modal-overlay--open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeTipModal() {
    const overlay = document.getElementById(TIP_MODAL_ID);
    if (overlay) {
      overlay.classList.remove('tip-modal-overlay--open');
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 300);
    }
  }

  // ── Initialize article interactions ──
  function initArticleInteractions() {
    const articleId = getArticleId();
    if (!articleId) return;

    // Track view (only once per session per article)
    if (!hasVisited(articleId)) {
      markVisited(articleId);
      incrementCount(articleId, 'views');
    }

    // Wait for DOM to be ready
    const container = document.querySelector('.article-page__footnote');
    if (!container) return;

    const views = getCount(articleId, 'views');
    const likes = getCount(articleId, 'likes');

    // Build interaction bar HTML
    const bar = document.createElement('div');
    bar.className = 'article-interactions';
    bar.innerHTML = `
      <div class="article-interactions__stats">
        <div class="article-interactions__stat">
          <span class="article-interactions__stat-icon">👁</span>
          <span class="article-interactions__stat-value" id="dv-views">${formatNumber(views)}</span>
          <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--gray-light);font-family:var(--sans);font-style:italic;">Reads</span>
        </div>
        <div class="article-interactions__stat">
          <span class="article-interactions__stat-icon">♥</span>
          <span class="article-interactions__stat-value" id="dv-likes">${formatNumber(likes)}</span>
          <span style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--gray-light);font-family:var(--sans);font-style:italic;">Likes</span>
        </div>
      </div>
      <div class="article-interactions__actions">
        <button class="like-btn" id="dv-like-btn" type="button" aria-label="点赞">
          <span class="like-btn__heart">♥</span>
          <span class="like-btn__label">Like</span>
          <span class="like-btn__count" id="dv-like-count">${formatNumber(likes)}</span>
        </button>
        <button class="tip-btn" id="dv-tip-btn" type="button" aria-label="打赏">
          <span>☕</span>
          <span>Tip</span>
        </button>
      </div>
    `;

    // Insert before footnote
    container.parentNode.insertBefore(bar, container);

    // Like button handler (can click multiple times, no cancel)
    const likeBtn = document.getElementById('dv-like-btn');
    const likeCountEl = document.getElementById('dv-like-count');
    const statsLikeEl = document.getElementById('dv-likes');

    likeBtn.addEventListener('click', function() {
      const newCount = incrementCount(articleId, 'likes');
      const formatted = formatNumber(newCount);
      likeCountEl.textContent = formatted;
      statsLikeEl.textContent = formatted;

      // Burst animation
      likeBtn.classList.remove('like-btn--burst');
      void likeBtn.offsetWidth; // force reflow
      likeBtn.classList.add('like-btn--burst', 'like-btn--liked');

      // Haptic-ish feedback via scale
      setTimeout(() => {
        likeBtn.classList.remove('like-btn--burst');
      }, 400);
    });

    // Tip button handler
    const tipBtn = document.getElementById('dv-tip-btn');
    tipBtn.addEventListener('click', openTipModal);
  }

  // ── Initialize listing page interactions (tip button on article cards) ──
  function initListingPage() {
    // Add global tip buttons to cao section?
    // For now, just ensure modal exists if any tip buttons are clicked
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-tip-btn]');
      if (btn) {
        e.preventDefault();
        openTipModal();
      }
    });
  }

  // ── SEO: JSON-LD Structured Data helper ──
  function injectJsonLd(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // ── DOM Ready ──
  function init() {
    initArticleInteractions();
    initListingPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.DawnVision = {
    openTipModal: openTipModal,
    closeTipModal: closeTipModal,
    injectJsonLd: injectJsonLd
  };

})();
