/* charts.js - Spark 聚合与 Join 原理深度解析 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var violet = style.getPropertyValue('--violet').trim();
  var pink = style.getPropertyValue('--pink').trim();
  var green = style.getPropertyValue('--green').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  /* ---- Chart 1: 聚合算子 Shuffle 数据量对比（对数轴） ---- */
  var el1 = document.getElementById('chart-shuffle-compare');
  if (el1) {
    var c1 = echarts.init(el1, null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          var p = ps[0];
          var map = { 0: '输入数据（示例：70 万条单词记录）', 1: 'groupByKey：全部原始记录进入 Shuffle', 2: 'reduceByKey：Map 端预聚合后仅剩少量中间结果', 3: 'aggregateByKey：同 reduceByKey，预聚合后传输' };
          var n = p.value;
          return '<b>' + map[p.dataIndex] + '</b><br/>Shuffle/输入数据量：' + (n >= 10000 ? (n / 10000) + ' 万条' : n + ' 条');
        }
      },
      grid: { left: 80, right: 30, top: 30, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['输入数据', 'groupByKey', 'reduceByKey', 'aggregateByKey'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 12 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'log',
        logBase: 10,
        axisLabel: { color: muted, formatter: function (v) { return v >= 10000 ? (v / 10000) + '万' : v; } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [{
        name: '数据量（条）',
        type: 'bar',
        barWidth: 52,
        data: [
          { value: 700000, itemStyle: { color: accent + '66' }, label: { show: true, position: 'top', color: muted, formatter: '70 万' } },
          { value: 700000, itemStyle: { color: pink }, label: { show: true, position: 'top', color: muted, formatter: '70 万' } },
          { value: 4, itemStyle: { color: green }, label: { show: true, position: 'top', color: muted, formatter: '≈4 条' } },
          { value: 8, itemStyle: { color: accent2 }, label: { show: true, position: 'top', color: muted, formatter: '≈8 条' } }
        ],
        itemStyle: { borderRadius: [8, 8, 0, 0] }
      }]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  /* ---- Chart 2: Join 策略适用区域（对数坐标系） ---- */
  var el2 = document.getElementById('chart-join-strategy');
  if (el2) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    var fmt = function (v) {
      if (v >= 1024) return (v / 1024) + 'GB';
      return v + 'MB';
    };
    c2.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: function (p) {
          return '<b>' + p.seriesName + '</b><br/>表A=' + fmt(p.value[0]) + '，表B=' + fmt(p.value[1]) + '<br/>' + p.data[2];
        }
      },
      legend: { top: 0, textStyle: { color: muted }, itemWidth: 14, itemHeight: 14 },
      grid: { left: 80, right: 40, top: 46, bottom: 64 },
      xAxis: {
        type: 'log', name: '表 A 大小（MB，对数刻度）', nameLocation: 'middle', nameGap: 34,
        nameTextStyle: { color: muted, fontSize: 12 },
        min: 0.1, max: 200000,
        axisLabel: { color: muted, formatter: function (v) { return v >= 1024 ? Math.round(v / 1024) + 'G' : v + 'M'; } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      yAxis: {
        type: 'log', name: '表 B 大小（MB，对数刻度）', nameLocation: 'middle', nameGap: 44,
        nameTextStyle: { color: muted, fontSize: 12 },
        min: 0.1, max: 200000,
        axisLabel: { color: muted, formatter: function (v) { return v >= 1024 ? Math.round(v / 1024) + 'G' : v + 'M'; } },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '策略区域',
          type: 'scatter',
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: 'transparent' },
            data: [
              [
                { name: 'BHJ：表B ≤ 10MB 可广播', xAxis: 0.1, yAxis: 0.1, itemStyle: { color: accent + '14' } },
                { xAxis: 200000, yAxis: 10, itemStyle: { color: accent + '14' } }
              ],
              [
                { name: 'BHJ：表A ≤ 10MB 可广播', xAxis: 0.1, yAxis: 0.1, itemStyle: { color: accent + '14' } },
                { xAxis: 10, yAxis: 200000, itemStyle: { color: accent + '14' } }
              ],
              [
                { name: 'SMJ：两侧均大，默认兜底', xAxis: 10, yAxis: 10, itemStyle: { color: violet + '10' } },
                { xAxis: 200000, yAxis: 200000, itemStyle: { color: violet + '10' } }
              ]
            ],
            label: {
              show: true, position: 'inside', color: muted, fontSize: 11,
              formatter: function (p) { return p.name || ''; }
            }
          }
        },
        {
          name: 'Broadcast Hash Join',
          type: 'scatter',
          symbolSize: 13,
          itemStyle: { color: accent },
          data: [
            [5, 30000, '大事实表 × 小维度表（国家/分类）'],
            [20000, 3, '大订单表 × 小用户配置表'],
            [1, 5000, '日志表 × 小型字典表']
          ]
        },
        {
          name: 'Shuffle Hash Join',
          type: 'scatter',
          symbolSize: 13,
          itemStyle: { color: accent2 },
          data: [
            [1500, 200, '中等表对，分区内小侧可入内存'],
            [300, 800, '中等表对，键分布均匀']
          ]
        },
        {
          name: 'Sort Merge Join',
          type: 'scatter',
          symbolSize: 13,
          itemStyle: { color: violet },
          data: [
            [30000, 50000, '用户表 × 订单表（大 × 大）'],
            [80000, 2000, '事实表 × 大维度表（超广播阈值）'],
            [5000, 20000, '两张大表的常规关联']
          ]
        },
        {
          name: 'Bucket Join（免 Shuffle）',
          type: 'scatter',
          symbolSize: 16,
          symbol: 'diamond',
          itemStyle: { color: green },
          data: [
            [30000, 30000, '两表同键同桶数，直接本地归并']
          ]
        }
      ]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  /* ---- Chart 3: 三种 Join 匹配方式的复杂度对比（对数轴） ---- */
  var el3 = document.getElementById('chart-join-complexity');
  if (el3) {
    var c3 = echarts.init(el3, null, { renderer: 'svg' });
    var nVals = [1000, 10000, 100000, 1000000, 10000000, 100000000];
    var nLabels = ['1千', '1万', '10万', '100万', '1000万', '1亿'];
    var nlogn = nVals.map(function (n) { return Math.round(n * Math.log10(n)); });
    c3.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function (ps) {
          var i = ps[0].dataIndex;
          var html = '<b>每侧 ' + nLabels[i] + ' 行（n=m）</b><br/>';
          ps.forEach(function (p) {
            var v = p.value;
            var s;
            if (v >= 1e12) { s = (v / 1e12).toFixed(1) + ' 万亿'; }
            else if (v >= 1e8) { s = (v / 1e8).toFixed(1) + ' 亿'; }
            else { s = v; }
            html += p.marker + ' ' + p.seriesName + '：约 ' + s + ' 次比较<br/>';
          });
          return html;
        }
      },
      legend: { top: 0, textStyle: { color: muted }, itemWidth: 16, itemHeight: 10 },
      grid: { left: 90, right: 40, top: 46, bottom: 56 },
      xAxis: {
        type: 'log',
        min: 1000, max: 100000000,
        axisLabel: {
          color: muted,
          formatter: function (v) {
            var idx = nVals.indexOf(v);
            return idx >= 0 ? nLabels[idx] : v;
          }
        },
        name: '每侧数据行数 n（对数刻度）', nameLocation: 'middle', nameGap: 34, nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'log',
        min: 1000, max: 10000000000000000,
        axisLabel: {
          color: muted,
          formatter: function (v) {
            if (v >= 1e12) return (v / 1e12) + '万亿';
            if (v >= 1e8) return (v / 1e8) + '亿';
            return v;
          }
        },
        name: '匹配比较次数（对数刻度）', nameLocation: 'middle', nameGap: 52, nameTextStyle: { color: muted, fontSize: 12 },
        splitLine: { lineStyle: { color: rule, type: 'dashed' } }
      },
      series: [
        {
          name: '嵌套循环 O(n²)',
          type: 'line',
          smooth: true,
          symbol: 'circle', symbolSize: 6,
          lineStyle: { width: 3, color: pink },
          itemStyle: { color: pink },
          data: nVals.map(function (n) { return n * n; })
        },
        {
          name: '排序归并 O(n log n)',
          type: 'line',
          smooth: true,
          symbol: 'triangle', symbolSize: 7,
          lineStyle: { width: 3, color: violet },
          itemStyle: { color: violet },
          data: nlogn
        },
        {
          name: '哈希探测 O(n)',
          type: 'line',
          smooth: true,
          symbol: 'diamond', symbolSize: 7,
          lineStyle: { width: 3, color: green },
          itemStyle: { color: green },
          data: nVals
        }
      ]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }
})();
