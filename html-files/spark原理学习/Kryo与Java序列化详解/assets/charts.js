// assets/charts.js — ECharts 初始化（Kryo vs Java 序列化对比）
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ---------- 图 1：序列化耗时对比（10 万次，毫秒） ----------
  var elTime = document.getElementById('chart-time');
  if (elTime && window.echarts) {
    var chart1 = echarts.init(elTime, null, { renderer: 'svg' });
    chart1.setOption({
      animation: false,
      grid: { left: 10, right: 46, top: 16, bottom: 10, containLabel: true },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          var p = ps[0];
          return p.name + '<br/>耗时：' + p.value + ' ms' + (p.dataIndex === 1 ? '（约快 8 倍）' : '');
        }
      },
      xAxis: {
        type: 'value',
        name: '耗时 (ms)',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: ['Java 原生序列化', 'Kryo 序列化'],
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 13, fontWeight: 600 }
      },
      series: [{
        type: 'bar',
        barWidth: 26,
        data: [1200, 150],
        itemStyle: {
          borderRadius: [0, 14, 14, 0],
          color: function (p) { return p.dataIndex === 0 ? accent : accent2; }
        },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: function (p) {
            return p.value + ' ms' + (p.dataIndex === 1 ? '（约快 8 倍）' : '');
          },
          color: ink,
          fontWeight: 700,
          fontSize: 12
        }
      }]
    });
    window.addEventListener('resize', function () { chart1.resize(); });
  }

  // ---------- 图 2：序列化体积对比（字节，Kryo 为区间） ----------
  var elSize = document.getElementById('chart-size');
  if (elSize && window.echarts) {
    var chart2 = echarts.init(elSize, null, { renderer: 'svg' });
    chart2.setOption({
      animation: false,
      grid: { left: 10, right: 20, top: 34, bottom: 10, containLabel: true },
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: function (p) {
          var d = p.data;
          return d[0] + '<br/>体积：' + d[1] + (d[2] > d[1] ? ' ~ ' + d[2] : '') + ' 字节';
        }
      },
      xAxis: {
        type: 'category',
        data: ['Java 原生', 'JSON (Jackson)', 'Kryo'],
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 13, fontWeight: 600 }
      },
      yAxis: {
        type: 'value',
        name: '字节 (B)',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'custom',
        encode: { x: 0, y: [1, 2] },
        data: [
          ['Java 原生', 215, 215],
          ['JSON (Jackson)', 45, 45],
          ['Kryo（区间）', 43, 108]
        ],
        renderItem: function (params, api) {
          var cat = api.value(0);
          var lo = api.value(1);
          var hi = api.value(2);
          var x0 = api.coord([cat, 0]);
          var x1 = api.coord([cat, lo]);
          var x2 = api.coord([cat, hi]);
          var w = Math.max(18, Math.round(api.size([1, 0])[0] * 0.5));
          var isRange = hi > lo;
          var topY, h;
          if (isRange) { topY = x2[1]; h = x1[1] - x2[1]; }
          else { topY = x1[1]; h = x0[1] - x1[1]; }
          var labelY = topY - 8;
          if (labelY < 12) { labelY = topY + h + 14; }
          return {
            type: 'group',
            children: [{
              type: 'rect',
              shape: { x: x0[0] - w / 2, y: topY, width: w, height: h },
              style: {
                fill: isRange ? accent2 : accent,
                opacity: isRange ? 0.5 : 0.92,
                stroke: isRange ? accent2 : accent,
                lineWidth: 1.5
              }
            }, {
              type: 'text',
              style: {
                x: x0[0],
                y: labelY,
                text: isRange ? lo + ' ~ ' + hi + ' B' : lo + ' B',
                fill: ink,
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center'
              }
            }]
          };
        }
      }]
    });
    window.addEventListener('resize', function () { chart2.resize(); });
  }
})();
