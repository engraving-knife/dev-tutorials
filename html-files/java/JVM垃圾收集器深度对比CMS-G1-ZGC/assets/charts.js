// assets/charts.js
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent   = style.getPropertyValue('--accent').trim();
  var accent2  = style.getPropertyValue('--accent2').trim();
  var accent3  = style.getPropertyValue('--accent3').trim();
  var ink      = style.getPropertyValue('--ink').trim();
  var ink2     = style.getPropertyValue('--ink2').trim();
  var muted    = style.getPropertyValue('--muted').trim();
  var rule     = style.getPropertyValue('--rule').trim();
  var bg2      = style.getPropertyValue('--bg2').trim();

  var gridCommon = { left: 56, right: 24, top: 50, bottom: 46 };
  var tooltipCommon = { trigger: 'axis', appendToBody: true, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: rule, textStyle: { color: ink } };

  // ---------- Chart: STW 停顿对比 ----------
  var chartStw = echarts.init(document.getElementById('chart-stw'), null, { renderer: 'svg' });
  chartStw.setOption({
    color: [accent3, accent, accent2],
    tooltip: { ...tooltipCommon, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 6, textStyle: { color: muted }, data: ['平均停顿 (ms)', '最坏停顿 (ms)'] },
    grid: gridCommon,
    xAxis: { type: 'category', data: ['CMS', 'G1', 'ZGC'], axisLine: { lineStyle: { color: rule } }, axisLabel: { color: ink2, fontWeight: 700 } },
    yAxis: { type: 'value', name: 'ms（对数感）', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      {
        name: '平均停顿 (ms)', type: 'bar', barWidth: 26,
        data: [60, 30, 0.5],
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: 'top', color: ink2, fontFamily: 'JetBrainsMono', formatter: function (p) { return p.value + ' ms'; } }
      },
      {
        name: '最坏停顿 (ms)', type: 'bar', barWidth: 26,
        data: [1500, 400, 3],
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: 'top', color: ink2, fontFamily: 'JetBrainsMono', formatter: function (p) { return p.value + ' ms'; } }
      }
    ],
    animation: false
  });
  window.addEventListener('resize', function () { chartStw.resize(); });

  // ---------- Chart: 停顿随堆增长 ----------
  var heaps = ['4 GB', '16 GB', '64 GB', '256 GB', '1 TB'];
  var chartScale = echarts.init(document.getElementById('chart-scalability'), null, { renderer: 'svg' });
  chartScale.setOption({
    color: [accent, accent2],
    tooltip: { ...tooltipCommon, trigger: 'axis' },
    legend: { top: 6, textStyle: { color: muted }, data: ['G1 停顿 (ms)', 'ZGC 停顿 (ms)'] },
    grid: gridCommon,
    xAxis: { type: 'category', data: heaps, boundaryGap: false, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
    yAxis: { type: 'value', name: '停顿时间', nameTextStyle: { color: muted }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [
      {
        name: 'G1 停顿 (ms)', type: 'line', smooth: true, symbolSize: 8,
        data: [30, 55, 120, 300, 950],
        areaStyle: { opacity: 0.08 },
        lineStyle: { width: 3, color: accent },
        itemStyle: { color: accent },
        label: { show: true, color: accent, fontFamily: 'JetBrainsMono', formatter: '{c}' }
      },
      {
        name: 'ZGC 停顿 (ms)', type: 'line', smooth: true, symbolSize: 8,
        data: [0.4, 0.5, 0.6, 0.7, 0.9],
        areaStyle: { opacity: 0.08 },
        lineStyle: { width: 3, color: accent2 },
        itemStyle: { color: accent2 },
        label: { show: true, color: accent2, fontFamily: 'JetBrainsMono', formatter: '{c}' }
      }
    ],
    animation: false
  });
  window.addEventListener('resize', function () { chartScale.resize(); });

  // ---------- Chart: Radar 五维对比 ----------
  var dims = ['低停顿性能', '吞吐量', '停顿可预测性', '可扩展性(大堆)', '配置易用性'];
  var radar = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });
  radar.setOption({
    color: [accent3, accent, accent2],
    tooltip: { trigger: 'item', appendToBody: true, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: rule, textStyle: { color: ink } },
    legend: { top: 6, textStyle: { color: muted } },
    radar: {
      indicator: dims.map(function (d) { return { name: d, max: 100 }; }),
      radius: '62%',
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0.6)', 'rgba(15,157,151,0.04)'] } },
      axisName: { color: ink2 },
      splitLine: { lineStyle: { color: rule } },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      data: [
        { name: 'CMS', value: [75, 70, 45, 30, 45], symbolSize: 5, lineStyle: { width: 2 }, areaStyle: { opacity: 0.22 } },
        { name: 'G1', value: [72, 85, 85, 68, 82], symbolSize: 5, lineStyle: { width: 2 }, areaStyle: { opacity: 0.22 } },
        { name: 'ZGC', value: [98, 60, 95, 96, 72], symbolSize: 5, lineStyle: { width: 2 }, areaStyle: { opacity: 0.22 } }
      ]
    }],
    animation: false
  });
  window.addEventListener('resize', function () { radar.resize(); });
})();