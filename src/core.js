/**
 * dsh-feiyu-vision · © 2026 ShirasuAzusa_XXGJ
 * https://github.com/ShirasuAzusa_XXGJ/dsh-feiyu-vision
 * MIT License —— 转载/修改请保留本版权声明与仓库地址。
 */
/**
 * dsh-feiyu-vision 核心：图片预处理 + 多模型识图/认人（不依赖 DSH）
 * 配置：D:\\dshchajian\\vision-config.json（也可环境变量）
 */
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export const CONFIG_FILE = process.env.DSH_VISION_CONFIG || ''

function loadFileConfig() {
  try { return CONFIG_FILE === '' ? {} : JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) }
  catch { return {} }
}

export const DEFAULTS = {
  arkEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/responses',
  arkApiKey: '',
  arkModel: 'doubao-seed-evolving',
  arkModelLite: 'doubao-seed-2-1-lite-260915',
  zhipuEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  zhipuApiKey: '',
  zhipuModel: 'glm-4.5v',
  model: 'glm-4.5v',
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  sauceApiKey: '',
  maxSide: 2048,
  timeoutMs: 60000,
  ffmpeg: '',
}
try { Object.assign(DEFAULTS, loadFileConfig()) } catch { /* 忽略 */ }

function sniffMime(buf) {
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf.length > 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf.length > 12 && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return ''
}

function normalizeImage(filePath, conf = DEFAULTS) {
  let buf = readFileSync(filePath)
  let mime = sniffMime(buf)
  const needConvert = mime === 'image/gif' || mime === 'image/webp' || mime === ''
  if (!needConvert && buf.length <= 4 * 1024 * 1024)
    return { data: buf.toString('base64'), mime }
  const outDir = join(tmpdir(), 'dsh-feiyu-vision')
  mkdirSync(outDir, { recursive: true })
  const out = join(outDir, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.png')
  const side = String(Number(conf.maxSide) > 0 ? Number(conf.maxSide) : DEFAULTS.maxSide)
  execFileSync(conf.ffmpeg || DEFAULTS.ffmpeg, ['-y', '-loglevel', 'error', '-i', filePath, '-frames:v', '1',
    '-vf', "scale='min(" + side + ",iw)':'min(" + side + ",ih)':force_original_aspect_ratio=decrease", out],
    { timeout: 30000, windowsHide: true })
  buf = readFileSync(out)
  return { data: buf.toString('base64'), mime: 'image/png' }
}

function dataUri(filePath, conf) {
  const img = normalizeImage(filePath, conf)
  return 'data:' + img.mime + ';base64,' + img.data
}

/** 智谱兼容接口（OpenAI 风格） */
export async function describeImage(filePath, options = {}) {
  const conf = { ...DEFAULTS, ...(options || {}) }
  const key = String(conf.apiKey ?? conf.zhipuApiKey ?? process.env.ZHIPU_API_KEY ?? '').trim()
  if (!key) throw new Error('dsh-feiyu-vision: 缺少 API Key（zhipuApiKey / apiKey）')
  if (!filePath || !statSync(filePath).isFile()) throw new Error('dsh-feiyu-vision: 图片不存在 ' + String(filePath))
  const question = String(conf.question ?? '用一句简短中文描述这张图；有文字就读出来。')
  const body = {
    model: String(conf.model ?? DEFAULTS.model),
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: dataUri(filePath, conf) } },
      { type: 'text', text: question },
    ] }],
  }
  const resp = await fetch(String(conf.endpoint ?? DEFAULTS.endpoint), {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(conf.timeoutMs) > 0 ? Number(conf.timeoutMs) : DEFAULTS.timeoutMs),
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error('智谱接口错误 ' + resp.status + ' ' + text.slice(0, 200))
  const j = JSON.parse(text)
  const out = j?.choices?.[0]?.message?.content
  if (typeof out !== 'string' || out.trim() === '') throw new Error('智谱没有返回内容')
  return out.trim()
}

/** 火山方舟 responses 接口（豆包） */
export async function askArk(filePath, question, conf = DEFAULTS) {
  const key = String(conf.arkApiKey ?? process.env.ARK_API_KEY ?? '').trim()
  if (!key) throw new Error('dsh-feiyu-vision: 缺火山方舟 Key（arkApiKey）')
  const body = {
    model: String(conf.arkModel ?? DEFAULTS.arkModel),
    input: [{ role: 'user', content: [
      { type: 'input_image', image_url: dataUri(filePath, conf) },
      { type: 'input_text', text: question },
    ] }],
    max_output_tokens: Number(conf.arkMaxTokens) > 0 ? Number(conf.arkMaxTokens) : 600,
    thinking: { type: 'disabled' },
  }
  const resp = await fetch(String(conf.arkEndpoint ?? DEFAULTS.arkEndpoint), {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(conf.timeoutMs) > 0 ? Number(conf.timeoutMs) : 120000),
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error('豆包接口错误 ' + resp.status + ' ' + text.slice(0, 200))
  const j = JSON.parse(text)
  const msg = (j.output ?? []).filter((o) => o.type === 'message')
  const out = msg.flatMap((o) => (o.content ?? []).map((c) => c.text ?? '')).join('').trim()
  if (out === '') throw new Error('豆包没有返回内容')
  return out
}

function stripReasoning(t) {
  return String(t ?? '').replace(/^.*?用户现在需要[^。]*。/s, '').replace(/^\s+/, '').trim()
}

/** 快速描述：优先智谱（输出干净），否则豆包 lite */
export async function describeFast(filePath, question, conf = DEFAULTS) {
  const q = question || '只输出一句画面描述：画的是什么、什么颜色、有没有文字。不要解释、不要思考过程。'
  const zKey = String(conf.zhipuApiKey ?? conf.apiKey ?? '').trim()
  if (zKey !== '') {
    try { return stripReasoning(await describeImage(filePath, { ...conf, apiKey: zKey, model: conf.zhipuModel, question: q })) }
    catch { /* 退豆包 */ }
  }
  const lite = String(conf.arkModelLite ?? '').trim()
  if (lite !== '' && String(conf.arkApiKey ?? '').trim() !== '') {
    try { return stripReasoning(await askArk(filePath, q, { ...conf, arkModel: lite })) }
    catch { /* 忽略 */ }
  }
  return describeImage(filePath, { ...conf, question: q })
}

/** SauceNAO 反查（动漫插画） */
export async function sauceSearch(filePath, conf = DEFAULTS) {
  const key = String(conf.sauceApiKey ?? process.env.SAUCENAO_API_KEY ?? '').trim()
  if (key === '') return undefined
  const buf = readFileSync(filePath)
  const form = new FormData()
  form.append('file', new Blob([buf]), 'image.jpg')
  form.append('output_type', '2')
  form.append('api_key', key)
  form.append('db', '999')
  form.append('numres', '3')
  form.append('minsim', '60')
  const resp = await fetch('https://saucenao.com/search.php', { method: 'POST', body: form, signal: AbortSignal.timeout(60000) })
  const text = await resp.text()
  if (!resp.ok) throw new Error('SauceNAO 错误 ' + resp.status)
  const json = JSON.parse(text)
  const results = json?.results ?? []
  if (results.length === 0) return undefined
  const best = results[0]
  const sim = Number(best?.header?.similarity ?? 0)
  if (sim < 60) return undefined
  const d = best?.data ?? {}
  const clean = (v) => (Array.isArray(v) ? v : (typeof v === 'string' ? [v] : [])).map((x) => String(x ?? '').trim()).filter(Boolean)
  return {
    title: String(d.material ?? '') || String(d.title ?? '') || String(d.part ?? '') || '',
    characters: clean(d.characters).slice(0, 4),
    creator: clean(d.creator)[0] ?? '',
    similarity: sim,
    urls: clean(d.ext_urls).slice(0, 2),
  }
}

/** 认角色：SauceNAO → 豆包 → 智谱，结果交叉核对，不确定就返回 undefined */
export async function identifyImage(filePath, conf = DEFAULTS) {
  try {
    const s = await sauceSearch(filePath, conf)
    if (s !== undefined) {
      const parts = []
      if (s.title !== '') parts.push('《' + s.title + '》')
      if (s.characters.length > 0) parts.push('角色：' + s.characters.join('、'))
      if (s.creator !== '') parts.push('画师：' + s.creator)
      if (parts.length > 0) return { text: parts.join('；'), confident: true, source: 'saucenao' }
    }
  } catch { /* 继续用模型 */ }
  const askA = '这是哪部作品（动漫/游戏/插画）？如果认得，用一句话回答：作品名 + 角色名；认不出就只回答「不确定」。不要解释，不要列候选。'
  const askB = '这是哪部作品的角色？说出你能确定的作品名和角色名，一句话；不确定就只回答「不确定」。'
  const bad = (s) => s === '' || /不确定|不认识|unknown|not sure/i.test(s)
  const answers = []
  try { answers.push(String(await askArk(filePath, askA, conf)).trim()) } catch { /* 忽略 */ }
  if (String(conf.zhipuApiKey ?? '').trim() !== '') {
    try { answers.push(String(await describeImage(filePath, { ...conf, apiKey: conf.zhipuApiKey, model: conf.zhipuModel, question: askB })).trim()) } catch { /* 忽略 */ }
  }
  const good = answers.filter((s) => !bad(s))
  if (good.length === 0) return undefined
  const title = (s) => {
    const m = s.match(/《([^》]+)》/)
    if (m !== null) return m[1].trim()
    if (/蔚蓝档案|blue archive/i.test(s)) return '蔚蓝档案'
    return ''
  }
  const titles = good.map(title).filter((t) => t !== '')
  if (titles.length > 0) {
    const t = titles[0]
    if (titles.length >= 2 && titles[0] !== titles[1]) return { text: '《' + t + '》（具体角色不确定）', confident: true }
    if (good.length >= 2) {
      const chars = (s) => (s.match(/[\u4e00-\u9fff]{2,6}/g) ?? []).filter((w) => !/蔚蓝档案|角色|作品|两个|这|不|确|定/.test(w))
      const c0 = new Set(chars(good[0])); const c1 = new Set(chars(good[1]))
      if (![...c0].some((w) => c1.has(w))) return { text: '《' + t + '》（角色名我不确定）', confident: true }
    }
    return { text: stripReasoning(good[0]).split('\n')[0], confident: true }
  }
  return { text: stripReasoning(good[0]).split('\n')[0], confident: true }
}

/** 动漫截图识别（trace.moe） */
export async function traceAnime(filePath, conf = DEFAULTS) {
  const buf = readFileSync(filePath)
  const form = new FormData()
  form.append('image', new Blob([buf]), 'a.jpg')
  const resp = await fetch('https://api.trace.moe/search?anilistInfo=1&cutBorders=1', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) })
  const text = await resp.text()
  if (!resp.ok) throw new Error('trace.moe 错误 ' + resp.status)
  const json = JSON.parse(text)
  const hit = json?.result?.[0]
  if (!hit) return undefined
  const sim = Number(hit.similarity ?? 0)
  if (sim < 0.85) return undefined
  const anilist = hit.anilist ?? {}
  return {
    similarity: sim,
    title: anilist.title?.native ?? anilist.title?.romaji ?? anilist.title?.english ?? '',
    characters: (anilist.characters ?? []).map((c) => c?.name?.full ?? c?.name?.native ?? '').filter(Boolean),
    episode: hit.episode ?? null,
  }
}
