// assets/charts.js — ECharts 图表逻辑
(function() {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var fontFamily = "'Noto Sans CJK SC','PingFang SC','WenQuanYi Micro Hei',sans-serif";
  var fontNum = "'Outfit','PingFang SC',sans-serif";

  var baseText = {
    color: muted,
    fontFamily: fontFamily
  };

  // ============ Chart 1: 网络带宽与磁盘吞吐演进 ============
  var elBandwidth = document.getElementById('chart-bandwidth');
  if (elBandwidth) {
    var chart1 = echarts.init(elBandwidth, null, { renderer: 'svg' });
    var years = ['2006', '2012', '2018', '2024'];
    chart1.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: rule,
        textStyle: { color: ink, fontFamily: fontFamily },
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['主流网卡带宽 (Gbps)', '磁盘吞吐 (MB/s)'],
        textStyle: baseText,
        top: 0
      },
      grid: { left: 52, right: 56, top: 44, bottom: 36 },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontFamily: fontFamily },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '网络带宽 Gbps',
          nameTextStyle: baseText,
          splitLine: { lineStyle: { color: rule, type: 'dashed' } },
          axisLabel: { color: muted, fontFamily: fontNum }
        },
        {
          type: 'value',
          name: '磁盘吞吐 MB/s',
          nameTextStyle: baseText,
          splitLine: { show: false },
          axisLabel: { color: muted, fontFamily: fontNum }
        }
      ],
      series: [
        {
          name: '主流网卡带宽 (Gbps)',
          type: 'bar',
          barWidth: 40,
          data: [1, 10, 25, 100],
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: accent },
                { offset: 1, color: accent + 'aa' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            color: accent,
            fontFamily: fontNum,
            fontWeight: 700,
            formatter: function(p) { return p.value + 'G'; }
          }
        },
        {
          name: '磁盘吞吐 (MB/s)',
          type: 'line',
          yAxisIndex: 1,
          data: [50, 70, 100, 120],
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: accent2, width: 3 },
          itemStyle: { color: accent2 },
          label: {
            show: true,
            position: 'top',
            color: accent2,
            fontFamily: fontNum,
            fontWeight: 700,
            formatter: function(p) { return p.value + 'MB'; }
          }
        }
      ]
    });
    window.addEventListener('resize', function() { chart1.resize(); });
  }

  // ============ Chart 2: 存算一体 vs 存算分离 六维雷达图 ============
  var elRadar = document.getElementById('chart-radar');
  if (elRadar) {
    var chart2 = echarts.init(elRadar, null, { renderer: 'svg' });
    var dimensions = ['弹性伸缩', '存储成本', '数据共享', '元数据扩展', '运维便捷', '查询性能'];
    chart2.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: rule,
        textStyle: { color: ink, fontFamily: fontFamily }
      },
      legend: {
        data: ['存算一体', '存算分离'],
        textStyle: baseText,
        bottom: 0
      },
      radar: {
        indicator: dimensions.map(function(d) {
          return { name: d, max: 5 };
        }),
        radius: '62%',
        center: ['50%', '52%'],
        splitNumber: 5,
        axisName: { color: ink, fontFamily: fontFamily, fontSize: 13 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: {
          areaStyle: {
            color: ['rgba(61,139,255,0.03)', 'rgba(47,196,160,0.03)']
          }
        },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            name: '存算一体',
            value: [2, 2, 2, 2, 3, 5],
            lineStyle: { color: accent3, width: 2 },
            itemStyle: { color: accent3 },
            areaStyle: { color: accent3 + '33' },
            symbol: 'circle',
            symbolSize: 5
          },
          {
            name: '存算分离',
            value: [5, 5, 5, 4, 4, 3],
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent },
            areaStyle: { color: accent + '2e' },
            symbol: 'circle',
            symbolSize: 5
          }
        ]
      }]
    });
    window.addEventListener('resize', function() { chart2.resize(); });
  }
})();
