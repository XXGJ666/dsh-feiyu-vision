import { writeFileSync } from 'node:fs'
/**
 * dsh-feiyu-vision — 看图插件（智谱 GLM-4V-Flash）
 * 注册 see_image 工具；核心逻辑在 src/core.js，可被 QQ 通道补丁直接 import。
 */
// dsh-tools 在 pnpm 安装布局下解析不到；defineTool 本身只是包装，本地兜底成恒等函数
let defineTool = (spec) => spec
try { const m = await import('@deepseek-ai/dsh-tools'); if (typeof m.defineTool === 'function') defineTool = m.defineTool } catch { /* 兜底 */ }
import { describeFast, describeImage, identifyImage, traceAnime, DEFAULTS } from './src/core.js'

export { describeFast, describeImage, identifyImage, traceAnime } from './src/core.js'

export const name = 'dsh-feiyu-vision'
export const inject = ['tools', 'webServer']

export function apply(ctx, pluginConfig) {
  const config = { ...DEFAULTS, ...(pluginConfig || {}) }
  const CONFIG_PATH = 'D:\\dshchajian\\vision-config.json'
  // 独立网页面板
  const page = (res) => {
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>识图设置</title>
<style>body{font:13px/1.75 system-ui;color:#e8e8ef;background:#17171d;padding:18px}h1{font-size:16px;margin:0 0 4px}.note{opacity:.65;font-size:12px;line-height:1.75}.card{border:1px solid #ffffff22;border-radius:10px;padding:10px 12px;margin:9px 0;line-height:1.75}.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0}input{background:transparent;border:1px solid #ffffff33;border-radius:8px;color:inherit;padding:3px 7px;flex:1;min-width:200px;font-size:12px}button{border:1px solid #ffffff33;background:transparent;color:inherit;border-radius:8px;padding:3px 9px;cursor:pointer;font-size:12px}.ok{color:#6dd48a}.bad{color:#ff8f8f}</style></head><body>
<h1>识图</h1><div class="note">豆包认人、智谱补描述、SauceNAO 反查原图。</div>
<div class="card" id="st">读取中…</div>
<div class="card"><b>换 Key（留空不改）</b>
<div class="row">豆包 <input id="ark" placeholder="ark-..."></div>
<div class="row">智谱 <input id="zhipu" placeholder="..."></div>
<div class="row">Sauce <input id="sauce" placeholder="..."></div>
<div class="row">ffmpeg <input id="ffmpeg" placeholder="ffmpeg.exe 的完整路径"></div>
<div class="row"><button onclick="save()">保存</button><button onclick="load()">刷新</button><span class="note" id="msg"></span></div></div>
<div class="card"><b>怎么获取 API Key</b>
<div class="note">豆包（火山方舟）：打开 console.volcengine.com → 登录 → 「方舟」→ API Key 管理 → 创建；模型名填 doubao-seed-evolving</div>
<div class="note">智谱：打开 open.bigmodel.cn → 注册/登录 → 右上「API Keys」→ 新建；模型名填 glm-4.5v（有免费额度）</div>
<div class="note">SauceNAO（可选，反查动漫原图）：saucenao.com → 注册 → 登录后进 Account → API 一栏复制 key</div>
<div class="note">ffmpeg（GIF/WebP 图需要）：下载 Windows 版 https://www.gyan.dev/ffmpeg/builds/（选 ffmpeg-release-essentials.zip），解压到任意目录，例如 D:\tools\ffmpeg</div>
<div class="note">解压后找到 bin\ffmpeg.exe，把它的完整路径（如 D:\tools\ffmpeg\bin\ffmpeg.exe）填到上面 ffmpeg 那一行</div>
<div class="note">验证：按 Win+R 输入 cmd 回车，运行 你的路径\ffmpeg.exe -version，能打印版本号就说明可用</div>
<div class="note">全部填完点「保存」→ 完全退出 DSH 再打开 → 回到这页，顶部应该全是「已配置」</div></div>
<script>
async function load(){const j=await (await fetch('/dsh-feiyu-vision/state')).json();const ok=b=>b?'<span class="ok">已配置</span>':'<span class="bad">未配置</span>';document.getElementById('ffmpeg').value=j.ffmpeg||'';document.getElementById('st').innerHTML='<div class="row">豆包 '+ok(j.hasArk)+' <span class="note">'+j.arkModel+' / '+j.arkModelLite+'</span></div><div class="row">智谱 '+ok(j.hasZhipu)+' <span class="note">'+j.zhipuModel+'</span></div><div class="row">SauceNAO '+ok(j.hasSauce)+'</div><div class="row note" style="word-break:break-all">ffmpeg: '+(j.ffmpeg||'')+'</div>'}
async function save(){const b={};for(const k of ['ark','zhipu','sauce']){const v=document.getElementById(k).value.trim();if(v)b[k==='ark'?'arkApiKey':k==='zhipu'?'zhipuApiKey':'sauceApiKey']=v}await fetch('/dsh-feiyu-vision/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});await fetch('/dsh-feiyu-vision/config',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ffmpeg:document.getElementById('ffmpeg').value.trim()})});document.getElementById('msg').textContent='已保存，重启 DSH 后生效';load()}
load();
</script><div style="opacity:.45;font-size:11px;margin-top:16px">© 2026 <a href="https://github.com/ShirasuAzusa_XXGJ" target="_blank" rel="noreferrer" style="color:#5aa9ff">ShirasuAzusa_XXGJ</a> · <a href="https://github.com/ShirasuAzusa_XXGJ/dsh-feiyu-vision" target="_blank" rel="noreferrer" style="color:#5aa9ff">dsh-feiyu-vision</a> · MIT</div></body></html>`
    res.statusCode = 200
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(html)
  }
  try { ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/dsh-feiyu-vision', handler: async (req, res) => page(res) })) } catch { /* 忽略 */ }

  try {
    const json = (res, obj) => { res.statusCode = 200; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)) }
    const body = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => { b += c }); req.on('end', () => { try { resolve(JSON.parse(b || '{}')) } catch { resolve({}) } }) })
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/dsh-feiyu-vision/state', handler: async (req, res) => {
      json(res, { arkModel: config.arkModel, arkModelLite: config.arkModelLite, zhipuModel: config.zhipuModel,
        hasArk: String(config.arkApiKey || '').trim() !== '', hasZhipu: String(config.zhipuApiKey || '').trim() !== '',
        hasSauce: String(config.sauceApiKey || '').trim() !== '', ffmpeg: config.ffmpeg })
    } }))
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/dsh-feiyu-vision/config', handler: async (req, res) => {
      if (req.method === 'POST') {
        const b = await body(req)
        for (const k of ['arkApiKey','zhipuApiKey','sauceApiKey','arkModel','arkModelLite','zhipuModel','ffmpeg']) {
          if (typeof b[k] === 'string' && b[k] !== '') config[k] = b[k]
        }
        try { const fsx = await import('node:fs'); fsx.writeFileSync(CONFIG_PATH, JSON.stringify({
          arkApiKey: config.arkApiKey, arkModel: config.arkModel, arkModelLite: config.arkModelLite,
          zhipuApiKey: config.zhipuApiKey, zhipuModel: config.zhipuModel, sauceApiKey: config.sauceApiKey, ffmpeg: config.ffmpeg }, null, 2), 'utf8') } catch { /* 忽略 */ }
        json(res, { ok: true })
        return
      }
      json(res, { ok: true })
    } }))
  } catch { /* 忽略 */ }
  const register = () => ctx.tools.register(defineTool({
    name: 'see_image',
    description: '看一张图片并描述内容（支持本地路径或 http(s) 链接）。用于理解用户发的图、表情包、截图里的文字。',
    parameters: {
      path: { type: 'string', description: '本地图片绝对路径（与 imageUrl 二选一）' },
      imageUrl: { type: 'string', description: '图片 http(s) 链接（与 path 二选一）' },
      question: { type: 'string', description: '想问关于这张图的问题，默认让模型描述内容' },
    },
    output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: String(value.text ?? '') }] },
    async execute(args) {
      const p = String(args.path ?? '').trim()
      const url = String(args.imageUrl ?? '').trim()
      let file = p
      if (!file && url) {
        const r = await fetch(url, { signal: AbortSignal.timeout(30000) })
        if (!r.ok)
          throw new Error('下载图片失败: ' + r.status)
        const { mkdirSync, writeFileSync } = await import('node:fs')
        const { join } = await import('node:path')
        const { tmpdir } = await import('node:os')
        const dir = join(tmpdir(), 'dsh-feiyu-vision')
        mkdirSync(dir, { recursive: true })
        file = join(dir, 'url-' + Date.now() + '.bin')
        writeFileSync(file, Buffer.from(await r.arrayBuffer()))
      }
      if (!file)
        return { text: '请给我图片路径或链接（path / imageUrl 二选一）' }
      try {
        // 动漫截图先用 trace.moe 精确比对（命中就是作品名+角色）
        try {
          const hit = await traceAnime(file, config)
          if (hit !== undefined) {
            const who = hit.characters.length > 0 ? '（' + hit.characters.slice(0, 3).join('、') + '）' : ''
            return { text: '《' + hit.title + '》' + who }
          }
        }
        catch { /* trace 失败就退回视觉模型 */ }
        const q = String(args.question ?? '')
        // 先尝试认人（豆包 evolving），认不出再退回描述
        try {
          const who = await identifyImage(file, config)
          if (who !== undefined)
            return { text: who.text }
        }
        catch { /* 认人失败 → 描述 */ }
        const question = q !== '' ? q : '用一句简短中文描述这张图；有文字就读出来。'
        const desc = await describeFast(file, question, config)
        return { text: '不确定这是谁（画面：' + desc + '）' }
      }
      catch (e) {
        return { text: '看图失败：' + (e instanceof Error ? e.message : String(e)) }
      }
    },
  }))
  try {
    register()
  }
  catch (e) {
    console.error('[dsh-feiyu-vision] 工具注册失败：' + (e instanceof Error ? e.message : String(e)))
  }
}
