// 交互脚本：Mermaid 初始化、阅读进度、滚动高亮、返回顶部
(function () {
  // Mermaid
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: "'Outfit','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
      flowchart: { curve: 'basis', nodeSpacing: 36, rankSpacing: 42, htmlLabels: true }
    });
  }

  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');
  var chapterIds = Array.prototype.slice.call(document.querySelectorAll('section.chapter'))
    .map(function (s) { return s.id; });
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.side-nav a, .mobile-nav a')
  );

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    progress.style.width = p + '%';
    toTop.classList.toggle('show', doc.scrollTop > 600);

    var current = '';
    for (var i = 0; i < chapterIds.length; i++) {
      var sec = document.getElementById(chapterIds[i]);
      if (sec && doc.scrollTop >= sec.offsetTop - 160) current = chapterIds[i];
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
