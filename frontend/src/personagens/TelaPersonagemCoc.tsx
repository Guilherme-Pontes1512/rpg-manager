import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { faDiceD20, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { listarCampanhas } from '../campanhas/clienteCampanhas'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import {
  atualizarPersonagemCoc,
  criarPersonagemCoc,
  excluirPersonagemCoc,
  listarPersonagensCoc,
  obterPersonagemCoc,
} from './clientePersonagensCoc'
import type {
  ArmaCoc,
  AtributosCoc,
  FichaCoc,
  PericiaCoc,
  PersonagemCoc,
  PersonagemCocForm,
  PersonagemCocResumo,
  RitualCoc,
} from './tiposPersonagemCoc'
import './TelaPersonagemCoc.css'

type TelaPersonagemCocProps = {
  backLabel?: string
  campanhaId?: number
  campanhaNome?: string
  canCreate?: boolean
  canDelete?: boolean
  initialPersonagemId?: number | null
  onBack?: () => void
  token: string
}

type AtributoConfig = {
  field: keyof AtributosCoc
  label: string
  title: string
}

type CharacterViewMode = 'lista' | 'formulario'

type OcupacaoCoc = {
  nome: string
  pericias: string
}

type SecaoColapsavel = {
  field: keyof Pick<FichaCoc, 'historico' | 'importantes' | 'inventario' | 'aparencia' | 'anotacoes'>
  label: string
}

const ATRIBUTOS: AtributoConfig[] = [
  { field: 'forca', label: 'FOR', title: 'Força' },
  { field: 'destreza', label: 'DES', title: 'Destreza' },
  { field: 'inteligencia', label: 'INT', title: 'Inteligência' },
  { field: 'constituicao', label: 'CON', title: 'Constituição' },
  { field: 'presenca', label: 'PRE', title: 'Presença' },
  { field: 'vontade', label: 'VON', title: 'Vontade' },
]

const PERICIAS_INICIAIS: PericiaCoc[] = [
  { nome: 'Atirar', base: 10, valor: 0, marcada: false },
  { nome: 'Atletismo', base: 15, valor: 0, marcada: false },
  { nome: 'Condução', base: 10, valor: 0, marcada: false },
  { nome: 'Furtividade', base: 15, valor: 0, marcada: false },
  { nome: 'História', base: 10, valor: 0, marcada: false },
  { nome: 'Intimidação', base: 15, valor: 0, marcada: false },
  { nome: 'Investigação', base: 15, valor: 0, marcada: false },
  { nome: 'Lábia', base: 15, valor: 0, marcada: false },
  { nome: 'Lutar', base: 20, valor: 0, marcada: false },
  { nome: 'Mecânica', base: 10, valor: 0, marcada: false },
  { nome: 'Medicina', base: 5, valor: 0, marcada: false },
  { nome: 'Ocultismo', base: 5, valor: 0, marcada: false },
  { nome: 'Percepção', base: 20, valor: 0, marcada: false },
  { nome: 'Prestidigitação', base: 10, valor: 0, marcada: false },
  { nome: 'Primeiros Socorros', base: 15, valor: 0, marcada: false },
  { nome: 'Psicologia', base: 10, valor: 0, marcada: false },
  { nome: 'Tecnologia', base: 10, valor: 0, marcada: false },
]

const OCUPACOES: OcupacaoCoc[] = [
  {
    nome: 'Acadêmico',
    pericias: 'História, Investigação, Lábia, Ocultismo, Psicologia e Tecnologia',
  },
  {
    nome: 'Agente de Saúde',
    pericias: 'Investigação, Lábia, Medicina, Percepção, Primeiros Socorros e Psicologia',
  },
  {
    nome: 'Artista',
    pericias: 'História, Lábia, Percepção, Prestidigitação, Psicologia e Furtividade',
  },
  {
    nome: 'Atleta',
    pericias: 'Atirar, Atletismo, Condução, Intimidação, Lutar e Percepção',
  },
  {
    nome: 'Criminoso',
    pericias: 'Atirar, Furtividade, Intimidação, Lábia, Lutar e Prestidigitação',
  },
  {
    nome: 'Explorador',
    pericias: 'Atletismo, Condução, Furtividade, Investigação, Percepção e Primeiros Socorros',
  },
  {
    nome: 'Investigador',
    pericias: 'Atirar, Furtividade, Investigação, Lábia, Percepção e Psicologia',
  },
  {
    nome: 'Militar',
    pericias: 'Atirar, Atletismo, Furtividade, Intimidação, Lutar e Primeiros Socorros',
  },
  {
    nome: 'Policial',
    pericias: 'Atirar, Atletismo, Condução, Investigação, Intimidação e Percepção',
  },
  {
    nome: 'Profissional',
    pericias: 'História, Intimidação, Investigação, Lábia, Percepção e Psicologia',
  },
  {
    nome: 'Religioso',
    pericias: 'História, Investigação, Lábia, Ocultismo, Primeiros Socorros e Psicologia',
  },
  {
    nome: 'Socialite',
    pericias: 'Intimidação, Lábia, Percepção, Prestidigitação, Psicologia e Sorte (2:1)',
  },
  {
    nome: 'Técnico',
    pericias: 'Condução, Investigação, Mecânica, Percepção, Prestidigitação e Tecnologia',
  },
  {
    nome: 'Trabalhador',
    pericias: 'Atletismo, Condução, Intimidação, Lutar, Mecânica e Percepção',
  },
];

const SECOES_COLAPSAVEIS: SecaoColapsavel[] = [
  { field: 'anotacoes', label: 'Anotações'},
  { field: 'historico', label: 'Histórico' },
  { field: "aparencia", label: 'Aparência' },
  { field: 'importantes', label: 'Importantes' },
  { field: 'inventario', label: 'Inventário' },
]

const ALPHANUMERIC_PATTERN = '[A-Za-zÀ-ÖØ-öø-ÿ0-9 ]*'

function criarFichaInicial(): FichaCoc {
  return {
    atributos: {
      constituicao: 0,
      destreza: 0,
      forca: 0,
      inteligencia: 0,
      presenca: 0,
      vontade: 0,
    },
    armas: [],
    esquiva: 0,
    pericias: PERICIAS_INICIAIS.map((pericia) => ({ ...pericia })),
    profissao: '',
    rituais: [],
    sanidade: 0,
    sorte: 50,
    vidaAtual: 10,
    vidaMaxima: 10,
  }
}

function criarFormularioInicial(campanhaId = ''): PersonagemCocForm {
  return {
    campanhaId,
    ficha: criarFichaInicial(),
    imageUrl: '',
    nome: '',
  }
}

export function TelaPersonagemCoc({
  backLabel = 'Voltar',
  campanhaId,
  campanhaNome,
  canDelete = true,
  canCreate = true,
  initialPersonagemId,
  onBack,
  token,
}: TelaPersonagemCocProps) {
  const { notify } = useNotificacoes()
  const campanhaIdFixo = campanhaId ? String(campanhaId) : ''
  const [form, setForm] = useState<PersonagemCocForm>(() => criarFormularioInicial(campanhaIdFixo))
  const [campanhasPorId, setCampanhasPorId] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [personagens, setPersonagens] = useState<PersonagemCocResumo[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vidaMaximaEmEdicao, setVidaMaximaEmEdicao] = useState<string | null>(null)
  const [esquivaManual, setEsquivaManual] = useState(false)
  const [viewMode, setViewMode] = useState<CharacterViewMode>('lista')

  useEffect(() => {
    void carregarPersonagens()
  }, [token, campanhaId])

  useEffect(() => {
    if (!initialPersonagemId) {
      return
    }

    void abrirFichaPersonagem(initialPersonagemId)
  }, [initialPersonagemId])

  useEffect(() => {
    if (!campanhaIdFixo) {
      return
    }

    setForm((current) => ({ ...current, campanhaId: campanhaIdFixo }))
  }, [campanhaIdFixo])

  const vidaPercentual = useMemo(() => {
    if (form.ficha.vidaMaxima <= 0) {
      return 0
    }

    return Math.min(100, Math.round((form.ficha.vidaAtual / form.ficha.vidaMaxima) * 100))
  }, [form.ficha.vidaAtual, form.ficha.vidaMaxima])

  async function carregarPersonagens() {
    setLoading(true)

    try {
      const [lista, campanhas] = await Promise.all([
        listarPersonagensCoc(token, campanhaId),
        campanhaId ? Promise.resolve([]) : listarCampanhas(token),
      ])

      setPersonagens(lista)
      setCampanhasPorId(
        campanhas.reduce<Record<number, string>>((acc, campanha) => {
          acc[campanha.id] = campanha.nome
          return acc
        }, {}),
      )
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel carregar personagens.'))
    } finally {
      setLoading(false)
    }
  }

  function obterNomeCampanhaPersonagem(personagem: PersonagemCocResumo) {
    if (campanhaId && personagem.campanhaId === campanhaId) {
      return campanhaNome ?? campanhasPorId[personagem.campanhaId] ?? 'Campanha sem nome'
    }

    return campanhasPorId[personagem.campanhaId] ?? 'Campanha sem nome'
  }

  function carregarNoFormulario(personagem: PersonagemCoc) {
    const fichaPadrao = criarFichaInicial()
    const atributos = {
      ...fichaPadrao.atributos,
      ...personagem.dadosFichaJson.atributos,
    }
    const esquiva = personagem.dadosFichaJson.esquiva ?? calcularEsquiva(atributos.destreza)
    const sorte = personagem.dadosFichaJson.sorte ?? personagem.dadosFichaJson.pontosDeDestino ?? fichaPadrao.sorte
    const ocupacao = obterOcupacaoFicha(personagem.dadosFichaJson)
    const ocupacaoPericias = personagem.dadosFichaJson.ocupacaoPericias
      ?? personagem.dadosFichaJson.origemPericias
      ?? OCUPACOES.find((item) => item.nome === ocupacao)?.pericias
      ?? ''

    setForm({
      campanhaId: String(personagem.campanhaId),
      ficha: {
        ...fichaPadrao,
        ...personagem.dadosFichaJson,
        atributos,
        esquiva,
        pericias:
          personagem.dadosFichaJson.pericias?.length > 0
            ? normalizarPericias(personagem.dadosFichaJson.pericias)
            : fichaPadrao.pericias,
        armas: normalizarArmas(personagem.dadosFichaJson.armas),
        ocupacao,
        ocupacaoPericias,
        profissao: obterProfissaoFicha(personagem.dadosFichaJson),
        rituais: normalizarRituais(personagem.dadosFichaJson.rituais),
        origem: undefined,
        origemPericias: undefined,
        pontosDeDestino: undefined,
        sorte,
      },
      id: personagem.id,
      imageUrl: personagem.imageUrl ?? '',
      nome: personagem.nome,
    })
    setEsquivaManual(esquiva !== calcularEsquiva(atributos.destreza))
    setViewMode('formulario')
  }

  async function abrirFichaPersonagem(personagemId?: number) {
    if (!personagemId) {
      notify('error', 'Nao foi possivel identificar o personagem selecionado.')
      return
    }

    setSaving(true)

    try {
      const personagem = await obterPersonagemCoc(token, personagemId)
      carregarNoFormulario(personagem)
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel abrir a ficha do personagem.'))
    } finally {
      setSaving(false)
    }
  }

  function iniciarNovaFicha() {
    setForm(criarFormularioInicial(campanhaIdFixo))
    setEsquivaManual(false)
    setViewMode('formulario')
  }

  function voltarParaLista() {
    setViewMode('lista')
  }

  async function handleDeletePersonagem() {
    if (!form.id) {
      return
    }

    setSaving(true)

    try {
      await excluirPersonagemCoc(token, form.id)
      setShowDeleteConfirm(false)
      setForm(criarFormularioInicial(campanhaIdFixo))
      setViewMode('lista')
      await carregarPersonagens()
      notify('success', 'Personagem excluido com sucesso.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel excluir o personagem.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const campanhaIdPayload = Number(form.campanhaId)
    if (!campanhaIdPayload) {
      notify('error', 'Nao foi possivel identificar a campanha da ficha.')
      return
    }

    setSaving(true)

    try {
      const payload: PersonagemCoc = {
        campanhaId: campanhaIdPayload,
        dadosFichaJson: prepararFichaParaSalvar(form.ficha),
        nome: form.nome.trim(),
        status: 'ATIVO',
      }

      const salvo = form.id
        ? await atualizarPersonagemCoc(token, form.id, payload)
        : await criarPersonagemCoc(token, payload)

      carregarNoFormulario(preservarDadosFichaEnviados(salvo, payload.dadosFichaJson))
      await carregarPersonagens()
      notify('success', 'Ficha de personagem salva.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel salvar a ficha.'))
    } finally {
      setSaving(false)
    }
  }

  function atualizarAtributo(field: keyof AtributosCoc, value: string) {
    const numero = normalizarNumeroTresDigitos(value)
    setForm((current) => {
      const atributos = {
        ...current.ficha.atributos,
        [field]: numero,
      }

      return {
        ...current,
        ficha: {
          ...current.ficha,
          atributos,
          esquiva: field === 'destreza' && !esquivaManual ? calcularEsquiva(numero) : current.ficha.esquiva,
        },
      }
    })
  }

  function atualizarEsquiva(value: string) {
    setEsquivaManual(true)
    atualizarCampoFicha('esquiva', normalizarNumeroTresDigitos(value))
  }

  function atualizarVida(delta: number) {
    setForm((current) => {
      const vidaAtual = Math.max(0, Math.min(current.ficha.vidaMaxima, current.ficha.vidaAtual + delta))
      return {
        ...current,
        ficha: {
          ...current.ficha,
          vidaAtual,
        },
      }
    })
  }

  function atualizarVidaAtual(value: string) {
    const vidaAtual = normalizarNumeroTresDigitos(value)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        vidaAtual: Math.max(0, Math.min(current.ficha.vidaMaxima, vidaAtual)),
      },
    }))
  }

  function atualizarVidaMaxima(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 3)
    setVidaMaximaEmEdicao(digits)

    if (!digits) {
      return
    }

    const vidaMaxima = Math.max(1, Number(digits))
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        vidaAtual: Math.min(current.ficha.vidaAtual, vidaMaxima),
        vidaMaxima,
      },
    }))
  }

  function finalizarEdicaoVidaMaxima() {
    setForm((current) => {
      const vidaMaxima = Math.max(1, current.ficha.vidaMaxima)
      return {
        ...current,
        ficha: {
          ...current.ficha,
          vidaAtual: Math.min(current.ficha.vidaAtual, vidaMaxima),
          vidaMaxima,
        },
      }
    })
    setVidaMaximaEmEdicao(null)
  }

  function atualizarPericia(index: number, value: string) {
    const numero = normalizarNumeroTresDigitos(value)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        pericias: current.ficha.pericias.map((pericia, periciaIndex) =>
          periciaIndex === index ? { ...pericia, valor: numero } : pericia,
        ),
      },
    }))
  }

  function atualizarPericiaMarcada(index: number, marcada: boolean) {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        pericias: current.ficha.pericias.map((pericia, periciaIndex) =>
          periciaIndex === index ? { ...pericia, marcada } : pericia,
        ),
      },
    }))
  }

  function rolarPericia(pericia: PericiaCoc) {
    const resultado = rolarD100()
    const sucesso = resultado <= pericia.valor
    const mensagemResultado = sucesso ? 'sucesso' : 'falha'

    notify(
      'info',
      `${pericia.nome}: 1d100 = ${resultado} contra ${pericia.valor} (${mensagemResultado}).`,
    )
  }

  function rolarAtributo(atributo: AtributoConfig) {
    const valor = form.ficha.atributos[atributo.field]
    const resultado = rolarD100()
    const sucesso = resultado <= valor
    const mensagemResultado = sucesso ? 'sucesso' : 'falha'

    notify(
      'info',
      `${atributo.title}: 1d100 = ${resultado} contra ${valor} (${mensagemResultado}).`,
    )
  }

  function atualizarCampoFicha<K extends keyof FichaCoc>(field: K, value: FichaCoc[K]) {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        [field]: value,
      },
    }))
  }

  function adicionarArma() {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        armas: [
          ...(current.ficha.armas ?? []),
          {
            alcance: '',
            arma: '',
            dano: '',
            modificador: '',
            municao: '',
          },
        ],
      },
    }))
  }

  function atualizarArma(index: number, field: keyof ArmaCoc, value: string) {
    const valor = normalizarAlfanumerico(value)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        armas: (current.ficha.armas ?? []).map((arma, armaIndex) =>
          armaIndex === index ? { ...arma, [field]: valor } : arma,
        ),
      },
    }))
  }

  function removerArma(index: number) {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        armas: (current.ficha.armas ?? []).filter((_, armaIndex) => armaIndex !== index),
      },
    }))
  }

  function adicionarRitual() {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        rituais: [
          ...(current.ficha.rituais ?? []),
          {
            alvo: '',
            custo: '',
            descricao: '',
            ritual: '',
          },
        ],
      },
    }))
  }

  function atualizarRitual(index: number, field: keyof RitualCoc, value: string) {
    const valor = field === 'descricao' ? normalizarTextoAlfanumerico(value) : normalizarAlfanumerico(value)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        rituais: (current.ficha.rituais ?? []).map((ritual, ritualIndex) =>
          ritualIndex === index ? { ...ritual, [field]: valor } : ritual,
        ),
      },
    }))
  }

  function removerRitual(index: number) {
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        rituais: (current.ficha.rituais ?? []).filter((_, ritualIndex) => ritualIndex !== index),
      },
    }))
  }

  function atualizarOcupacao(nome: string) {
    const ocupacao = OCUPACOES.find((item) => item.nome === nome)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        ocupacao: ocupacao?.nome ?? '',
        ocupacaoPericias: ocupacao?.pericias ?? '',
        origem: undefined,
        origemPericias: undefined,
      },
    }))
  }

  function importarRetrato(file: File | null) {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        ficha: {
          ...current.ficha,
          retratoUrl: typeof reader.result === 'string' ? reader.result : current.ficha.retratoUrl,
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="coc-screen">
      <header className="coc-topline">
        <div>
          <span className="panel-tag">Call of Cthulhu</span>
          <h1>Ficha de investigador</h1>
        </div>
        <div className="coc-top-actions">
          {viewMode === 'lista' ? (
            canCreate ? (
              <button className="primary-button" type="button" onClick={iniciarNovaFicha}>
              Criar novo personagem
              </button>
            ) : null
          ) : null}
          {viewMode === 'lista' && onBack ? (
            <button className="ghost-button" type="button" onClick={onBack}>
              {backLabel}
            </button>
          ) : null}
        </div>
      </header>

      {viewMode === 'lista' ? (
        <section className="panel-surface coc-list-panel">
          <h2>Personagens</h2>
          {loading ? <p className="panel-hint">Carregando fichas...</p> : null}
          {!loading && personagens.length === 0 ? (
            <p className="panel-hint">Nenhuma ficha CoC salva ainda.</p>
          ) : null}
          <div className="coc-character-grid">
            {personagens.map((personagem) => (
              <button
                key={personagem.id}
                className={form.id === personagem.id ? 'coc-character-card active' : 'coc-character-card'}
                type="button"
                onClick={() => void abrirFichaPersonagem(personagem.id)}
                disabled={saving}
              >
                <div className="coc-character-card-portrait" aria-hidden="true">
                  {obterRetratoPersonagem(personagem) ? (
                    <img src={obterRetratoPersonagem(personagem)} alt="" />
                  ) : (
                    <SilhuetaPersonagemIcon />
                  )}
                </div>
                <div className="coc-character-card-body">
                <strong>{personagem.nome}</strong>
                <span>{obterNomeCampanhaPersonagem(personagem)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="coc-form-view">
          <div className="coc-form-toolbar">
            <button className="ghost-button" type="button" onClick={voltarParaLista}>
              Voltar para personagens
            </button>
            {form.id && canDelete ? (
              <button
                className="coc-delete-button"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Excluir personagem"
                title="Excluir personagem"
              >
                <IconeFa path={faTrashCan.icon[4]} width={faTrashCan.icon[0]} height={faTrashCan.icon[1]} />
              </button>
            ) : null}
          </div>

          <form className="panel-surface coc-sheet" onSubmit={(event) => void handleSubmit(event)}>
            <div className="coc-identity-row">
              <label>
                Nome do personagem
                <input
                  required
                  value={form.nome}
                  onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                  placeholder="Ex.: Eleanor Marsh"
                />
              </label>
              <input type="hidden" value={form.campanhaId} readOnly />
            </div>

            <section className="coc-attributes-panel" aria-label="Atributos base">
                <div className="coc-attribute-grid">
                  {ATRIBUTOS.map((atributo) => (
                    <div className="coc-attribute" key={atributo.field}>
                      <div className="coc-attribute-header">
                        <span>{atributo.label}</span>
                        <button
                          type="button"
                          className="coc-skill-roll coc-attribute-roll"
                          onClick={() => rolarAtributo(atributo)}
                          aria-label={`Rolar 1d100 para ${atributo.title}`}
                          title={`Rolar 1d100 para ${atributo.title}`}
                        >
                          <DadoPoliedricoIcon />
                        </button>
                      </div>
                      <small>{atributo.title}</small>
                      <input
                        aria-label={`${atributo.title} valor`}
                        inputMode="numeric"
                        maxLength={3}
                        pattern="[0-9]*"
                        value={form.ficha.atributos[atributo.field]}
                        onChange={(event) => atualizarAtributo(atributo.field, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
            </section>

            <div className="coc-main-row">
              <section className="coc-vitals-panel">
                <section className="coc-portrait-panel" aria-label="Retrato do personagem">
                  <label className="coc-portrait-preview">
                    {form.ficha.retratoUrl ? (
                      <img src={form.ficha.retratoUrl} alt={`Retrato de ${form.nome || 'personagem'}`} />
                    ) : (
                      <span>Retrato</span>
                    )}
                    <input
                      accept="image/*"
                      type="file"
                      onChange={(event) => importarRetrato(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </section>

                <div className="coc-life-header">
                  <h2>Vida</h2>
                </div>
                <div className="coc-life-bar" aria-label={`Vida em ${vidaPercentual}%`}>
                  <span className="coc-life-fill" style={{ width: `${vidaPercentual}%` }} />
                  <div className="coc-life-inline-fields" aria-label="Vida atual e vida maxima">
                    <input
                      aria-label="Vida atual"
                      inputMode="numeric"
                      maxLength={3}
                      pattern="[0-9]*"
                      value={form.ficha.vidaAtual}
                      onChange={(event) => atualizarVidaAtual(event.target.value)}
                    />
                    <span>/</span>
                    <input
                      aria-label="Vida maxima"
                      inputMode="numeric"
                      maxLength={3}
                      pattern="[0-9]*"
                      value={vidaMaximaEmEdicao ?? form.ficha.vidaMaxima}
                      onChange={(event) => atualizarVidaMaxima(event.target.value)}
                      onBlur={finalizarEdicaoVidaMaxima}
                    />
                  </div>
                </div>
                <div className="coc-life-actions">
                  <button type="button" onClick={() => atualizarVida(-5)} aria-label="Reduzir vida em 5">
                    -5
                  </button>
                  <button type="button" onClick={() => atualizarVida(-1)} aria-label="Reduzir vida em 1">
                    -1
                  </button>
                  <button type="button" onClick={() => atualizarVida(1)} aria-label="Aumentar vida em 1">
                    +1
                  </button>
                  <button type="button" onClick={() => atualizarVida(5)} aria-label="Aumentar vida em 5">
                    +5
                  </button>
                </div>

                <h2>Sanidade</h2>
                <div className="coc-sanidade-row" aria-label="Sanidade">
                  {Array.from({ length: 11 }, (_, index) => index - 5).map((valor) => (
                    <button
                      key={valor}
                      className={form.ficha.sanidade === valor ? 'active' : ''}
                      type="button"
                      onClick={() => atualizarCampoFicha('sanidade', valor)}
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
                      value={form.ficha.esquiva}
                      onChange={(event) => atualizarEsquiva(event.target.value)}
                    />
                  </label>
                </div>

                <div className="coc-vital-field">
                  <label>
                    Sorte
                    <input
                      inputMode="numeric"
                      maxLength={3}
                      pattern="[0-9]*"
                      value={form.ficha.sorte}
                      onChange={(event) => atualizarCampoFicha('sorte', normalizarNumeroTresDigitos(event.target.value))}
                    />
                  </label>
                </div>

                <section className="coc-origin-panel">
                  <h2>Ocupação</h2>
                  <label>
                    Selecione uma ocupação
                    <select
                      value={obterOcupacaoFicha(form.ficha)}
                      onChange={(event) => atualizarOcupacao(event.target.value)}
                    >
                      <option value="">Escolha...</option>
                      {OCUPACOES.map((ocupacao) => (
                        <option key={ocupacao.nome} value={ocupacao.nome}>
                          {ocupacao.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Profissão
                    <input
                      value={form.ficha.profissao ?? ''}
                      onChange={(event) => atualizarCampoFicha('profissao', event.target.value)}
                      placeholder="Ex.: professor universitário"
                    />
                  </label>
                  {obterOcupacaoFicha(form.ficha) ? (
                    <dl className="coc-origin-details">
                      <dt>Perícias</dt>
                      <dd>{form.ficha.ocupacaoPericias}</dd>
                    </dl>
                  ) : null}
                </section>
              </section>

              <section className="coc-skills-panel">
                <div className="coc-skills-header">
                  <h2>Pericias</h2>
                  <span>Base / Normal / Bom / Extremo</span>
                </div>
                <div className="coc-skill-list">
                  {form.ficha.pericias.map((pericia, index) => (
                    <div className="coc-skill" key={pericia.nome}>
                      <span className="coc-skill-name">
                        <input
                          type="checkbox"
                          checked={pericia.marcada ?? false}
                          onChange={(event) => atualizarPericiaMarcada(index, event.target.checked)}
                          aria-label={`Marcar ${pericia.nome}`}
                        />
                        <button
                          type="button"
                          className="coc-skill-roll"
                          onClick={() => rolarPericia(pericia)}
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
                          onChange={(event) => atualizarPericia(index, event.target.value)}
                        />
                        <output>{Math.floor(pericia.valor / 2)}</output>
                        <output>{Math.floor(pericia.valor / 5)}</output>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="coc-notes-panel">
                {SECOES_COLAPSAVEIS.map((secao) => (
                  <details key={secao.field} className="coc-note-section">
                    <summary>{secao.label}</summary>
                    <textarea
                      rows={6}
                      value={form.ficha[secao.field] ?? ''}
                      onChange={(event) => atualizarCampoFicha(secao.field, event.target.value)}
                      placeholder={`Escreva ${secao.label.toLowerCase()} aqui...`}
                    />
                  </details>
                ))}
                <details className="coc-note-section coc-weapons-section" open>
                  <summary className="coc-weapons-summary">
                    <span>Armas</span>
                    <button
                        className="coc-add-weapon-button"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          adicionarArma()
                        }}
                        aria-label="Adicionar arma"
                        title="Adicionar arma"
                    >
                      <IconeFa path={faPlus.icon[4]} width={faPlus.icon[0]} height={faPlus.icon[1]} />
                    </button>
                  </summary>
                  <div className="coc-weapons-content">
                    {(form.ficha.armas ?? []).length === 0 ? (
                        <p className="panel-hint">Nenhuma arma cadastrada.</p>
                    ) : null}
                    {(form.ficha.armas ?? []).map((arma, index) => (
                        <details className="coc-weapon-card" key={index} open>
                          <summary className="coc-weapon-card-header">
                            <span>{arma.arma || `Arma ${index + 1}`}</span>
                            <button
                                className="coc-delete-button"
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  removerArma(index)
                                }}
                                aria-label={`Remover arma ${index + 1}`}
                                title="Remover arma"
                            >
                              <IconeFa path={faTrashCan.icon[4]} width={faTrashCan.icon[0]} height={faTrashCan.icon[1]} />
                            </button>
                          </summary>
                          <div className="coc-weapon-fields">
                            <label>
                              Arma
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={arma.arma}
                                  onChange={(event) => atualizarArma(index, 'arma', event.target.value)}
                              />
                            </label>
                            <label>
                              Alcance
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={arma.alcance}
                                  onChange={(event) => atualizarArma(index, 'alcance', event.target.value)}
                              />
                            </label>
                            <label>
                              Dano
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={arma.dano}
                                  onChange={(event) => atualizarArma(index, 'dano', event.target.value)}
                              />
                            </label>
                            <label>
                              Munição
                              <input
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={arma.municao ?? ''}
                                  onChange={(event) => atualizarArma(index, 'municao', event.target.value)}
                              />
                            </label>
                            <label>
                              Modificador
                              <input
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={arma.modificador ?? ''}
                                  onChange={(event) => atualizarArma(index, 'modificador', event.target.value)}
                              />
                            </label>
                          </div>
                        </details>
                    ))}
                  </div>
                </details>
                <details className="coc-note-section coc-rituals-section" open>
                  <summary className="coc-rituals-summary">
                    <span>Rituais</span>
                    <button
                        className="coc-add-ritual-button"
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          adicionarRitual()
                        }}
                        aria-label="Adicionar ritual"
                        title="Adicionar ritual"
                    >
                      <IconeFa path={faPlus.icon[4]} width={faPlus.icon[0]} height={faPlus.icon[1]} />
                    </button>
                  </summary>
                  <div className="coc-rituals-content">
                    {(form.ficha.rituais ?? []).length === 0 ? (
                        <p className="panel-hint">Nenhum ritual cadastrado.</p>
                    ) : null}
                    {(form.ficha.rituais ?? []).map((ritual, index) => (
                        <details className="coc-ritual-card" key={index} open>
                          <summary className="coc-ritual-card-header">
                            <span>{ritual.ritual || `Ritual ${index + 1}`}</span>
                            <button
                                className="coc-delete-button"
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  removerRitual(index)
                                }}
                                aria-label={`Remover ritual ${index + 1}`}
                                title="Remover ritual"
                            >
                              <IconeFa path={faTrashCan.icon[4]} width={faTrashCan.icon[0]} height={faTrashCan.icon[1]} />
                            </button>
                          </summary>
                          <div className="coc-ritual-fields">
                            <label>
                              Ritual
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={ritual.ritual}
                                  onChange={(event) => atualizarRitual(index, 'ritual', event.target.value)}
                              />
                            </label>
                            <label>
                              Custo
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={ritual.custo}
                                  onChange={(event) => atualizarRitual(index, 'custo', event.target.value)}
                              />
                            </label>
                            <label>
                              Alvo
                              <input
                                  required
                                  pattern={ALPHANUMERIC_PATTERN}
                                  value={ritual.alvo}
                                  onChange={(event) => atualizarRitual(index, 'alvo', event.target.value)}
                              />
                            </label>
                            <label className="coc-ritual-description">
                              Descrição
                              <textarea
                                  required
                                  rows={7}
                                  value={ritual.descricao}
                                  onChange={(event) => atualizarRitual(index, 'descricao', event.target.value)}
                              />
                            </label>
                          </div>
                        </details>
                    ))}
                  </div>
                </details>
              </aside>
            </div>

            <button className="primary-button form-submit-button" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar ficha CoC'}
            </button>
          </form>
        </div>
      )}

      {showDeleteConfirm ? (
        <div className="coc-modal-backdrop" role="presentation">
          <div className="coc-modal" role="dialog" aria-modal="true" aria-labelledby="delete-character-title">
            <h2 id="delete-character-title">Excluir personagem</h2>
            <p>Tem certeza que quer excluir este personagem?</p>
            <div className="coc-modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowDeleteConfirm(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="primary-button coc-danger-button" type="button" onClick={() => void handleDeletePersonagem()} disabled={saving}>
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function normalizarNumeroTresDigitos(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 3)
  return digits ? Number(digits) : 0
}

function calcularEsquiva(destreza: number) {
  return Math.floor(destreza / 2)
}

function prepararFichaParaSalvar(ficha: FichaCoc): FichaCoc {
  const { pontosDeDestino, ...fichaAtualizada } = ficha
  const ocupacao = obterOcupacaoFicha(fichaAtualizada)
  const ocupacaoPericias = OCUPACOES.find((item) => item.nome === ocupacao)?.pericias ?? fichaAtualizada.ocupacaoPericias ?? ''

  return {
    ...fichaAtualizada,
    ocupacao,
    ocupacaoPericias,
    pericias: fichaAtualizada.pericias.map((pericia) => ({
      ...pericia,
      marcada: pericia.marcada ?? false,
    })),
    profissao: obterProfissaoFicha(fichaAtualizada).trim(),
    origem: undefined,
    origemPericias: undefined,
  }
}

function preservarDadosFichaEnviados(personagem: PersonagemCoc, fichaEnviada: FichaCoc): PersonagemCoc {
  const profissaoSalva = personagem.dadosFichaJson.profissao?.trim()
  const marcacoesEnviadas = new Map(fichaEnviada.pericias.map((pericia) => [pericia.nome, pericia.marcada ?? false]))
  const pericias = personagem.dadosFichaJson.pericias?.map((pericia) => ({
    ...pericia,
    marcada: pericia.marcada ?? marcacoesEnviadas.get(pericia.nome) ?? false,
  }))

  return {
    ...personagem,
    dadosFichaJson: {
      ...personagem.dadosFichaJson,
      pericias: pericias ?? fichaEnviada.pericias,
      profissao: profissaoSalva ? personagem.dadosFichaJson.profissao : fichaEnviada.profissao ?? '',
    },
  }
}

function normalizarAlfanumerico(value: string) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 ]/g, '')
}

function normalizarTextoAlfanumerico(value: string) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9 \r\n]/g, '')
}

function rolarD100() {
  return Math.floor(Math.random() * 100) + 1
}

function obterRetratoPersonagem(personagem: PersonagemCocResumo | PersonagemCoc) {
  if ('dadosFichaJson' in personagem) {
    return personagem.dadosFichaJson.retratoUrl || personagem.imageUrl || ''
  }

  return personagem.imageUrl || ''
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

function SilhuetaPersonagemIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="22" r="12" />
      <path d="M12 56c0-11.046 8.954-20 20-20s20 8.954 20 20" />
    </svg>
  )
}

function normalizarPericias(pericias: PericiaCoc[]) {
  return pericias.map((pericia) => ({
    ...pericia,
    base: pericia.base ?? PERICIAS_INICIAIS.find(({ nome }) => nome === pericia.nome)?.base ?? 0,
    marcada: pericia.marcada ?? false,
  }))
}

function ocupacaoExiste(nome?: string) {
  return Boolean(nome && OCUPACOES.some((ocupacao) => ocupacao.nome === nome))
}

function obterOcupacaoFicha(ficha: FichaCoc) {
  if (ocupacaoExiste(ficha.ocupacao)) {
    return ficha.ocupacao ?? ''
  }

  if (ocupacaoExiste(ficha.origem)) {
    return ficha.origem ?? ''
  }

  return ficha.ocupacao ?? ficha.origem ?? ''
}

function obterProfissaoFicha(ficha: FichaCoc) {
  if (ficha.profissao !== undefined) {
    return ficha.profissao
  }

  return ficha.ocupacao && !ocupacaoExiste(ficha.ocupacao) ? ficha.ocupacao : ''
}

function normalizarArmas(armas: unknown): ArmaCoc[] {
  if (typeof armas === 'string' && armas.trim()) {
    return [
      {
        alcance: '',
        arma: normalizarAlfanumerico(armas),
        dano: '',
        modificador: '',
        municao: '',
      },
    ]
  }

  if (!Array.isArray(armas)) {
    return []
  }

  return armas.map((arma) => {
    const entrada = arma as Partial<ArmaCoc>
    return {
      alcance: normalizarAlfanumerico(entrada.alcance ?? ''),
      arma: normalizarAlfanumerico(entrada.arma ?? ''),
      dano: normalizarAlfanumerico(entrada.dano ?? ''),
      modificador: normalizarAlfanumerico(entrada.modificador ?? ''),
      municao: normalizarAlfanumerico(entrada.municao ?? ''),
    }
  })
}

function normalizarRituais(rituais: unknown): RitualCoc[] {
  if (typeof rituais === 'string' && rituais.trim()) {
    return [
      {
        alvo: '',
        custo: '',
        descricao: normalizarTextoAlfanumerico(rituais),
        ritual: '',
      },
    ]
  }

  if (!Array.isArray(rituais)) {
    return []
  }

  return rituais.map((ritual) => {
    const entrada = ritual as Partial<RitualCoc>
    return {
      alvo: normalizarAlfanumerico(entrada.alvo ?? ''),
      custo: normalizarAlfanumerico(entrada.custo ?? ''),
      descricao: normalizarTextoAlfanumerico(entrada.descricao ?? ''),
      ritual: normalizarAlfanumerico(entrada.ritual ?? ''),
    }
  })
}

function extrairErro(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback
}
