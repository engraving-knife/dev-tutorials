// assets/charts.js — ClickHouse 引擎能力定性对比雷达图
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var el = document.getElementById('chart-radar');
  if (!el) return;

  var chart = echarts.init(el, null, { renderer: 'svg' });

  var indicators = [
    { name: '写入性能', max: 5 },
    { name: '并发读取', max: 5 },
    { name: '索引能力', max: 5 },
    { name: '数据规模', max: 5 },
    { name: '功能完备', max: 5 }
  ];

  var seriesData = [
    { name: 'TinyLog', value: [5, 2, 1, 2, 1], color: accent3 },
    { name: 'Log', value: [4, 5, 1, 3, 1], color: accent },
    { name: 'StripeLog', value: [5, 5, 1, 3, 1], color: accent2 },
    { name: 'MergeTree', value: [4, 5, 5, 5, 5], color: '#F0A93B' }
  ];

  chart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,.92)',
      borderColor: rule,
      textStyle: { color: ink, fontSize: 12.5 }
    },
    legend: {
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: ink, fontSize: 12.5 },
      data: seriesData.map(function (d) { return d.name; })
    },
    radar: {
      indicator: indicators,
      radius: '62%',
      center: ['50%', '47%'],
      splitNumber: 5,
      axisName: { color: ink, fontSize: 12.5, fontWeight: 600 },
      splitLine: { lineStyle: { color: 'rgba(47,124,246,.18)' } },
      splitArea: { areaStyle: { color: ['rgba(47,124,246,.03)', 'rgba(255,255,255,.4)'] } },
      axisLine: { lineStyle: { color: 'rgba(47,124,246,.25)' } }
    },
    series: [{
      type: 'radar',
      data: seriesData.map(function (d) {
        return {
          name: d.name,
          value: d.value,
          symbolSize: 4,
          lineStyle: { width: 2, color: d.color },
          itemStyle: { color: d.color },
          areaStyle: { color: d.color, opacity: 0.10 }
        };
      })
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
})();
