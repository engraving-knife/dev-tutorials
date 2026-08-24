// Kubernetes Namespace 教程 - 图表与交互逻辑
(function () {
  'use strict';

  // ===== Mermaid 初始化 =====
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: { curve: 'basis', padding: 14 },
      themeVariables: {
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        primaryColor: '#eef2ff',
        primaryBorderColor: '#4f6ef7',
        primaryTextColor: '#17233f',
        lineColor: '#4f6ef7',
        secondaryColor: '#e6fbf6',
        tertiaryColor: '#f6f0ff',
        clusterBkg: 'rgba(255,255,255,0.6)',
        clusterBorder: '#c7d2fe'
      }
    });
  }

  // ===== ECharts：ResourceQuota 配额 vs 使用量 =====
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  var quotaEl = document.getElementById('chart-quota');
  if (quotaEl && window.echarts) {
    var chart = echarts.init(quotaEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: rule,
        textStyle: { color: ink, fontSize: 12.5 },
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['已用量 Used', '上限 Hard'],
        top: 0,
        textStyle: { color: ink, fontSize: 12.5 }
      },
      grid: { left: 48, right: 24, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['count/pods\n(个)', 'count/services\n(个)', 'limits.cpu\n(核)', 'limits.memory\n(Gi)', 'requests.cpu\n(核)', 'requests.memory\n(Gi)'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 12, lineHeight: 16 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '数值',
        nameTextStyle: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted, fontSize: 11 }
      },
      series: [
        {
          name: '已用量 Used',
          type: 'bar',
          data: [1, 0, 0.5, 1, 0.25, 0.5],
          barWidth: 26,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: accent
          },
          label: { show: true, position: 'top', color: accent, fontSize: 11, fontWeight: 600 }
        },
        {
          name: '上限 Hard',
          type: 'bar',
          data: [10, 5, 4, 4, 2, 2],
          barWidth: 26,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: accent2
          },
          label: { show: true, position: 'top', color: accent2, fontSize: 11, fontWeight: 600 }
        }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ===== FAQ 折叠交互 =====
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // 关闭其他已展开项
      faqItems.forEach(function (other) {
        if (other !== item) other.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  // ===== 返回顶部按钮 =====
  var backTop = document.getElementById('backTop');
  if (backTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backTop.classList.add('show');
      } else {
        backTop.classList.remove('show');
      }
    });
    backTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
