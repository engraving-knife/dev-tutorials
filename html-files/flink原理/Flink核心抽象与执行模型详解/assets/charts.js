(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 5s tumbling window per-second order counts ---
  var elWindow = document.getElementById('chart-window');
  if (elWindow) {
    var chartWindow = echarts.init(elWindow, null, { renderer: 'svg' });
    // 20 秒内，每 5 秒一个滚动窗口，累计该窗口内下单成功笔数
    var windows = ['[0,5)s', '[5,10)s', '[10,15)s', '[15,20)s'];
    var counts = [8, 13, 6, 11];
    // 每秒到达的事件数（用于展示数据分布），可选用柱状淡化展示
    var perSec = [4, 3, 1, 3, 2, 1, 1, 2, 2, 1, 2, 2, 3, 2, 1, 3, 2, 4, 1, 1];

    chartWindow.setOption({
      animation: false,
      color: [accent2],
      tooltip: {
        appendToBody: true,
        trigger: 'axis',
        formatter: function (params) {
          var s = '<b>' + params[0].axisValue + '</b><br/>';
          s += '成交笔数：' + params[0].value + ' 笔';
          return s;
        }
      },
      grid: { left: 44, right: 24, top: 24, bottom: 44 },
      xAxis: {
        type: 'category',
        data: windows,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '笔数',
        nameTextStyle: { color: muted },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      series: [{
        name: '窗口成交笔数',
        type: 'bar',
        barWidth: '46%',
        data: counts,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent },
              { offset: 1, color: accent2 }
            ]
          }
        },
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontSize: 12,
          formatter: '{c}'
        }
      }]
    });
    window.addEventListener('resize', function () { chartWindow.resize(); });
  }
})();