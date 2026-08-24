(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#2563eb';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#f59e0b';
  var accent3 = style.getPropertyValue('--accent3').trim() || '#10b981';
  var ink = style.getPropertyValue('--ink').trim() || '#1a1d24';
  var muted = style.getPropertyValue('--muted').trim() || '#6b7280';
  var rule = style.getPropertyValue('--rule').trim() || '#e5e7eb';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#ffffff';

  // --- Chart 1: Executor 内存概览饼图 ---
  var chart1 = echarts.init(document.getElementById('chart-memory-overview'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: function(params) {
        return params.name + '<br/>大小: ' + params.value + ' MB<br/>占比: ' + params.percent + '%';
      }
    },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: {
        color: ink,
        fontSize: 13
      },
      itemGap: 16
    },
    series: [{
      name: '内存分布',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: bg2,
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'inside',
        formatter: '{d}%',
        color: '#fff',
        fontWeight: 600,
        fontSize: 13
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 2368, name: '执行内存', itemStyle: { color: accent } },
        { value: 2367, name: '存储内存', itemStyle: { color: accent2 } },
        { value: 3157, name: '用户内存', itemStyle: { color: accent3 } },
        { value: 300, name: '系统预留', itemStyle: { color: muted } }
      ]
    }]
  });

  // --- Chart 2: 内存分配详情旭日图/环形图 ---
  var chart2 = echarts.init(document.getElementById('chart-memory-detail'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: function(params) {
        if (params.treePathInfo) {
          var path = params.treePathInfo.map(function(p) { return p.name; }).join(' / ');
          return path + '<br/>大小: ' + params.value + ' MB';
        }
        return params.name + '<br/>大小: ' + params.value + ' MB';
      }
    },
    legend: {
      bottom: 0,
      textStyle: {
        color: ink,
        fontSize: 12
      },
      itemGap: 20
    },
    series: [{
      name: '内存层级',
      type: 'sunburst',
      center: ['50%', '48%'],
      radius: ['15%', '85%'],
      sort: null,
      emphasis: {
        focus: 'ancestor'
      },
      levels: [
        {},
        {
          r0: '15%',
          r: '40%',
          itemStyle: {
            borderWidth: 2,
            borderColor: bg2
          },
          label: {
            rotate: 0,
            fontSize: 12,
            fontWeight: 600,
            color: '#fff'
          }
        },
        {
          r0: '40%',
          r: '70%',
          itemStyle: {
            borderWidth: 2,
            borderColor: bg2
          },
          label: {
            fontSize: 11,
            color: '#fff'
          }
        },
        {
          r0: '70%',
          r: '85%',
          itemStyle: {
            borderWidth: 1,
            borderColor: bg2
          },
          label: {
            position: 'outside',
            padding: 3,
            silent: false,
            fontSize: 11,
            color: ink
          }
        }
      ],
      data: [
        {
          name: 'Spark 内存池 (4735 MB)',
          value: 4735,
          itemStyle: { color: accent },
          children: [
            {
              name: '执行内存 (2368 MB)',
              value: 2368,
              itemStyle: { color: '#3b82f6' },
              children: [
                { name: 'Shuffle', value: 947, itemStyle: { color: '#60a5fa' } },
                { name: 'Join/Sort', value: 710, itemStyle: { color: '#93c5fd' } },
                { name: 'Aggregation', value: 474, itemStyle: { color: '#bfdbfe' } },
                { name: '其他计算', value: 237, itemStyle: { color: '#dbeafe' } }
              ]
            },
            {
              name: '存储内存 (2367 MB)',
              value: 2367,
              itemStyle: { color: accent2 },
              children: [
                { name: 'RDD 缓存', value: 1184, itemStyle: { color: '#fbbf24' } },
                { name: '广播变量', value: 592, itemStyle: { color: '#fcd34d' } },
                { name: '展开内存', value: 355, itemStyle: { color: '#fde68a' } },
                { name: '空闲', value: 236, itemStyle: { color: '#fef3c7' } }
              ]
            }
          ]
        },
        {
          name: '用户内存 (3157 MB)',
          value: 3157,
          itemStyle: { color: accent3 },
          children: [
            {
              name: '用户数据结构',
              value: 1579,
              itemStyle: { color: '#34d399' }
            },
            {
              name: '内部元数据',
              value: 1052,
              itemStyle: { color: '#6ee7b7' }
            },
            {
              name: '其他开销',
              value: 526,
              itemStyle: { color: '#a7f3d0' }
            }
          ]
        },
        {
          name: '系统预留 (300 MB)',
          value: 300,
          itemStyle: { color: muted },
          children: [
            {
              name: '运行时对象',
              value: 180,
              itemStyle: { color: '#9ca3af' }
            },
            {
              name: '安全缓冲',
              value: 120,
              itemStyle: { color: '#d1d5db' }
            }
          ]
        }
      ]
    }]
  });

  // Resize listeners
  window.addEventListener('resize', function() {
    chart1.resize();
    chart2.resize();
  });
})();
