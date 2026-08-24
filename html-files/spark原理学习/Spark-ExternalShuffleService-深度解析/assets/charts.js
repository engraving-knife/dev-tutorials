// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Magnet push-based shuffle 收益对比 ---
  var chartEl = document.getElementById('chart-magnet');
  if (chartEl) {
    var chart = echarts.init(chartEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      color: [accent2, accent, accent3],
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: rule,
        textStyle: { color: ink, fontSize: 13 }
      },
      legend: {
        top: 4,
        itemWidth: 14,
        itemHeight: 10,
        textStyle: { color: muted, fontSize: 13 }
      },
      grid: { left: 56, right: 28, top: 52, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['shuffle 请求数（相对值）', '任务完成时间（相对值）'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 13 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        max: 110,
        name: '相对值（ESS = 100）',
        nameTextStyle: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 12 }
      },
      series: [
        {
          name: '经典 ESS',
          type: 'bar',
          barWidth: 28,
          data: [100, 100],
          itemStyle: { borderRadius: [6, 6, 0, 0], color: accent3 + '99' },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            color: muted,
            fontSize: 12,
            fontWeight: 700
          }
        },
        {
          name: 'Push-based（3.2+）',
          type: 'bar',
          barWidth: 28,
          data: [15, 63],
          itemStyle: { borderRadius: [6, 6, 0, 0], color: accent2 },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            color: accent2,
            fontSize: 12,
            fontWeight: 700
          }
        }
      ]
    });
    window.addEventListener('resize', function() { chart.resize(); });
  }
})();
