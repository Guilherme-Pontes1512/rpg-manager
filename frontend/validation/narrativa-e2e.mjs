import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const base = process.env.RPG_VALIDATION_URL || 'http://127.0.0.1:5174'
const output = new URL('./narrativa/', import.meta.url)
await mkdir(output, { recursive: true })
const profile = `/tmp/rpg-narrativa-chrome-${Date.now()}`
const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
let stderr = ''
chrome.stderr.on('data', chunk => { stderr += chunk })
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
let endpoint
for (let attempt = 0; attempt < 100; attempt++) {
  try {
    endpoint = `http://127.0.0.1:${(await readFile(`${profile}/DevToolsActivePort`, 'utf8')).split('\n')[0]}`
    break
  } catch { await delay(100) }
}
if (!endpoint) { chrome.kill(); throw new Error(`Chrome unavailable: ${stderr.slice(-2000)}`) }
const target = await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' }).then(response => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let nextId = 0
const pending = new Map()
const results = []
const runtimeErrors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const request = pending.get(message.id)
    pending.delete(message.id)
    message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result)
  }
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
function installFixtures() {
  const originalFetch = window.fetch.bind(window)
  localStorage.setItem('rpg-manager-auth', btoa('guardiao@example.test:ficticio'))
  localStorage.setItem('rpg-manager-current-view', 'campanhas')
  window.confirm = () => true
  const campaign = { id: 1, nome: 'O silêncio de Arkham', descricao: 'Dados fictícios de validação visual.', sistema: 'COC', papel: 'MESTRE', mestreUsername: 'guardiao', membros: [{ id: 1, usuarioId: 1, username: 'guardiao', email: 'guardiao@example.test', papel: 'MESTRE' }] }
  const sheet = { atributos: { forca: 50, destreza: 60, constituicao: 50, inteligencia: 70, presenca: 50, vontade: 60 }, vidaAtual: 7, vidaMaxima: 10, sanidade: 42, pericias: [], armas: [], rituais: [] }
  const pcs = [{ id: 11, campanhaId: 1, nome: 'Eleanor Ward', status: 'ATIVO', dadosFichaJson: sheet }]
  const npcs = [{ id: 31, campanhaId: 1, nome: 'Margaret, bibliotecária', dadosFichaJson: { ...sheet, profissao: 'Bibliotecária' } }]
  const state = window.__narrativa = { sessions: [], events: [], links: [], notes: [], requests: [], failNext: false, failSessions: false, failPeople: false, nextId: 100 }
  const now = () => new Date().toISOString()
  const response = (body, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const eventOutput = event => ({ ...event, sessaoPlanejadaId: state.links.find(link => link.evento.id === event.id && link.status === 'PENDENTE')?.sessaoId ?? null })
  const sessionOutput = session => ({ ...session, quantidadeEventos: state.links.filter(link => link.sessaoId === session.id).length, eventosRealizados: state.links.filter(link => link.sessaoId === session.id && link.status === 'REALIZADO').length, quantidadeNotas: state.notes.filter(note => note.sessaoId === session.id).length })
  const createEvent = body => { const event = { id: state.nextId++, campanhaId: 1, tipo: 'OPCIONAL', status: 'PENDENTE', participantes: [], npcs: [], criadoEm: now(), atualizadoEm: now(), ...body }; state.events.push(event); return event }
  const associate = (sessionId, event) => { const link = { id: state.nextId++, sessaoId: sessionId, evento: event, ordem: state.links.filter(item => item.sessaoId === sessionId).length, status: 'PENDENTE' }; state.links.push(link); return link }
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href)
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/usuarios')) return originalFetch(input, options)
    const path = url.pathname
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : {}
    state.requests.push({ path, method, body })
    if (path === '/api/auth/me') return response({ id: 1, username: 'guardiao', email: 'guardiao@example.test', emailVerificado: true })
    if (path.endsWith('/documentos/notificacoes')) return response([])
    if (path.endsWith('/stream')) return new Response('', { headers: { 'Content-Type': 'text/event-stream' } })
    if (path === '/api/campanhas') return response({ content: [campaign] })
    if (path === '/api/campanhas/1') return response(campaign)
    if (path.endsWith('/acompanhamento')) return state.failPeople ? response({ message: 'Acompanhamento temporariamente indisponível' }, 503) : response({ campanhaId: 1, campanhaNome: campaign.nome, documentos: [], npcs, personagens: pcs.map(pc => ({ ...pc, jogadorUsername: 'investigadora', ...pc.dadosFichaJson })) })
    if (path === '/api/personagens/coc/11') return response(pcs[0])
    if (path.startsWith('/api/personagens/coc')) return response(pcs)
    if (!path.includes('/narrativa')) throw new Error(`Unhandled isolated mock ${method} ${path}`)
    if (state.failNext) { state.failNext = false; return response({ message: 'Falha simulada de conexão' }, 503) }
    const parts = path.split('/narrativa')[1].split('/').filter(Boolean)
    const id = Number(parts[1])
    if (state.failSessions && parts[0] === 'sessoes' && parts.length === 1 && method === 'GET') return response({ message: 'Endpoint de sessões indisponível no backend' }, 404)
    if (parts[0] === 'eventos') {
      if (parts.length === 1 && method === 'GET') return response(state.events.map(eventOutput))
      if (parts.length === 1 && method === 'POST') return response(eventOutput(createEvent(body)), 201)
      const event = state.events.find(item => item.id === id)
      if (method === 'PUT') { Object.assign(event, body); return response(eventOutput(event)) }
      if (method === 'DELETE') { state.events = state.events.filter(item => item.id !== id); return response(null, 204) }
      return response(eventOutput(event))
    }
    if (parts.length === 1) {
      if (method === 'GET') return response(state.sessions.map(sessionOutput))
      const session = { id: state.nextId++, campanhaId: 1, numero: null, titulo: null, status: 'PLANEJADA', participantes: [], npcs: [], criadoEm: now(), atualizadoEm: now(), ...body }
      state.sessions.push(session)
      return response(sessionOutput(session), 201)
    }
    const session = state.sessions.find(item => item.id === id)
    if (parts.length === 2) {
      if (method === 'PUT') Object.assign(session, body, { atualizadoEm: now() })
      if (method === 'DELETE') { state.sessions = state.sessions.filter(item => item.id !== id); return response(null, 204) }
      return response(sessionOutput(session))
    }
    if (parts[2] === 'iniciar') { session.status = 'EM_ANDAMENTO'; return response(sessionOutput(session)) }
    if (parts[2] === 'cancelar') { session.status = 'CANCELADA'; return response(sessionOutput(session)) }
    if (parts[2] === 'encerrar') {
      for (const link of state.links.filter(item => item.sessaoId === id && item.status === 'PENDENTE')) link.status = 'ADIADO'
      Object.assign(session, { status: 'CONCLUIDA', resumo: body.resumo })
      return response(sessionOutput(session))
    }
    if (parts[2] === 'notas') {
      if (parts.length === 3 && method === 'GET') return response(state.notes.filter(note => note.sessaoId === id))
      if (parts.length === 3) { const note = { id: state.nextId++, sessaoId: id, criadoEm: now(), categoria: 'OBSERVACAO_GERAL', ...body }; state.notes.push(note); return response(note, 201) }
      const note = state.notes.find(item => item.id === Number(parts[3]))
      if (method === 'DELETE') { state.notes = state.notes.filter(item => item !== note); return response(null, 204) }
      Object.assign(note, body); return response(note)
    }
    if (parts[2] === 'eventos') {
      if (parts.length === 3 && method === 'GET') return response(state.links.filter(link => link.sessaoId === id))
      if (parts.length === 3) return response(associate(id, state.events.find(item => item.id === body.eventoId)), 201)
      if (parts[3] === 'novo') return response(associate(id, createEvent(body)), 201)
      if (parts[3] === 'ordem') { body.ids.forEach((linkId, index) => { state.links.find(item => item.id === linkId).ordem = index }); return response(null, 204) }
      const link = state.links.find(item => item.id === Number(parts[3]))
      if (parts[4] === 'banco') { link.status = 'ADIADO'; return response(null, 204) }
      if (parts[4] === 'transferir') { link.status = 'ADIADO'; return response(associate(body.sessaoDestinoId, link.evento)) }
      if (method === 'DELETE') { state.links = state.links.filter(item => item !== link); return response(null, 204) }
      Object.assign(link, body)
      if (link.status === 'REALIZADO') { link.evento.status = 'REALIZADO'; state.events.find(item => item.id === link.evento.id).status = 'REALIZADO'; link.realizadoEm = now() }
      return response(link)
    }
    throw new Error(`Unhandled isolated mock ${method} ${path}`)
  }
}
async function assert(expression, label) {
  if (!await evaluate(expression)) throw new Error(`Assertion failed: ${label}`)
  results.push({ label, passed: true })
}
async function button(label, index = 0) {
  await evaluate(`(() => { const matches=[...document.querySelectorAll('button')].filter(item => item.textContent.trim()===${JSON.stringify(label)}); const element=matches[${index}]??matches.at(-1); if(!element)throw new Error('Missing button '+${JSON.stringify(label)}); element.click() })()`)
  await delay(350)
}
async function fill(selector, value, index = 0) {
  await evaluate(`(() => { const element=document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if(!element)throw new Error('Missing field '+${JSON.stringify(selector)}); const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:element.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event('input',{bubbles:true})); element.dispatchEvent(new Event('change',{bubbles:true})); })()`)
  await delay(100)
}
async function field(label, value) {
  const selector = await evaluate(`(() => { const label=[...document.querySelectorAll('.narrative-dialog label')].find(item=>item.firstChild?.textContent?.trim().startsWith(${JSON.stringify(label)})); const field=label?.querySelector('input,textarea,select'); if(!field)throw new Error('Missing label '+${JSON.stringify(label)}); field.dataset.validation='current'; return '[data-validation="current"]' })()`)
  await fill(selector, value)
  await evaluate(`delete document.querySelector(${JSON.stringify(selector)}).dataset.validation`)
}
async function salvarSessaoEVoltar() {
  await button('Salvar')
  await button('Voltar às sessões')
}
async function screenshot(name, width = 1440, height = 1000) {
  if (await evaluate('!!document.querySelector(".notification-toast")')) await delay(4300)
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 })
  await delay(250)
  const metrics = await evaluate('({width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})')
  const image = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(2500, metrics.height), scale: 1 } })
  await writeFile(new URL(`${name}.png`, output), Buffer.from(image.data, 'base64'))
  results.push({ screenshot: name, ...metrics })
  if (metrics.documentWidth > width) throw new Error(`Horizontal overflow at ${name}: ${metrics.documentWidth}/${width}`)
}
try {
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `(${installFixtures.toString()})()` })
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await cdp('Page.navigate', { url: base }); await delay(1000)
  await button('Abrir campanha'); await button('Sessões', 1)
  await assert(`document.body.textContent.includes('Nenhuma sessão encontrada')`, 'Estado vazio de sessões')
  await screenshot('01-sessoes-vazio')
  await button('Nova sessão')
  await assert(`document.querySelectorAll('.narrative-dialog [required]').length===0`, 'Formulário de sessão não exige campos')
  await assert(`!document.querySelector('.narrative-dialog input[type="date"]')&&!document.querySelector('.narrative-dialog').textContent.includes('Data narrativa')`, 'Formulário de sessão sem datas')
  await salvarSessaoEVoltar(); await button('Nova sessão'); await salvarSessaoEVoltar()
  await assert(`window.__narrativa.sessions.length===2&&window.__narrativa.sessions.every(item=>item.numero==null&&!item.titulo&&!item.participantes.length&&!item.npcs.length)`, 'Múltiplas sessões totalmente vazias sem numeração automática')
  await button('Nova sessão'); await field('Número', '8'); await salvarSessaoEVoltar()
  await button('Nova sessão'); await field('Título', 'Somente um título'); await salvarSessaoEVoltar()
  await assert(`window.__narrativa.sessions.some(item=>item.numero===8&&!item.titulo)&&window.__narrativa.sessions.some(item=>item.numero==null&&item.titulo==='Somente um título')`, 'Criação apenas número ou apenas título')
  await screenshot('11-sessoes-flexiveis')
  await button('Banco de Eventos'); await button('Novo evento')
  await field('Título', 'O funeral do professor')
  await cdp('Page.reload'); await delay(1000)
  await button('Banco de Eventos'); await button('Novo evento')
  await assert(`document.querySelector('.narrative-dialog input').value==='O funeral do professor'`, 'Rascunho de formulário recuperado após recarregar e reabrir')
  await field('Local', 'Cemitério de Arkham')
  await field('Data ou horário narrativo', '10h da terceira lua')
  await field('Condições de ativação', 'Se os investigadores comparecerem ao funeral.')
  await field('Orientações privadas', 'A viúva esconde uma carta no casaco.')
  await field('Evidências e informações descobríveis', 'Carta com o símbolo do farol.')
  await evaluate(`document.querySelectorAll('.narrative-dialog input[type="checkbox"]')[1].click()`)
  await button('Salvar')
  await assert('window.__narrativa.events.length===1', 'Cadastro de evento independente de sessão')
  await button('Sessões', 2); await button('Nova sessão')
  await field('Título', 'As cartas de Arkham')
  await field('Descrição e objetivos narrativos', 'Investigar o funeral e o desaparecimento dos arquivos.')
  await evaluate(`document.querySelectorAll('.narrative-dialog input[type="checkbox"]').forEach(element=>element.click())`)
  await salvarSessaoEVoltar(); await screenshot('02-sessao-planejada')
  await button('Abrir sessão'); await button('Eventos'); await button('Associar evento')
  await fill('select[aria-label="Evento"]', await evaluate('String(window.__narrativa.events[0].id)'))
  await button('Associar'); await button('Criar evento'); await field('Título', 'A manifestação no farol'); await button('Salvar')
  await assert('window.__narrativa.links.length===2', 'Associação existente e criação dentro da sessão')
  await assert(`document.querySelector('.narrative-record').textContent.includes('10h da terceira lua')&&document.querySelector('.narrative-record').textContent.includes('Margaret')`, 'Metadados NPC e data narrativa visíveis no evento')
  await screenshot('03-planejamento-eventos')
  await button('Iniciar sessão')
  await assert(`document.querySelectorAll('.narrative-live .gm-character-card').length===1`, 'Mesa reutiliza card do personagem participante')
  await screenshot('04-mesa-desktop')
  await screenshot('05-mesa-mobile', 390, 844)
  await assert(`(() => {const sections=[...document.querySelectorAll('.narrative-live>.narrative-section')];const diary=sections.find(item=>item.textContent.includes('Diário da sessão'));const events=sections.find(item=>item.textContent.includes('Eventos narrativos'));return diary.getBoundingClientRect().top<events.getBoundingClientRect().top})()`, 'Registro rápido aparece antes dos eventos em celular')
  await assert(`document.querySelector('.narrative-more-actions')?.open===false`, 'Ações secundárias permanecem recolhidas')
  await button('Abrir ficha', 1)
  await assert(`document.querySelector('.coc-identity-row input')?.value==='Margaret, bibliotecária'`, 'Ficha existente do NPC aberta diretamente pela sessão')
  await screenshot('10-ficha-npc-existente', 390, 844)
  await button('Voltar à sessão')
  await assert(`!!document.querySelector('.narrative-live')`, 'Retorno da ficha NPC preserva sessão em andamento')
  await button('Realizado', 0)
  await fill('.narrative-live textarea', 'A investigadora encontrou a carta escondida.')
  await button('Salvar anotação')
  await assert('window.__narrativa.notes.length===1&&window.__narrativa.events[0].status==="REALIZADO"', 'Realização rápida e anotação durante a mesa')
  await fill('.narrative-live textarea', 'Rascunho preservado para consulta')
  await button('Anotações'); await button('Eventos'); await button('Anotações')
  await assert(`document.querySelector('textarea').value==='Rascunho preservado para consulta'`, 'Rascunho preservado entre abas')
  await fill('textarea', ''); await fill('input[aria-label="Pesquisar anotações"]', 'carta')
  await assert(`document.querySelectorAll('.narrative-record').length===1`, 'Pesquisa no diário')
  await screenshot('06-diario-mobile', 390, 844)
  await button('Eventos'); await button('Registrar resultado', 0)
  await field('Resultado ocorrido', 'A carta foi entregue voluntariamente pela viúva.')
  await field('Informações reveladas', 'O farol aparece no mapa antigo.')
  await button('Salvar registro'); await button('Encerrar e revisar')
  await screenshot('07-revisao-desktop')
  await field('Resumo final (opcional)', 'O grupo descobriu uma ligação entre o funeral e o farol.')
  await evaluate(`document.querySelector('.narrative-dialog input[type="checkbox"]').click()`)
  await button('Confirmar encerramento')
  await assert('window.__narrativa.sessions[0].status==="CONCLUIDA"&&window.__narrativa.links[1].status==="ADIADO"', 'Encerramento com retorno coletivo ao banco')
  await screenshot('08-resumo-concluido')
  await button('Editar'); await field('Resumo final (opcional)', 'Resumo complementado posteriormente.'); await button('Salvar')
  await assert('window.__narrativa.sessions[0].resumo==="Resumo complementado posteriormente."', 'Edição de sessão concluída')
  await button('Voltar às sessões')
  await evaluate('window.__narrativa.failNext=true')
  await button('Abrir sessão')
  await assert(`document.querySelector('[role="alert"]')?.textContent.includes('Falha simulada')`, 'Estado de erro de carregamento')
  await screenshot('09-erro-carregamento')
  await button('Tentar novamente')
  await assert(`!document.querySelector('[role="alert"]')`, 'Recuperação após falha')
  await evaluate('window.__narrativa.failSessions=true')
  await button('Campanha'); await button('Sessões', 1)
  await assert(`(() => {const errors=[...document.querySelectorAll('[role="alert"]')].map(item=>item.textContent).join(' ');return errors.includes('404')&&errors.includes('/sessoes')})()`, 'Erro HTTP 404 identifica endpoint de sessões indisponível')
  await assert(`!document.body.textContent.includes('Nenhuma sessão encontrada')`, 'Falha de consulta não aparece como lista vazia')
  await button('Nova sessão')
  await assert(`document.querySelector('.narrative-dialog').textContent.includes('Eleanor Ward')&&document.querySelector('.narrative-dialog').textContent.includes('Margaret')`, 'Personagens e NPCs permanecem disponíveis com sessões 404 e acompanhamento 200')
  await screenshot('12-sessoes-endpoint-indisponivel')
  await button('Cancelar'); await evaluate('window.__narrativa.failSessions=false'); await button('Tentar novamente')
  await evaluate('window.__narrativa.failPeople=true')
  await button('Campanha'); await button('Sessões', 1)
  await assert(`document.body.textContent.includes('As cartas de Arkham')`, 'Falha auxiliar de pessoas não impede listagem das sessões')
  if (await evaluate(`[...document.querySelectorAll('button')].some(item=>item.textContent.trim()==='Voltar às sessões')`)) await button('Voltar às sessões')
  await button('Nova sessão'); await button('Salvar')
  await assert(`window.__narrativa.sessions.length===2&&window.__narrativa.sessions.at(-1).numero==null&&!window.__narrativa.sessions.at(-1).participantes.length`, 'Sessão vazia salva mesmo com acompanhamento indisponível')
  await assert('true', 'Fluxo visual completo com API interceptada e dados fictícios')
} catch (error) {
  results.push({ error: error.stack }); console.error(error.stack); process.exitCode = 1
  try { await screenshot('failure') } catch (captureError) { console.error(captureError.message) }
} finally {
  results.push({ runtimeErrors, mode: 'Browser real com API fetch interceptada; não valida integração HTTP real.' })
  await writeFile(new URL('browser-results.json', output), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  socket.close(); chrome.kill('SIGTERM')
}
