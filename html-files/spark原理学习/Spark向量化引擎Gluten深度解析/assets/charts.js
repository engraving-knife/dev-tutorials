// assets/charts.js — ECharts 图表初始化
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var teal = style.getPropertyValue('--teal').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var grad = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: accent },
    { offset: 1, color: teal }
  ]);

  // --- Chart 1: TPC-H SF1024 官方基准（耗时，秒） ---
  var chart1 = echarts.init(document.getElementById('chart-tpch'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
    legend: {
      top: 0, textStyle: { color: ink, fontSize: 13 },
      data: ['Gluten + Velox（ORC）', '原生 Spark（Parquet）', '原生 Spark（ORC）']
    },
    grid: { left: 10, right: 16, top: 46, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['TPC-H Q1', 'TPC-H Q6'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 14 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: '耗时（秒）', nameTextStyle: { color: muted },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    series: [
      {
        name: 'Gluten + Velox（ORC）', type: 'bar', barWidth: 34,
        data: [26.1, 13.6],
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: grad
        },
        label: { show: true, position: 'top', color: accent, fontWeight: 700, formatter: '{c}s' }
      },
      {
        name: '原生 Spark（Parquet）', type: 'bar', barWidth: 34,
        data: [76.7, 21.6],
        itemStyle: { borderRadius: [8, 8, 0, 0], color: muted + '55' },
        label: { show: true, position: 'top', color: muted, formatter: '{c}s' }
      },
      {
        name: '原生 Spark（ORC）', type: 'bar', barWidth: 34,
        data: [84.9, 34.9],
        itemStyle: { borderRadius: [8, 8, 0, 0], color: accent2 + '66' },
        label: { show: true, position: 'top', color: accent2, formatter: '{c}s' }
      }
    ]
  });
  window.addEventListener('resize', function () { chart1.resize(); });

  // --- Chart 2: 各来源公开加速比汇总（倍率） ---
  var chart2 = echarts.init(document.getElementById('chart-speedup'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var p = params[0];
        return p.name + '<br/>加速比：<b>' + p.value + '×</b>';
      }
    },
    grid: { left: 10, right: 40, top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'value',
      name: '倍率（×）', nameTextStyle: { color: muted },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted }
    },
    yAxis: {
      type: 'category',
      data: [
        'Fabric NEE（TPC-DS SF1000）',
        'Velox（TPC-H-like）',
        'Velox（TPC-DS-like）',
        'ClickHouse 后端（1TB）',
        'AWS TPC-DS 1TB',
        'Kyligence 内部场景',
        'AWS TPC-DS 3TB（Graviton4）'
      ],
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 13 }
    },
    series: [
      {
        name: '加速比', type: 'bar', barWidth: 20,
        data: [6.0, 3.34, 3.02, 2.12, 1.69, 2.0, 1.63],
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: grad
        },
        label: {
          show: true, position: 'right', color: accent, fontWeight: 700,
          formatter: '{c}×'
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: accent2, type: 'dashed' },
          data: [{ xAxis: 1 }],
          label: { show: false }
        }
      }
    ]
  });
  window.addEventListener('resize', function () { chart2.resize(); });
})();
