/**
 * dsh-feiyu-vision · 侧边栏图标 + 主窗口内嵌完整面板
 */
window.__ModuleLoader__.load({
  id: 'dsh-feiyu-vision',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block', marginLeft: '-1px' } }, h('path', { d: 'M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z' }), h('circle', { cx: 12, cy: 12, r: 2.7 }))

    const Panel = () => h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#17171d' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', borderBottom: '1px solid #ffffff16', color: '#ddd', fontSize: '13px', lineHeight: 1.7 } },
        h('b', { style: { fontWeight: 600 } }, '识图'),
        h('span', { style: { opacity: 0.55, fontSize: '12px', marginLeft: '4px' } }, '模型与 Key 配置在下面')),
      h('iframe', { src: '/dsh-feiyu-vision', title: '识图', style: { flex: 1, width: '100%', border: 'none', background: '#17171d' } }))

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'dsh-feiyu-vision',
          order: 96,
          label: () => h('span', { style: { fontSize: '14px', fontWeight: 400 } }, '识图'),
        }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-feiyu-vision' }, Panel))
      },
    }
  },
})
