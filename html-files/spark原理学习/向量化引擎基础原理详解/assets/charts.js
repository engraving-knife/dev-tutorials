// assets/charts.js — 向量化引擎基础原理详解
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var fontHead = "'Bricolage Grotesque','PingFang SC','Microsoft YaHei',sans-serif";

  function axisLabel(color) {
    return { color: color, fontFamily: "'Instrument Sans','PingFang SC','Microsoft YaHei',sans-serif" };
  }

  // --- Chart 1: CPU 时间构成对比（火山 vs 向量化） ---
  var cpuEl = document.getElementById('chart-cpu');
  if (cpuEl) {
    var chartCpu = echarts.init(cpuEl, null, { renderer: 'svg' });
    chartCpu.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendToBody: true,
        valueFormatter: function (v) { return v + '%'; }
      },
      legend: {
        top: 0,
        textStyle: axisLabel(muted),
        itemWidth: 14,
        itemHeight: 10
      },
      grid: { left: 8, right: 24, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: ['火山模型（逐行解释）', '向量化模型（批量）'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisLabel(ink)
      },
      series: [
        {
          name: '有效计算',
          type: 'bar',
          stack: 'cpu',
          barWidth: 38,
          itemStyle: { color: accent, borderRadius: [0, 0, 0, 0] },
          label: { show: true, position: 'inside', color: '#fff', fontWeight: 700, formatter: '{c}%' },
          data: [35, 92]
        },
        {
          name: '解释与调度开销',
          type: 'bar',
          stack: 'cpu',
          barWidth: 38,
          itemStyle: { color: accent + '30', borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: 'insideRight', color: muted, fontWeight: 600, formatter: '{c}%' },
          data: [65, 8]
        }
      ]
    });
    window.addEventListener('resize', function () { chartCpu.resize(); });
  }

  // --- Chart 2: 单次算子调用处理行数（对数轴） ---
  var batchEl = document.getElementById('chart-batch');
  if (batchEl) {
    var chartBatch = echarts.init(batchEl, null, { renderer: 'svg' });
    chartBatch.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        valueFormatter: function (v) { return v.toLocaleString() + ' 行/次调用'; }
      },
      grid: { left: 8, right: 24, top: 30, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['火山模型\nnext()', '向量化引擎\n典型批（DuckDB/CH）', '向量化引擎\n大批次（上限）'],
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: axisLabel(ink)
      },
      yAxis: {
        type: 'log',
        logBase: 10,
        min: 0.5,
        axisLabel: { formatter: function (v) { return v >= 1000 ? (v / 1000) + 'k' : v; } },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '行数/次调用',
          type: 'bar',
          barWidth: 54,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: function (p) { return [accent, accent2, accent3][p.dataIndex]; }
          },
          label: {
            show: true,
            position: 'top',
            color: ink,
            fontWeight: 700,
            fontFamily: fontHead,
            formatter: function (p) { return p.value >= 1000 ? (p.value / 1000) + ',000' : p.value + ' 行'; }
          },
          data: [1, 2048, 4096]
        }
      ]
    });
    window.addEventListener('resize', function () { chartBatch.resize(); });
  }
})();
