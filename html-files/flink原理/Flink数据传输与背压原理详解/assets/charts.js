// assets/charts.js — Flink 数据传输与背压原理详解 图表
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- 图 5：正常 vs 背压状态下各算子实际吞吐对比 ---
  var chart1 = echarts.init(document.getElementById('chart-throughput'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: ink } },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['Kafka Source', 'Map', 'Kafka Sink'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'value', name: '条/秒',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '正常状态',
        type: 'bar',
        barGap: '30%',
        data: [1000, 1000, 1000],
        itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] }
      },
      {
        name: '背压状态',
        type: 'bar',
        data: [200, 200, 200],
        itemStyle: { color: accent2, borderRadius: [6, 6, 0, 0] }
      }
    ]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- 图 6：背压缓解手段的吞吐改善对比 ---
  var chart2 = echarts.init(document.getElementById('chart-mitigation'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: ink } },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['缓解前', '异步 I/O', '两阶段聚合', '提高并行度', '算子链优化'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, interval: 0 }
    },
    yAxis: {
      type: 'value', name: '条/秒',
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '作业吞吐',
        type: 'bar',
        data: [
          { value: 200, itemStyle: { color: accent2 + '55' } },
          { value: 620, itemStyle: { color: accent2 } },
          { value: 760, itemStyle: { color: accent2 } },
          { value: 880, itemStyle: { color: accent } },
          { value: 950, itemStyle: { color: accent } }
        ],
        label: { show: true, position: 'top', color: ink, formatter: '{c}' },
        itemStyle: { borderRadius: [6, 6, 0, 0] }
      }
    ]
  });
  window.addEventListener('resize', function() { chart2.resize(); });
})();
