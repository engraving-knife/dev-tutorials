// assets/charts.js — ECharts 图表初始化（IIFE，避免污染全局）
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var cyan = style.getPropertyValue('--cyan').trim();
  var pink = style.getPropertyValue('--pink').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  var fontHead = "'Outfit','PingFang SC','Hiragino Sans GB','Noto Sans CJK SC','Microsoft YaHei',sans-serif";
  var fontBody = "'WorkSans','PingFang SC','Hiragino Sans GB','Noto Sans CJK SC','Microsoft YaHei',sans-serif";

  function baseGrid(extra) {
    var g = { left: 14, right: 18, top: 46, bottom: 8, containLabel: true };
    if (extra) { for (var k in extra) g[k] = extra[k]; }
    return g;
  }

  function tooltip() {
    return {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink, fontFamily: fontBody, fontSize: 12 }
    };
  }

  var gradBlue = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent }, { offset: 1, color: cyan }] };
  var gradViolet = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: accent2 }, { offset: 1, color: accent }] };
  var gradPink = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: pink }, { offset: 1, color: accent2 }] };

  function axisCommon(name, unit) {
    return {
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontFamily: fontBody, fontSize: 11 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      name: name,
      nameTextStyle: { color: muted, fontFamily: fontBody, fontSize: 11 },
      nameGap: 14
    };
  }

  // === 图 5-1 调度启动延迟（区间） ===
  var el1 = document.getElementById('chart-sched-latency');
  if (el1) {
    var c1 = echarts.init(el1, null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: tooltip(),
      legend: { data: ['区间下界', '区间上界'], textStyle: { color: muted, fontFamily: fontBody, fontSize: 11 }, top: 6, right: 6 },
      grid: baseGrid(),
      xAxis: Object.assign(axisCommon(), {
        type: 'category',
        data: ['默认 kube-scheduler', 'YuniKorn Gang 调度'],
        axisLabel: { color: ink, fontFamily: fontBody, fontSize: 12, interval: 0 }
      }),
      yAxis: Object.assign(axisCommon('启动时间 (秒)', 's'), { type: 'value', min: 0 }),
      series: [
        { name: '区间下界', type: 'bar', barWidth: 26, data: [90, 45], itemStyle: { color: gradBlue, borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: ink, fontFamily: fontBody, fontSize: 11, formatter: '{c}s' } },
        { name: '区间上界', type: 'bar', barWidth: 26, data: [120, 60], itemStyle: { color: gradViolet, borderRadius: [6, 6, 0, 0] }, label: { show: true, position: 'top', color: ink, fontFamily: fontBody, fontSize: 11, formatter: '{c}s' } }
      ]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // === 图 5-2 TPC-DS 3TB 总耗时 ===
  var el2 = document.getElementById('chart-celeborn-3tb');
  if (el2) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    c2.setOption({
      animation: false,
      tooltip: tooltip(),
      grid: baseGrid(),
      xAxis: Object.assign(axisCommon(), {
        type: 'category',
        data: ['无 Celeborn', '启用 Celeborn'],
        axisLabel: { color: ink, fontFamily: fontBody, fontSize: 12 }
      }),
      yAxis: Object.assign(axisCommon('总耗时 (秒)', 's'), { type: 'value', min: 0 }),
      series: [{
        name: '总耗时',
        type: 'bar',
        barWidth: 56,
        data: [
          { value: 1792.8, itemStyle: { color: gradBlue, borderRadius: [8, 8, 0, 0] } },
          { value: 2079.6, itemStyle: { color: gradPink, borderRadius: [8, 8, 0, 0] } }
        ],
        label: { show: true, position: 'top', color: ink, fontFamily: fontBody, fontSize: 12, formatter: function (p) { return p.value + 's'; } },
        markPoint: {
          data: [
            { coord: [1, 2079.6], value: '+16% 回归', symbol: 'rect', symbolSize: [56, 22], itemStyle: { color: accent2 }, label: { color: '#fff', fontFamily: fontBody, fontSize: 10 } }
          ],
          symbolOffset: [0, -46]
        }
      }]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  // === 图 5-3 TPC-DS 10TB 提升幅度 ===
  var el3 = document.getElementById('chart-celeborn-10tb');
  if (el3) {
    var c3 = echarts.init(el3, null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: tooltip(),
      grid: baseGrid(),
      xAxis: Object.assign(axisCommon(), {
        type: 'category',
        data: ['总体性能提升', 'Shuffle 重查询最高提升'],
        axisLabel: { color: ink, fontFamily: fontBody, fontSize: 12, interval: 0 }
      }),
      yAxis: Object.assign(axisCommon('性能提升 (%)', '%'), { type: 'value', min: 0, max: 60 }),
      series: [{
        name: '提升幅度',
        type: 'bar',
        barWidth: 64,
        data: [
          { value: 14.5, itemStyle: { color: gradBlue, borderRadius: [8, 8, 0, 0] } },
          { value: 49, itemStyle: { color: gradViolet, borderRadius: [8, 8, 0, 0] } }
        ],
        label: { show: true, position: 'top', color: ink, fontFamily: fontBody, fontSize: 12, formatter: function (p) { return '+' + p.value + '%'; } }
      }]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }

  // === 图 5-4 部署模式成本对比 ===
  var el4 = document.getElementById('chart-cost');
  if (el4) {
    var c4 = echarts.init(el4, null, { renderer: 'svg' });
    c4.setOption({
      animation: false,
      tooltip: tooltip(),
      grid: baseGrid(),
      xAxis: Object.assign(axisCommon(), {
        type: 'category',
        data: ['Spark on K8s', 'Standalone', 'Dataproc', 'EMR', 'Databricks'],
        axisLabel: { color: ink, fontFamily: fontBody, fontSize: 11, interval: 0 }
      }),
      yAxis: Object.assign(axisCommon('月成本 (USD / 500 vCPU-hr)', 'USD'), { type: 'value', min: 0 }),
      series: [{
        name: '成本',
        type: 'bar',
        barWidth: 42,
        data: [
          { value: 1050, itemStyle: { color: gradBlue, borderRadius: [6, 6, 0, 0] } },
          { value: 1050, itemStyle: { color: gradBlue, borderRadius: [6, 6, 0, 0] } },
          { value: 1150, itemStyle: { color: gradViolet, borderRadius: [6, 6, 0, 0] } },
          { value: 1200, itemStyle: { color: gradViolet, borderRadius: [6, 6, 0, 0] } },
          { value: 1750, itemStyle: { color: gradPink, borderRadius: [6, 6, 0, 0] } }
        ],
        label: { show: true, position: 'top', color: ink, fontFamily: fontBody, fontSize: 11, formatter: function (p) { return '$' + p.value; } }
      }]
    });
    window.addEventListener('resize', function () { c4.resize(); });
  }
})();
