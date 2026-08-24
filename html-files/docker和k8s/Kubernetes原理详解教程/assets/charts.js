// Kubernetes 原理详解教程 — 图表
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var grad3 = style.getPropertyValue('--grad3').trim();
  var grad4 = style.getPropertyValue('--grad4').trim();

  function hexToRgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // ---------- 图表 A：版本演进时间线 ----------
  var elA = document.getElementById('chart-versions');
  if (elA) {
    var chartA = echarts.init(elA, null, { renderer: 'svg' });
    // [发布月份, 版本号, 版本标签]
    var versions = [
      ['2015-07', 1.0], ['2015-11', 1.1], ['2016-03', 1.2], ['2016-07', 1.3],
      ['2016-09', 1.4], ['2016-12', 1.5], ['2017-03', 1.6], ['2017-06', 1.7],
      ['2017-09', 1.8], ['2017-12', 1.9], ['2018-03', 1.10], ['2018-06', 1.11],
      ['2018-09', 1.12], ['2018-12', 1.13], ['2019-03', 1.14], ['2019-06', 1.15],
      ['2019-09', 1.16], ['2019-12', 1.17], ['2020-03', 1.18], ['2020-08', 1.19],
      ['2020-12', 1.20], ['2021-04', 1.21], ['2021-08', 1.22], ['2021-12', 1.23],
      ['2022-05', 1.24], ['2022-08', 1.25], ['2022-12', 1.26], ['2023-04', 1.27],
      ['2023-08', 1.28], ['2023-12', 1.29], ['2024-04', 1.30], ['2024-08', 1.31],
      ['2024-12', 1.32], ['2025-04', 1.33], ['2025-08', 1.34], ['2025-12', 1.35],
      ['2026-04', 1.36]
    ];
    var data = versions.map(function(v) { return [new Date(v[0]).getTime(), v[1]]; });
    chartA.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function(params) {
          var p = params[0];
          var d = new Date(p.value[0]);
          return 'v' + Number(p.value[1]).toFixed(2).replace(/\.?0+$/, '') + ' · ' +
            d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月发布';
        }
      },
      grid: { left: 42, right: 24, top: 28, bottom: 34 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11, formatter: function(v) { return String(new Date(v).getFullYear()); } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0, max: 1.5,
        axisLine: { show: false },
        axisLabel: { color: muted, fontSize: 11, formatter: function(v) { return 'v' + v.toFixed(1); } },
        splitLine: { lineStyle: { color: hexToRgba(accent, 0.08) } }
      },
      series: [{
        type: 'line',
        data: data,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: accent },
        itemStyle: { color: accent, borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(accent, 0.28) },
              { offset: 1, color: hexToRgba(accent, 0.02) }
            ]
          }
        },
        markPoint: {
          symbolSize: 34,
          label: { fontSize: 10, fontWeight: 700, color: '#fff' },
          itemStyle: { color: accent2 },
          data: [
            { coord: [new Date('2015-07').getTime(), 1.0], value: '1.0', name: '首个正式版' },
            { coord: [new Date('2026-04').getTime(), 1.36], value: '1.36', name: '当前最新' }
          ]
        }
      }]
    });
    window.addEventListener('resize', function() { chartA.resize(); });
  }

  // ---------- 图表 B：生产环境采用率 ----------
  var elB = document.getElementById('chart-adoption');
  if (elB) {
    var chartB = echarts.init(elB, null, { renderer: 'svg' });
    var years = ['2023', '2024', '2025'];
    var values = [66, 80, 82];
    chartB.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        formatter: function(params) {
          var p = params[0];
          return p.name + ' 年：容器用户中 ' + p.value + '% 在生产环境运行 Kubernetes';
        }
      },
      grid: { left: 46, right: 24, top: 30, bottom: 34 },
      xAxis: {
        type: 'category',
        data: years.map(function(y) { return y + ' 年'; }),
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 12 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: muted, fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: hexToRgba(accent, 0.08) } }
      },
      series: [{
        type: 'bar',
        data: values,
        barWidth: '44%',
        label: {
          show: true, position: 'top',
          formatter: '{c}%', color: ink, fontWeight: 700, fontSize: 13
        },
        itemStyle: {
          borderRadius: [10, 10, 3, 3],
          color: function(params) {
            var colors = [hexToRgba(accent, 0.55), hexToRgba(accent, 0.78), accent];
            return colors[params.dataIndex];
          }
        }
      }]
    });
    window.addEventListener('resize', function() { chartB.resize(); });
  }
})();
