import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { faDiceD20, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import {
  atualizarPersonagemCoc,
  criarPersonagemCoc,
  excluirPersonagemCoc,
  listarPersonagensCoc,
} from './clientePersonagensCoc'
import type { AtributosCoc, FichaCoc, PericiaCoc, PersonagemCoc, PersonagemCocForm } from './tiposPersonagemCoc'
import './TelaPersonagemCoc.css'

type TelaPersonagemCocProps = {
  backLabel?: string
  campanhaId?: number
  canCreate?: boolean
  onBack?: () => void
  token: string
}

type AtributoConfig = {
  field: keyof AtributosCoc
  label: string
  title: string
}

type CharacterViewMode = 'lista' | 'formulario'

type OrigemCoc = {
  buff: string
  habilidade: string
  nome: string
  pericias: string
}

type SecaoColapsavel = {
  field: keyof Pick<FichaCoc, 'armas' | 'historico' | 'importantes' | 'inventario' | 'rituais' | 'aparencia' | 'anotacoes'>
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
  { nome: 'Atirar', base: 10, valor: 0 },
  { nome: 'Atletismo', base: 20, valor: 0 },
  { nome: 'Ciencias', base: 10, valor: 0 },
  { nome: 'Furtividade', base: 15, valor: 0 },
  { nome: 'Historia', base: 10, valor: 0 },
  { nome: 'Intimidacao', base: 15, valor: 0 },
  { nome: 'Investigacao', base: 20, valor: 0 },
  { nome: 'Labia', base: 15, valor: 0 },
  { nome: 'Lutar', base: 20, valor: 0 },
  { nome: 'Mecanica', base: 10, valor: 0 },
  { nome: 'Medicina', base: 5, valor: 0 },
  { nome: 'Ocultismo', base: 5, valor: 0 },
  { nome: 'Percepcao', base: 20, valor: 0 },
  { nome: 'Pilotagem', base: 20, valor: 0 },
  { nome: 'Prestidigitacao', base: 10, valor: 0 },
  { nome: 'Primeiros Socorros', base: 15, valor: 0 },
  { nome: 'Psicologia', base: 10, valor: 0 },
  { nome: 'Tecnologia', base: 10, valor: 0 },
]

const ORIGENS: OrigemCoc[] = [
  {
    nome: 'Acadêmico',
    habilidade: 'Conhecimento aplicado',
    buff: 'Recebe +10% em um teste de pericia que nao seja de combate. Uma vez por cena.',
    pericias: 'Ciências e História',
  },
  {
    nome: 'Agente de Saúde',
    habilidade: 'Tecnica medicinal',
    buff: 'Cura +1d4 quando fizer um teste de Primeiros Socorros. Uma vez por cena. Alem disso, pode usar Medicina no lugar de Primeiros Socorros.',
    pericias: 'Medicina/Primeiros socorros e Ciências',
  },
  {
    nome: 'Atleta',
    habilidade: 'Condicionamento extremo',
    buff: 'Ignora penalidades de terreno difícil e exaustão.',
    pericias: 'Atletismo e Percepção',
  },
  {
    nome: 'Criminoso',
    habilidade: 'Jogo sujo',
    buff: 'Substitui um teste, que não seja de combate, por Lábia ou Prestidigitação. Uma vez por sessão.',
    pericias: 'Furtividade e Prestidigitação',
  },
  {
    nome: 'Cultista Arrependido',
    habilidade: 'Conhecimento proibido',
    buff: 'Pode receber vantagem em um teste, em troca de -1 de sanidade.',
    pericias: 'Ocultismo e Psicologia',
  },
  {
    nome: 'Investigador',
    habilidade: 'Faro pra pistas',
    buff: 'Pode refazer um teste de Investigação falho. Uma vez por cena.',
    pericias: 'Investigação e Percepção',
  },
  {
    nome: 'Lutador',
    habilidade: 'Mão pesada',
    buff: 'Causa +1 de dano corpo a corpo.',
    pericias: 'Lutar e Atletismo',
  },
  {
    nome: 'Mercenário',
    habilidade: 'Treino de combate',
    buff: 'Saca, guarda e recarrega armas de fogo livremente. Uma vez por turno.',
    pericias: 'Furtividade e Atirar',
  },
  {
    nome: 'Policial',
    habilidade: 'Alerta constante',
    buff: 'Recebe +1 de redução de dano.',
    pericias: 'Atirar e Atletismo',
  },
  {
    nome: 'Psicólogo',
    habilidade: 'Terapia emocional',
    buff: 'Cura +1 de sanidade de até dois alvos. Uma vez por sessão.',
    pericias: 'Psicologia e Ciências',
  },
  {
    nome: 'Religioso',
    habilidade: 'Palavra de esperança',
    buff: 'Remove uma condição de Loucura temporária de um aliado. Uma vez por sessão.',
    pericias: 'História e Psicologia',
  },
  {
    nome: 'Técnico',
    habilidade: 'Procedimento técnico',
    buff: 'Usando ferramenta ou dispositivo tecnológico e gastar mais tempo, reduz em um nível a dificuldade de um teste. Uma vez por cena.',
    pericias: 'Mecânica e Tecnologia',
  },
]

const SECOES_COLAPSAVEIS: SecaoColapsavel[] = [
  { field: 'anotacoes', label: 'Anotações'},
  { field: 'historico', label: 'Histórico' },
  { field: "aparencia", label: 'Aparência' },
  { field: 'importantes', label: 'Importantes' },
  { field: 'inventario', label: 'Inventário' },
  { field: 'armas', label: 'Armas' },
  { field: 'rituais', label: 'Rituais' },
]

function criarFichaInicial(): FichaCoc {
  return {
    atributos: {
      constituicao: 50,
      destreza: 50,
      forca: 50,
      inteligencia: 50,
      presenca: 50,
      vontade: 50,
    },
    pericias: PERICIAS_INICIAIS.map((pericia) => ({ ...pericia })),
    pontosDeDestino: 0,
    sanidade: 0,
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
  canCreate = true,
  onBack,
  token,
}: TelaPersonagemCocProps) {
  const { notify } = useNotificacoes()
  const campanhaIdFixo = campanhaId ? String(campanhaId) : ''
  const [form, setForm] = useState<PersonagemCocForm>(() => criarFormularioInicial(campanhaIdFixo))
  const [loading, setLoading] = useState(true)
  const [personagens, setPersonagens] = useState<PersonagemCoc[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vidaMaximaEmEdicao, setVidaMaximaEmEdicao] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<CharacterViewMode>('lista')

  useEffect(() => {
    void carregarPersonagens()
  }, [token, campanhaId])

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
      const lista = await listarPersonagensCoc(token, campanhaId)
      setPersonagens(lista)
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel carregar personagens.'))
    } finally {
      setLoading(false)
    }
  }

  function carregarNoFormulario(personagem: PersonagemCoc) {
    const fichaPadrao = criarFichaInicial()
    setForm({
      campanhaId: String(personagem.campanhaId),
      ficha: {
        ...fichaPadrao,
        ...personagem.dadosFichaJson,
        atributos: {
          ...fichaPadrao.atributos,
          ...personagem.dadosFichaJson.atributos,
        },
        pericias:
          personagem.dadosFichaJson.pericias?.length > 0
            ? normalizarPericias(personagem.dadosFichaJson.pericias)
            : fichaPadrao.pericias,
      },
      id: personagem.id,
      imageUrl: personagem.imageUrl ?? '',
      nome: personagem.nome,
    })
    setViewMode('formulario')
  }

  function iniciarNovaFicha() {
    setForm(criarFormularioInicial(campanhaIdFixo))
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
        dadosFichaJson: form.ficha,
        nome: form.nome.trim(),
        status: 'ATIVO',
      }

      const salvo = form.id
        ? await atualizarPersonagemCoc(token, form.id, payload)
        : await criarPersonagemCoc(token, payload)

      carregarNoFormulario(salvo)
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
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        atributos: {
          ...current.ficha.atributos,
          [field]: numero,
        },
      },
    }))
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

  function atualizarOrigem(nome: string) {
    const origem = ORIGENS.find((item) => item.nome === nome)
    setForm((current) => ({
      ...current,
      ficha: {
        ...current.ficha,
        origem: origem?.nome ?? '',
        origemBuff: origem?.buff ?? '',
        origemHabilidade: origem?.habilidade ?? '',
        origemPericias: origem?.pericias ?? '',
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
                onClick={() => carregarNoFormulario(personagem)}
              >
                <strong>{personagem.nome}</strong>
                <span>Campanha #{personagem.campanhaId}</span>
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
            {form.id ? (
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

                <fieldset className="coc-destiny">
                  <legend>Pontos de destino</legend>
                  {[1, 2, 3].map((ponto) => (
                    <label key={ponto}>
                      <input
                        checked={form.ficha.pontosDeDestino >= ponto}
                        type="checkbox"
                        onChange={() =>
                          atualizarCampoFicha(
                            'pontosDeDestino',
                            form.ficha.pontosDeDestino === ponto ? ponto - 1 : ponto,
                          )
                        }
                      />
                      <span />
                    </label>
                  ))}
                </fieldset>

                <section className="coc-origin-panel">
                  <h2>Origem</h2>
                  <label>
                    Selecione uma origem
                    <select
                      value={form.ficha.origem ?? ''}
                      onChange={(event) => atualizarOrigem(event.target.value)}
                    >
                      <option value="">Escolha...</option>
                      {ORIGENS.map((origem) => (
                        <option key={origem.nome} value={origem.nome}>
                          {origem.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.ficha.origem ? (
                    <dl className="coc-origin-details">
                      <dt>Habilidade</dt>
                      <dd>{form.ficha.origemHabilidade}</dd>
                      <dt>Buff</dt>
                      <dd>{form.ficha.origemBuff}</dd>
                      <dt>Pericias</dt>
                      <dd>{form.ficha.origemPericias}</dd>
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

function rolarD100() {
  return Math.floor(Math.random() * 100) + 1
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

function normalizarPericias(pericias: PericiaCoc[]) {
  return pericias.map((pericia) => ({
    ...pericia,
    base: pericia.base ?? PERICIAS_INICIAIS.find(({ nome }) => nome === pericia.nome)?.base ?? 0,
  }))
}

function extrairErro(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback
}
