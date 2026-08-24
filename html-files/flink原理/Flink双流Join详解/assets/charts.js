// charts.js — Flink 双流 Join 详解 图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  function init(id, option) {
    var el = document.getElementById(id);
    if (!el) return null;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption(option);
    window.addEventListener('resize', function () { chart.resize(); });
    return chart;
  }

  // ---- Chart 2: 易用性 vs 灵活性权衡 ----
  var tradeoffOption = {
    backgroundColor: 'transparent',
    tooltip: {
      appendToBody: true,
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    animation: false,
    legend: { data: ['易用性', '灵活性'], top: 0, textStyle: { color: ink } },
    grid: { left: 40, right: 20, top: 44, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Window Join', 'Interval Join', 'Temporal Join', 'CoProcessFunction'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: ink, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '易用性',
        type: 'bar',
        barWidth: 22,
        itemStyle: { color: accent, borderRadius: [5, 5, 0, 0] },
        data: [95, 88, 90, 45]
      },
      {
        name: '灵活性',
        type: 'bar',
        barWidth: 22,
        itemStyle: { color: accent2, borderRadius: [5, 5, 0, 0] },
        data: [35, 55, 55, 98]
      }
    ]
  };

  // ---- Chart 3: 状态增长 vs TTL ----
  function buildStateSeries(withTtl) {
    var xs = ['0h', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h'];
    var noTtl = [10, 22, 36, 52, 70, 90, 112, 136, 162, 190];   // 持续累积
    var withTtl = [10, 22, 36, 40, 44, 48, 42, 46, 50, 50];     // 周期性清理、封顶
    return { xs: xs, noTtl: noTtl, withTtl: withTtl };
  }

  var state = buildStateSeries(true);
  var ttlOption = {
    backgroundColor: 'transparent',
    tooltip: {
      appendToBody: true,
      trigger: 'axis',
      valueFormatter: function (v) { return v + ' MB'; }
    },
    animation: false,
    legend: { data: ['未配置 TTL', '配置 TTL'], top: 0, textStyle: { color: ink } },
    grid: { left: 44, right: 20, top: 44, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: state.xs,
      axisLabel: { color: ink },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'value',
      name: '状态占用 (MB)',
      nameTextStyle: { color: muted },
      axisLine: { show: false },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        name: '未配置 TTL',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: accent2 },
        areaStyle: { color: accent2, opacity: 0.14 },
        data: state.noTtl
      },
      {
        name: '配置 TTL',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: accent },
        areaStyle: { color: accent, opacity: 0.12 },
        data: state.withTtl
      }
    ]
  };

  init('chart-tradeoff', tradeoffOption);
  init('chart-ttl', ttlOption);
})();