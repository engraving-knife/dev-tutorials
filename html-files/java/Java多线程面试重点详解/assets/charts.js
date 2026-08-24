// Java 多线程面试考点热度图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 考点热度 ---
  var heatEl = document.getElementById('chart-heat');
  if (!heatEl) return;

  var heat = echarts.init(heatEl, null, { renderer: 'svg' });
  var topics = [
    'synchronized 锁升级',
    '线程池参数与流程',
    'volatile / JMM',
    'AQS 原理',
    'ConcurrentHashMap',
    'ThreadLocal 内存泄漏',
    'CAS 与 ABA',
    '线程创建与生命周期',
    '并发工具对比',
    '死锁排查'
  ];
  var scores = [96, 95, 92, 88, 86, 84, 80, 76, 74, 70];

  heat.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      appendToBody: true,
      formatter: function (params) {
        var p = params[0];
        return p.name + '<br/>考察热度：' + p.value + ' / 100';
      }
    },
    grid: { left: 10, right: 46, top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'category',
      data: topics,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: scores,
      barWidth: 16,
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: function (params) {
          var v = params.value;
          // 前三名用主渐变，其余用柔和渐变
          if (v >= 90) {
            return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: accent },
              { offset: 1, color: accent2 }
            ]);
          }
          if (v >= 80) {
            return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: accent + 'cc' },
              { offset: 1, color: accent2 + 'aa' }
            ]);
          }
          return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: accent3 + 'aa' },
            { offset: 1, color: accent + '88' }
          ]);
        }
      },
      label: {
        show: true,
        position: 'right',
        color: muted,
        fontSize: 11,
        formatter: '{c}'
      }
    }]
  });
  window.addEventListener('resize', function () { heat.resize(); });
})();
