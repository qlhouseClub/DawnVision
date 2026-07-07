(function(){const o=document.getElementById("articles-page");if(!o)return;const l=JSON.parse(o.dataset.issues||"[]"),g={};l.forEach(a=>{g[a.num]=a});const f=l[0]?.num;function h(a){return String(a).padStart(3,"0")}function s(a){const e=document.createElement("div");return e.textContent=a,e.innerHTML}function k(a){if(!a.cao)return"";const e=!!(a.cao.title_en&&a.cao.deck_en);return`
          <h2 class="articles-page__cao-title notranslate">Cao! <em class="dv-zh">槽点!</em></h2>
          <article class="articles-page__cao-article">
            <h3 class="articles-page__cao-article-title">
              <a href="/articles/${a.cao.slug}/">
                <span class="dv-zh">${a.cao.title}</span>
                ${e?`<span class="dv-en">${a.cao.title_en}</span>`:""}
              </a>
            </h3>
            <p class="articles-page__cao-deck dv-zh">${s(a.cao.deck)}</p>
            ${e?`<p class="articles-page__cao-deck dv-en">${s(a.cao.deck_en)}</p>`:""}
            ${a.cao.read_time?`<div class="articles-page__cao-meta"><a href="/articles/${a.cao.slug}/"><span class="dv-zh">${s(a.cao.read_time)} →</span>${e&&a.cao.read_time_en?`<span class="dv-en">${s(a.cao.read_time_en)} →</span>`:""}</a></div>`:""}
          </article>
          <a href="/cao/" class="articles-page__cao-all notranslate">View All Cao! →</a>
        `}function w(a){const e=a.cover,n=!!(e.title_en&&e.deck_en);return`
          <article class="card card--cover">
            <h3 class="card__title">
              <a href="/articles/${e.slug}/">
                <span class="dv-zh">${e.title}</span>
                ${n?`<span class="dv-en">${e.title_en}</span>`:""}
              </a>
            </h3>
            <p class="card__deck dv-zh">${s(e.deck)}</p>
            ${n?`<p class="card__deck dv-en">${s(e.deck_en)}</p>`:""}
            <div class="card__byline">
              <a href="/articles/${e.slug}/">
                <span class="dv-zh">Dawn Vision · ${s(e.read_time||"")} →</span>
                ${n&&e.read_time_en?`<span class="dv-en">Dawn Vision · ${s(e.read_time_en)} →</span>`:""}
              </a>
            </div>
          </article>
        `}function I(a){return a.briefs.map(e=>{const n=!!(e.title_en&&e.deck_en);return`
            <article class="card card--grid">
              <span class="card__tag dv-zh">${s(e.category||"")}</span>
              ${n&&e.category_en?`<span class="card__tag dv-en">${s(e.category_en)}</span>`:""}
              <h3 class="card__title">
                <a href="/articles/${e.slug}/">
                  <span class="dv-zh">${e.title}</span>
                  ${n?`<span class="dv-en">${e.title_en}</span>`:""}
                </a>
              </h3>
              <p class="card__deck dv-zh">${s(e.deck)}</p>
              ${n?`<p class="card__deck dv-en">${s(e.deck_en)}</p>`:""}
            </article>
          `}).join("")}function L(a){const e=l.findIndex(c=>c.num===a),n=a===f,t=e<l.length-1?l[e+1]?.num:null,r=l.map(c=>c.num).reverse();let i='<nav class="pagination" aria-label="期数分页" data-pagination>';return t?i+=`<a href="/articles/?issue=${t}" class="pagination__nav pagination__nav--prev notranslate" translate="no" data-issue="${t}">← Issue ${h(t)}</a>`:i+='<span class="pagination__nav pagination__nav--disabled">← 创刊号</span>',i+='<div class="pagination__pages">',r.forEach(c=>{i+=`<a href="/articles/?issue=${c}" class="pagination__page${c===a?" is-active":""}" data-issue="${c}">${parseInt(c)}</a>`}),i+="</div>",n?i+='<span class="pagination__nav pagination__nav--disabled">已是最新 →</span>':i+='<a href="/articles/" class="pagination__nav pagination__nav--next" data-issue="latest">最新一期 →</a>',i+="</nav>",i}let d=!1;function p(a,e){if(d)return;d=!0;const n=a==="latest"?l[0]:g[a];if(!n){d=!1;return}const t=n.num,r=t===f,i=document.getElementById("issue-label");i&&(i.textContent=`Issue ${h(t)}`);const c=document.getElementById("cao-content"),u=document.getElementById("section-cao");c&&u&&(n.cao?(u.style.display="",c.innerHTML=k(n)):u.style.display="none");const $=document.getElementById("focus-content");$&&($.innerHTML=w(n));const y=document.getElementById("brief-grid"),v=document.getElementById("section-brief");y&&v&&(n.briefs.length>0?(v.style.display="",y.innerHTML=I(n)):v.style.display="none");const E=o.querySelector(".articles-page__pagination");E&&(E.innerHTML=L(t));const S=r?"/articles/":`/articles/?issue=${t}`;history.pushState({issue:t},"",S),(e==="pagination"||e==="navigation")&&document.dispatchEvent(new CustomEvent("issue-changed",{detail:{issue:t,source:"pagination"}})),window.scrollTo({top:o.offsetTop-60,behavior:"smooth"}),m(),d=!1}function m(){const a=o.querySelector("[data-pagination]");if(!a)return;a.querySelectorAll("a[data-issue]").forEach(n=>{n.addEventListener("click",t=>{t.preventDefault();const r=n.dataset.issue||"latest";p(r,"pagination")})})}window.addEventListener("popstate",a=>{const n=new URLSearchParams(window.location.search).get("issue")||"latest";p(n,"navigation")}),m(),document.addEventListener("issue-changed",(a=>{a.detail&&a.detail.issue&&a.detail.source==="filter"&&p(a.detail.issue,"filter")}));const _=new URLSearchParams(window.location.search).get("issue");_&&g[_]&&_!==f&&setTimeout(()=>p(_,"init"),200)})();
