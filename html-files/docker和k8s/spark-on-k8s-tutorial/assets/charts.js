// Spark on Kubernetes 教程图表逻辑
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var spark = style.getPropertyValue('--spark').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- 图 4-1：三种部署方式能力对比（雷达图） ---
  var elApproach = document.getElementById('chart-approach');
  if (elApproach) {
    var chartApproach = echarts.init(elApproach, null, { renderer: 'svg' });
    chartApproach.setOption({
      animation: false,
      color: [accent, accent2, spark],
      tooltip: {
        appendToBody: true,
        trigger: 'item'
      },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 }
      },
      radar: {
        indicator: [
          { name: '易用性', max: 10 },
          { name: '灵活性', max: 10 },
          { name: '运维自动化', max: 10 },
          { name: '生产成熟度', max: 10 },
          { name: '生态集成', max: 10 },
          { name: '可观测性', max: 10 }
        ],
        radius: '62%',
        splitArea: { areaStyle: { color: [bg2, 'rgba(14,165,233,0.03)'] } },
        axisName: { color: ink, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          { value: [9, 6, 3, 8, 7, 6], name: 'spark-submit', areaStyle: { opacity: 0.15 } },
          { value: [6, 8, 9, 8, 9, 8], name: 'Spark Operator', areaStyle: { opacity: 0.15 } },
          { value: [7, 8, 7, 7, 8, 7], name: 'Helm Chart', areaStyle: { opacity: 0.15 } }
        ]
      }]
    });
    window.addEventListener('resize', function () { chartApproach.resize(); });
  }

  // --- 图 5-1：Executor 内存构成（堆叠柱状图） ---
  var elMemory = document.getElementById('chart-memory');
  if (elMemory) {
    var chartMemory = echarts.init(elMemory, null, { renderer: 'svg' });
    chartMemory.setOption({
      animation: false,
      color: [accent, accent2, spark],
      tooltip: {
        appendToBody: true,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: function (v) { return v + ' GB'; }
      },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 }
      },
      grid: { left: 40, right: 20, top: 30, bottom: 60 },
      xAxis: {
        type: 'category',
        data: ['executor.memory\n(堆内)', 'memoryOverhead\n(默认 10%)', 'limit.memory\n(总上限)'],
        axisLabel: { color: ink, fontSize: 12, lineHeight: 16 },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: 'GB',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: '堆内内存',
          type: 'bar',
          stack: 'mem',
          data: [4, 4, 4],
          itemStyle: { borderRadius: [0, 0, 0, 0] }
        },
        {
          name: '堆外 / overhead',
          type: 'bar',
          stack: 'mem',
          data: [0.4, 0.4, 0.4],
          itemStyle: { borderRadius: [0, 0, 0, 0] }
        },
        {
          name: '额外预留（limit 富余）',
          type: 'bar',
          stack: 'mem',
          data: [0, 0, 1.6],
          itemStyle: { borderRadius: [4, 4, 0, 0] }
        }
      ]
    });
    window.addEventListener('resize', function () { chartMemory.resize(); });
  }

  // --- 图 5-2：动态分配 vs 固定分配（折线图） ---
  var elDynamic = document.getElementById('chart-dynamic');
  if (elDynamic) {
    var chartDynamic = echarts.init(elDynamic, null, { renderer: 'svg' });
    chartDynamic.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: {
        appendToBody: true,
        trigger: 'axis'
      },
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 12 }
      },
      grid: { left: 40, right: 20, top: 30, bottom: 60 },
      xAxis: {
        type: 'category',
        data: ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
        name: '时间',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: 'Executor 数量',
        min: 0,
        max: 10,
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: '动态分配',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          data: [2, 3, 6, 8, 10, 7, 4, 3, 2, 2],
          areaStyle: { opacity: 0.12 }
        },
        {
          name: '固定分配',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          data: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
        }
      ]
    });
    window.addEventListener('resize', function () { chartDynamic.resize(); });
  }
})();
