/**
 * Dawn Vision — Interaction Script
 * Handles: read count (busuanzi + local fallback), like count (localStorage), tip modal
 *
 * 阅读量：使用不蒜子(busuanzi)提供跨用户真实统计，加载失败时降级为localStorage本地计数
 * 点赞：localStorage本地存储，从0开始，点击即+1
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'dawnvision_analytics';
  const STORAGE_VERSION = 2; // 升级版本号，清除v1的假种子数据
  const TIP_MODAL_ID = 'tip-modal';
  const BUSUANZI_TIMEOUT = 6000; // 不蒜子加载超时(ms)，超时降级为本地计数

  // ── Storage migration ──
  function migrateStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      // v1数据包含seed字段（假种子），需清除重建
      const hasSeeds = Object.values(data).some(function(v) {
        return v && typeof v === 'object' && (v.viewsSeed !== undefined || v.likesSeed !== undefined);
      });
      if (hasSeeds || !data.__v || data.__v < STORAGE_VERSION) {
        // 清除旧数据（保留liked标记如果有）
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
      // 损坏则重置
      try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
    }
  }
  migrateStorage();

  // ── Storage helpers ──
  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const d = raw ? JSON.parse(raw) : { __v: STORAGE_VERSION };
      if (!d.__v) d.__v = STORAGE_VERSION;
      return d;
    } catch(e) {
      return { __v: STORAGE_VERSION };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) { /* storage full or disabled */ }
  }

  function getArticleId() {
    const path = window.location.pathname;
    // 匹配 articles/ 和 cao/ 下的文章
    const match = path.match(/\/((?:articles|cao)\/\d{4}-\d{2}-\d{2}-[^/]+\.html)$/);
    return match ? match[1] : null;
  }

  function formatNumber(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // ── Likes (localStorage, starts from 0) ──
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

  // ── Local view tracking (fallback only) ──
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

  // ── Busuanzi (不蒜子) real page view counter ──
  function initBusuanzi(articleId, onCount) {
    // 创建隐藏的span供不蒜子填充
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
      const localViews = getLocalView(articleId);
      onCount(localViews, true);
    }

    function resolveRemote(count) {
      if (resolved) return;
      resolved = true;
      if (checkInterval) clearInterval(checkInterval);
      onCount(count, false);
    }

    // 超时降级
    const fallbackTimer = setTimeout(resolveLocal, BUSUANZI_TIMEOUT);

    // 加载不蒜子脚本
    const script = document.createElement('script');
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    script.async = true;
    script.referrerPolicy = 'no-referrer';

    script.onload = function() {
      // 不蒜子加载后，轮询等待它填充数值
      let checks = 0;
      checkInterval = setInterval(function() {
        checks++;
        const val = hiddenSpan.textContent;
        const num = parseInt(val, 10);
        if (num > 0) {
          clearTimeout(fallbackTimer);
          resolveRemote(num);
        } else if (checks > 30) {
          // 轮询15秒仍无数值，降级
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

    const container = document.querySelector('.article-page__footnote');
    if (!container) return;

    const initialLikes = getLikes(articleId);

    // 构建交互条
    const bar = document.createElement('div');
    bar.className = 'article-interactions';
    bar.innerHTML = `
      <div class="article-interactions__stats">
        <div class="article-interactions__stat">
          <span class="article-interactions__stat-icon">👁</span>
          <span class="article-interactions__stat-value" id="dv-views">…</span>
          <span class="article-interactions__stat-label">Reads</span>
        </div>
        <div class="article-interactions__stat">
          <span class="article-interactions__stat-icon">♥</span>
          <span class="article-interactions__stat-value" id="dv-likes">${formatNumber(initialLikes)}</span>
          <span class="article-interactions__stat-label">Likes</span>
        </div>
      </div>
      <div class="article-interactions__actions">
        <button class="like-btn${initialLikes > 0 ? ' like-btn--liked' : ''}" id="dv-like-btn" type="button" aria-label="点赞">
          <span class="like-btn__heart">♥</span>
          <span class="like-btn__label">Like</span>
          <span class="like-btn__count" id="dv-like-count">${formatNumber(initialLikes)}</span>
        </button>
        <button class="tip-btn" id="dv-tip-btn" type="button" aria-label="打赏">
          <span>☕</span>
          <span>Tip</span>
        </button>
      </div>
    `;

    container.parentNode.insertBefore(bar, container);

    // 初始化阅读量
    const viewsEl = document.getElementById('dv-views');
    initBusuanzi(articleId, function(count, isLocal) {
      viewsEl.textContent = formatNumber(count);
      if (isLocal) {
        viewsEl.style.opacity = '0.5';
        viewsEl.title = '本地计数（统计服务暂不可用）';
      } else {
        viewsEl.style.opacity = '1';
        viewsEl.title = `总阅读量 ${count}`;
        // 数字更新时轻微动画
        viewsEl.style.transition = 'transform 0.3s ease';
        viewsEl.style.transform = 'scale(1.15)';
        setTimeout(function() { viewsEl.style.transform = 'scale(1)'; }, 300);
      }
    });

    // 点赞按钮
    const likeBtn = document.getElementById('dv-like-btn');
    const likeCountEl = document.getElementById('dv-like-count');
    const statsLikeEl = document.getElementById('dv-likes');

    likeBtn.addEventListener('click', function() {
      const newCount = addLike(articleId);
      const formatted = formatNumber(newCount);
      likeCountEl.textContent = formatted;
      statsLikeEl.textContent = formatted;

      // 心跳动画
      likeBtn.classList.remove('like-btn--burst');
      void likeBtn.offsetWidth; // force reflow
      likeBtn.classList.add('like-btn--burst', 'like-btn--liked');
      setTimeout(function() {
        likeBtn.classList.remove('like-btn--burst');
      }, 400);
    });

    // 打赏按钮
    const tipBtn = document.getElementById('dv-tip-btn');
    tipBtn.addEventListener('click', openTipModal);
  }

  // ── Listing page tip buttons ──
  function initListingPage() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-tip-btn]');
      if (btn) {
        e.preventDefault();
        openTipModal();
      }
    });
  }

  // ── Issue filter cascading dropdowns ──
  function initIssueFilter() {
    const filterEl = document.querySelector('.issue-filter');
    if (!filterEl) return;

    let issues = [];
    try {
      issues = JSON.parse(filterEl.dataset.issues || '[]');
    } catch(e) { return; }

    if (!issues.length) return;

    const yearSel = filterEl.querySelector('[data-filter="year"]');
    const monthSel = filterEl.querySelector('[data-filter="month"]');
    const halfSel = filterEl.querySelector('[data-filter="half"]');
    const issueSel = filterEl.querySelector('[data-filter="issue"]');
    const selects = [yearSel, monthSel, halfSel, issueSel];

    function getSelected() {
      return {
        year: yearSel.value,
        month: monthSel.value,
        half: halfSel.value,
        issue: issueSel.value
      };
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
      // Disable if no options besides placeholder
      sel.disabled = options.length === 0;
    }

    function cascade(changedLevel) {
      var sel = getSelected();

      // If year changed, reset month/half/issue
      if (changedLevel === 'year') {
        monthSel.value = '';
        halfSel.value = '';
        issueSel.value = '';
      }
      // If month changed, reset half/issue
      if (changedLevel === 'month') {
        halfSel.value = '';
        issueSel.value = '';
      }
      // If half changed, reset issue
      if (changedLevel === 'half') {
        issueSel.value = '';
      }

      sel = getSelected();

      // Update month options based on year
      var monthIssues = filterIssues({year: sel.year});
      var availableMonths = [...new Set(monthIssues.map(function(i) { return i.month; }))].sort();
      var monthOpts = availableMonths.map(function(m) {
        return {value: m, label: parseInt(m) + '月'};
      });
      // Preserve current month selection before rebuilding
      var prevMonth = sel.month;
      updateOptions(monthSel, monthOpts, '月');
      // Restore month if still valid
      if (prevMonth && availableMonths.includes(prevMonth)) {
        monthSel.value = prevMonth;
        sel.month = prevMonth;
      } else {
        sel.month = monthSel.value;
      }

      // Update half options based on year+month
      var halfIssues = filterIssues({year: sel.year, month: sel.month});
      var availableHalves = [...new Set(halfIssues.map(function(i) { return i.half; }))].sort();
      var halfOpts = availableHalves.map(function(h) {
        return {value: h, label: h === 'H1' ? '上半月' : '下半月'};
      });
      var prevHalf = sel.half;
      updateOptions(halfSel, halfOpts, '半');
      if (prevHalf && availableHalves.includes(prevHalf)) {
        halfSel.value = prevHalf;
        sel.half = prevHalf;
      } else {
        sel.half = halfSel.value;
      }

      // Update issue options based on year+month+half
      var issueIssues = filterIssues({year: sel.year, month: sel.month, half: sel.half});
      issueIssues.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var issueOpts = issueIssues.map(function(i) {
        var label = 'Issue ' + parseInt(i.num);
        if (i.is_latest) label += ' (最新)';
        return {value: i.num, label: label};
      });
      var prevIssue = sel.issue;
      updateOptions(issueSel, issueOpts, '期');
      if (prevIssue && issueOpts.some(function(o) { return o.value === prevIssue; })) {
        issueSel.value = prevIssue;
      }
    }

    // Event listeners
    yearSel.addEventListener('change', function() { cascade('year'); });
    monthSel.addEventListener('change', function() { cascade('month'); });
    halfSel.addEventListener('change', function() { cascade('half'); });
    issueSel.addEventListener('change', function() {
      var num = issueSel.value;
      if (!num) return;
      var match = issues.find(function(i) { return i.num === num; });
      if (match) {
        window.location.href = match.url;
      }
    });

    // Initial cascade: populate dependent dropdowns, preserving pre-selected values
    // Don't call cascade('year') which would reset - instead manually populate down
    (function initCascade() {
      var sel = getSelected();

      // 1. Populate months based on selected year
      var monthIssues = filterIssues({year: sel.year});
      var availableMonths = [...new Set(monthIssues.map(function(i) { return i.month; }))].sort();
      var monthOpts = availableMonths.map(function(m) {
        return {value: m, label: parseInt(m) + '月'};
      });
      // Save current month before rebuilding
      var curMonth = sel.month;
      updateOptions(monthSel, monthOpts, '月');
      if (curMonth && availableMonths.includes(curMonth)) {
        monthSel.value = curMonth;
      }

      // 2. Populate halves based on year+month
      sel = getSelected();
      var halfIssues = filterIssues({year: sel.year, month: sel.month});
      var availableHalves = [...new Set(halfIssues.map(function(i) { return i.half; }))].sort();
      var halfOpts = availableHalves.map(function(h) {
        return {value: h, label: h === 'H1' ? '上半月' : '下半月'};
      });
      var curHalf = sel.half;
      updateOptions(halfSel, halfOpts, '半');
      if (curHalf && availableHalves.includes(curHalf)) {
        halfSel.value = curHalf;
      }

      // 3. Populate issues based on year+month+half
      sel = getSelected();
      var issueIssues = filterIssues({year: sel.year, month: sel.month, half: sel.half});
      issueIssues.sort(function(a, b) { return parseInt(b.num) - parseInt(a.num); });
      var issueOpts = issueIssues.map(function(i) {
        var label = 'Issue ' + parseInt(i.num);
        if (i.is_latest) label += ' (最新)';
        return {value: i.num, label: label};
      });
      updateOptions(issueSel, issueOpts, '期');

      // Auto-select: prefer current issue from data-current, otherwise first option
      var currentNum = filterEl.dataset.current || '';
      if (issueOpts.length >= 1) {
        var matchOpt = issueOpts.find(function(o) { return o.value === currentNum; });
        if (matchOpt) {
          issueSel.value = matchOpt.value;
        } else if (!issueSel.value) {
          issueSel.value = issueOpts[0].value;
        }
      }
    })();
  }

  // ── DOM Ready ──
  function init() {
    initArticleInteractions();
    initListingPage();
    initIssueFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.DawnVision = {
    openTipModal: openTipModal,
    closeTipModal: closeTipModal
  };

})();
