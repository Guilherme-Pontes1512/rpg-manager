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

type CampaignViewMode = 'lista' | 'formulario' | 'personagens'

const formularioInicial: CampanhaFormulario = {
  nome: '',
  sistema: 'COC',
  descricao: '',
}

export function TelaCampanhas({ token, user }: TelaCampanhasProps) {
  const { notify } = useNotificacoes()
  const [campanhas, setCampanhas] = useState<CampanhaResumo[]>([])
  const [campanhaAtual, setCampanhaAtual] = useState<CampanhaDetalhe | null>(null)
  const [campanhaSelecionadaId, setCampanhaSelecionadaId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<CampaignViewMode>('lista')
  const [form, setForm] = useState<CampanhaFormulario>(formularioInicial)
  const [playerIdentificador, setPlayerIdentificador] = useState('')
  const [loadingLista, setLoadingLista] = useState(true)
  const [saving, setSaving] = useState(false)
  const [playerSubmitting, setPlayerSubmitting] = useState(false)

  useEffect(() => {
    void carregarCampanhas()
  }, [token])

  async function carregarCampanhas(preferidaId?: number | null) {
    setLoadingLista(true)

    try {
      const campanhasCarregadas = await listarCampanhas(token)
      setCampanhas(campanhasCarregadas)

      const proximaId =
        preferidaId ??
        (campanhaSelecionadaId && campanhasCarregadas.some(({ id }) => id === campanhaSelecionadaId)
          ? campanhaSelecionadaId
          : campanhasCarregadas[0]?.id ?? null)

      if (proximaId) {
        await selecionarCampanha(proximaId)
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
      const detalhe = await obterCampanha(token, campanhaId)
      setViewMode('formulario')
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

  async function abrirPersonagensDaCampanha(campanhaId: number) {
    try {
      const detalhe = await obterCampanha(token, campanhaId)
      setViewMode('personagens')
      setCampanhaSelecionadaId(campanhaId)
      setCampanhaAtual(detalhe)
      setForm({
        nome: detalhe.nome,
        sistema: detalhe.sistema,
        descricao: detalhe.descricao ?? '',
      })
    } catch (caughtError) {
      notify('error', extrairErro(caughtError, 'Nao foi possivel abrir os personagens da campanha.'))
    }
  }

  function iniciarNovaCampanha() {
    setViewMode('formulario')
    setCampanhaSelecionadaId(null)
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
  const membroAtual = campanhaAtual?.membros.find((membro) => membro.usuarioId === user.id)

  function voltarParaLista() {
    setViewMode('lista')
  }

  return (
    <div className="campaigns-screen">
      <header className="campaigns-topline">
        <div>
          <h1>Campanhas</h1>
        </div>
        <div className="campaigns-top-actions">
          {!isFormView && !isPersonagensView ? (
            <button className="primary-button" type="button" onClick={iniciarNovaCampanha}>
              Criar nova campanha
            </button>
          ) : null}
        </div>
      </header>

      {isPersonagensView && campanhaAtual ? (
        <TelaPersonagemCoc
          backLabel="Voltar para campanhas"
          campanhaId={campanhaAtual.id}
          canCreate={membroAtual?.papel === 'JOGADOR'}
          onBack={voltarParaLista}
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
