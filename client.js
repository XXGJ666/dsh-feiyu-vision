/**
 * dsh-feiyu-vision · 侧边栏图标 + 原生透明面板
 * © 2026 ShirasuAzusa_XXGJ · https://github.com/ShirasuAzusa_XXGJ/dsh-feiyu-vision
 */
window.__ModuleLoader__.load({
  id: 'dsh-feiyu-vision',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const css = `
      [data-fv]{padding:16px;font-size:13px;line-height:1.75;color:var(--fg,#ddd);display:flex;flex-direction:column;gap:10px;background:transparent}
      [data-fv] .fv-h{font-size:15px;font-weight:600}
      [data-fv] .fv-note{opacity:.6;font-size:12px}
      [data-fv] .fv-card{border:1px solid #ffffff24;border-radius:10px;padding:10px 12px;background:transparent}
      [data-fv] .fv-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0}
      [data-fv] .fv-row>span:first-child{min-width:86px}
      [data-fv] input{background:rgba(0,0,0,.28);border:1px solid #ffffff2e;border-radius:8px;color:inherit;padding:3px 8px;font-size:12px;flex:1;min-width:200px}
      [data-fv] button{border:1px solid #ffffff33;background:transparent;color:inherit;border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer}
      [data-fv] a{color:#5aa9ff}
      [data-fv] .ok{color:#6dd48a}
      [data-fv] .bad{color:#ff8f8f}
    `
    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block', marginLeft: '-1px' } }, h('path', { d: 'M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z' }), h('circle', { cx: 12, cy: 12, r: 2.7 }))
    function Panel() {
      const [d, setD] = React.useState(null)
      const [msg, setMsg] = React.useState('')
      const [ark, setArk] = React.useState('')
      const [zhipu, setZhipu] = React.useState('')
      const [sauce, setSauce] = React.useState('')
      const [ffmpeg, setFfmpeg] = React.useState('')
      const load = async () => {
        try {
          const j = await (await fetch('/dsh-feiyu-vision/state', { headers: { accept: 'application/json' } })).json()
          setD(j); setFfmpeg(j.ffmpeg || '')
        } catch { setMsg('读不到数据') }
      }
      React.useEffect(() => { load() }, [])
      const save = async () => {
        const body = {}
        if (ark.trim()) body.arkApiKey = ark.trim()
        if (zhipu.trim()) body.zhipuApiKey = zhipu.trim()
        if (sauce.trim()) body.sauceApiKey = sauce.trim()
        if (ffmpeg.trim() !== (d && d.ffmpeg ? d.ffmpeg : '')) body.ffmpeg = ffmpeg.trim()
        try { await fetch('/dsh-feiyu-vision/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); setMsg('已保存，重启 DSH 后生效'); load() } catch { setMsg('保存失败') }
      }
      const ok = (b) => h('span', { className: b ? 'ok' : 'bad' }, b ? '已配置' : '未配置')
      const st = d
      return h('div', { 'data-fv': '' },
        h('div', { className: 'fv-h' }, '识图'),
        h('div', { className: 'fv-note' }, '豆包认人、智谱补描述、SauceNAO 反查原图；GIF/WebP 需要 ffmpeg 转 png。'),
        h('div', { className: 'fv-card' },
          st ? h('div', null,
            h('div', { className: 'fv-row' }, h('span', null, '豆包'), ok(st.hasArk), h('span', { className: 'fv-note' }, String(st.arkModel || '') + ' / ' + String(st.arkModelLite || ''))),
            h('div', { className: 'fv-row' }, h('span', null, '智谱'), ok(st.hasZhipu), h('span', { className: 'fv-note' }, String(st.zhipuModel || ''))),
            h('div', { className: 'fv-row' }, h('span', null, 'SauceNAO'), ok(st.hasSauce)),
            h('div', { className: 'fv-row' }, h('span', null, 'ffmpeg'), h('span', { className: 'fv-note', style: { wordBreak: 'break-all' } }, String(st.ffmpeg || '未填'))),
          ) : h('div', { className: 'fv-note' }, '读取中…')),
        h('div', { className: 'fv-card' },
          h('div', { className: 'fv-h' }, '填 Key / 路径'),
          h('div', { className: 'fv-row' }, h('span', null, '豆包 Key'), h('input', { value: ark, placeholder: '留空不改', onChange: (e) => setArk(e.target.value) })),
          h('div', { className: 'fv-row' }, h('span', null, '智谱 Key'), h('input', { value: zhipu, placeholder: '留空不改', onChange: (e) => setZhipu(e.target.value) })),
          h('div', { className: 'fv-row' }, h('span', null, 'Sauce Key'), h('input', { value: sauce, placeholder: '可选，留空不改', onChange: (e) => setSauce(e.target.value) })),
          h('div', { className: 'fv-row' }, h('span', null, 'ffmpeg'), h('input', { value: ffmpeg, placeholder: 'ffmpeg.exe 完整路径', onChange: (e) => setFfmpeg(e.target.value) })),
          h('div', { className: 'fv-row' }, h('button', { onClick: save }, '保存'), h('button', { onClick: load }, '刷新'), h('span', { className: 'fv-note' }, msg))),
        h('div', { className: 'fv-card' },
          h('div', { className: 'fv-h' }, '怎么获取 API Key'),
          h('div', { className: 'fv-note' }, '豆包（火山方舟）：console.volcengine.com → 方舟 → API Key 管理 → 创建；模型 doubao-seed-evolving'),
          h('div', { className: 'fv-note' }, '智谱：open.bigmodel.cn → API Keys → 新建；模型 glm-4.5v（有免费额度）'),
          h('div', { className: 'fv-note' }, 'SauceNAO（可选）：saucenao.com → 注册 → Account 页复制 key'),
          h('div', { className: 'fv-note' }, 'ffmpeg：https://www.gyan.dev/ffmpeg/builds/ 下载 essentials.zip，解压后找到 bin\\ffmpeg.exe，把完整路径填上'),
          h('div', { className: 'fv-note' }, '全部填完点保存 → 完全退出 DSH 再打开 → 回来这里应该全是「已配置」')),
        h('div', { className: 'fv-note', style: { marginTop: '10px' } }, '© 2026 ', h('a', { href: 'https://github.com/ShirasuAzusa_XXGJ', target: '_blank', rel: 'noreferrer' }, 'ShirasuAzusa_XXGJ'), ' · ', h('a', { href: 'https://github.com/ShirasuAzusa_XXGJ/dsh-feiyu-vision', target: '_blank', rel: 'noreferrer' }, 'dsh-feiyu-vision'), ' · MIT'))
    }
    return {
      inject: ['slots'],
      apply(ctx) {
        const style = document.createElement('style'); style.setAttribute('data-plugin-css', 'dsh-feiyu-vision'); style.textContent = css; document.head.appendChild(style)
        ctx.effect(() => () => style.remove(), 'vision css')
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-feiyu-vision', order: 96, label: () => h('span', { style: { fontSize: '14px' } }, '识图') }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-feiyu-vision' }, Panel))
      },
    }
  },
})
