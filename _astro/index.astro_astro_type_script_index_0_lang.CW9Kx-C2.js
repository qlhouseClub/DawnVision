(function(){const r=document.getElementById("articles-page");if(!r)return;const c=JSON.parse(r.dataset.issues||"[]"),f={};c.forEach(a=>{f[a.num]=a});const _=c[0]?.num;function h(a){return String(a).padStart(3,"0")}function o(a){const e=document.createElement("div");return e.textContent=a,e.innerHTML}function w(a){return a.cao?`
        <h2 class="articles-page__cao-title notranslate" translate="no">Cao! <em>槽点!</em></h2>
        <article class="articles-page__cao-article">
          <h3 class="articles-page__cao-article-title">
            <a href="/articles/${a.cao.slug}">${a.cao.title}</a>
          </h3>
          <p class="articles-page__cao-deck">${o(a.cao.deck)}</p>
          ${a.cao.read_time?`<div class="articles-page__cao-meta"><a href="/articles/${a.cao.slug}">${o(a.cao.read_time)} →</a></div>`:""}
        </article>
        <a href="/cao" class="articles-page__cao-all notranslate" translate="no">View All Cao! →</a>
      `:""}function I(a){const e=a.cover;return`
        <article class="card card--cover">
          <h3 class="card__title">
            <a href="/articles/${e.slug}">${e.title}</a>
          </h3>
          <p class="card__deck">${o(e.deck)}</p>
          <div class="card__byline">
            <a href="/articles/${e.slug}">Dawn Vision · ${o(e.read_time||"")} →</a>
          </div>
        </article>
      `}function L(a){return a.briefs.map(e=>`
          <article class="card card--grid">
            <span class="card__tag">${o(e.category||"")}</span>
            <h3 class="card__title">
              <a href="/articles/${e.slug}">${e.title}</a>
            </h3>
            <p class="card__deck">${o(e.deck)}</p>
          </article>
        `).join("")}function b(a){const e=c.findIndex(i=>i.num===a),t=a===_,n=e<c.length-1?c[e+1]?.num:null,l=c.map(i=>i.num).reverse();let s='<nav class="pagination" aria-label="期数分页" data-pagination>';return n?s+=`<a href="/articles?issue=${n}" class="pagination__nav pagination__nav--prev notranslate" translate="no" data-issue="${n}">← Issue ${h(n)}</a>`:s+='<span class="pagination__nav pagination__nav--disabled">← 创刊号</span>',s+='<div class="pagination__pages">',l.forEach(i=>{s+=`<a href="/articles?issue=${i}" class="pagination__page${i===a?" is-active":""}" data-issue="${i}">${parseInt(i)}</a>`}),s+="</div>",t?s+='<span class="pagination__nav pagination__nav--disabled">已是最新 →</span>':s+='<a href="/articles" class="pagination__nav pagination__nav--next" data-issue="latest">最新一期 →</a>',s+="</nav>",s}let d=!1;function u(a,e){if(d)return;d=!0;const t=a==="latest"?c[0]:f[a];if(!t){d=!1;return}const n=t.num,l=n===_,s=document.getElementById("issue-label");s&&(s.textContent=`Issue ${h(n)}`);const i=document.getElementById("cao-content"),g=document.getElementById("section-cao");i&&g&&(t.cao?(g.style.display="",i.innerHTML=w(t)):g.style.display="none");const $=document.getElementById("focus-content");$&&($.innerHTML=I(t));const y=document.getElementById("brief-grid"),m=document.getElementById("section-brief");y&&m&&(t.briefs.length>0?(m.style.display="",y.innerHTML=L(t)):m.style.display="none");const E=r.querySelector(".articles-page__pagination");E&&(E.innerHTML=b(n));const S=l?"/articles":`/articles?issue=${n}`;history.pushState({issue:n},"",S),(e==="pagination"||e==="navigation")&&document.dispatchEvent(new CustomEvent("issue-changed",{detail:{issue:n,source:"pagination"}})),window.scrollTo({top:r.offsetTop-60,behavior:"smooth"}),v(),d=!1}function v(){const a=r.querySelector("[data-pagination]");if(!a)return;a.querySelectorAll("a[data-issue]").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const l=t.dataset.issue||"latest";u(l,"pagination")})})}window.addEventListener("popstate",a=>{const t=new URLSearchParams(window.location.search).get("issue")||"latest";u(t,"navigation")}),v(),document.addEventListener("issue-changed",(a=>{a.detail&&a.detail.issue&&a.detail.source==="filter"&&u(a.detail.issue,"filter")}));const p=new URLSearchParams(window.location.search).get("issue");p&&f[p]&&p!==_&&setTimeout(()=>u(p,"init"),200)})();
