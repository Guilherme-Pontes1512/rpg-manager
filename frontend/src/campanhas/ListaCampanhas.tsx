import type { CampanhaResumo } from './tiposCampanha'

type ListaCampanhasProps = {
  campanhas: CampanhaResumo[]
  loading: boolean
  onEditar: (campanhaId: number) => void
  onExcluir: (campanha: CampanhaResumo) => void
  onSelecionar: (campanhaId: number) => void
  selecionadaId: number | null
}

function formatarSistema(sistema: CampanhaResumo['sistema']) {
  return sistema === 'COC' ? 'Call of Cthulhu' : 'Dungeons & Dragons'
}

export function ListaCampanhas({
  campanhas,
  loading,
  onEditar,
  onExcluir,
  onSelecionar,
  selecionadaId,
}: ListaCampanhasProps) {
  return (
    <section className="campaign-list-panel">
      {loading ? <p className="panel-hint">Carregando campanhas...</p> : null}
      {!loading && campanhas.length === 0 ? (
        <p className="panel-hint campaign-empty-state">
          <strong>Nenhuma campanha encontrada. Crie a primeira mesa para iniciar o CRUD.</strong>
        </p>
      ) : null}

      <div className="campaign-card-grid">
        {campanhas.map((campanha) => (
          <article
            key={campanha.id}
            className={
              campanha.id === selecionadaId ? 'campaign-card active' : 'campaign-card'
            }
          >
            <div className="campaign-card-actions">
              {campanha.papel === 'MESTRE' ? (
                <>
                  <button
                    type="button"
                    className="card-icon-button"
                    onClick={() => onEditar(campanha.id)}
                    aria-label={`Editar campanha ${campanha.nome}`}
                    title="Editar campanha"
                  >
                    <IconeLapis />
                  </button>
                  <button
                    type="button"
                    className="card-icon-button danger"
                    onClick={() => onExcluir(campanha)}
                    aria-label={`Excluir campanha ${campanha.nome}`}
                    title="Excluir campanha"
                  >
                    <IconeLixeira />
                  </button>
                </>
              ) : null}
            </div>
            <span
              className={
                campanha.papel === 'MESTRE'
                  ? 'campaign-role-badge role-mestre'
                  : 'campaign-role-badge role-jogador'
              }
            >
              {campanha.papel === 'MESTRE' ? 'Mestre' : 'Jogador'}
            </span>
            <strong>{campanha.nome}</strong>
            <p>{campanha.descricao || 'Sem descricao cadastrada.'}</p>
            <dl>
              <div>
                <dt>Mestre</dt>
                <dd>{campanha.mestreUsername}</dd>
              </div>
              <div>
                <dt>Sistema</dt>
                <dd>{formatarSistema(campanha.sistema)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="campaign-open-button"
              onClick={() => onSelecionar(campanha.id)}
            >
              Abrir campanha
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function IconeLapis() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20l4.2-1 9.5-9.5a1.5 1.5 0 000-2.1l-1.1-1.1a1.5 1.5 0 00-2.1 0L5 15.8 4 20zM13 6l5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function IconeLixeira() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M9 7V5h6v2m-7 0l1 12h6l1-12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
