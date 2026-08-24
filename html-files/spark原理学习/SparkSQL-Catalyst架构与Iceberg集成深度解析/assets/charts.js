// assets/charts.js
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var grad = [accent, accent2, accent3];

  // --- Chart: codegen overhead comparison (图 4-1) ---
  var el1 = document.getElementById('chart-codegen');
  if (el1 && typeof echarts !== 'undefined') {
    var chart1 = echarts.init(el1, null, { renderer: 'svg' });
    chart1.setOption({
      animation: false,
      color: grad,
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      grid: { left: 70, right: 30, top: 30, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['解释执行\n(Volcano)', '整段代码生成\n(WholeStageCodegen)'],
        axisLabel: { color: ink, interval: 0, lineHeight: 18 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '相对开销 (%)',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        name: '单行处理开销',
        type: 'bar',
        barWidth: 48,
        data: [
          { value: 100, itemStyle: { color: accent2 + 'aa' } },
          { value: 18, itemStyle: { color: accent } }
        ],
        label: {
          show: true,
          position: 'top',
          formatter: function (p) { return p.value + '%'; },
          color: ink
        }
      }]
    });
    window.addEventListener('resize', function () { chart1.resize(); });
  }
})();
