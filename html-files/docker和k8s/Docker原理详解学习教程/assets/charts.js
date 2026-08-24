/* Docker 原理详解学习教程 —— 图表与页面交互 */
(function () {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  /* ---------- Mermaid 图 ---------- */
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'neutral',
      flowchart: { useMaxWidth: false },
      state: { useMaxWidth: false },
      themeVariables: {
        primaryColor: '#eaf1ff',
        primaryTextColor: ink,
        primaryBorderColor: accent,
        lineColor: accent2,
        secondaryColor: '#f3efff',
        tertiaryColor: '#e8faf6',
        edgeLabelBackground: '#ffffff',
        fontSize: '15px',
        fontFamily: "'Outfit','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
      }
    });
    if (typeof mermaid.run === 'function') {
      mermaid.run({ querySelector: '.mermaid' })
        .then(function () {
          /* 渲染完成后，按 viewBox 把 SVG 强制为自然像素尺寸，保证图中文字清晰可读 */
          document.querySelectorAll('.mermaid svg').forEach(function (svg) {
            var vb = svg.viewBox && svg.viewBox.baseVal;
            if (vb && vb.width) {
              svg.setAttribute('width', vb.width);
              svg.setAttribute('height', vb.height);
            }
            svg.removeAttribute('style');
          });
        })
        .catch(function (e) {
          console.warn('mermaid render error:', e);
        });
    }
  }

  /* ---------- 图 1-2：容器 vs 虚拟机指标对比 ---------- */
  var el1 = document.getElementById('chart-vm');
  if (el1 && window.echarts) {
    var c1 = echarts.init(el1, null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: rule,
        textStyle: { color: ink }
      },
      legend: {
        data: ['虚拟机', '容器'],
        top: 6,
        textStyle: { color: muted }
      },
      grid: { left: 72, right: 40, top: 52, bottom: 44 },
      xAxis: {
        type: 'category',
        data: ['启动时间 (秒)', '空闲内存 (MB)', '单机密度 (个)'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'log',
        axisLine: { show: false },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: '虚拟机',
          type: 'bar',
          data: [45, 1024, 10],
          barMaxWidth: 44,
          itemStyle: { color: muted, borderRadius: [6, 6, 0, 0] },
          label: { show: true, position: 'top', color: muted, fontSize: 13, formatter: '{c}' }
        },
        {
          name: '容器',
          type: 'bar',
          data: [0.2, 15, 500],
          barMaxWidth: 44,
          itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] },
          label: { show: true, position: 'top', color: accent, fontSize: 13, formatter: '{c}' }
        }
      ]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  /* ---------- 图 10-1：多阶段构建体积对比 ---------- */
  var el2 = document.getElementById('chart-build');
  if (el2 && window.echarts) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    c2.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: rule,
        textStyle: { color: ink },
        valueFormatter: function (v) { return v + ' MB'; }
      },
      grid: { left: 72, right: 40, top: 36, bottom: 44 },
      xAxis: {
        type: 'category',
        data: ['传统单阶段构建', '多阶段构建', '多阶段 + Alpine'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'MB',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 64,
          data: [
            { value: 812, itemStyle: { color: muted, borderRadius: [6, 6, 0, 0] } },
            { value: 15.3, itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] } },
            { value: 6.8, itemStyle: { color: accent3, borderRadius: [6, 6, 0, 0] } }
          ],
          label: { show: true, position: 'top', color: ink, fontSize: 13, formatter: '{c} MB' }
        }
      ]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  /* ---------- 阅读进度条 + 目录高亮 + 返回顶部 ---------- */
  var progress = document.getElementById('progress');
  var backtop = document.getElementById('backtop');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var sections = [];
  tocLinks.forEach(function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el) sections.push({ link: a, el: el });
  });

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (backtop) backtop.classList.toggle('show', window.scrollY > 600);

    var current = sections.length ? sections[0].link : null;
    sections.forEach(function (s) {
      if (s.el.getBoundingClientRect().top <= 120) current = s.link;
    });
    sections.forEach(function (s) {
      s.link.classList.toggle('active', s.link === current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backtop) {
    backtop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
