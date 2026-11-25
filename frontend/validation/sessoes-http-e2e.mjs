import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const base = process.env.RPG_HTTP_VALIDATION_URL || 'http://127.0.0.1:18080'
if (!/^http:\/\/(127\.0\.0\.1|localhost):18080$/.test(base)) throw new Error('Validação permitida somente no backend temporário localhost:18080')
const container = 'rpg-sessoes-validacao-20261125'
const schema = 'narrativa_validacao'
const mysql = sql => execFileSync('docker', ['exec', container, 'mysql', '-uroot', '-pnarrativa-test-local', '--batch', '--skip-column-names', schema, '-e', sql], { encoding: 'utf8' }).trim()
if (mysql('SELECT DATABASE()') !== schema) throw new Error('Schema temporário não confirmado')
const suffix = Date.now().toString(36)
const email = `sessoes-${suffix}@example.test`
const senha = `Fixture-${suffix}-123`
const authorization = `Basic ${Buffer.from(`${email}:${senha}`).toString('base64')}`
const output = new URL('./sessoes-http/', import.meta.url)
await mkdir(output, { recursive: true })
const results = []
async function api(path, method = 'GET', body, authenticated = true) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: authorization } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const content = await response.text()
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}: ${content}`)
  return content ? JSON.parse(content) : null
}
const user = await api('/api/auth/register', 'POST', { nome: 'Guardião fictício HTTP', username: `sessoes-${suffix}`, email, senha, confirmarSenha: senha }, false)
if (!Number.isSafeInteger(user.id)) throw new Error('Identificador de fixture inválido')
mysql(`UPDATE usuarios SET email_verificado=1,email_verificado_em=CURRENT_TIMESTAMP WHERE id=${user.id}`)
const campaign = await api('/api/campanhas', 'POST', { nome: `Arquivo HTTP ${suffix}`, descricao: 'Campanha fictícia isolada para validação de sessões.', sistema: 'COC' })
const sheet = { atributos: { forca: 50, destreza: 60, constituicao: 50, inteligencia: 70, presenca: 50, vontade: 60 }, vidaAtual: 7, vidaMaxima: 10, sanidade: 2, esquiva: 30, sorte: 50, pericias: [], armas: [], rituais: [], retratoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=' }
const pc = await api('/api/personagens/coc', 'POST', { campanhaId: campaign.id, nome: 'Eleanor HTTP', status: 'ATIVO', dadosFichaJson: sheet })
const npc = await api(`/api/campanhas/${campaign.id}/acompanhamento/npcs`, 'POST', { nome: 'Margaret HTTP', imageUrl: sheet.retratoUrl, dadosFichaJson: { ...sheet, profissao: 'Bibliotecária' } })
results.push({ fixture: { userId: user.id, campaignId: campaign.id, pcId: pc.id, npcId: npc.id, container, schema }, mode: 'HTTP real sem interceptação de API; somente backend e MySQL temporários' })

const profile = `/tmp/rpg-sessoes-http-chrome-${Date.now()}`
const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
let stderr = ''
chrome.stderr.on('data', chunk => { stderr += chunk })
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
let endpoint
for (let attempt = 0; attempt < 100; attempt++) {
  try { endpoint = `http://127.0.0.1:${(await readFile(`${profile}/DevToolsActivePort`, 'utf8')).split('\n')[0]}`; break }
  catch { await delay(100) }
}
if (!endpoint) { chrome.kill(); throw new Error(`Chrome unavailable: ${stderr.slice(-1000)}`) }
const target = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' }).then(response => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let nextId = 0
const pending = new Map()
const runtimeErrors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) { const request = pending.get(message.id); pending.delete(message.id); message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result) }
  if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails)
})
function cdp(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
async function assert(expression, label) {
  if (!await evaluate(expression)) throw new Error(`Assertion failed: ${label}`)
  results.push({ label, passed: true })
}
async function button(label, index = 0) {
  await evaluate(`(() => {const matches=[...document.querySelectorAll('button')].filter(item=>item.textContent.trim()===${JSON.stringify(label)});const element=matches[${index}]??matches.at(-1);if(!element)throw new Error('Missing button '+${JSON.stringify(label)});element.click()})()`)
  await delay(650)
}
async function fill(selector, value) {
  await evaluate(`(() => {const element=document.querySelector(${JSON.stringify(selector)});if(!element)throw new Error('Missing field '+${JSON.stringify(selector)});const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await delay(100)
}
async function field(label, value) {
  await evaluate(`(() => {const label=[...document.querySelectorAll('.narrative-dialog label')].find(item=>item.firstChild?.textContent?.trim().startsWith(${JSON.stringify(label)}));const element=label?.querySelector('input,textarea');if(!element)throw new Error('Missing label '+${JSON.stringify(label)});element.dataset.validation='current'})()`)
  await fill('[data-validation="current"]', value)
  await evaluate(`delete document.querySelector('[data-validation="current"]').dataset.validation`)
}
async function screenshot(name, width = 1440, height = 1000) {
  if (await evaluate('!!document.querySelector(".notification-toast")')) await delay(4300)
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 }); await delay(250)
  const metrics = await evaluate('({width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})')
  const image = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(metrics.height, 2500), scale: 1 } })
  await writeFile(new URL(`${name}.png`, output), Buffer.from(image.data, 'base64'))
  results.push({ screenshot: name, ...metrics })
  if (metrics.documentWidth > width) throw new Error(`Horizontal overflow: ${name}`)
}
try {
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await cdp('Page.navigate', { url: base }); await delay(1000)
  await fill('input[type="email"]', email); await fill('input[type="password"]', senha); await button('Entrar')
  await button('Abrir campanha'); await button('Sessões')
  await assert(`!document.querySelector('.narrative-error')`, 'API real carrega módulo sem erros')
  await button('Nova sessão')
  await assert(`document.querySelectorAll('.narrative-dialog [required]').length===0`, 'Sessão permite salvar formulário vazio')
  await assert(`document.querySelector('.narrative-dialog').textContent.includes('Eleanor HTTP')&&document.querySelector('.narrative-dialog').textContent.includes('Margaret HTTP')`, 'Seletores carregam PC e NPC reais')
  await button('Salvar')
  await assert(`document.querySelector('.narrative-header')?.textContent.includes('Sessão sem título')`, 'Criação vazia abre sessão com identificação legível')
  const sessions = await api(`/api/campanhas/${campaign.id}/narrativa/sessoes`)
  const session = sessions[0]
  if (sessions.length !== 1 || session.numero !== null || session.participantes.length || session.npcs.length) throw new Error('Sessão vazia foi preenchida indevidamente')
  if (['dataReal', 'dataNarrativa', 'inicio', 'fim'].some(key => key in session)) throw new Error('API retornou campos de datas removidos da sessão')
  results.push({ label: 'API persiste sessão vazia sem número automático, participantes ou datas', passed: true })
  await screenshot('01-sessao-vazia-http')
  await button('Editar'); await field('Título', 'Investigação HTTP real')
  await evaluate(`document.querySelectorAll('.narrative-dialog input[type="checkbox"]').forEach(item=>item.click())`)
  await button('Salvar'); await button('Eventos'); await button('Criar evento')
  await field('Título', 'A carta do farol HTTP'); await field('Data ou horário narrativo', 'Meia-noite fictícia'); await button('Salvar')
  await button('Iniciar sessão')
  await assert(`document.querySelectorAll('.narrative-live .gm-character-card').length===1&&document.querySelector('.narrative-live').textContent.includes('Margaret HTTP')`, 'Mesa usa fichas existentes PC e NPC da campanha')
  await fill('.narrative-live textarea', 'A carta foi encontrada durante a investigação HTTP.'); await button('Salvar anotação')
  await button('Realizado')
  await screenshot('02-mesa-http-desktop')
  await screenshot('03-mesa-http-mobile', 390, 844)
  await button('Encerrar e revisar'); await screenshot('04-revisao-http', 1440, 1000)
  await button('Confirmar encerramento')
  await assert(`document.querySelector('.narrative-header').textContent.includes('Concluída')`, 'Sessão encerra sem exigir resumo')
  await button('Voltar às sessões'); await button('Abrir sessão'); await button('Anotações')
  await assert(`document.body.textContent.includes('A carta foi encontrada durante a investigação HTTP.')`, 'Anotação persistida reaparece no histórico')
  const narrativeBase = `/api/campanhas/${campaign.id}/narrativa/sessoes/${session.id}`
  const finalSession = await api(narrativeBase)
  const notes = await api(`${narrativeBase}/notas`)
  const links = await api(`${narrativeBase}/eventos`)
  if (finalSession.status !== 'CONCLUIDA' || notes.length !== 1 || links[0].status !== 'REALIZADO' || links[0].evento.status !== 'REALIZADO') throw new Error('API real não confirmou histórico final')
  results.push({ label: 'HTTP real confirma sessão concluída, nota e realização do evento preservados', passed: true })
  await screenshot('05-historico-http')
  await assert('true', 'Fluxo completo sem mocks concluído')
} catch (error) {
  results.push({ error: error.stack }); console.error(error.stack); process.exitCode = 1
  try { await screenshot('failure') } catch (captureError) { console.error(captureError.message) }
} finally {
  results.push({ runtimeErrors })
  await writeFile(new URL('browser-results.json', output), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  socket.close(); chrome.kill('SIGTERM')
}
