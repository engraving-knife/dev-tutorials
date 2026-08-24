// assets/charts.js — Paimon 教程可视化
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var purple = style.getPropertyValue('--purple').trim();
  var sun = style.getPropertyValue('--sun').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  function init(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    return echarts.init(el, null, { renderer: 'svg' });
  }

  // ---- Chart: 湖格式能力雷达对比 ----
  var radarEl = document.getElementById('chart-lake-format');
  if (radarEl) {
    var radar = echarts.init(radarEl, null, { renderer: 'svg' });
    var indicators = [
      { name: '流式更新', max: 10 },
      { name: '主键去重', max: 10 },
      { name: '部分列更新', max: 10 },
      { name: '自动 changelog', max: 10 },
      { name: 'Compaction', max: 10 },
      { name: 'CDC 实时入湖', max: 10 },
      { name: '批查询性能', max: 10 },
      { name: '时间旅行', max: 10 }
    ];
    radar.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true },
      legend: { data: ['Paimon', 'Iceberg', 'Hudi'], bottom: 0, textStyle: { color: muted, fontSize: 12 } },
      radar: {
        indicator: indicators,
        radius: '62%',
        center: ['50%', '48%'],
        splitNumber: 4,
        axisName: { color: ink, fontSize: 11 },
        splitLine: { lineStyle: { color: [rule] } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          { name: 'Paimon', value: [9, 9, 9, 9, 9, 9, 8, 7], areaStyle: { color: accent + '38' }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } },
          { name: 'Iceberg', value: [3, 3, 2, 2, 5, 3, 9, 9], areaStyle: { color: accent2 + '2e' }, lineStyle: { color: accent2, width: 2 }, itemStyle: { color: accent2 } },
          { name: 'Hudi', value: [7, 7, 5, 6, 7, 7, 7, 6], areaStyle: { color: sun + '30' }, lineStyle: { color: sun, width: 2 }, itemStyle: { color: sun } }
        ]
      }]
    });
    window.addEventListener('resize', function(){ radar.resize(); });
  }
})();