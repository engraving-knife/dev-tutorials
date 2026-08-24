(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ===== Radar Chart: 三种建模方法对比 =====
  var chartRadar = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });

  var indicator = [
    { name: '可扩展性', max: 100 },
    { name: '可审计性', max: 100 },
    { name: '加载效率', max: 100 },
    { name: '查询易用性', max: 100 },
    { name: '历史追踪', max: 100 },
    { name: '敏捷性', max: 100 }
  ];

  chartRadar.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'item'
    },
    legend: {
      data: ['Data Vault 2.0', '维度建模 (Kimball)', '第三范式 (3NF)'],
      bottom: 0,
      textStyle: { color: ink, fontSize: 13 },
      itemGap: 20
    },
    radar: {
      indicator: indicator,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: ink,
        fontSize: 13,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: { color: rule }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255,255,255,0.3)', 'rgba(245,246,250,0.5)']
        }
      },
      axisLine: {
        lineStyle: { color: rule }
      },
      center: ['50%', '48%'],
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [95, 95, 90, 50, 95, 85],
          name: 'Data Vault 2.0',
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent },
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: accent + '10' },
                { offset: 1, color: accent + '30' }
              ]
            }
          }
        },
        {
          value: [60, 55, 70, 95, 70, 75],
          name: '维度建模 (Kimball)',
          lineStyle: { color: accent2, width: 2 },
          itemStyle: { color: accent2 },
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: accent2 + '10' },
                { offset: 1, color: accent2 + '25' }
              ]
            }
          }
        },
        {
          value: [40, 35, 45, 55, 50, 35],
          name: '第三范式 (3NF)',
          lineStyle: { color: muted, width: 2 },
          itemStyle: { color: muted },
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: muted + '08' },
                { offset: 1, color: muted + '20' }
              ]
            }
          }
        }
      ]
    }]
  });

  window.addEventListener('resize', function() {
    chartRadar.resize();
  });
})();
