// SIMD 指令与向量化引擎详解 - 图表脚本
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#3b82f6';
  var accent2 = style.getPropertyValue('--accent-2').trim() || '#06b6d4';
  var accent3 = style.getPropertyValue('--accent-3').trim() || '#8b5cf6';
  var ink = style.getPropertyValue('--ink').trim() || '#0f172a';
  var muted = style.getPropertyValue('--muted').trim() || '#64748b';
  var rule = style.getPropertyValue('--rule').trim() || 'rgba(59, 130, 246, 0.12)';
  var bg2 = style.getPropertyValue('--bg2').trim() || 'rgba(255, 255, 255, 0.7)';

  // ============================================
  // 图表 1：性能对比柱状图
  // ============================================
  var chartPerformance = echarts.init(document.getElementById('chart-performance'), null, { renderer: 'svg' });

  var performanceData = [
    { name: '行式执行\n(Baseline)', value: 1, color: '#94a3b8' },
    { name: '向量化\n(无 SIMD)', value: 3.5, color: '#fbbf24' },
    { name: '向量化 + SSE\n(128bit)', value: 7, color: '#22d3ee' },
    { name: '向量化 + AVX2\n(256bit)', value: 15, color: '#3b82f6' },
    { name: '向量化 + AVX-512\n(512bit)', value: 35, color: '#8b5cf6' }
  ];

  chartPerformance.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        var data = params[0];
        return '<div style="font-weight: 600; margin-bottom: 4px;">' + data.name.replace('\n', '') + '</div>' +
               '<div style="color: ' + data.color + '; font-size: 18px; font-weight: 700;">' + data.value + 'x</div>' +
               '<div style="color: #64748b; font-size: 12px; margin-top: 4px;">相对行式执行加速比</div>';
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: rule,
      borderWidth: 1,
      textStyle: {
        color: ink
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: performanceData.map(function(d) { return d.name; }),
      axisLine: {
        lineStyle: { color: rule }
      },
      axisTick: { show: false },
      axisLabel: {
        color: muted,
        fontSize: 12,
        interval: 0,
        lineHeight: 18
      }
    },
    yAxis: {
      type: 'value',
      name: '加速比 (倍)',
      nameTextStyle: {
        color: muted,
        fontSize: 12
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: muted,
        fontSize: 12,
        formatter: '{value}x'
      },
      splitLine: {
        lineStyle: {
          color: rule,
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: performanceData.map(function(d) {
        return {
          value: d.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: d.color },
                { offset: 1, color: d.color + '99' }
              ]
            },
            borderRadius: [6, 6, 0, 0]
          }
        };
      }),
      label: {
        show: true,
        position: 'top',
        formatter: '{c}x',
        fontWeight: 600,
        fontSize: 13,
        color: ink
      }
    }]
  });

  // ============================================
  // 图表 2：SIMD 宽度对比
  // ============================================
  var chartWidth = echarts.init(document.getElementById('chart-width'), null, { renderer: 'svg' });

  var widthData = [
    { name: 'SSE (128bit)', float32: 4, float64: 2, int64: 2, color: '#22d3ee' },
    { name: 'AVX (256bit)', float32: 8, float64: 4, int64: 4, color: '#3b82f6' },
    { name: 'AVX2 (256bit)', float32: 8, float64: 4, int64: 4, color: '#6366f1' },
    { name: 'AVX-512 (512bit)', float32: 16, float64: 8, int64: 8, color: '#8b5cf6' },
    { name: 'NEON (128bit)', float32: 4, float64: 2, int64: 2, color: '#10b981' }
  ];

  chartWidth.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: rule,
      borderWidth: 1,
      textStyle: {
        color: ink
      }
    },
    legend: {
      data: ['单精度浮点 (float32)', '双精度浮点 (float64)', '64位整数 (int64)'],
      bottom: 0,
      textStyle: {
        color: muted,
        fontSize: 12
      },
      itemWidth: 14,
      itemHeight: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '18%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: widthData.map(function(d) { return d.name; }),
      axisLine: {
        lineStyle: { color: rule }
      },
      axisTick: { show: false },
      axisLabel: {
        color: muted,
        fontSize: 12,
        interval: 0,
        rotate: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '并行通道数',
      nameTextStyle: {
        color: muted,
        fontSize: 12
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: muted,
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: rule,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '单精度浮点 (float32)',
        type: 'bar',
        barWidth: '22%',
        data: widthData.map(function(d) { return d.float32; }),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '双精度浮点 (float64)',
        type: 'bar',
        barWidth: '22%',
        data: widthData.map(function(d) { return d.float64; }),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#a78bfa' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '64位整数 (int64)',
        type: 'bar',
        barWidth: '22%',
        data: widthData.map(function(d) { return d.int64; }),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#06b6d4' },
              { offset: 1, color: '#22d3ee' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  });

  // ============================================
  // 响应式
  // ============================================
  window.addEventListener('resize', function() {
    chartPerformance.resize();
    chartWidth.resize();
  });
})();
