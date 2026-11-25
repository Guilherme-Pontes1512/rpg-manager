import { spawn } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const base = process.env.RPG_VALIDATION_URL || 'http://localhost:5173'
const output = fileURLToPath(new URL('../validation', import.meta.url))
await mkdir(output, { recursive: true })
const profile = '/tmp/rpg-visual-chrome-' + Date.now()
const chrome = spawn(process.env.RPG_CHROME_BINARY || '/usr/bin/google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
let stderr = ''
chrome.stderr.on('data', chunk => { stderr += chunk })
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let endpoint
for (let attempt = 0; attempt < 100; attempt++) {
  try {
    const portFile = await readFile(profile + '/DevToolsActivePort', 'utf8')
    endpoint = 'http://127.0.0.1:' + portFile.split('\n')[0]
    break
  } catch { await delay(100) }
}
if (!endpoint) throw new Error('Chrome unavailable: ' + stderr.slice(-2000))
const target = await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' }).then(response => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let nextId = 0
const pending = new Map()
const runtimeErrors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const current = pending.get(message.id)
    pending.delete(message.id)
    message.error ? current.reject(new Error(JSON.stringify(message.error))) : current.resolve(message.result)
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
const fixtures = `(() => {
 const realFetch = window.fetch.bind(window);
 const user = { id: 1, username: 'guardiao', email: 'guardiao@example.test', emailVerificado: true };
 const member = {id: 1, usuarioId: 1, nome: 'Guardião', username: 'guardiao', email: user.email, papel: 'MESTRE'};
 const campaigns = [{id: 1,nome: 'O silêncio de Arkham',descricao: 'Outono de 1927. Um arquivo desaparecido, cartas sem remetente e uma investigação entre as sombras de Massachusetts.',sistema:'COC',papel:'MESTRE',mestreUsername:'guardiao',membros:[member]}, {id:2,nome:'O observatório de Kingsport',descricao:'Uma investigação na costa da Nova Inglaterra.',sistema:'COC',papel:'JOGADOR',mestreUsername:'eleanor',membros:[{...member,papel:'JOGADOR'}]}];
 const sheet = {atributos:{forca:50,destreza:60,constituicao:50,inteligencia:70,presenca:40,vontade:60},vidaAtual:0,vidaMaxima:10,sanidade:-15,sorte:50,esquiva:30,profissao:'Arquivista e pesquisadora de manuscritos desaparecidos',ocupacao:'Acadêmico',idade:42,nacionalidade:'Brasileira',historico:'Uma carta encontrada no acervo de Miskatonic deu início à investigação.',aparencia:'Casaco escuro e um caderno de anotações.',personalidade:'Observadora e reservada.',inventario:'Caderno, lanterna e chaves do arquivo.',importantes:'O bibliotecário de Arkham.',segredos:'O nome nos registros antigos é o seu.',pericias:[{nome:'Ocultismo',base:5,valor:45},{nome:'Biblioteconomia',base:20,valor:65},{nome:'Furtividade',base:20,valor:30}],armas:[],rituais:[]};
 const pcs = [{id:11,campanhaId:1,nome:'Eleanor Alexandria Montgomery de Albuquerque',status:'MORTO',dadosFichaJson:structuredClone(sheet)},{id:12,campanhaId:1,nome:'Henry Marsh',dadosFichaJson:{...structuredClone(sheet),vidaAtual:7,sanidade:42}},{id:21,campanhaId:2,nome:'Amelia Ward',dadosFichaJson:{...structuredClone(sheet),vidaAtual:10,sanidade:55}}];
 const npcs = [{id:31,campanhaId:1,nome:'Professor Nathaniel Augustus Blackwood',dadosFichaJson:{...structuredClone(sheet),profissao:'Pesquisador de documentos históricos e antiguidades',vidaAtual:0,sanidade:-9}},{id:32,campanhaId:1,nome:'Margaret',dadosFichaJson:{...structuredClone(sheet),profissao:'Bibliotecária',vidaAtual:8,sanidade:38}}];
 window.__mock = {user,campaigns,pcs,npcs,requests:[]};
 window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/usuarios')) return realFetch(input,options);
  const path = url.pathname, method = options.method || 'GET';
  window.__mock.requests.push({path,method});
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const json = data => Promise.resolve(new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}}));
  if (path === '/api/auth/me' || path === '/api/auth/register') return json(user);
  if (path.includes('/auth/')) return json({message:'Solicitação recebida.'});
  if (path.endsWith('/documentos/notificacoes')) return json([]);
  if (path.endsWith('/stream')) return new Response('',{headers:{'Content-Type':'text/event-stream'}});
  if (path === '/api/campanhas') return json({content:campaigns});
  if (/^\\/api\\/campanhas\\/\\d+$/.test(path)) return json(campaigns.find(item=>item.id===Number(path.split('/')[3])));
  if (path.endsWith('/acompanhamento')) return json({campanhaId:1,campanhaNome:campaigns[0].nome,documentos:[],npcs,personagens:pcs.filter(item=>item.campanhaId===1).map(item=>({id:item.id,nome:item.nome,jogadorUsername:'investigador_'+item.id,vidaAtual:item.dadosFichaJson.vidaAtual,vidaMaxima:item.dadosFichaJson.vidaMaxima,sanidade:item.dadosFichaJson.sanidade}))});
  if (path.includes('/npcs')) {
   if (method === 'POST') {const npc={...body,id:40+npcs.length};npcs.push(npc);return json(npc)}
   if (method === 'PUT') {const index=npcs.findIndex(item=>item.id===Number(path.split('/').at(-1)));npcs[index]={...body,id:npcs[index].id};return json(npcs[index])}
   return json(npcs);
  }
  if (path.startsWith('/api/personagens/coc')) {
   const id = Number(path.split('/')[4]);
   if (method==='POST') {const pc={...body,id:50+pcs.length};pcs.push(pc);return json(pc)}
   if (method==='PUT') {const index=pcs.findIndex(item=>item.id===id);pcs[index]={...body,id};return json(pcs[index])}
   if (id) return json(pcs.find(item=>item.id===id));
   return json(pcs.filter(item=>!url.searchParams.has('campanhaId')||item.campanhaId===Number(url.searchParams.get('campanhaId'))));
  }
  throw new Error('Unhandled mocked request: '+method+' '+path);
 };
})();`
const results = []
async function assert(expression, label) {
  if (!await evaluate(expression)) throw new Error('Assertion failed: ' + label)
  results.push({ label, passed: true })
}
async function click(selector, index = 0) {
  await evaluate(`(() => {const element=document.querySelectorAll(${JSON.stringify(selector)})[${index}];if(!element)throw new Error('Missing '+${JSON.stringify(selector)});element.click()})()`)
  await delay(400)
}
async function button(text, index = 0) {
  await evaluate(`(() => {const element=[...document.querySelectorAll('button')].filter(button=>button.textContent.trim()===${JSON.stringify(text)})[${index}];if(!element)throw new Error('Missing button '+${JSON.stringify(text)});element.click()})()`)
  await delay(500)
}
async function fill(selector, value, index = 0) {
  await evaluate(`(() => {const element=document.querySelectorAll(${JSON.stringify(selector)})[${index}];if(!element)throw new Error('Missing input '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await delay(100)
}
async function viewport(width, height) {
  await cdp('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:false })
  await delay(250)
}
async function shot(name) {
  await evaluate('document.fonts.ready')
  await delay(300)
  const metrics = await evaluate(`({width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,theme:document.documentElement.dataset.theme,overflow:[...document.querySelectorAll('body *')].filter(element=>{const rect=element.getBoundingClientRect();return rect.width>0&&(rect.right>innerWidth+1||rect.left< -1)}).slice(0,12).map(element=>element.className)})`)
  const image = await cdp('Page.captureScreenshot', { format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:0,y:0,width:metrics.width,height:metrics.height,scale:1} })
  await writeFile(output + '/' + name + '.png',Buffer.from(image.data,'base64'))
  const cards = await evaluate(`Array.from(document.querySelectorAll('.gm-character-card')).map(element=>({npc:element.classList.contains('gm-character-card-npc'),height:element.getBoundingClientRect().height,width:element.getBoundingClientRect().width}))`)
  results.push({screenshot:name,...metrics,cards})
  console.log(name,JSON.stringify(metrics))
  if (metrics.documentWidth > metrics.width + 1) throw new Error('Horizontal page overflow: ' + name)
}
try {
 await cdp('Page.enable');await cdp('Runtime.enable');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:fixtures});
 await viewport(1440,1000);
 await cdp('Page.navigate',{url:base});await delay(1300);
 await shot('01-login-desktop');
 await button('Cadastro');await shot('02-cadastro-desktop');
 await fill('input[placeholder="Nome"]','Teste Visual');await fill('input[placeholder="GuardiaoDaMesa"]','testevisual');await fill('input[type="email"]','teste@example.test');await fill('input[type="password"]','teste123',0);await fill('input[type="password"]','teste123',1);
 await button('Criar conta');await assert(`!!document.querySelector('.form-success')`,'Cadastro retorna confirmação');
 await button('Esqueci minha senha?');await shot('03-recuperacao-desktop');
 await button('Voltar para login');
 await viewport(390,844);await shot('04-login-mobile');
 await fill('input[type="email"]','teste@example.test');await fill('input[type="password"]','teste123');await button('Entrar');await assert(`!!document.querySelector('.top-menu')`,'Login abre aplicação');
 await shot('05-campanhas-mobile');await viewport(1440,1000);await shot('06-campanhas-desktop');
 await click('.card-icon-button');await shot('07-campanha-editor');await button('Voltar para campanhas');
 await button('Abrir campanha',0);await shot('08-acompanhamento-desktop');
 await assert(`document.querySelector('.gm-character-card').textContent.includes('0 / 10')&&document.querySelector('.gm-character-card').textContent.includes('-15')`,'Vida zero e sanidade negativa preservadas');
 await viewport(1366,768);await shot('17-acompanhamento-notebook');await viewport(768,1024);await shot('18-acompanhamento-tablet');
 await assert(`new Set([...document.querySelectorAll('.gm-character-card')].map(element=>Math.round(element.getBoundingClientRect().height))).size===1`,'Altura dos cards PC e NPC consistente');
 await viewport(320,800);await shot('20-acompanhamento-mobile-320');
 await viewport(390,844);await shot('09-acompanhamento-mobile');
 await click('.theme-toggle');await shot('10-acompanhamento-claro-mobile');await viewport(1440,1000);await shot('11-acompanhamento-claro-desktop');await click('.theme-toggle');
 await button('Abrir ficha',0);await shot('12-ficha-investigador');
 await assert(`document.querySelector('.coc-sanity-current').textContent.trim()==='-15'`,'Ficha PC exibe sanidade negativa atual');
 await fill('.coc-identity-row input','Eleanor Montgomery — revisão visual');await delay(3500);await assert(`window.__mock.requests.some(item=>item.method==='PUT'&&item.path==='/api/personagens/coc/11')`,'Edição PC dispara salvamento automático');
 await assert(`window.__mock.pcs[0].dadosFichaJson.vidaAtual===0&&window.__mock.pcs[0].dadosFichaJson.sanidade===-15`,'Edição PC preserva vida zero e sanidade negativa no payload');
 await button('Voltar para acompanhamento');await click('.gm-character-card-npc .gm-character-edit-button');await shot('19-npc-existente');await assert(`document.querySelector('.coc-sanity-current').textContent.trim()==='-9'`,'Ficha NPC exibe sanidade negativa atual');await fill('.coc-identity-row input','Professor Nathaniel — revisão visual');await button('Salvar ficha NPC');await assert(`window.__mock.npcs[0].dadosFichaJson.vidaAtual===0&&window.__mock.npcs[0].dadosFichaJson.sanidade===-9`,'Edição NPC preserva vida zero e sanidade negativa no payload');await button('Voltar para acompanhamento');await button('Adicionar NPC');await fill('.coc-identity-row input','NPC de validação');await shot('13-npc-criacao');await button('Salvar ficha NPC');
 await assert(`window.__mock.requests.some(item=>item.method==='POST'&&item.path.endsWith('/npcs'))`,'Criação NPC envia POST');
 await fill('.coc-identity-row input','NPC revisado');await button('Salvar ficha NPC');await assert(`window.__mock.requests.some(item=>item.method==='PUT'&&item.path.includes('/npcs/'))`,'Edição NPC envia PUT');
 await viewport(390,844);await shot('14-npc-ficha-mobile');await button('Voltar para acompanhamento');await button('Voltar para campanhas');
 await button('Abrir campanha',1);await button('Criar novo personagem');await fill('.coc-identity-row input','Investigadora de validação');await button('Salvar ficha CoC');await assert(`window.__mock.requests.some(item=>item.method==='POST'&&item.path==='/api/personagens/coc')`,'Criação PC envia POST');await shot('15-investigador-mobile');
 await click('.coc-delete-button');await shot('16-confirmacao-exclusao-mobile');
 await assert('true','Fluxos de navegação concluídos');
} catch(error) {results.push({error:error.stack});console.error(error.stack);process.exitCode=1}
finally {
 results.push({runtimeErrors});
 if (runtimeErrors.length) process.exitCode=1;
 await writeFile(output+'/browser-results.json',JSON.stringify(results,null,2));
 socket.close();chrome.kill('SIGTERM');
}
