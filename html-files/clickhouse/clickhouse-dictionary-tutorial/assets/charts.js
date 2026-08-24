(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 应用场景概览 ---
  var el = document.getElementById('chart-scenarios');
  if (!el) return;
  var chart = echarts.init(el, null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'item',
      formatter: '{b}<br/>典型用途：{c}',
      backgroundColor: '#ffffff',
      borderColor: rule,
      textStyle: { color: ink }
    },
    color: [accent, accent2, '#7c69ff', '#f5a623'],
    legend: {
      bottom: 0,
      textStyle: { color: muted }
    },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '46%'],
      itemStyle: { borderColor: '#ffffff', borderWidth: 3, borderRadius: 8 },
      label: { color: ink, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: rule } },
      data: [
        { value: 35, name: '维度补全/转换' },
        { value: 25, name: '汇率/定价/税率' },
        { value: 20, name: 'IP归属地/GEO' },
        { value: 20, name: '标签/风控映射' }
      ]
    }]
  });
  window.addEventListener('resize', function () { chart.resize(); });
})();