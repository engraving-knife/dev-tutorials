// 图表初始化 —— JDK 性能对比（图 5）
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var teal = style.getPropertyValue('--teal').trim();
  var sun = style.getPropertyValue('--sun').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var el = document.getElementById('chart-jdk');
  if (!el) return;
  var chart = echarts.init(el, null, { renderer: 'svg' });

  chart.setOption({
    animation: false,
    color: [accent, accent2, teal],
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(20,28,56,0.92)',
      borderWidth: 0,
      textStyle: { color: '#dde6ff', fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(62,123,255,0.08)' } }
    },
    legend: {
      top: 0,
      textStyle: { color: muted },
      data: ['GC 最大停顿', '吞吐']
    },
    grid: { left: 70, right: 62, top: 48, bottom: 34 },
    xAxis: {
      type: 'category',
      data: ['JDK 8 / G1', 'JDK 11 / G1', 'JDK 18 / G1', 'JDK 18 / ZGC'],
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 12, fontWeight: 600 }
    },
    yAxis: [
      {
        type: 'log',
        logBase: 10,
        name: '最大停顿 (ms)',
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      {
        type: 'value',
        name: '吞吐',
        min: 0,
        max: 1,
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLabel: { color: muted, fontSize: 11, formatter: function (v) { return Number(v).toFixed(2); } },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'GC 最大停顿',
        type: 'bar',
        barWidth: 44,
        data: [30000, 2500, 2500, 0.2],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent2 },
              { offset: 1, color: accent }
            ]
          },
          borderRadius: [8, 8, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: accent,
          fontWeight: 700,
          fontSize: 11,
          formatter: function (p) {
            return p.value >= 1 ? p.value + ' ms' : p.value + ' ms';
          }
        }
      },
      {
        name: '吞吐',
        type: 'line',
        yAxisIndex: 1,
        data: [0.3, 0.8, 0.8, 0.99997],
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: teal, borderColor: bg2, borderWidth: 2 },
        lineStyle: { color: teal, width: 3 },
        label: {
          show: true,
          position: 'top',
          color: teal,
          fontWeight: 700,
          fontSize: 11,
          formatter: function (p) { return Number(p.value).toFixed(4); }
        }
      }
    ]
  });

  window.addEventListener('resize', function () { chart.resize(); });
})();
