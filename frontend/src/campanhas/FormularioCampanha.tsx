import type { FormEvent } from 'react'
import type { CampanhaDetalhe, CampanhaFormulario, CampanhaMembro } from './tiposCampanha'

type FormularioCampanhaProps = {
  addPlayerValue: string
  canEdit: boolean
  campanha: CampanhaDetalhe | null
  form: CampanhaFormulario
  onAddPlayerChange: (value: string) => void
  onAddPlayerSubmit: () => void
  onFormChange: (field: keyof CampanhaFormulario, value: string) => void
  onRemovePlayer: (membro: CampanhaMembro) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  playerSubmitting: boolean
  saving: boolean
}

const SISTEMAS = [
  { value: 'COC', label: 'Call of Cthulhu' },
  { value: 'DND', label: 'Dungeons & Dragons' },
] as const

export function FormularioCampanha({
  addPlayerValue,
  canEdit,
  campanha,
  form,
  onAddPlayerChange,
  onAddPlayerSubmit,
  onFormChange,
  onRemovePlayer,
  onSubmit,
  playerSubmitting,
  saving,
}: FormularioCampanhaProps) {
  const isEdicao = campanha !== null
  const formId = 'campaign-form'

  return (
    <section className="campaign-editor panel-surface">
      <div className="editor-header">
        <div>
          <span className="panel-tag">{isEdicao ? 'Edicao' : 'Nova campanha'}</span>
          <h2>{isEdicao ? form.nome || 'Campanha sem nome' : 'Criar campanha'}</h2>
        </div>
      </div>

      <form id={formId} className="campaign-form" onSubmit={onSubmit}>
        <label>
          <span>Nome da campanha</span>
          <input
            type="text"
            value={form.nome}
            onChange={(event) => onFormChange('nome', event.target.value)}
            placeholder="Sombras de Arkham"
            required
            disabled={!canEdit}
          />
        </label>

        <label>
          <span>Sistema</span>
          <select
            value={form.sistema}
            onChange={(event) => onFormChange('sistema', event.target.value)}
            disabled={!canEdit}
          >
            {SISTEMAS.map((sistema) => (
              <option key={sistema.value} value={sistema.value}>
                {sistema.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Descricao breve</span>
          <textarea
            value={form.descricao}
            onChange={(event) => onFormChange('descricao', event.target.value)}
            placeholder="Resumo rapido da campanha para os jogadores."
            maxLength={300}
            rows={5}
            disabled={!canEdit}
          />
          <small>{form.descricao.length}/300</small>
        </label>

      </form>

      <section className="players-section">
        <div className="players-header">
          <div>
            <span className="panel-tag">Players</span>
            <h3>Participantes</h3>
          </div>
          {!isEdicao ? <p>Salve a campanha para liberar o CRUD de players.</p> : null}
        </div>

        <div className="player-adder">
          <input
            type="text"
            value={addPlayerValue}
            onChange={(event) => onAddPlayerChange(event.target.value)}
            placeholder="Email ou username do jogador"
            disabled={!isEdicao || !canEdit}
          />
          <button
            className="primary-button"
            type="button"
            onClick={onAddPlayerSubmit}
            disabled={!isEdicao || !canEdit || playerSubmitting}
          >
            {playerSubmitting ? 'Adicionando...' : 'Adicionar player'}
          </button>
        </div>

        <div className="players-table-wrapper">
          <table className="players-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Papel</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(campanha?.membros ?? []).map((membro) => (
                <tr key={membro.id}>
                  <td>{membro.nome}</td>
                  <td>{membro.username}</td>
                  <td>{membro.email}</td>
                  <td>{membro.papel === 'MESTRE' ? 'Mestre' : 'Jogador'}</td>
                  <td>
                    {membro.papel === 'JOGADOR' ? (
                      <button
                        className="table-action"
                        type="button"
                        onClick={() => onRemovePlayer(membro)}
                        disabled={!canEdit || playerSubmitting}
                      >
                        Remover
                      </button>
                    ) : (
                      <span className="table-lock">Fixo</span>
                    )}
                  </td>
                </tr>
              ))}
              {campanha?.membros.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-table">
                    Nenhum participante na campanha.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <button
        className="primary-button form-submit-button"
        type="submit"
        form={formId}
        disabled={!canEdit || saving}
      >
        {saving ? 'Salvando...' : isEdicao ? 'Salvar alteracoes' : 'Criar campanha'}
      </button>
    </section>
  )
}
