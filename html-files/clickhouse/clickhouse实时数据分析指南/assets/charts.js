(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // 颜色渐变色构建
  var gradientColor1 = {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: accent },
      { offset: 1, color: accent2 }
    ]
  };

  var gradientColor2 = {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: '#64748b' },
      { offset: 1, color: '#94a3b8' }
    ]
  };

  // ========== Chart 1: 写入性能对比 ==========
  var chartIngestion = echarts.init(document.getElementById('chart-ingestion'), null, { renderer: 'svg' });
  chartIngestion.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink, fontSize: 13 }
    },
    legend: {
      data: ['ClickHouse 列式存储', '传统行式数据库'],
      top: 0,
      textStyle: { color: muted, fontSize: 13 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['日志数据', '指标数据', '订单数据', 'IoT 传感器', '用户行为'],
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '写入速度 (万行/秒)',
      nameTextStyle: { color: muted, fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        name: 'ClickHouse 列式存储',
        type: 'bar',
        barWidth: '30%',
        data: [280, 350, 120, 420, 180],
        itemStyle: {
          color: gradientColor1,
          borderRadius: [6, 6, 0, 0]
        }
      },
      {
        name: '传统行式数据库',
        type: 'bar',
        barWidth: '30%',
        data: [25, 30, 18, 40, 22],
        itemStyle: {
          color: gradientColor2,
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  });

  // ========== Chart 2: 延迟-复杂度散点图 ==========
  var chartLatency = echarts.init(document.getElementById('chart-latency'), null, { renderer: 'svg' });
  chartLatency.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: rule,
      borderWidth: 1,
      textStyle: { color: ink, fontSize: 13 },
      formatter: function(params) {
        return '<strong>' + params.data[3] + '</strong><br/>' +
               '延迟: ' + params.data[0] + '<br/>' +
               '架构复杂度: ' + params.data[1] + '<br/>' +
               '写入吞吐: ' + params.data[2] + '万行/s';
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '数据延迟 (秒)',
      nameTextStyle: { color: muted, fontSize: 12 },
      nameLocation: 'middle',
      nameGap: 25,
      min: 0,
      max: 60,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: '架构复杂度',
      nameTextStyle: { color: muted, fontSize: 12 },
      nameLocation: 'middle',
      nameGap: 40,
      min: 0,
      max: 10,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [
      {
        type: 'scatter',
        symbolSize: function(data) {
          return Math.sqrt(data[2]) * 2.5;
        },
        data: [
          // [延迟(秒), 复杂度, 吞吐量(万行/s), 名称]
          [2, 2, 200, 'ClickHouse Kafka 引擎'],
          [3, 5, 250, 'ClickHouse Kafka Connect'],
          [1, 3, 180, 'ClickHouse ClickPipes'],
          [0.5, 8, 150, 'Flink + ClickHouse'],
          [0.3, 7, 100, 'Apache Pinot'],
          [0.5, 7, 80, 'Apache Druid'],
          [2, 4, 60, 'Elasticsearch'],
          [30, 1, 50, '传统数仓批量导入']
        ],
        itemStyle: {
          color: function(params) {
            var name = params.data[3];
            if (name.indexOf('ClickHouse') !== -1) {
              return accent;
            }
            return muted;
          },
          opacity: 0.8,
          shadowBlur: 10,
          shadowColor: 'rgba(14, 165, 233, 0.3)'
        },
        label: {
          show: true,
          formatter: function(params) {
            return params.data[3];
          },
          position: 'top',
          fontSize: 11,
          color: ink,
          fontWeight: 500
        }
      }
    ]
  });

  // ========== Resize handlers ==========
  window.addEventListener('resize', function() {
    chartIngestion.resize();
    chartLatency.resize();
  });
})();
