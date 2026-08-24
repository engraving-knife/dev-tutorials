/* WholeStageCodegen 原理详解 · 图表 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var CN_FONT = '"Noto Sans CJK SC","WenQuanYi Micro Hei","PingFang SC",sans-serif';

  function baseOption(xData, seriesData, formatter) {
    return {
      animation: false,
      textStyle: { fontFamily: CN_FONT, color: ink },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        confine: true,
        axisPointer: { type: 'shadow' },
        textStyle: { fontFamily: CN_FONT, color: ink },
        formatter: function (ps) {
          var head = '<b>' + ps[0].name + '</b><br/>';
          return head + ps.map(function (p) {
            return p.marker + ' ' + p.seriesName + '：<b>' + formatter(p.value) + '</b>';
          }).join('<br/>');
        }
      },
      grid: { left: 46, right: 20, top: 36, bottom: 44 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '耗时（秒）',
        nameTextStyle: { color: muted, fontFamily: CN_FONT, fontSize: 11 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted, fontFamily: CN_FONT, fontSize: 11 }
      },
      series: [{
        type: 'bar',
        barWidth: 42,
        data: seriesData,
        itemStyle: {
          borderRadius: [8, 8, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontFamily: CN_FONT,
          fontSize: 12,
          fontWeight: 600,
          formatter: function (p) { return formatter(p.value); }
        }
      }]
    };
  }

  /* --- 图 4 · sum(1B) --- */
  var elSum = document.getElementById('chart-sum');
  if (elSum) {
    var chartSum = echarts.init(elSum, null, { renderer: 'svg' });
    chartSum.setOption(baseOption(
      ['无 Codegen（Spark 1.6）', '有 Codegen（Spark 2.0）'],
      [
        { value: 8.0, itemStyle: { color: muted, opacity: 0.75 } },
        { value: 0.7, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: accent }, { offset: 1, color: accent2 }]) } }
      ],
      function (v) { return v + 's'; }
    ));
    window.addEventListener('resize', function () { chartSum.resize(); });
  }

  /* --- 图 5 · join(1B) --- */
  var elJoin = document.getElementById('chart-join');
  if (elJoin) {
    var chartJoin = echarts.init(elJoin, null, { renderer: 'svg' });
    chartJoin.setOption(baseOption(
      ['无 Codegen（Spark 1.6）', '有 Codegen（Spark 2.0）'],
      [
        { value: 67.9, itemStyle: { color: muted, opacity: 0.75 } },
        { value: 0.86, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: accent }, { offset: 1, color: accent2 }]) } }
      ],
      function (v) { return v + 's'; }
    ));
    window.addEventListener('resize', function () { chartJoin.resize(); });
  }
})();
