// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 状态后端指标对比 ---
  var c1 = echarts.init(document.getElementById('chart-compare'), null, { renderer:'svg' });
  c1.setOption({
    animation: false,
    legend: { bottom: 0, textStyle: { color: muted }, itemWidth: 14, itemHeight: 10 },
    grid: { top: 34, left: 44, right: 24, bottom: 56 },
    tooltip: {
      appendToBody: true,
      trigger: 'item',
      axisPointer: { type: 'shadow' },
      valueFormatter: function(v){ return v; }
    },
    xAxis: {
      type: 'value', max: 100,
      axisLabel: { color: muted, formatter: '{value}' },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'category',
      data: ['状态容量上限', '访问延迟(低→高)', '写入吞吐', 'GC 友好度', '增量快照', '生产普及度'],
      axisLabel: { color: ink },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'HashMap',
        type: 'bar', data: [40, 96, 92, 30, 70, 62],
        itemStyle: { color: accent, borderRadius: [0,6,6,0], opacity: .85 },
        barWidth: 14,
        label: { show: true, position: 'right', color: accent, fontWeight: 600 }
      },
      {
        name: 'EmbeddedRocksDB',
        type: 'bar', data: [92, 70, 75, 88, 96, 90],
        itemStyle: { color: accent2, borderRadius: [0,6,6,0], opacity: .85 },
        barWidth: 14,
        label: { show: true, position: 'right', color: accent2, fontWeight: 600 }
      }
    ]
  });
  window.addEventListener('resize', function(){ c1.resize(); });
})();