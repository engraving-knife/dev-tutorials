/* app.js —— Kubernetes Pod 深度学习教程交互逻辑 */
(function () {
  'use strict';

  /* ---------- Mermaid 初始化 ---------- */
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Outfit, "PingFang SC", "Microsoft YaHei", sans-serif'
    });
  }

  /* ---------- 工具函数 ---------- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 代码块：行号 + 注释高亮 ---------- */
  document.querySelectorAll('pre.code').forEach(function (pre) {
    var raw = pre.textContent.replace(/\n$/, '');
    pre.dataset.raw = raw;
    var lines = raw.split('\n');
    var html = lines.map(function (line, i) {
      var ln = '<span class="ln">' + (i + 1) + '</span>';
      var body = '';
      var trimmed = line.trim();

      if (trimmed.charAt(0) === '#') {
        // 整行都是注释
        body = '<span class="cm">' + esc(line) + '</span>';
      } else {
        var codePart = line;
        var cmPart = '';
        var idx = line.indexOf(' #');
        if (idx > -1) {
          codePart = line.slice(0, idx);
          cmPart = line.slice(idx + 1);
        }
        var code = esc(codePart);
        // 高亮 YAML 键（行首的 key: 或 - key:）
        code = code.replace(/^(\s*-?\s*)([A-Za-z0-9_.-]+)(:)/, function (m, p1, p2, p3) {
          return p1 + '<span class="kw">' + p2 + '</span>' + p3;
        });
        body = code + (cmPart ? '<span class="cm">' + esc(cmPart) + '</span>' : '');
      }
      return ln + body;
    }).join('\n');
    pre.innerHTML = html;
  });

  /* ---------- 复制按钮 ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.codeblock').querySelector('pre.code');
      var text = pre.dataset.raw || pre.textContent;
      var done = function () {
        btn.textContent = '已复制 ✓';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
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

  /* ---------- 回到顶部 ---------- */
  var backTop = document.getElementById('backTop');
  if (backTop) {
    window.addEventListener('scroll', function () {
      backTop.classList.toggle('show', window.scrollY > 640);
    }, { passive: true });
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 目录滚动高亮 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (tocLinks.length) {
    var onScroll = function () {
      var pos = window.scrollY + 140;
      var current = null;
      tocLinks.forEach(function (a) {
        var sec = document.querySelector(a.getAttribute('href'));
        if (sec && sec.offsetTop <= pos) current = a;
      });
      tocLinks.forEach(function (a) {
        a.classList.toggle('active', a === current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
