import { useEffect, useMemo, useState } from 'react'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import {
  baixarDocumentoCampanha,
  enviarDocumentoCampanha,
  obterAcompanhamentoCampanha,
} from './clienteAcompanhamento'
import type { AcompanhamentoCampanha, AcompanhamentoPersonagem, CampanhaDocumento } from './tiposAcompanhamento'
import './TelaAcompanhamentoMestre.css'

type TelaAcompanhamentoMestreProps = {
  campanhaId: number
  onBack: () => void
  token: string
}

const ACCEPTED_DOCUMENT_TYPES = '.pdf,.jpeg,.jpg,.png'

export function TelaAcompanhamentoMestre({ campanhaId, onBack, token }: TelaAcompanhamentoMestreProps) {
  const { notify } = useNotificacoes()
  const [acompanhamento, setAcompanhamento] = useState<AcompanhamentoCampanha | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void carregarAcompanhamento()
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

  const personagens = acompanhamento?.personagens ?? []
  const documentos = acompanhamento?.documentos ?? []

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
            <PersonagemAcompanhamentoCard key={personagem.id} personagem={personagem} />
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

function PersonagemAcompanhamentoCard({ personagem }: { personagem: AcompanhamentoPersonagem }) {
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
