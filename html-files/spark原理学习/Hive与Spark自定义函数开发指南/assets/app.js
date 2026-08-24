/* Hive与Spark自定义函数开发指南 —— 页面交互脚本 */
(function () {
  'use strict';

  /* ========== Mermaid 初始化 ========== */
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true },
      themeVariables: {
        fontFamily: "'BricolageGrotesque','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
        fontSize: '14px',
        primaryColor: '#eef0ff',
        primaryTextColor: '#1c2440',
        primaryBorderColor: '#c7cbff',
        lineColor: '#8b93d6',
        secondaryColor: '#e4f9fd',
        tertiaryColor: '#fdeef6'
      }
    });
  }

  /* ========== 代码复制按钮 ========== */
  var copyBtns = document.querySelectorAll('.copy-btn');
  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.code-card');
      if (!card) return;
      var codeEl = card.querySelector('.code-body pre');
      if (!codeEl) return;
      var text = codeEl.innerText;
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ========== 返回顶部 ========== */
  var topBtn = document.getElementById('top-btn');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 480;
      topBtn.classList.toggle('show', show);
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ========== 目录滚动高亮（scrollspy） ========== */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('#toc a[data-target]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('data-target');
      if (id) map[id] = a;
    });
    var targets = Object.keys(map).map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        if (!map[id]) return;
        tocLinks.forEach(function (a) { a.classList.remove('active'); });
        map[id].classList.add('active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }
})();
