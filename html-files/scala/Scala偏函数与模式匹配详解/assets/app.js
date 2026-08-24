/* Scala偏函数与模式匹配详解 — 页面交互脚本 */
(function () {
  'use strict';

  /* ---------- 1. Mermaid 图初始化（在 mermaid.min.js 加载后执行） ---------- */
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#eef2ff',
        primaryBorderColor: '#4f7cff',
        primaryTextColor: '#1c2547',
        lineColor: '#4f7cff',
        secondaryColor: '#f5f3ff',
        tertiaryColor: '#ecfeff',
        edgeLabelBackground: 'rgba(255,255,255,0.85)',
        fontFamily: 'Instrument Sans, PingFang SC, Noto Sans CJK SC, sans-serif',
        fontSize: '14px'
      }
    });
  }

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 2. 顶部滚动进度条 ---------- */
  var progress = $('#progress');
  function updateProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var ratio = max > 0 ? (doc.scrollTop || document.body.scrollTop) / max : 0;
    progress.style.width = (ratio * 100).toFixed(2) + '%';
  }

  /* ---------- 3. 目录滚动高亮 ---------- */
  var tocLinks = $$('#toc a[href^="#"]');
  var sections = [];
  tocLinks.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) sections.push({ link: a, el: el });
  });

  var activeLink = null;
  function updateToc() {
    var pos = window.pageYOffset + 140; // 偏移量，略高于视口顶部
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.offsetTop <= pos) current = sections[i].link;
      else break;
    }
    if (current !== activeLink) {
      if (activeLink) activeLink.classList.remove('active');
      activeLink = current;
      if (activeLink) activeLink.classList.add('active');
    }
  }

  /* ---------- 4. 滚动监听（合并进度条 + 目录高亮 + 回到顶部按钮） ---------- */
  var toTop = $('#toTop');
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        updateToc();
        if (toTop) {
          if (window.pageYOffset > 600) toTop.classList.add('show');
          else toTop.classList.remove('show');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  /* ---------- 5. 回到顶部 ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 6. 滚动显现动画（reveal） ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 7. 代码复制按钮 ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // 降级方案：老式 execCommand
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  $$('.code-head .copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.code-card');
      var pre = card ? card.querySelector('pre') : null;
      if (!pre) return;
      copyText(pre.innerText)
        .then(function () {
          var old = btn.textContent;
          btn.textContent = '已复制 ✓';
          btn.classList.add('done');
          setTimeout(function () {
            btn.textContent = old;
            btn.classList.remove('done');
          }, 1600);
        })
        .catch(function () {
          btn.textContent = '复制失败';
          setTimeout(function () { btn.textContent = '复制'; }, 1600);
        });
    });
  });

  /* ---------- 8. 启动 ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll(); // 首帧执行一次，初始化进度条与目录高亮

  // 页面加载完成后，确保首屏 reveal 元素立即显现
  window.addEventListener('load', onScroll);
})();
