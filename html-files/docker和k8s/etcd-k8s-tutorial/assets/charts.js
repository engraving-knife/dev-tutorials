// assets/charts.js — etcd 教程图表初始化
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ---------- Chart 1: 集群规模与容错能力 ----------
  var faultEl = document.getElementById('chart-fault-tolerance');
  if (faultEl) {
    var c1 = echarts.init(faultEl, null, { renderer: 'svg' });
    var sizes = ['1', '2', '3', '4', '5', '6', '7'];
    var tolerance = [0, 0, 1, 1, 2, 2, 3];
    c1.setOption({
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function (params) {
          var p = params[0];
          return '集群规模：<strong>' + p.name + ' 节点</strong><br/>可容忍故障：<strong>' + p.value + ' 台</strong>（多数派 ≥ ' + Math.ceil(p.name / 2) + ' 节点）';
        }
      },
      grid: { left: 56, right: 24, top: 40, bottom: 34 },
      xAxis: {
        type: 'category',
        data: sizes,
        name: '集群节点数',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 3,
        interval: 1,
        name: '可容忍故障节点数',
        nameTextStyle: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      series: [{
        type: 'bar',
        data: tolerance.map(function (v, i) {
          return {
            value: v,
            itemStyle: {
              color: (i === 2 || i === 4 || i === 6) ? accent : accent2,
              borderRadius: [8, 8, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              color: (i === 2 || i === 4 || i === 6) ? accent : muted,
              fontWeight: 700,
              fontSize: 14,
              formatter: v + ' 台'
            }
          };
        }),
        barWidth: 44,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: accent, type: 'dashed', opacity: 0.45 },
          label: { show: false },
          data: [{ yAxis: 1 }, { yAxis: 2 }]
        }
      }],
      animation: false
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // ---------- Chart 2: 能力雷达对比 ----------
  var radarEl = document.getElementById('chart-radar');
  if (radarEl) {
    var c2 = echarts.init(radarEl, null, { renderer: 'svg' });
    var indicators = [
      { name: '线性一致读', max: 5 },
      { name: 'MVCC 多版本', max: 5 },
      { name: '流式 Watch', max: 5 },
      { name: '事务 / CAS', max: 5 },
      { name: '锁 / 选举原语', max: 5 },
      { name: 'KV 扩展性', max: 5 },
      { name: '接口易用性', max: 5 },
      { name: '资源轻量', max: 5 }
    ];
    c2.setOption({
      tooltip: {
        appendToBody: true,
        trigger: 'item',
        formatter: function (p) {
          var rows = p.value.map(function (v, i) {
            return indicators[i].name + '：' + v + ' / 5';
          }).join('<br/>');
          return '<strong>' + p.name + '</strong><br/>' + rows;
        }
      },
      legend: {
        bottom: 0,
        itemWidth: 16,
        itemHeight: 10,
        textStyle: { color: ink, fontSize: 13 },
        data: ['etcd', 'ZooKeeper', 'Consul']
      },
      radar: {
        indicator: indicators,
        radius: '64%',
        center: ['50%', '48%'],
        splitNumber: 5,
        axisName: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['rgba(2,132,199,0.03)', 'rgba(255,255,255,0.4)'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            name: 'etcd',
            value: [5, 5, 5, 5, 5, 5, 5, 5],
            lineStyle: { color: accent, width: 2.5 },
            itemStyle: { color: accent },
            areaStyle: { color: accent, opacity: 0.16 }
          },
          {
            name: 'ZooKeeper',
            value: [3, 1, 2, 3, 4, 4, 2, 2],
            lineStyle: { color: accent2, width: 2 },
            itemStyle: { color: accent2 },
            areaStyle: { color: accent2, opacity: 0.10 }
          },
          {
            name: 'Consul',
            value: [5, 1, 3, 4, 5, 2, 4, 4],
            lineStyle: { color: muted, width: 2, type: 'dashed' },
            itemStyle: { color: muted },
            areaStyle: { color: muted, opacity: 0.06 }
          }
        ]
      }],
      animation: false
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }
})();
