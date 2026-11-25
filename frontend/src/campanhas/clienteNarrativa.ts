export type Sessao = {
  id: number; campanhaId: number; numero: number | null; titulo: string | null; descricao: string | null
  status: string; resumo: string | null; criadoEm: string; atualizadoEm: string
  participantes: number[]; npcs: number[]; quantidadeEventos: number; eventosRealizados: number; quantidadeNotas: number
}
export type Evento = {
  id: number; titulo: string; descricao: string; tipo: string; status: string; local: string
  dataNarrativa: string; condicoes: string; orientacoes: string; evidencias: string; consequencias: string
  participantes: number[]; npcs: number[]; sessaoPlanejadaId: number | null
}
export type Associacao = {
  id: number; sessaoId: number; evento: Evento; ordem: number; status: string; observacoes: string
  resultado: string; consequencias: string; evidencias: string; realizadoEm: string
}
export type Nota = {
  id: number; titulo: string; conteudo: string; categoria: string; participantes: number[]
  npcs: number[]; eventoId: number | null; criadoEm: string
}
export function clienteNarrativa(token: string, campanhaId: number) {
  return async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const endpoint = `/api/campanhas/${campanhaId}/narrativa${path}`
    let response: Response
    try { response = await fetch(endpoint, {
      method, headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }) } catch {
      throw new Error(`Falha de conexão ao acessar ${method} ${endpoint}. Verifique a conexão com o servidor.`)
    }
    if (!response.ok) {
      let message = 'Não foi possível concluir a operação.'
      try {
        const error = await response.json()
        const detalhes = [...Object.values<string>(error.fields ?? {}), error.message, error.detail]
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        if (detalhes.length) message = [...new Set(detalhes)].join(' ').slice(0, 1000)
      } catch { message = 'Não foi possível concluir a operação.' }
      if (response.status === 404 && method === 'GET' && (path === '/sessoes' || path === '/eventos')) {
        message += ' Se este recurso deveria estar disponível, verifique se o backend foi atualizado para incluir o módulo de sessões.'
      }
      throw new Error(`HTTP ${response.status} — ${method} ${endpoint}: ${message}`)
    }
    return response.status === 204 ? undefined as T : response.json()
  }
}
export function tituloSessao(sessao: Pick<Sessao, 'numero' | 'titulo'>) {
  const titulo = sessao.titulo?.trim()
  if (titulo && sessao.numero != null) return `Sessão ${sessao.numero} — ${titulo}`
  if (titulo) return titulo
  return sessao.numero != null ? `Sessão ${sessao.numero}` : 'Sessão sem título'
}
export const categorias = ['OBSERVACAO_GERAL', 'ACAO_JOGADORES', 'ACONTECIMENTO_IMPROVISADO', 'EVIDENCIA_DESCOBERTA', 'INFORMACAO_REVELADA', 'CONSEQUENCIA_NARRATIVA', 'PENDENCIA_MESTRE']
export const tipos = ['PROGRAMADO', 'CONDICIONAL', 'INDEPENDENTE', 'OPCIONAL']
export const estadosSessao = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']
const nomes: Record<string, string> = {
  OBSERVACAO_GERAL: 'Observação geral', ACAO_JOGADORES: 'Ação dos jogadores', ACONTECIMENTO_IMPROVISADO: 'Acontecimento improvisado',
  EVIDENCIA_DESCOBERTA: 'Evidência descoberta', INFORMACAO_REVELADA: 'Informação revelada', CONSEQUENCIA_NARRATIVA: 'Consequência narrativa', PENDENCIA_MESTRE: 'Pendência para o mestre',
  PLANEJADA: 'Planejada', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
  PENDENTE: 'Pendente', REALIZADO: 'Realizado', DESCARTADO: 'Descartado', ADIADO: 'Adiado',
  PROGRAMADO: 'Programado', CONDICIONAL: 'Condicional', INDEPENDENTE: 'Independente', OPCIONAL: 'Opcional',
}
export const rotulo = (value: string) => nomes[value] ?? value
