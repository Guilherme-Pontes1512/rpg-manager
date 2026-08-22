import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { faDiceD20 } from '@fortawesome/free-solid-svg-icons'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import {
  acompanharAcompanhamentoCampanhaTempoReal,
  atualizarNpcCampanha,
  baixarDocumentoCampanha,
  criarNpcCampanha,
  enviarDocumentoCampanha,
  excluirNpcCampanha,
  obterAcompanhamentoCampanha,
} from './clienteAcompanhamento'
import type {
  AcompanhamentoCampanha,
  AcompanhamentoPersonagem,
  AtributosNpcCoc,
  CampanhaDocumento,
  CampanhaNpc,
  FichaNpcCoc,
} from './tiposAcompanhamento'
import '../personagens/TelaPersonagemCoc.css'
import './TelaAcompanhamentoMestre.css'

type TelaAcompanhamentoMestreProps = {
  campanhaId: number
  onBack: () => void
  onEditarPersonagem: (personagemId: number) => void
  token: string
}

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.jpeg,.jpg,.png'
const NPC_PERICIAS = [
  'Atirar',
  'Atletismo',
  'Conducao',
  'Furtividade',
  'Lutar',
  'Ocultismo',
  'Primeiros Socorros',
]

const NPC_ATRIBUTOS: { field: keyof AtributosNpcCoc; label: string }[] = [
  { field: 'forca', label: 'FOR' },
  { field: 'destreza', label: 'DES' },
  { field: 'constituicao', label: 'CON' },
  { field: 'inteligencia', label: 'INT' },
  { field: 'vontade', label: 'VON' },
]

const NPC_TEXT_FIELDS: { field: keyof Pick<FichaNpcCoc, 'historico' | 'aparencia' | 'importantes' | 'segredos' | 'armas' | 'rituais'>; label: string }[] = [
  { field: 'historico', label: 'Historico' },
  { field: 'aparencia', label: 'Aparencia' },
  { field: 'importantes', label: 'Importantes' },
  { field: 'segredos', label: 'Segredos' },
  { field: 'armas', label: 'Armas' },
  { field: 'rituais', label: 'Rituais' },
]

export function TelaAcompanhamentoMestre({ campanhaId, onBack, onEditarPersonagem, token }: TelaAcompanhamentoMestreProps) {
  const { notify } = useNotificacoes()
  const [acompanhamento, setAcompanhamento] = useState<AcompanhamentoCampanha | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [npcEmEdicaoId, setNpcEmEdicaoId] = useState<number | null>(null)
  const [npcFichaAberta, setNpcFichaAberta] = useState(false)
  const [npcForm, setNpcForm] = useState<CampanhaNpc>(() => criarNpcInicial(campanhaId))
  const [loading, setLoading] = useState(true)
  const [salvandoNpc, setSalvandoNpc] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void carregarAcompanhamento()
  }, [campanhaId, token])

  useEffect(() => {
    cancelarEdicaoNpc()
  }, [campanhaId])

  useEffect(() => {
    const stream = acompanharAcompanhamentoCampanhaTempoReal(
      token,
      campanhaId,
      () => void carregarAcompanhamento(),
      (caughtError) => notify('error', extrairErro(caughtError, 'Acompanhamento em tempo real desconectado.')),
    )

    return () => stream.abort()
  }, [campanhaId, token])

  async function carregarAcompanhamento() {
    setLoading(true)

    try {
      setAcompanhamento(await obterAcompanhamentoCampanha(token, campanhaId))
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel carregar o acompanhamento da campanha.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviarDocumento() {
    if (!arquivo) {
      notify('error', 'Selecione um documento para enviar.')
      return
    }

    setSubmitting(true)

    try {
      await enviarDocumentoCampanha(token, campanhaId, arquivo)
      setArquivo(null)
      await carregarAcompanhamento()
      notify('success', 'Documento enviado para os jogadores.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel enviar o documento.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBaixarDocumento(documento: CampanhaDocumento) {
    try {
      await baixarDocumentoCampanha(token, documento)
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel baixar o documento.'))
    }
  }

  async function handleSalvarNpc(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const nome = npcForm.nome.trim()
    if (!nome) {
      notify('error', 'Informe o nome do NPC.')
      return
    }

    setSalvandoNpc(true)

    try {
      const payload = prepararNpcParaSalvar({ ...npcForm, nome })
      const salvo = npcEmEdicaoId
        ? await atualizarNpcCampanha(token, campanhaId, npcEmEdicaoId, payload)
        : await criarNpcCampanha(token, campanhaId, payload)

      if (npcEmEdicaoId) {
        notify('success', 'NPC atualizado.')
      } else {
        notify('success', 'NPC adicionado.')
      }

      setNpcEmEdicaoId(salvo.id ?? npcEmEdicaoId)
      setNpcForm(normalizarNpcFormulario(salvo, campanhaId))
      await carregarAcompanhamento()
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel salvar o NPC.'))
    } finally {
      setSalvandoNpc(false)
    }
  }

  async function handleExcluirNpc(npcId?: number) {
    if (!npcId) {
      return
    }

    setSalvandoNpc(true)

    try {
      await excluirNpcCampanha(token, campanhaId, npcId)
      if (npcEmEdicaoId === npcId) {
        cancelarEdicaoNpc()
        setNpcFichaAberta(false)
      }
      await carregarAcompanhamento()
      notify('success', 'NPC removido.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel remover o NPC.'))
    } finally {
      setSalvandoNpc(false)
    }
  }

  function editarNpc(npc: CampanhaNpc) {
    setNpcEmEdicaoId(npc.id ?? null)
    setNpcForm(normalizarNpcFormulario(npc, campanhaId))
    setNpcFichaAberta(true)
  }

  function iniciarNovoNpc() {
    setNpcEmEdicaoId(null)
    setNpcForm(criarNpcInicial(campanhaId))
    setNpcFichaAberta(true)
  }

  function cancelarEdicaoNpc() {
    setNpcEmEdicaoId(null)
    setNpcForm(criarNpcInicial(campanhaId))
  }

  function voltarParaAcompanhamentoNpc() {
    setNpcFichaAberta(false)
    cancelarEdicaoNpc()
  }

  function atualizarCampoNpc<K extends keyof CampanhaNpc>(field: K, value: CampanhaNpc[K]) {
    setNpcForm((current) => ({
      ...current,
      [field]: value,
      dadosFichaJson: field === 'imageUrl' ? { ...current.dadosFichaJson, retratoUrl: String(value ?? '') } : current.dadosFichaJson,
    }))
  }

  function atualizarCampoFichaNpc<K extends keyof FichaNpcCoc>(field: K, value: FichaNpcCoc[K]) {
    setNpcForm((current) => ({
      ...current,
      dadosFichaJson: {
        ...current.dadosFichaJson,
        [field]: value,
      },
    }))
  }

  function atualizarAtributoNpc(field: keyof AtributosNpcCoc, value: string) {
    const numero = normalizarNumeroTresDigitos(value)
    setNpcForm((current) => {
      const atributos = {
        ...current.dadosFichaJson.atributos,
        [field]: numero,
      }

      return {
        ...current,
        dadosFichaJson: {
          ...current.dadosFichaJson,
          atributos,
          esquiva: field === 'destreza' ? calcularEsquiva(numero) : current.dadosFichaJson.esquiva,
        },
      }
    })
  }

  function atualizarPericiaNpc(index: number, value: string) {
    const valor = normalizarNumeroTresDigitos(value)
    setNpcForm((current) => ({
      ...current,
      dadosFichaJson: {
        ...current.dadosFichaJson,
        pericias: current.dadosFichaJson.pericias.map((pericia, periciaIndex) =>
          periciaIndex === index ? { ...pericia, valor } : pericia,
        ),
      },
    }))
  }

  function atualizarVidaNpc(delta: number) {
    setNpcForm((current) => {
      const vidaAtual = Math.max(0, Math.min(current.dadosFichaJson.vidaMaxima, current.dadosFichaJson.vidaAtual + delta))

      return {
        ...current,
        dadosFichaJson: {
          ...current.dadosFichaJson,
          vidaAtual,
        },
      }
    })
  }

  function atualizarVidaAtualNpc(value: string) {
    const vidaAtual = normalizarNumeroTresDigitos(value)
    setNpcForm((current) => ({
      ...current,
      dadosFichaJson: {
        ...current.dadosFichaJson,
        vidaAtual: Math.max(0, Math.min(current.dadosFichaJson.vidaMaxima, vidaAtual)),
      },
    }))
  }

  function atualizarVidaMaximaNpc(value: string) {
    const vidaMaxima = Math.max(1, normalizarNumeroTresDigitos(value))
    setNpcForm((current) => ({
      ...current,
      dadosFichaJson: {
        ...current.dadosFichaJson,
        vidaAtual: Math.min(current.dadosFichaJson.vidaAtual, vidaMaxima),
        vidaMaxima,
      },
    }))
  }

  function rolarPericiaNpc(nome: string, valor: number) {
    const resultado = rolarD100()
    const sucesso = resultado <= valor
    const mensagemResultado = sucesso ? 'sucesso' : 'falha'

    notify('info', `${nome}: 1d100 = ${resultado} contra ${valor} (${mensagemResultado}).`)
  }

  const personagens = acompanhamento?.personagens ?? []
  const npcs = acompanhamento?.npcs ?? []
  const documentos = acompanhamento?.documentos ?? []
  const npcVidaPercentual = npcForm.dadosFichaJson.vidaMaxima <= 0
    ? 0
    : Math.max(0, Math.min(100, Math.round((npcForm.dadosFichaJson.vidaAtual / npcForm.dadosFichaJson.vidaMaxima) * 100)))

  if (npcFichaAberta) {
    return (
      <div className="coc-screen">
        <div className="coc-form-view">
          <div className="coc-form-toolbar">
            <button className="ghost-button" type="button" onClick={voltarParaAcompanhamentoNpc}>
              Voltar para acompanhamento
            </button>
            {npcEmEdicaoId ? (
              <button className="ghost-button gm-danger-button" type="button" onClick={() => void handleExcluirNpc(npcEmEdicaoId)} disabled={salvandoNpc}>
                Excluir NPC
              </button>
            ) : null}
          </div>

          <form className="panel-surface coc-sheet" onSubmit={(event) => void handleSalvarNpc(event)}>
            <div className="coc-topline">
              <div>
                <span className="panel-tag">NPC</span>
                <h1>{npcEmEdicaoId ? npcForm.nome || 'NPC' : 'Novo NPC'}</h1>
              </div>
            </div>

            <div className="coc-identity-row">
              <label>
                Nome
                <input required value={npcForm.nome} onChange={(event) => atualizarCampoNpc('nome', event.target.value)} />
              </label>
              <label>
                Profissao
                <input
                  value={npcForm.dadosFichaJson.profissao ?? ''}
                  onChange={(event) => atualizarCampoFichaNpc('profissao', event.target.value)}
                  placeholder="Ex.: empresario"
                />
              </label>
            </div>

            <section className="coc-attributes-panel" aria-label="Atributos base">
              <div className="coc-attribute-grid npc-attribute-grid">
                {NPC_ATRIBUTOS.map((atributo) => (
                  <label className="coc-attribute" key={atributo.field}>
                    <span>{atributo.label}</span>
                    <input
                      inputMode="numeric"
                      maxLength={3}
                      pattern="[0-9]*"
                      value={npcForm.dadosFichaJson.atributos[atributo.field]}
                      onChange={(event) => atualizarAtributoNpc(atributo.field, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className="coc-main-row">
              <section className="coc-vitals-panel">
                <div className="coc-portrait-panel">
                  <label className="coc-portrait-preview">
                    {obterRetratoNpc(npcForm) ? <img src={obterRetratoNpc(npcForm)} alt="" /> : <span>Retrato</span>}
                  </label>
                </div>

                <div>
                  <div className="coc-life-header">
                    <h2>Vida</h2>
                  </div>
                  <div className="coc-life-bar" aria-label="Vida atual">
                    <span className="coc-life-fill" style={{ width: `${npcVidaPercentual}%` }} />
                    <span className="coc-life-inline-fields">
                      <input
                        aria-label="Vida atual"
                        inputMode="numeric"
                        maxLength={3}
                        pattern="[0-9]*"
                        value={npcForm.dadosFichaJson.vidaAtual}
                        onChange={(event) => atualizarVidaAtualNpc(event.target.value)}
                      />
                      <span>/</span>
                      <input
                        aria-label="Vida maxima"
                        inputMode="numeric"
                        maxLength={3}
                        pattern="[0-9]*"
                        value={npcForm.dadosFichaJson.vidaMaxima}
                        onChange={(event) => atualizarVidaMaximaNpc(event.target.value)}
                      />
                    </span>
                  </div>
                </div>
                <div className="coc-life-actions">
                  <button type="button" onClick={() => atualizarVidaNpc(-5)} aria-label="Reduzir vida em 5">
                    -5
                  </button>
                  <button type="button" onClick={() => atualizarVidaNpc(-1)} aria-label="Reduzir vida em 1">
                    -1
                  </button>
                  <button type="button" onClick={() => atualizarVidaNpc(1)} aria-label="Aumentar vida em 1">
                    +1
                  </button>
                  <button type="button" onClick={() => atualizarVidaNpc(5)} aria-label="Aumentar vida em 5">
                    +5
                  </button>
                </div>

                <h2>Sanidade</h2>
                <div className="coc-sanidade-row" aria-label="Sanidade">
                  {Array.from({ length: 11 }, (_, index) => index - 5).map((valor) => (
                    <button
                      key={valor}
                      className={npcForm.dadosFichaJson.sanidade === valor ? 'active' : ''}
                      type="button"
                      onClick={() => atualizarCampoFichaNpc('sanidade', valor)}
                    >
                      {valor}
                    </button>
                  ))}
                </div>

                <div className="coc-vital-field">
                  <label>
                    Esquiva
                    <input
                      inputMode="numeric"
                      maxLength={3}
                      pattern="[0-9]*"
                      value={npcForm.dadosFichaJson.esquiva}
                      onChange={(event) => atualizarCampoFichaNpc('esquiva', normalizarNumeroTresDigitos(event.target.value))}
                    />
                  </label>
                </div>
              </section>

              <section className="coc-skills-panel">
                <div className="coc-skills-header">
                  <h2>Pericias</h2>
                  <span>Base / Normal / Dificil / Extremo</span>
                </div>
                <div className="coc-skill-list">
                  {npcForm.dadosFichaJson.pericias.map((pericia, index) => (
                    <div className="coc-skill npc-skill" key={pericia.nome}>
                      <span className="coc-skill-name">
                        <button
                          type="button"
                          className="coc-skill-roll"
                          onClick={() => rolarPericiaNpc(pericia.nome, pericia.valor)}
                          aria-label={`Rolar 1d100 para ${pericia.nome}`}
                          title={`Rolar 1d100 para ${pericia.nome}`}
                        >
                          <DadoPoliedricoIcon />
                        </button>
                        <span>{pericia.nome}</span>
                      </span>
                      <div className="coc-skill-values">
                        <output aria-label={`${pericia.nome} base`}>{pericia.base}</output>
                        <input
                          aria-label={`${pericia.nome} normal`}
                          inputMode="numeric"
                          maxLength={3}
                          pattern="[0-9]*"
                          value={pericia.valor}
                          onChange={(event) => atualizarPericiaNpc(index, event.target.value)}
                        />
                        <output>{Math.floor(pericia.valor / 2)}</output>
                        <output>{Math.floor(pericia.valor / 5)}</output>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="coc-notes-panel">
                {NPC_TEXT_FIELDS.map((campo) => (
                  <details key={campo.field} className="coc-note-section" open>
                    <summary>{campo.label}</summary>
                    <textarea
                      rows={6}
                      value={String(npcForm.dadosFichaJson[campo.field] ?? '')}
                      onChange={(event) => atualizarCampoFichaNpc(campo.field, event.target.value)}
                    />
                  </details>
                ))}
              </aside>
            </div>

            <button className="primary-button form-submit-button" type="submit" disabled={salvandoNpc}>
              {salvandoNpc ? 'Salvando...' : 'Salvar ficha NPC'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="gm-dashboard">
      <div className="campaign-form-toolbar">
        <button className="ghost-button" type="button" onClick={onBack}>
          Voltar para campanhas
        </button>
      </div>

      <header className="gm-dashboard-header">
        <div>
          <span className="panel-tag">Acompanhamento</span>
          <h2>{acompanhamento?.campanhaNome ?? 'Campanha'}</h2>
        </div>
      </header>

      <section className="gm-panel">
        <div className="gm-section-header">
          <h3>Personagens dos jogadores</h3>
          <span>{personagens.length} fichas</span>
        </div>
        {loading ? <p className="panel-hint">Carregando personagens...</p> : null}
        {!loading && personagens.length === 0 ? (
          <p className="panel-hint">Nenhum personagem cadastrado nessa campanha.</p>
        ) : null}
        <div className="gm-character-grid">
          {personagens.map((personagem) => (
            <PersonagemAcompanhamentoCard
              key={personagem.id}
              onEditar={() => onEditarPersonagem(personagem.id)}
              personagem={personagem}
            />
          ))}
        </div>
      </section>

      <section className="gm-panel">
        <div className="gm-section-header">
          <h3>NPCs</h3>
          <div className="gm-section-actions">
            <span>{npcs.length} fichas</span>
            <button className="ghost-button" type="button" onClick={iniciarNovoNpc}>
              Adicionar NPC
            </button>
          </div>
        </div>
        {loading ? <p className="panel-hint">Carregando NPCs...</p> : null}
        {!loading && npcs.length === 0 ? (
          <p className="panel-hint">Nenhum NPC cadastrado nessa campanha.</p>
        ) : null}
        <div className="gm-character-grid">
          {npcs.map((npc) => (
            <NpcAcompanhamentoCard
              key={npc.id}
              npc={npc}
              onEditar={() => editarNpc(npc)}
              onExcluir={() => void handleExcluirNpc(npc.id)}
              salvando={salvandoNpc}
            />
          ))}
        </div>
      </section>

      <section className="gm-panel">
        <div className="gm-section-header">
          <h3>Documentos compartilhados</h3>
          <span>{documentos.length} arquivos</span>
        </div>
        <div className="gm-upload-row">
          <label className="gm-file-input">
            <span>{arquivo ? arquivo.name : 'Selecionar PDF ou imagem'}</span>
            <input
              accept={ACCEPTED_DOCUMENT_TYPES}
              type="file"
              onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
            />
          </label>
          <button className="primary-button" type="button" onClick={() => void handleEnviarDocumento()} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        <div className="gm-document-list">
          {documentos.map((documento) => (
            <article className="gm-document-item" key={documento.id}>
              <div>
                <strong>{documento.nomeArquivo}</strong>
                <span>
                  Enviado por {documento.enviadoPorUsername} em {formatarData(documento.enviadoEm)}
                </span>
              </div>
              <button className="ghost-button" type="button" onClick={() => void handleBaixarDocumento(documento)}>
                Baixar
              </button>
            </article>
          ))}
          {!loading && documentos.length === 0 ? (
            <p className="panel-hint">Nenhum documento enviado ainda.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function criarNpcInicial(campanhaId: number): CampanhaNpc {
  return {
    campanhaId,
    dadosFichaJson: {
      aparencia: '',
      armas: '',
      atributos: {
        constituicao: 0,
        destreza: 0,
        forca: 0,
        inteligencia: 0,
        vontade: 0,
      },
      esquiva: 0,
      historico: '',
      importantes: '',
      pericias: NPC_PERICIAS.map((nome) => ({ base: obterBasePericiaNpc(nome), nome, valor: 0 })),
      profissao: '',
      retratoUrl: '',
      rituais: '',
      sanidade: 0,
      segredos: '',
      vidaAtual: 10,
      vidaMaxima: 10,
    },
    imageUrl: '',
    nome: '',
  }
}

function normalizarNpcFormulario(npc: CampanhaNpc, campanhaId: number): CampanhaNpc {
  const fichaInicial = criarNpcInicial(campanhaId).dadosFichaJson
  const atributos = {
    ...fichaInicial.atributos,
    ...npc.dadosFichaJson.atributos,
  }

  return {
    ...npc,
    campanhaId,
    dadosFichaJson: {
      ...fichaInicial,
      ...npc.dadosFichaJson,
      atributos,
      pericias: NPC_PERICIAS.map((nome) => {
        const pericia = npc.dadosFichaJson.pericias?.find((item) => normalizarPericiaNpc(item.nome) === normalizarPericiaNpc(nome))
        return {
          base: pericia?.base ?? obterBasePericiaNpc(nome),
          nome,
          valor: pericia?.valor ?? 0,
        }
      }),
    },
    imageUrl: npc.imageUrl ?? npc.dadosFichaJson.retratoUrl ?? '',
  }
}

function prepararNpcParaSalvar(npc: CampanhaNpc): CampanhaNpc {
  return {
    ...npc,
    dadosFichaJson: {
      ...npc.dadosFichaJson,
      retratoUrl: npc.imageUrl ?? npc.dadosFichaJson.retratoUrl ?? '',
      pericias: npc.dadosFichaJson.pericias.map((pericia) => ({
        base: pericia.base,
        nome: pericia.nome,
        valor: pericia.valor,
      })),
    },
  }
}

function obterBasePericiaNpc(nome: string) {
  switch (normalizarPericiaNpc(nome)) {
    case 'Atirar':
    case 'Conducao':
      return 10
    case 'Atletismo':
    case 'Furtividade':
    case 'Primeiros Socorros':
      return 15
    case 'Lutar':
      return 20
    case 'Ocultismo':
      return 5
    default:
      return 0
  }
}

function obterRetratoNpc(npc: CampanhaNpc) {
  return npc.dadosFichaJson.retratoUrl || npc.imageUrl || ''
}

function normalizarNumeroTresDigitos(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 3)
  return digits ? Number(digits) : 0
}

function calcularEsquiva(destreza: number) {
  return Math.floor(destreza / 2)
}

function normalizarPericiaNpc(nome: string) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function NpcAcompanhamentoCard({
  npc,
  onEditar,
  onExcluir,
  salvando,
}: {
  npc: CampanhaNpc
  onEditar: () => void
  onExcluir: () => void
  salvando: boolean
}) {
  const vidaPercentual = useMemo(() => {
    if (!npc.dadosFichaJson.vidaMaxima || npc.dadosFichaJson.vidaMaxima <= 0) {
      return 0
    }

    return Math.max(0, Math.min(100, Math.round((npc.dadosFichaJson.vidaAtual / npc.dadosFichaJson.vidaMaxima) * 100)))
  }, [npc.dadosFichaJson.vidaAtual, npc.dadosFichaJson.vidaMaxima])

  return (
    <article className="gm-character-card">
      <div className="gm-character-portrait" aria-hidden="true">
        {obterRetratoNpc(npc) ? <img src={obterRetratoNpc(npc)} alt="" /> : <SilhuetaPersonagemIcon />}
      </div>
      <div className="gm-character-info">
        <strong>{npc.nome}</strong>
        <span>{npc.dadosFichaJson.profissao || 'Sem profissao'}</span>
        <div className="gm-life-bar" aria-hidden="true">
          <span style={{ width: `${vidaPercentual}%` }} />
        </div>
      </div>
      <dl className="gm-character-status-list">
        <div className="gm-character-status gm-character-status-life">
          <dt>Vida</dt>
          <dd>
            {npc.dadosFichaJson.vidaAtual} / {npc.dadosFichaJson.vidaMaxima}
          </dd>
        </div>
        <div className="gm-character-status gm-character-status-sanity">
          <dt>Sanidade</dt>
          <dd>{npc.dadosFichaJson.sanidade}</dd>
        </div>
      </dl>
      <div className="gm-npc-actions">
        <button className="ghost-button gm-character-edit-button" type="button" onClick={onEditar}>
          Abrir ficha
        </button>
        <button className="ghost-button gm-danger-button" type="button" onClick={onExcluir} disabled={salvando}>
          Remover
        </button>
      </div>
    </article>
  )
}

function PersonagemAcompanhamentoCard({
  onEditar,
  personagem,
}: {
  onEditar: () => void
  personagem: AcompanhamentoPersonagem
}) {
  const vidaPercentual = useMemo(() => {
    if (!personagem.vidaMaxima || personagem.vidaMaxima <= 0 || personagem.vidaAtual == null) {
      return 0
    }

    return Math.max(0, Math.min(100, Math.round((personagem.vidaAtual / personagem.vidaMaxima) * 100)))
  }, [personagem.vidaAtual, personagem.vidaMaxima])

  return (
    <article className="gm-character-card">
      <div className="gm-character-portrait" aria-hidden="true">
        {personagem.retratoUrl ? <img src={personagem.retratoUrl} alt="" /> : <SilhuetaPersonagemIcon />}
      </div>
      <div className="gm-character-info">
        <strong>{personagem.nome}</strong>
        <span>{personagem.jogadorUsername}</span>
        <div className="gm-life-bar" aria-hidden="true">
          <span style={{ width: `${vidaPercentual}%` }} />
        </div>
      </div>
      <dl className="gm-character-status-list">
        <div className="gm-character-status gm-character-status-life">
          <dt>Vida</dt>
          <dd>
            {personagem.vidaAtual ?? '-'} / {personagem.vidaMaxima ?? '-'}
          </dd>
        </div>
        <div className="gm-character-status gm-character-status-sanity">
          <dt>Sanidade</dt>
          <dd>{personagem.sanidade ?? '-'}</dd>
        </div>
      </dl>
      <button className="ghost-button gm-character-edit-button" type="button" onClick={onEditar}>
        Abrir ficha
      </button>
    </article>
  )
}

function SilhuetaPersonagemIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="22" r="12" />
      <path d="M12 56c0-11.046 8.954-20 20-20s20 8.954 20 20" />
    </svg>
  )
}

function DadoPoliedricoIcon() {
  const [width, height, , , pathData] = faDiceD20.icon
  return <IconeFa path={pathData} width={width} height={height} />
}

function IconeFa({ path, width, height }: { path: string | string[]; width: number; height: number }) {
  const paths = Array.isArray(path) ? path : [path]

  return (
    <svg
      className="coc-skill-roll-icon"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}

function rolarD100() {
  return Math.floor(Math.random() * 100) + 1
}

function formatarData(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function extrairErro(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback
}
