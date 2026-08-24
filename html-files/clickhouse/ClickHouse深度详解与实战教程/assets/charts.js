// assets/charts.js
(function () {
  'use strict';

  // --- Mermaid init ---
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'InstrumentSans, PingFang SC, Microsoft YaHei, sans-serif'
    });
  }

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: ClickHouse 26.6 内建能力统计 ---
  var capEl = document.getElementById('chart-capabilities');
  if (capEl && window.echarts) {
    var chart1 = echarts.init(capEl, null, { renderer: 'svg' });
    chart1.setOption({
      animation: false,
      grid: { top: 36, left: 16, right: 30, bottom: 10, containLabel: true },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0e2439',
        borderColor: '#0e2439',
        textStyle: { color: '#e6f1ff', fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: ['函数 Functions', '设置 Settings', '服务器设置 Server settings', 'MergeTree 设置'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 12, interval: 0 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '数量',
        nameTextStyle: { color: muted },
        axisLine: { show: false },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'bar',
        data: [
          { value: 1592, itemStyle: { color: accent, borderRadius: [8, 8, 0, 0] } },
          { value: 1548, itemStyle: { color: accent2, borderRadius: [8, 8, 0, 0] } },
          { value: 412, itemStyle: { color: accent3, borderRadius: [8, 8, 0, 0] } },
          { value: 316, itemStyle: { color: muted, borderRadius: [8, 8, 0, 0] } }
        ],
        barWidth: 64,
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontWeight: 700,
          fontSize: 13,
          formatter: function (p) { return p.value; }
        }
      }]
    });
    window.addEventListener('resize', function () { chart1.resize(); });
  }
})();
