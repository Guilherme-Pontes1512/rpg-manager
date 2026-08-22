import { useEffect, useState } from 'react'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { useNotificacoes } from '../notificacoes/NotificacoesProvider'
import { baixarDocumentoCampanha, listarNotificacoesDocumentos } from '../campanhas/clienteAcompanhamento'
import type { CampanhaDocumento } from '../campanhas/tiposAcompanhamento'

type NotificacoesDocumentosProps = {
  token: string
}

export function NotificacoesDocumentos({ token }: NotificacoesDocumentosProps) {
  const { notify } = useNotificacoes()
  const [aberto, setAberto] = useState(false)
  const [documentos, setDocumentos] = useState<CampanhaDocumento[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void carregarNotificacoes()
  }, [token])

  async function carregarNotificacoes() {
    setLoading(true)

    try {
      setDocumentos(await listarNotificacoesDocumentos(token))
    } catch {
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  async function handleBaixar(documento: CampanhaDocumento) {
    try {
      await baixarDocumentoCampanha(token, documento)
      await carregarNotificacoes()
      notify('success', 'Documento baixado.')
    } catch (caughtError) {
      notify('error', caughtError instanceof Error ? caughtError.message : 'Nao foi possivel baixar o documento.')
    }
  }

  return (
    <div className="document-notifications">
      <button
        className="notification-button"
        type="button"
        onClick={() => setAberto((current) => !current)}
        aria-label="Notificacoes de documentos"
        title="Notificacoes de documentos"
      >
        <IconeFa path={faBell.icon[4]} width={faBell.icon[0]} height={faBell.icon[1]} />
        {documentos.length > 0 ? <span>{documentos.length}</span> : null}
      </button>

      {aberto ? (
        <div className="notification-popover">
          <strong>Documentos recebidos</strong>
          {loading ? <p>Carregando...</p> : null}
          {!loading && documentos.length === 0 ? <p>Nenhuma notificacao pendente.</p> : null}
          {documentos.map((documento) => (
            <article key={documento.id}>
              <div>
                <span>{documento.campanhaNome}</span>
                <strong>{documento.nomeArquivo}</strong>
              </div>
              <button type="button" onClick={() => void handleBaixar(documento)}>
                Baixar
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function IconeFa({ path, width, height }: { path: string | string[]; width: number; height: number }) {
  const paths = Array.isArray(path) ? path : [path]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} fill="currentColor" aria-hidden="true" focusable="false">
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}
