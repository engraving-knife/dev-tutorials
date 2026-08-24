/* assets/charts.js — Deletion Vector 详解图表 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  function axisColor() { return muted; }

  /* ===== 图 2：删除工件数量随更新次数累积 ===== */
  var el2 = document.getElementById('chart-dv-accum');
  if (el2) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    var hours = [];
    var pos = [];      // Position Delete: 线性发散
    var dv = [];       // Deletion Vector: 收敛为固定少量文件
    for (var h = 0; h <= 24; h++) {
      hours.push(h + 'h');
      pos.push(h === 0 ? 0 : h * 1000);
      dv.push(h === 0 ? 0 : 5);
    }
    c2.setOption({
      animation: false,
      grid: { left: 56, right: 28, top: 46, bottom: 38 },
      legend: { top: 2, icon: 'roundRect', itemWidth: 18, itemHeight: 8, textStyle: { color: ink, fontSize: 13 } },
      tooltip: { trigger: 'axis', appendToBody: true, backgroundColor: '#12303f', borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff' } },
      xAxis: {
        type: 'category', data: hours, boundaryGap: false,
        axisLine: { lineStyle: { color: rule } }, axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 12, interval: 2 }
      },
      yAxis: {
        type: 'value', name: '删除工件数量',
        nameTextStyle: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: { color: muted, fontSize: 12 },
        axisLine: { show: false }
      },
      series: [
        { name: 'Position Delete (MOR-V2)', type: 'line', data: pos, smooth: true, symbol: 'none', lineStyle: { width: 3, color: '#e05f7d' }, areaStyle: { color: 'rgba(224,95,125,0.10)' } },
        { name: 'Deletion Vector (V3)', type: 'line', data: dv, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 3, color: accent2 }, areaStyle: { color: 'rgba(53,208,199,0.12)' } }
      ]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  /* ===== 图 3：三种策略成本对比（雷达图，值越低越好） ===== */
  var el3 = document.getElementById('chart-dv-compare');
  if (el3) {
    var c3 = echarts.init(el3, null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: { appendToBody: true, backgroundColor: '#12303f', borderColor: 'rgba(255,255,255,0.15)', textStyle: { color: '#fff' } },
      legend: { top: 2, icon: 'roundRect', itemWidth: 18, itemHeight: 8, textStyle: { color: ink, fontSize: 13 } },
      radar: {
        indicator: [
          { name: '写放大', max: 100 },
          { name: '读合并成本', max: 100 },
          { name: '删除工件发散度', max: 100 }
        ],
        radius: '66%', center: ['50%', '56%'],
        axisName: { color: ink, fontSize: 13, fontWeight: 600 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['rgba(47,162,230,0.03)', 'rgba(47,162,230,0.07)'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          { name: 'Copy-on-Write', value: [95, 20, 15], itemStyle: { color: '#e09a16' }, lineStyle: { width: 2 }, areaStyle: { color: 'rgba(224,154,22,0.14)' } },
          { name: 'Position Delete (MOR-V2)', value: [15, 88, 92], itemStyle: { color: '#e05f7d' }, lineStyle: { width: 2 }, areaStyle: { color: 'rgba(224,95,125,0.14)' } },
          { name: 'Deletion Vector (V3)', value: [18, 38, 20], itemStyle: { color: accent2 }, lineStyle: { width: 3 }, areaStyle: { color: 'rgba(53,208,199,0.16)' } }
        ]
      }]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }
})();