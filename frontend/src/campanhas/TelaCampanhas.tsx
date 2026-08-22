import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './TelaCampanhas.css'
import {
  adicionarPlayer,
  atualizarCampanha,
  criarCampanha,
  excluirCampanha,
  listarCampanhas,
  obterCampanha,
  removerPlayer,
} from './clienteCampanhas'
import { FormularioCampanha } from './FormularioCampanha'
import { ListaCampanhas } from './ListaCampanhas'
import { TelaAcompanhamentoMestre } from './TelaAcompanhamentoMestre'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import { TelaPersonagemCoc } from '../personagens/TelaPersonagemCoc'
import type { AuthUser } from '../auth'
import type {
  CampanhaDetalhe,
  CampanhaFormulario,
  CampanhaMembro,
  CampanhaResumo,
} from './tiposCampanha'

type TelaCampanhasProps = {
  token: string
  user: AuthUser
}

type CampaignViewMode = 'lista' | 'formulario' | 'personagens' | 'acompanhamento'

type StoredCampaignNavigation = {
  campanhaSelecionadaId: number | null
  personagemSelecionadoId: number | null
  viewMode: CampaignViewMode
}

const formularioInicial: CampanhaFormulario = {
  nome: '',
  sistema: 'COC',
  descricao: '',
}

const CAMPAIGN_NAVIGATION_STORAGE_KEY = 'rpg-manager-campaign-navigation'

function getInitialCampaignNavigation(): StoredCampaignNavigation {
  try {
    const storedNavigation = window.localStorage.getItem(CAMPAIGN_NAVIGATION_STORAGE_KEY)
    if (!storedNavigation) {
      return { campanhaSelecionadaId: null, personagemSelecionadoId: null, viewMode: 'lista' }
    }

    const parsedNavigation = JSON.parse(storedNavigation) as Partial<StoredCampaignNavigation>
    const viewMode = parsedNavigation.viewMode

    return {
      campanhaSelecionadaId: typeof parsedNavigation.campanhaSelecionadaId === 'number'
        ? parsedNavigation.campanhaSelecionadaId
        : null,
      personagemSelecionadoId: typeof parsedNavigation.personagemSelecionadoId === 'number'
        ? parsedNavigation.personagemSelecionadoId
        : null,
      viewMode: viewMode === 'formulario' || viewMode === 'personagens' || viewMode === 'acompanhamento'
        ? viewMode
        : 'lista',
    }
  } catch {
    return { campanhaSelecionadaId: null, personagemSelecionadoId: null, viewMode: 'lista' }
  }
}

export function TelaCampanhas({ token, user }: TelaCampanhasProps) {
  const { notify } = useNotificacoes()
  const [initialNavigation] = useState(getInitialCampaignNavigation)
  const [campanhas, setCampanhas] = useState<CampanhaResumo[]>([])
  const [campanhaAtual, setCampanhaAtual] = useState<CampanhaDetalhe | null>(null)
  const [campanhaSelecionadaId, setCampanhaSelecionadaId] = useState<number | null>(initialNavigation.campanhaSelecionadaId)
  const [personagemSelecionadoId, setPersonagemSelecionadoId] = useState<number | null>(initialNavigation.personagemSelecionadoId)
  const [viewMode, setViewMode] = useState<CampaignViewMode>(initialNavigation.viewMode)
  const [form, setForm] = useState<CampanhaFormulario>(formularioInicial)
  const [playerIdentificador, setPlayerIdentificador] = useState('')
  const [loadingLista, setLoadingLista] = useState(true)
  const [saving, setSaving] = useState(false)
  const [playerSubmitting, setPlayerSubmitting] = useState(false)

  useEffect(() => {
    void carregarCampanhas()
  }, [token])

  useEffect(() => {
    window.localStorage.setItem(CAMPAIGN_NAVIGATION_STORAGE_KEY, JSON.stringify({
      campanhaSelecionadaId,
      personagemSelecionadoId,
      viewMode,
    }))
  }, [campanhaSelecionadaId, personagemSelecionadoId, viewMode])

  async function carregarCampanhas(preferidaId?: number | null) {
    setLoadingLista(true)

    try {
      const campanhasCarregadas = await listarCampanhas(token)
      setCampanhas(campanhasCarregadas)

      const proximaId =
        preferidaId ??
        (campanhaSelecionadaId && campanhasCarregadas.some(({ id }) => id === campanhaSelecionadaId)
          ? campanhaSelecionadaId
          : viewMode === 'lista'
            ? null
            : campanhasCarregadas[0]?.id ?? null)

      if (proximaId) {
        await carregarCampanhaSelecionada(proximaId)
      } else {
        setCampanhaSelecionadaId(null)
        setCampanhaAtual(null)
        setForm(formularioInicial)
      }
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel carregar as campanhas.'))
    } finally {
      setLoadingLista(false)
    }
  }

  async function selecionarCampanha(campanhaId: number) {
    try {
      await carregarCampanhaSelecionada(campanhaId)
      setViewMode('formulario')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel abrir a campanha.'))
    }
  }

  async function carregarCampanhaSelecionada(campanhaId: number) {
    const detalhe = await obterCampanha(token, campanhaId)

    setCampanhaSelecionadaId(campanhaId)
    setCampanhaAtual(detalhe)
    setForm({
      nome: detalhe.nome,
      sistema: detalhe.sistema,
      descricao: detalhe.descricao ?? '',
    })
  }

  async function abrirPersonagensDaCampanha(campanhaId: number) {
    try {
      const detalhe = await obterCampanha(token, campanhaId)
      setViewMode(detalhe.papel === 'MESTRE' ? 'acompanhamento' : 'personagens')
      setCampanhaSelecionadaId(campanhaId)
      setCampanhaAtual(detalhe)
      setForm({
        nome: detalhe.nome,
        sistema: detalhe.sistema,
        descricao: detalhe.descricao ?? '',
      })
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel abrir a campanha.'))
    }
  }

  function iniciarNovaCampanha() {
    setViewMode('formulario')
    setCampanhaSelecionadaId(null)
    setPersonagemSelecionadoId(null)
    setCampanhaAtual(null)
    setForm(formularioInicial)
    setPlayerIdentificador('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        descricao: form.descricao.trim(),
      }

      const detalhe = campanhaAtual
        ? await atualizarCampanha(token, campanhaAtual.id, payload)
        : await criarCampanha(token, payload)

      setViewMode('formulario')
      setCampanhaAtual(detalhe)
      setCampanhaSelecionadaId(detalhe.id)
      setForm({
        nome: detalhe.nome,
        sistema: detalhe.sistema,
        descricao: detalhe.descricao ?? '',
      })
      await carregarCampanhas(detalhe.id)
      notify('success', campanhaAtual ? 'Campanha atualizada.' : 'Campanha criada com sucesso.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel salvar a campanha.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteFromCard(campanha: CampanhaResumo) {
    const confirmou = window.confirm(`Excluir a campanha "${campanha.nome}"?`)
    if (!confirmou) {
      return
    }

    setSaving(true)

    try {
      await excluirCampanha(token, campanha.id)
      if (campanhaSelecionadaId === campanha.id) {
        setCampanhaAtual(null)
        setCampanhaSelecionadaId(null)
      }
      await carregarCampanhas(null)
      notify('success', 'Campanha excluida.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel excluir a campanha.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAdicionarPlayer() {
    if (!campanhaAtual || !playerIdentificador.trim()) {
      return
    }

    setPlayerSubmitting(true)

    try {
      await adicionarPlayer(token, campanhaAtual.id, playerIdentificador.trim())
      await selecionarCampanha(campanhaAtual.id)
      await carregarCampanhas(campanhaAtual.id)
      setPlayerIdentificador('')
      notify('success', 'Player adicionado a campanha.')
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel adicionar o player.'))
    } finally {
      setPlayerSubmitting(false)
    }
  }

  async function handleRemoverPlayer(membro: CampanhaMembro) {
    if (!campanhaAtual) {
      return
    }

    setPlayerSubmitting(true)

    try {
      await removerPlayer(token, campanhaAtual.id, membro.usuarioId)
      await selecionarCampanha(campanhaAtual.id)
      notify('success', `Player ${membro.username} removido.`)
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel remover o player.'))
    } finally {
      setPlayerSubmitting(false)
    }
  }

  function updateForm(field: keyof CampanhaFormulario, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const canEdit = campanhaAtual ? campanhaAtual.papel === 'MESTRE' : true
  const isFormView = viewMode === 'formulario'
  const isPersonagensView = viewMode === 'personagens'
  const isAcompanhamentoView = viewMode === 'acompanhamento'
  const membroAtual = campanhaAtual?.membros.find((membro) => membro.usuarioId === user.id)

  function voltarParaLista() {
    setPersonagemSelecionadoId(null)
    setViewMode('lista')
  }

  function abrirFichaPersonagemComoMestre(personagemId: number) {
    setPersonagemSelecionadoId(personagemId)
    setViewMode('personagens')
  }

  function voltarParaAcompanhamento() {
    setPersonagemSelecionadoId(null)
    setViewMode('acompanhamento')
  }

  return (
    <div className="campaigns-screen">
      <header className="campaigns-topline">
        <div>
          <h1>Campanhas</h1>
        </div>
        <div className="campaigns-top-actions">
          {!isFormView && !isPersonagensView && !isAcompanhamentoView ? (
            <button className="primary-button" type="button" onClick={iniciarNovaCampanha}>
              Criar nova campanha
            </button>
          ) : null}
        </div>
      </header>

      {isAcompanhamentoView && campanhaAtual ? (
        <TelaAcompanhamentoMestre
          campanhaId={campanhaAtual.id}
          onBack={voltarParaLista}
          onEditarPersonagem={abrirFichaPersonagemComoMestre}
          token={token}
        />
      ) : isPersonagensView && campanhaAtual ? (
        <TelaPersonagemCoc
          backLabel={campanhaAtual.papel === 'MESTRE' ? 'Voltar para acompanhamento' : 'Voltar para campanhas'}
          campanhaId={campanhaAtual.id}
          campanhaNome={campanhaAtual.nome}
          canCreate={membroAtual?.papel === 'JOGADOR'}
          canDelete={campanhaAtual.papel !== 'MESTRE'}
          initialPersonagemId={personagemSelecionadoId}
          onBack={campanhaAtual.papel === 'MESTRE' ? voltarParaAcompanhamento : voltarParaLista}
          token={token}
        />
      ) : isFormView ? (
        <div className="campaign-form-view">
          <div className="campaign-form-toolbar">
            <button className="ghost-button" type="button" onClick={voltarParaLista}>
              Voltar para campanhas
            </button>
          </div>

          <FormularioCampanha
            addPlayerValue={playerIdentificador}
            canEdit={canEdit}
            campanha={campanhaAtual}
            form={form}
            onAddPlayerChange={setPlayerIdentificador}
            onAddPlayerSubmit={() => void handleAdicionarPlayer()}
            onFormChange={updateForm}
            onRemovePlayer={(membro) => void handleRemoverPlayer(membro)}
            onSubmit={(event) => void handleSubmit(event)}
            playerSubmitting={playerSubmitting}
            saving={saving}
          />
        </div>
      ) : (
        <ListaCampanhas
          campanhas={campanhas}
          loading={loadingLista}
          onEditar={(campanhaId) => void selecionarCampanha(campanhaId)}
          onExcluir={(campanha) => void handleDeleteFromCard(campanha)}
          onSelecionar={(campanhaId) => {
            void abrirPersonagensDaCampanha(campanhaId)
          }}
          selecionadaId={campanhaSelecionadaId}
        />
      )}
    </div>
  )
}

function extrairErro(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback
}
