import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AcompanhamentoCampanha } from './tiposAcompanhamento'
import { categorias, tipos, rotulo } from './clienteNarrativa'
import type { Sessao, Evento, Nota } from './clienteNarrativa'

export type DadosFormulario = Partial<Omit<Sessao & Evento & Nota, 'titulo' | 'descricao' | 'resumo'>> & {
  titulo?: string | null
  descricao?: string | null
  resumo?: string | null
}
export function SeletorPessoas({ dados, onChange, acompanhamento, loading, erro }: { dados: DadosFormulario; onChange: (value: DadosFormulario) => void; acompanhamento: AcompanhamentoCampanha | null; loading: boolean; erro: string }) {
  return <div className="narrative-form-grid">
    {(['participantes', 'npcs'] as const).map((campo) => <fieldset key={campo}>
      <legend>
        {campo === 'npcs' ? 'NPCs relevantes' : 'Personagens participantes'}
      </legend>
      {loading ? <p className="panel-hint" role="status">Carregando opções...</p> : null}
      {erro ? <p className="panel-hint">Não foi possível carregar as opções. {erro}</p> : null}
      {!loading && !erro && !(campo === 'npcs' ? acompanhamento?.npcs?.length : acompanhamento?.personagens.length) ? <p className="panel-hint">Nenhum {campo === 'npcs' ? 'NPC' : 'personagem'} cadastrado nesta campanha.</p> : null}
      {(campo === 'npcs' ? acompanhamento?.npcs ?? [] : acompanhamento?.personagens ?? []).map((pessoa) => pessoa.id ? <label className="narrative-check" key={pessoa.id}>
        <input type="checkbox" checked={dados[campo]?.includes(pessoa.id) ?? false} onChange={(event) => onChange({ ...dados, [campo]: event.target.checked ? [...dados[campo] ?? [], pessoa.id] : dados[campo]?.filter((id) => id !== pessoa.id) })} />
        {pessoa.nome}
      </label> : null)}
    </fieldset>)}
  </div>
}
export function NarrativaFormulario({ modo, inicial, acompanhamento, eventos, onSave, onCancel, busy, draftKey, loadingPessoas, erroPessoas }: {
  modo: 'sessao' | 'evento' | 'nota'; inicial: DadosFormulario; acompanhamento: AcompanhamentoCampanha | null; eventos: Evento[]
  onSave: (dados: DadosFormulario) => Promise<boolean>; onCancel: () => void; busy: boolean; draftKey: string
  loadingPessoas: boolean; erroPessoas: string
}) {
  const [dados, setDados] = useState<DadosFormulario>(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) ?? 'null') ?? inicial }
    catch { return inicial }
  })
  const [alterado, setAlterado] = useState(false)
  function update(value: DadosFormulario) { setDados(value); setAlterado(true); localStorage.setItem(draftKey, JSON.stringify(value)) }
  function cancelar() {
    if (!alterado || window.confirm('Descartar alterações não salvas?')) {
      localStorage.removeItem(draftKey)
      onCancel()
    }
  }
  function campo(key: keyof DadosFormulario, label: string, multiline = false, required = false, type = 'text') {
    return <label key={key}>
      {label}{multiline ? <textarea required={required} value={String(dados[key] ?? '')} onChange={(event) => update({ ...dados, [key]: event.target.value })} /> : <input type={type} min={type === 'number' ? 1 : undefined} maxLength={type === 'text' ? 255 : undefined} required={required} value={String(dados[key] ?? '')} onChange={(event) => update({ ...dados, [key]: type === 'number' ? (event.target.value ? Number(event.target.value) : null) : event.target.value })} />}
    </label>
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const payload = modo === 'sessao' ? {
      id: dados.id, numero: dados.numero ?? null, titulo: dados.titulo, descricao: dados.descricao,
      resumo: inicial.id ? dados.resumo : undefined, participantes: dados.participantes ?? [], npcs: dados.npcs ?? [],
    } : { ...dados, participantes: dados.participantes ?? [], npcs: dados.npcs ?? [] }
    const salvo = await onSave(payload)
    if (salvo) localStorage.removeItem(draftKey)
  }
  return <div className="narrative-overlay">
    <section className="panel-surface narrative-dialog" role="dialog" aria-modal="true" aria-label={`Editar ${modo}`}>
      <h2>
        {inicial.id ? 'Editar' : 'Criar'} {modo === 'sessao' ? 'sessão' : modo === 'evento' ? 'evento' : 'anotação'}
      </h2>
      <form onSubmit={(event) => void submit(event)} className="narrative-form">
        {modo === 'sessao' ? <div className="narrative-form-grid">
          {campo('numero', 'Número', false, false, 'number')}{campo('titulo', 'Título')}
        </div> : campo('titulo', 'Título', false, modo === 'evento')}
        {modo === 'nota' ? <>
          {campo('conteudo', 'Conteúdo', true, true)}
          <label>Categoria<select value={dados.categoria ?? categorias[0]} onChange={(event) => update({ ...dados, categoria: event.target.value })}>
            {categorias.map((categoria) => <option key={categoria} value={categoria}>
              {rotulo(categoria)}
            </option>)}
          </select>
          </label>
          <label>Evento relacionado<select value={dados.eventoId ?? ''} onChange={(event) => update({ ...dados, eventoId: event.target.value ? Number(event.target.value) : null })}>
            <option value="">Sem evento</option>
            {eventos.map((evento) => <option key={evento.id} value={evento.id}>
              {evento.titulo}
            </option>)}
          </select>
          </label></> : campo('descricao', modo === 'sessao' ? 'Descrição e objetivos narrativos' : 'Descrição', true)}
        {modo === 'evento' ? <>
          <div className="narrative-form-grid">
            <label>Tipo<select value={dados.tipo ?? 'OPCIONAL'} onChange={(event) => update({ ...dados, tipo: event.target.value })}>
              {tipos.map((tipo) => <option key={tipo} value={tipo}>
                {rotulo(tipo)}
              </option>)}
            </select>
            </label>
            <label>Status narrativo<select value={dados.status ?? 'PENDENTE'} onChange={(event) => update({ ...dados, status: event.target.value })}>
              {['PENDENTE', 'REALIZADO', 'DESCARTADO'].map((status) => <option key={status} value={status}>
                {rotulo(status)}
              </option>)}
            </select>
            </label>
            {campo('local', 'Local')}{campo('dataNarrativa', 'Data ou horário narrativo')}
          </div>
          {campo('condicoes', 'Condições de ativação', true)}{campo('orientacoes', 'Orientações privadas', true)}{campo('evidencias', 'Evidências e informações descobríveis', true)}{campo('consequencias', 'Consequências previstas', true)}</> : null}
        <SeletorPessoas dados={dados} onChange={update} acompanhamento={acompanhamento} loading={loadingPessoas} erro={erroPessoas} />
        {modo === 'sessao' && inicial.id ? campo('resumo', 'Resumo final (opcional)', true) : null}
        <div className="narrative-actions">
          <button className="primary-button" disabled={busy}>Salvar</button>
          <button className="ghost-button" type="button" onClick={cancelar}>Cancelar</button>
        </div>
      </form>
    </section>
  </div>
}
