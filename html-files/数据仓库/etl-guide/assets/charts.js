// ETL Guide - Chart Scripts
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#4B3FE3';
  var accent2 = style.getPropertyValue('--accent-2').trim() || '#27D2BF';
  var ink = style.getPropertyValue('--ink').trim() || '#1A1A2E';
  var muted = style.getPropertyValue('--muted').trim() || '#6B7280';
  var rule = style.getPropertyValue('--rule').trim() || 'rgba(75, 63, 227, 0.12)';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#F0F2FF';
  var surface = style.getPropertyValue('--surface').trim() || '#FFFFFF';
  var success = style.getPropertyValue('--success').trim() || '#10B981';
  var warning = style.getPropertyValue('--warning').trim() || '#F59E0B';

  // --- Chart: Data Volume by Layer ---
  var chartLayers = echarts.init(document.getElementById('chart-layers'), null, { renderer: 'svg' });

  var layerData = [
    { name: 'ODS 操作数据层', value: 100, desc: '原始数据 100%' },
    { name: 'DWD 明细数据层', value: 85, desc: '清洗后约 85%' },
    { name: 'DWS 汇总数据层', value: 25, desc: '聚合后约 25%' },
    { name: 'ADS 应用数据层', value: 8, desc: '应用层约 8%' }
  ];

  chartLayers.setOption({
    animation: false,
    grid: {
      left: '3%',
      right: '10%',
      top: '8%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: muted,
        fontSize: 12
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: rule,
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: layerData.map(function(d) { return d.name; }),
      inverse: true,
      axisLabel: {
        color: ink,
        fontSize: 13,
        fontWeight: 500
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      formatter: function(params) {
        var d = layerData[params[0].dataIndex];
        return '<div style="font-weight:600;margin-bottom:4px;">' + d.name + '</div>' +
               '<div>数据量占比：<strong>' + d.value + '%</strong></div>' +
               '<div style="color:' + muted + ';font-size:12px;margin-top:2px;">' + d.desc + '</div>';
      }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 100, itemStyle: { color: accent } },
        { value: 85, itemStyle: { color: accent2 } },
        { value: 25, itemStyle: { color: warning } },
        { value: 8, itemStyle: { color: success } }
      ],
      barWidth: 28,
      barMaxWidth: 36,
      itemStyle: {
        borderRadius: [0, 6, 6, 0]
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%',
        color: ink,
        fontWeight: 600,
        fontSize: 13,
        fontFamily: 'JetBrainsMono, monospace'
      },
      showBackground: true,
      backgroundStyle: {
        color: bg2,
        borderRadius: [0, 6, 6, 0]
      }
    }]
  });

  window.addEventListener('resize', function() {
    chartLayers.resize();
  });

})();
