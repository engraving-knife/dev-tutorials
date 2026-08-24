(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: Slot Sharing 前后所需 Slot 数 ---
  var elShare = document.getElementById('chart-sharing');
  if (elShare) {
    var share = echarts.init(elShare, null, { renderer: 'svg' });
    share.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: { appendToBody: true, trigger: 'axis',
        formatter: function (p) { return '<b>' + p[0].axisValue + '</b><br/>' + p[0].seriesName + '：' + p[0].value + ' 个 Slot'; } },
      grid: { left: 56, right: 24, top: 34, bottom: 42 },
      xAxis: { type: 'category', data: ['所需 Slot 总数'], axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink }, axisTick: { show: false } },
      yAxis: { type: 'value', name: 'Slot 数', nameTextStyle: { color: muted },
        splitLine: { lineStyle: { color: rule } }, axisLabel: { color: muted } },
      series: [
        { name: '关闭 Slot Sharing', type: 'bar', barWidth: 34,
          data: [16], itemStyle: { borderRadius: [8, 8, 0, 0], color: accent },
          label: { show: true, position: 'top', color: accent, fontSize: 13, formatter: '{c} 个', fontWeight: 700 } },
        { name: '开启 Slot Sharing', type: 'bar', barWidth: 34,
          data: [4], itemStyle: { borderRadius: [8, 8, 0, 0], color: accent2 },
          label: { show: true, position: 'top', color: accent2, fontSize: 13, formatter: '{c} 个', fontWeight: 700 } }
      ]
    });
    window.addEventListener('resize', function () { share.resize(); });
  }

  // --- Chart: TaskManager 内存构成（示意环形） ---
  var elMem = document.getElementById('chart-mem');
  if (elMem) {
    var mem = echarts.init(elMem, null, { renderer: 'svg' });
    mem.setOption({
      animation: false,
      color: [accent, accent2, '#8a7bfa', '#f4b95f', '#e87a6a', muted],
      tooltip: { appendToBody: true, trigger: 'item',
        formatter: function (p) { return p.name + '<br/>' + p.value + '%' + '<br/><small>示意占比</small>'; } },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 12 }, icon: 'circle' },
      series: [{
        type: 'pie', radius: ['44%', '70%'], center: ['50%', '46%'],
        avoidLabelOverlap: true, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 6 },
        label: { show: true, formatter: '{d}%', color: ink, fontSize: 12, fontWeight: 700 },
        labelLine: { length: 14, length2: 8 },
        data: [
          { name: '任务/框架堆 Heap', value: 46, itemStyle: { color: accent } },
          { name: '托管内存 Managed', value: 30, itemStyle: { color: accent2 } },
          { name: '网络缓冲 Network', value: 12, itemStyle: { color: '#8a7bfa' } },
          { name: 'JVM 开销 Overhead', value: 12, itemStyle: { color: '#f4b95f' } }
        ]
      }]
    });
    window.addEventListener('resize', function () { mem.resize(); });
  }
})();