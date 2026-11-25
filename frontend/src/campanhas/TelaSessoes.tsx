import { useCallback, useEffect, useMemo, useState } from 'react'
import { clienteNarrativa, categorias, estadosSessao, rotulo, tipos, tituloSessao } from './clienteNarrativa'
import { Abas } from '../layout/Abas'
import type { Associacao, Evento, Nota, Sessao } from './clienteNarrativa'
import { NarrativaFormulario } from './NarrativaFormulario'
import type { DadosFormulario } from './NarrativaFormulario'
import { acompanharAcompanhamentoCampanhaTempoReal, obterAcompanhamentoCampanha } from './clienteAcompanhamento'
import type { AcompanhamentoCampanha } from './tiposAcompanhamento'
import { PersonagemAcompanhamentoCard } from './TelaAcompanhamentoMestre'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import './TelaSessoes.css'

type Editor = { modo: 'sessao' | 'evento' | 'nota'; dados: DadosFormulario; dentroSessao?: boolean }
type Decisao = { associacaoId: number; destino: string; sessaoDestinoId?: number; novaSessao?: DadosFormulario }
const destinos: Record<string, string> = { BANCO: 'Retornar ao Banco de Eventos', TRANSFERIR: 'Transferir para sessão existente', NOVA_SESSAO: 'Criar sessão futura e transferir', REALIZADO_FORA_CENA: 'Realizado fora de cena', DESCARTAR_SESSAO: 'Descartar nesta sessão', DESCARTAR_CAMPANHA: 'Descartar definitivamente' }

export function TelaSessoes({ campanhaId, usuarioId, token, onEditarPersonagem, onAcompanhamento }: {
  campanhaId: number; usuarioId: number; token: string; onEditarPersonagem: (id: number) => void; onAcompanhamento: (npcId?: number) => void
}) {
  const api = useMemo(() => clienteNarrativa(token, campanhaId), [token, campanhaId])
  const { notify } = useNotificacoes()
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [associacoes, setAssociacoes] = useState<Associacao[]>([])
  const [notas, setNotas] = useState<Nota[]>([])
  const [pessoas, setPessoas] = useState<AcompanhamentoCampanha | null>(null)
  const [sessaoId, setSessaoId] = useState<number | null>(() => Number(sessionStorage.getItem(`sessao-aberta-${usuarioId}-${campanhaId}`)) || null)
  const [area, setArea] = useState('sessoes')
  const [aba, setAba] = useState(() => sessionStorage.getItem(`sessao-aba-${usuarioId}-${campanhaId}-${sessaoId}`) ?? 'Visão geral')
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')
  const [npc, setNpc] = useState('')
  const [filtroSessao, setFiltroSessao] = useState('')
  const [buscaNotas, setBuscaNotas] = useState('')
  const [categoria, setCategoria] = useState('')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [registro, setRegistro] = useState<Associacao | null>(null)
  const [associar, setAssociar] = useState(false)
  const [eventoEscolhido, setEventoEscolhido] = useState('')
  const [revisao, setRevisao] = useState(false)
  const [resumo, setResumo] = useState('')
  const [decisoes, setDecisoes] = useState<Record<number, Decisao>>({})
  const [todosBanco, setTodosBanco] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erroSessoes, setErroSessoes] = useState('')
  const [erroEventos, setErroEventos] = useState('')
  const [erroDetalhes, setErroDetalhes] = useState('')
  const [erroPessoas, setErroPessoas] = useState('')
  const [loadingPessoas, setLoadingPessoas] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const sessao = sessoes.find((item) => item.id === sessaoId)
  const erro = sessaoId ? erroSessoes || erroDetalhes : area === 'sessoes' ? erroSessoes : erroEventos
  const base = `/sessoes/${sessaoId}`
  const chaveRascunho = `narrativa-rascunho-${usuarioId}-${campanhaId}-${sessaoId}`
  const chaveResumo = `narrativa-resumo-${usuarioId}-${campanhaId}-${sessaoId}`
  const chaveRevisao = `narrativa-revisao-${usuarioId}-${campanhaId}-${sessaoId}`
  const chaveRegistro = `narrativa-registro-${usuarioId}-${campanhaId}-${sessaoId}`
  const sessoesFiltradas = [...sessoes]
    .sort((primeira, segunda) => (segunda.criadoEm ?? '').localeCompare(primeira.criadoEm ?? '') || segunda.id - primeira.id)
    .filter((item) => (!status || item.status === status) && tituloSessao(item).toLowerCase().includes(busca.toLowerCase()))
  const eventosFiltrados = eventos.filter((evento) =>
    evento.titulo.toLowerCase().includes(busca.toLowerCase()) &&
    (!status || evento.status === status) && (!tipo || evento.tipo === tipo) &&
    (!npc || evento.npcs.includes(Number(npc))) &&
    (!filtroSessao || (filtroSessao === 'sem' ? !evento.sessaoPlanejadaId : evento.sessaoPlanejadaId === Number(filtroSessao))))

  const carregar = useCallback(async () => {
    setLoading(true)
    setLoadingPessoas(true)
    setErroSessoes(''); setErroEventos(''); setErroDetalhes(''); setErroPessoas('')
    const [listaResult, bancoResult, pessoasResult] = await Promise.allSettled([
      api<Sessao[]>('/sessoes'), api<Evento[]>('/eventos'), obterAcompanhamentoCampanha(token, campanhaId),
    ])
    const mensagem = (error: unknown) => error instanceof Error ? error.message : 'Falha ao carregar registros.'
    if (pessoasResult.status === 'fulfilled') setPessoas(pessoasResult.value)
    else setErroPessoas(mensagem(pessoasResult.reason))
    setLoadingPessoas(false)
    if (bancoResult.status === 'fulfilled') setEventos(bancoResult.value)
    else setErroEventos(mensagem(bancoResult.reason))
    if (listaResult.status === 'fulfilled') {
      const lista = listaResult.value
      setSessoes(lista)
      if (sessaoId && lista.some((item) => item.id === sessaoId)) {
        try {
          const [links, diario] = await Promise.all([api<Associacao[]>(`/sessoes/${sessaoId}/eventos`), api<Nota[]>(`/sessoes/${sessaoId}/notas`)])
          setAssociacoes(links.sort((primeiro, segundo) => primeiro.ordem - segundo.ordem)); setNotas(diario)
        } catch (error) { setErroDetalhes(mensagem(error)) }
      } else if (sessaoId) setSessaoId(null)
    } else setErroSessoes(mensagem(listaResult.reason))
    setLoading(false)
  }, [api, campanhaId, token, sessaoId])
  useEffect(() => { void carregar() }, [carregar])
  useEffect(() => {
    if (sessaoId) sessionStorage.setItem(`sessao-aba-${usuarioId}-${campanhaId}-${sessaoId}`, aba)
  }, [usuarioId, campanhaId, sessaoId, aba])
  useEffect(() => {
    sessionStorage.setItem(`sessao-aberta-${usuarioId}-${campanhaId}`, String(sessaoId ?? ''))
    setRascunho(localStorage.getItem(chaveRascunho) ?? '')
  }, [usuarioId, campanhaId, sessaoId, chaveRascunho])
  useEffect(() => {
    setResumo(localStorage.getItem(chaveResumo) ?? sessao?.resumo ?? '')
  }, [sessao?.resumo, chaveResumo])
  useEffect(() => {
    if (revisao) localStorage.setItem(chaveRevisao, JSON.stringify({ decisoes, todosBanco }))
  }, [revisao, decisoes, todosBanco, chaveRevisao])
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (rascunho.trim() || editor || registro || resumo !== (sessao?.resumo ?? '')) event.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [rascunho, editor, registro, resumo, sessao?.resumo])
  useEffect(() => {
    if (sessao?.status !== 'EM_ANDAMENTO') return
    const stream = acompanharAcompanhamentoCampanhaTempoReal(token, campanhaId, () => {
      void obterAcompanhamentoCampanha(token, campanhaId).then(setPessoas).catch(() => undefined)
    }, () => undefined)
    return () => stream.abort()
  }, [token, campanhaId, sessao?.status])

  async function executar(action: () => Promise<unknown>, success = 'Registro atualizado.') {
    setBusy(true)
    try { await action(); await carregar(); notify('success', success); return true }
    catch (error) { notify('error', error instanceof Error ? error.message : 'Falha na operação.'); return false }
    finally { setBusy(false) }
  }
  function novaSessao() { setEditor({ modo: 'sessao', dados: { participantes: [], npcs: [] } }) }
  function abrir(item: Sessao) { setSessaoId(item.id); setAba(item.status === 'EM_ANDAMENTO' ? 'Mesa' : 'Visão geral'); setResumo(item.resumo ?? '') }
  async function salvar(dados: DadosFormulario) {
    if (!editor) return false
    const path = editor.modo === 'sessao' ? '/sessoes' : editor.modo === 'nota' ? `${base}/notas` : editor.dentroSessao ? `${base}/eventos/novo` : '/eventos'
    let criada: Sessao | null = null
    const ok = await executar(async () => {
      const resposta = await api<Sessao>(`${path}${dados.id ? `/${dados.id}` : ''}`, dados.id ? 'PUT' : 'POST', dados)
      if (editor.modo === 'sessao' && !dados.id) criada = resposta
    })
    if (ok) {
      if (editor.modo === 'nota' && dados.conteudo === rascunho) atualizarRascunho('')
      setEditor(null)
      if (criada) abrir(criada)
    }
    return ok
  }
  async function excluir(path: string, message: string) { if (window.confirm(message)) await executar(() => api(path, 'DELETE')) }
  function mudarArea(value: string) { setArea(value); setSessaoId(null); setBusca(''); setStatus('') }
  function atualizarRascunho(value: string) { setRascunho(value); localStorage.setItem(chaveRascunho, value) }
  function atualizarResumo(value: string) { setResumo(value); localStorage.setItem(chaveResumo, value) }
  async function salvarNota() {
    if (!rascunho.trim()) return
    if (await executar(() => api(`${base}/notas`, 'POST', { conteudo: rascunho, categoria: 'OBSERVACAO_GERAL', participantes: [], npcs: [] }), 'Anotação salva.')) atualizarRascunho('')
  }
  async function mudarStatus(link: Associacao, value: string) {
    await executar(() => api(`${base}/eventos/${link.id}`, 'PUT', { ...link, status: value }))
  }
  async function reordenar(origem: number, destino: number) {
    const ids = associacoes.map((link) => link.id)
    const indice = ids.indexOf(origem)
    if (indice < 0 || !ids.includes(destino)) return
    ids.splice(indice, 1); ids.splice(ids.indexOf(destino), 0, origem)
    await executar(() => api(`${base}/eventos/ordem`, 'PUT', { ids }))
  }
  function escolherDecisao(link: Associacao, destino: string) { setDecisoes((atual) => ({ ...atual, [link.id]: { associacaoId: link.id, destino, novaSessao: destino === 'NOVA_SESSAO' ? { participantes: [], npcs: [] } : undefined } })) }
  function revisar() {
    try {
      const draft = JSON.parse(localStorage.getItem(chaveRevisao) ?? 'null')
      const pendentes = associacoes.filter((link) => link.status === 'PENDENTE').map((link) => link.id)
      const restauradas = Object.values<Decisao>(draft?.decisoes ?? {}).filter((item) => pendentes.includes(item.associacaoId))
      setDecisoes(Object.fromEntries(restauradas.map((item) => [item.associacaoId, item])))
      setTodosBanco(draft?.todosBanco ?? false)
    } catch { setDecisoes({}); setTodosBanco(false) }
    setRevisao(true)
  }
  function abrirRegistro(link: Associacao) {
    try {
      const draft: Associacao | null = JSON.parse(localStorage.getItem(`${chaveRegistro}-${link.id}`) ?? 'null')
      setRegistro(draft ? { ...draft, status: link.status === 'PENDENTE' ? draft.status : link.status, evento: link.evento } : link)
    } catch { setRegistro(link) }
  }
  function atualizarRegistro(value: Associacao) {
    setRegistro(value)
    localStorage.setItem(`${chaveRegistro}-${value.id}`, JSON.stringify(value))
  }
  async function salvarRegistro() {
    if (!registro) return
    if (await executar(() => api(`${base}/eventos/${registro.id}`, 'PUT', registro))) {
      localStorage.removeItem(`${chaveRegistro}-${registro.id}`)
      setRegistro(null)
    }
  }
  async function salvarResumo() {
    if (!sessao) return
    const input = {
      numero: sessao.numero, titulo: sessao.titulo, descricao: sessao.descricao,
      resumo, participantes: sessao.participantes, npcs: sessao.npcs,
    }
    if (await executar(() => api(base, 'PUT', input))) localStorage.removeItem(chaveResumo)
  }
  async function encerrar() {
    const ok = await executar(() => api(`${base}/encerrar`, 'POST', {
      resumo, retornarTodosAoBanco: todosBanco, decisoes: todosBanco ? [] : Object.values(decisoes),
    }), 'Sessão encerrada.')
    if (ok) {
      localStorage.removeItem(chaveRevisao)
      localStorage.removeItem(chaveResumo)
      setRevisao(false)
      setAba('Resumo')
    }
  }

  function selecao(values: string[], value: string, change: (value: string) => void, label: string) {
    return <select aria-label={label} value={value} onChange={(event) => change(event.target.value)}>
      <option value="">
        {label}
      </option>
      {values.map((item) => <option key={item} value={item}>
        {rotulo(item)}
      </option>)}
    </select>
  }
  function detalheEvento(evento: Evento) {
    return <dl className="narrative-details">
      {[['Descrição', evento.descricao], ['Condição de ativação', evento.condicoes], ['Orientações privadas', evento.orientacoes], ['Evidências previstas', evento.evidencias], ['Consequências previstas', evento.consequencias], ['Data narrativa', evento.dataNarrativa], ['NPCs', pessoas?.npcs?.filter((pessoa) => evento.npcs?.includes(pessoa.id!)).map((pessoa) => pessoa.nome).join(', ')]].map(([label, value]) => value ? <div key={label}>
        <dt>
          {label}
        </dt>
        <dd>
          {value}
        </dd>
      </div> : null)}
    </dl>
  }
  function metadadosEvento(evento: Evento) {
    const nomes = pessoas?.npcs?.filter((pessoa) => evento.npcs?.includes(pessoa.id!)).map((pessoa) => pessoa.nome).join(', ')
    if (!nomes && !evento.dataNarrativa) return null
    return <p className="panel-hint">{[nomes ? `NPCs: ${nomes}` : '', evento.dataNarrativa].filter(Boolean).join(' · ')}</p>
  }
  function listaEventos() {
    return <section className="narrative-section narrative-events">
      <div className="narrative-actions">
        <h3>Eventos narrativos</h3>
        <button className="ghost-button" onClick={() => setAssociar(true)}>Associar evento</button>
        <button className="ghost-button" onClick={() => setEditor({ modo: 'evento', dados: { tipo: 'OPCIONAL', status: 'PENDENTE' }, dentroSessao: true })}>Criar evento</button>
      </div>
      {!associacoes.length ? <p className="panel-hint">Nenhum evento planejado. Prepare possibilidades ou registre acontecimentos improvisados.</p> : null}
      {associacoes.map((link, index) => <article className={`narrative-record narrative-status-${link.status}`} key={link.id} draggable={!busy} onDragStart={(event) => event.dataTransfer.setData('text/plain', String(link.id))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const origem = Number(event.dataTransfer.getData('text/plain')); if (origem && origem !== link.id) void reordenar(origem, link.id) }}>
        <details>
          <summary>
            <strong>
              {link.evento.titulo}
            </strong>
            <span>
              {rotulo(link.evento.tipo)} · {rotulo(link.status)}{link.evento.local ? ` · ${link.evento.local}` : ''}
            </span>
          </summary>
          {detalheEvento(link.evento)}
          <dl className="narrative-details">
            {[['Observações da sessão', link.observacoes], ['Resultado ocorrido', link.resultado], ['Informações reveladas', link.evidencias], ['Consequências ocorridas', link.consequencias]].map(([label, value]) => value ? <div key={label}>
              <dt>
                {label}
              </dt>
              <dd>
                {value}
              </dd>
            </div> : null)}
          </dl>
        </details>
        {metadadosEvento(link.evento)}
        {link.evento.condicoes ? <p className="panel-hint">Condição: {link.evento.condicoes}
        </p> : null}
        <div className="narrative-actions">
          {link.status === 'PENDENTE' ? <>
            <button className="ghost-button" disabled={busy} onClick={() => void mudarStatus(link, 'REALIZADO')}>Realizado</button>
            <button className="ghost-button" disabled={busy} onClick={() => void mudarStatus(link, 'ADIADO')}>Adiar</button>
          </> : null}
          <button className="ghost-button" onClick={() => abrirRegistro(link)}>Registrar resultado</button>
          <details className="narrative-more-actions">
            <summary>Mais ações</summary>
            <div className="narrative-actions">
              {link.status === 'PENDENTE' ? <>
            <button className="ghost-button" disabled={busy} onClick={() => void executar(() => api(`${base}/eventos/${link.id}/banco`, 'POST'))}>Retornar ao banco</button>
            <select aria-label={`Transferir ${link.evento.titulo}`} value="" disabled={busy} onChange={(event) => { if (event.target.value) void executar(() => api(`${base}/eventos/${link.id}/transferir`, 'POST', { sessaoDestinoId: Number(event.target.value) })) }}>
              <option value="">Transferir para...</option>
              {sessoes.filter((item) => item.id !== sessaoId && item.status === 'PLANEJADA').map((item) => <option key={item.id} value={item.id}>{tituloSessao(item)}
              </option>)}
            </select>
            <button className="ghost-button" disabled={busy} onClick={() => void mudarStatus(link, 'DESCARTADO')}>Descartar nesta sessão</button>
            <button className="ghost-button" disabled={busy} onClick={() => void excluir(`${base}/eventos/${link.id}`, 'Remover associação ainda não utilizada? O evento permanece no banco.')}>Remover vínculo</button></> : null}
          <button className="ghost-button" disabled={busy || index === 0} onClick={() => void reordenar(link.id, associacoes[index - 1].id)} aria-label={`Mover ${link.evento.titulo} para cima`}>↑</button>
            </div>
          </details>
        </div>
      </article>)}
    </section>
  }
  function diario(compacto = false) {
    const filtradas = [...notas].sort((primeira, segunda) => primeira.criadoEm.localeCompare(segunda.criadoEm)).filter((nota) => (!categoria || nota.categoria === categoria) && `${nota.titulo ?? ''} ${nota.conteudo}`.toLowerCase().includes(buscaNotas.toLowerCase()))
    return <section className="narrative-section narrative-diary">
      <h3>Diário da sessão</h3>
      <label>Registro rápido<textarea value={rascunho} onChange={(event) => atualizarRascunho(event.target.value)} placeholder="O que aconteceu? Rascunho preservado neste navegador." />
      </label>
      <div className="narrative-actions">
        <button className="primary-button" disabled={busy || !rascunho.trim()} onClick={() => void salvarNota()}>Salvar anotação</button>
        <button className="ghost-button" onClick={() => setEditor({ modo: 'nota', dados: { conteudo: rascunho, categoria: 'OBSERVACAO_GERAL' } })}>Registro detalhado</button>
      </div>
      {!compacto ? <div className="narrative-filters narrative-filters-notas">
        <input aria-label="Pesquisar anotações" placeholder="Pesquisar no diário" value={buscaNotas} onChange={(event) => setBuscaNotas(event.target.value)} />
        {selecao(categorias, categoria, setCategoria, 'Todas as categorias')}
      </div> : null}
      {!filtradas.length ? <p className="panel-hint">Nenhuma anotação encontrada.</p> : null}
      {(compacto ? filtradas.slice(-5) : filtradas).map((nota) => <article key={nota.id} className="narrative-record">
        <small>
          {new Date(nota.criadoEm).toLocaleString('pt-BR')} · {rotulo(nota.categoria)}
        </small>
        {nota.titulo ? <h4>
          {nota.titulo}
        </h4> : null}
        <p className="narrative-prose">
          {nota.conteudo}
        </p>
        <div className="narrative-actions">
          <button className="ghost-button" onClick={() => setEditor({ modo: 'nota', dados: nota })}>Editar</button>
          <button className="ghost-button" disabled={busy} onClick={() => void excluir(`${base}/notas/${nota.id}`, 'Excluir esta anotação?')}>Excluir</button>
        </div>
      </article>)}
    </section>
  }
  function personagens() {
    return <section className="narrative-section">
      <h3>Participantes</h3>
      <div className="gm-character-grid">
        {pessoas?.personagens.filter((pessoa) => sessao?.participantes.includes(pessoa.id)).map((pessoa) => <PersonagemAcompanhamentoCard key={pessoa.id} personagem={pessoa} onEditar={() => onEditarPersonagem(pessoa.id)} />)}
      </div>
      <h3>NPCs relevantes</h3>
      {pessoas?.npcs?.filter((pessoa) => sessao?.npcs.includes(pessoa.id!)).map((pessoa) => <article className="narrative-record" key={pessoa.id}>
        <strong>
          {pessoa.nome}
        </strong>
        <p>Vida {pessoa.dadosFichaJson.vidaAtual}/{pessoa.dadosFichaJson.vidaMaxima} · Sanidade {pessoa.dadosFichaJson.sanidade}
        </p>
        <button className="ghost-button" onClick={() => onAcompanhamento(pessoa.id)}>Abrir ficha</button>
      </article>)}
    </section>
  }

  return <div className="narrative-screen">
    <header className="narrative-header">
      <div>
        <span className="panel-tag">Arquivo privado do mestre</span>
        <h2>
          {sessao ? tituloSessao(sessao) : 'Sessões e acontecimentos'}
        </h2>
        {sessao ? <p>
          {rotulo(sessao.status)}
        </p> : null}
      </div>
      <div className="narrative-actions">
        {sessao ? <>
          <button className="ghost-button" onClick={() => setSessaoId(null)}>Voltar às sessões</button>
          <button className="ghost-button" onClick={() => setEditor({ modo: 'sessao', dados: sessao })}>Editar</button>
          {sessao.status === 'PLANEJADA' ? <>
            <button className="primary-button" disabled={busy} onClick={() => void executar(() => api(`${base}/iniciar`, 'POST')).then((ok) => { if (ok) setAba('Mesa') })}>Iniciar sessão</button>
            <button className="ghost-button" disabled={busy} onClick={() => { if (window.confirm('Cancelar esta sessão?')) void executar(() => api(`${base}/cancelar`, 'POST')) }}>Cancelar sessão</button></> : null}{sessao.status === 'EM_ANDAMENTO' ? <button className="primary-button" onClick={revisar}>Encerrar e revisar</button> : null}</> : <button className="primary-button" onClick={area === 'sessoes' ? novaSessao : () => setEditor({ modo: 'evento', dados: { tipo: 'OPCIONAL', status: 'PENDENTE' } })}>
          {area === 'sessoes' ? 'Nova sessão' : 'Novo evento'}
        </button>}
      </div>
    </header>
    {erro ? <div className="narrative-error" role="alert">
      {erro} <button className="ghost-button" onClick={() => void carregar()}>Tentar novamente</button>
    </div> : null}
    {erroPessoas ? <div className="narrative-error" role="status">As opções de personagens e NPCs estão indisponíveis. {erroPessoas} <button className="ghost-button" onClick={() => void carregar()}>Recarregar opções</button></div> : null}
    {loading ? <p role="status" className="panel-hint">Carregando arquivo narrativo...</p> : null}
    {!sessao ? <>
      <Abas label="Áreas narrativas" ativa={area} onChange={mudarArea} itens={[{ valor: 'sessoes', titulo: 'Sessões' }, { valor: 'eventos', titulo: 'Banco de Eventos' }]} />
      <div className={`narrative-filters narrative-filters-${area}`}>
        <input aria-label="Pesquisar" placeholder={area === 'sessoes' ? 'Pesquisar por número ou título' : 'Pesquisar título'} value={busca} onChange={(event) => setBusca(event.target.value)} />
        {selecao(area === 'sessoes' ? estadosSessao : ['PENDENTE', 'REALIZADO', 'DESCARTADO'], status, setStatus, 'Todos os status')}{area === 'eventos' ? <>
          {selecao(tipos, tipo, setTipo, 'Todos os tipos')}
          <select aria-label="NPC envolvido" value={npc} onChange={(event) => setNpc(event.target.value)}>
            <option value="">Todos os NPCs</option>
            {pessoas?.npcs?.map((pessoa) => <option key={pessoa.id} value={pessoa.id}>
              {pessoa.nome}
            </option>)}
          </select>
          <select aria-label="Sessão associada" value={filtroSessao} onChange={(event) => setFiltroSessao(event.target.value)}>
            <option value="">Todas as sessões</option>
            <option value="sem">Sem sessão planejada</option>
            {sessoes.map((item) => <option key={item.id} value={item.id}>{tituloSessao(item)}
            </option>)}
          </select></> : null}
      </div>
      {area === 'sessoes' ? <div className="narrative-list">
        {!sessoesFiltradas.length && !loading && !erroSessoes ? <p className="panel-hint narrative-empty" role="status">Nenhuma sessão encontrada. Crie uma sessão ou ajuste a pesquisa.</p> : null}{sessoesFiltradas.map((item) => <article key={item.id} className={`narrative-record ${item.status === 'EM_ANDAMENTO' ? 'narrative-active' : ''}`}>
          <span className="panel-tag">
            {rotulo(item.status)}
          </span>
          <h3>{tituloSessao(item)}</h3>
          <p>
            {item.descricao?.slice(0, 220)}
          </p>
          <small>
            {item.quantidadeEventos} eventos · {item.eventosRealizados} realizados</small>
          <div className="narrative-actions">
            <button className="primary-button" onClick={() => abrir(item)}>Abrir sessão</button>
            <button className="ghost-button" onClick={() => setEditor({ modo: 'sessao', dados: item })}>Editar</button>
            <button className="ghost-button" disabled={busy} onClick={() => void excluir(`/sessoes/${item.id}`, 'Excluir sessão e seus registros? Os eventos originais serão preservados no banco. Sessões com registros históricos podem ter exclusão restringida.')}>Excluir</button>
          </div>
        </article>)}
      </div> : <div className="narrative-list">
        {!eventosFiltrados.length && !loading && !erroEventos ? <p className="panel-hint">Nenhum acontecimento encontrado. Basta um título para guardar uma ideia ou ajuste os filtros.</p> : null}{eventosFiltrados.map((evento) => <article className="narrative-record" key={evento.id}>
          <details>
            <summary>
              <strong>
                {evento.titulo}
              </strong>
              <span>
                {rotulo(evento.tipo)} · {rotulo(evento.status)}{evento.local ? ` · ${evento.local}` : ''}
              </span>
            </summary>
            {detalheEvento(evento)}
          </details>
          {evento.sessaoPlanejadaId ? <p>Planejado para {tituloSessao(sessoes.find((item) => item.id === evento.sessaoPlanejadaId) ?? { numero: null, titulo: null })}
          </p> : null}
          {metadadosEvento(evento)}
          <div className="narrative-actions">
            <button className="ghost-button" onClick={() => setEditor({ modo: 'evento', dados: evento })}>Editar</button>
            {evento.status === 'PENDENTE' ? <button className="ghost-button" disabled={busy} onClick={() => void executar(() => api(`/eventos/${evento.id}`, 'PUT', { ...evento, status: 'REALIZADO' }))}>Realizado fora de cena</button> : null}
            <select aria-label={`Associar ${evento.titulo}`} value="" disabled={busy || !!evento.sessaoPlanejadaId || evento.status !== 'PENDENTE'} onChange={(event) => { if (event.target.value) void executar(() => api(`/sessoes/${event.target.value}/eventos`, 'POST', { eventoId: evento.id })) }}>
              <option value="">Associar à sessão...</option>
              {sessoes.filter((item) => item.status === 'PLANEJADA' || item.status === 'EM_ANDAMENTO').map((item) => <option key={item.id} value={item.id}>{tituloSessao(item)}
              </option>)}
            </select>
            <button className="ghost-button" disabled={busy} onClick={() => void excluir(`/eventos/${evento.id}`, 'Excluir evento? Eventos com histórico de realização têm sua exclusão protegida.')}>Excluir</button>
          </div>
        </article>)}
      </div>}
    </> : <>
      <Abas label="Abas da sessão" ativa={aba} onChange={setAba} itens={[...(sessao.status === 'EM_ANDAMENTO' ? ['Mesa'] : []), 'Visão geral', 'Eventos', 'Anotações', 'Personagens', 'Resumo'].map((value) => ({ valor: value, titulo: value }))} />
      {aba === 'Visão geral' ? <section className="narrative-section">
        <h3>Objetivos narrativos</h3>
        <p className="narrative-prose">
          {sessao.descricao || 'Nenhum objetivo registrado.'}
        </p>
        <p>
          {sessao.quantidadeEventos} eventos planejados · {sessao.eventosRealizados} realizados · {sessao.quantidadeNotas} anotações</p>
        {personagens()}
      </section> : null}
      {aba === 'Eventos' ? listaEventos() : null}{aba === 'Anotações' ? diario() : null}{aba === 'Personagens' ? personagens() : null}
      {aba === 'Mesa' ? <div className="narrative-live">
        {personagens()}{listaEventos()}{diario(true)}
      </div> : null}
      {aba === 'Resumo' ? <section className="narrative-section">
        <label>Resumo narrativo<textarea value={resumo} onChange={(event) => atualizarResumo(event.target.value)} />
        </label>
        <button className="primary-button" disabled={busy} onClick={() => void salvarResumo()}>Salvar resumo</button>
        <h3>Acontecimentos e consequências</h3>
        {associacoes.filter((link) => link.status === 'REALIZADO').map((link) => <article className="narrative-record" key={link.id}>
          <strong>
            {link.evento.titulo}
          </strong>
          <p>
            {link.resultado}
          </p>
          <p>
            {link.evidencias}
          </p>
          <p>
            {link.consequencias}
          </p>
        </article>)}
        <h3>Informações e pendências</h3>
        {notas.filter((nota) => ['PENDENCIA_MESTRE', 'INFORMACAO_REVELADA', 'CONSEQUENCIA_NARRATIVA', 'EVIDENCIA_DESCOBERTA', 'ACONTECIMENTO_IMPROVISADO', 'ACAO_JOGADORES'].includes(nota.categoria)).map((nota) => <p className="narrative-prose" key={nota.id}>
          {rotulo(nota.categoria)}: {nota.conteudo}
        </p>)}
      </section> : null}
    </>}
    {editor ? <NarrativaFormulario key={`${editor.modo}-${editor.dados.id ?? 'novo'}`} draftKey={`narrativa-formulario-${usuarioId}-${campanhaId}-${editor.modo}-${editor.dados.id ?? 'novo'}-${sessaoId ?? 'banco'}`} modo={editor.modo} inicial={editor.dados} acompanhamento={pessoas} loadingPessoas={loadingPessoas} erroPessoas={erroPessoas} eventos={eventos} onSave={salvar} onCancel={() => setEditor(null)} busy={busy} /> : null}
    {associar ? <div className="narrative-overlay">
      <section className="panel-surface narrative-dialog" role="dialog" aria-modal="true" aria-label="Associar evento">
        <h3>Associar evento existente</h3>
        <select aria-label="Evento" value={eventoEscolhido} onChange={(event) => setEventoEscolhido(event.target.value)}>
          <option value="">Selecione um evento pendente</option>
          {eventos.filter((evento) => evento.status === 'PENDENTE' && !evento.sessaoPlanejadaId && !associacoes.some((link) => link.evento.id === evento.id)).map((evento) => <option key={evento.id} value={evento.id}>
            {evento.titulo}
          </option>)}
        </select>
        <div className="narrative-actions">
          <button className="primary-button" disabled={busy || !eventoEscolhido} onClick={() => void executar(() => api(`${base}/eventos`, 'POST', { eventoId: Number(eventoEscolhido) })).then((ok) => { if (ok) { setAssociar(false); setEventoEscolhido('') } })}>Associar</button>
          <button className="ghost-button" onClick={() => setAssociar(false)}>Cancelar</button>
        </div>
      </section>
    </div> : null}
    {registro ? <div className="narrative-overlay">
      <section className="panel-surface narrative-dialog" role="dialog" aria-modal="true" aria-label="Registrar resultado">
        <h3>
          {registro.evento.titulo}
        </h3>
        <form className="narrative-form" onSubmit={(event) => { event.preventDefault(); void salvarRegistro() }}>
          <label>Status<select value={registro.status} onChange={(event) => atualizarRegistro({ ...registro, status: event.target.value })}>
            {(associacoes.find((link) => link.id === registro.id)?.status === 'PENDENTE' ? ['PENDENTE', 'REALIZADO', 'ADIADO', 'DESCARTADO'] : [registro.status]).map((value) => <option key={value} value={value}>
              {rotulo(value)}
            </option>)}
          </select>
          </label>
          {(['observacoes', 'resultado', 'evidencias', 'consequencias'] as const).map((campo) => <label key={campo}>
            {{ observacoes: 'Observações da sessão', resultado: 'Resultado ocorrido', evidencias: 'Informações reveladas', consequencias: 'Consequências ocorridas' }[campo]}
            <textarea value={registro[campo] ?? ''} onChange={(event) => atualizarRegistro({ ...registro, [campo]: event.target.value })} />
          </label>)}
          <div className="narrative-actions">
            <button className="primary-button" disabled={busy}>Salvar registro</button>
            <button className="ghost-button" type="button" onClick={() => {
              if (window.confirm('Descartar alterações deste registro?')) {
                localStorage.removeItem(`${chaveRegistro}-${registro.id}`)
                setRegistro(null)
              }
            }}>Cancelar</button>
          </div>
        </form>
      </section>
    </div> : null}
    {revisao && sessao ? <div className="narrative-overlay">
      <section className="panel-surface narrative-dialog" role="dialog" aria-modal="true" aria-label="Revisão de encerramento">
        <h2>Revisão — {tituloSessao(sessao)}</h2>
        <p>Participantes: {pessoas?.personagens.filter((pessoa) => sessao.participantes.includes(pessoa.id)).map((pessoa) => pessoa.nome).join(', ') || 'Nenhum'}
        </p>
        {['REALIZADO', 'PENDENTE', 'ADIADO', 'DESCARTADO'].map((value) => <div key={value}>
          <h4>
            {rotulo(value)} ({associacoes.filter((link) => link.status === value).length})</h4>
          {associacoes.filter((link) => link.status === value).map((link) => <p key={link.id}>
            {link.evento.titulo}{link.evidencias ? ` — Revelado: ${link.evidencias}` : ''}
          </p>)}
        </div>)}
        <details>
          <summary>Anotações ({notas.length}) e pendências</summary>
          {notas.map((nota) => <p key={nota.id}>
            {rotulo(nota.categoria)}: {nota.conteudo}
          </p>)}
        </details>
        <form className="narrative-form" onSubmit={(event) => { event.preventDefault(); void encerrar() }}>
          <label>Resumo final (opcional)<textarea value={resumo} onChange={(event) => atualizarResumo(event.target.value)} />
          </label>
          <label className="narrative-check">
            <input type="checkbox" checked={todosBanco} onChange={(event) => setTodosBanco(event.target.checked)} />Retornar todos os eventos pendentes ao Banco de Eventos</label>
          {!todosBanco ? associacoes.filter((link) => link.status === 'PENDENTE').map((link) => <fieldset key={link.id}>
            <legend>
              {link.evento.titulo}
            </legend>
            <select required aria-label={`Destino de ${link.evento.titulo}`} value={decisoes[link.id]?.destino ?? ''} onChange={(event) => escolherDecisao(link, event.target.value)}>
              <option value="">Decida o destino do planejamento</option>
              {Object.entries(destinos).map(([value, label]) => <option key={value} value={value}>
                {label}
              </option>)}
            </select>
            {decisoes[link.id]?.destino === 'TRANSFERIR' ? <select required aria-label="Sessão futura" value={decisoes[link.id]?.sessaoDestinoId ?? ''} onChange={(event) => setDecisoes({ ...decisoes, [link.id]: { ...decisoes[link.id], sessaoDestinoId: Number(event.target.value) } })}>
              <option value="">Selecione a sessão</option>
              {sessoes.filter((item) => item.id !== sessaoId && item.status === 'PLANEJADA').map((item) => <option key={item.id} value={item.id}>{tituloSessao(item)}
              </option>)}
            </select> : null}{decisoes[link.id]?.destino === 'NOVA_SESSAO' ? <label>Título da nova sessão<input value={decisoes[link.id]?.novaSessao?.titulo ?? ''} onChange={(event) => setDecisoes({ ...decisoes, [link.id]: { ...decisoes[link.id], novaSessao: { titulo: event.target.value, participantes: [], npcs: [] } } })} />
            </label> : null}
          </fieldset>) : null}
          <div className="narrative-actions">
            <button className="primary-button" disabled={busy}>Confirmar encerramento</button>
            <button className="ghost-button" type="button" onClick={() => setRevisao(false)}>Continuar sessão</button>
          </div>
        </form>
      </section>
    </div> : null}
  </div>
}
