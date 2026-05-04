export type AcompanhamentoPersonagem = {
  id: number
  jogadorUsername: string
  nome: string
  retratoUrl?: string
  sanidade?: number
  vidaAtual?: number
  vidaMaxima?: number
}

export type CampanhaDocumento = {
  baixado: boolean
  campanhaId: number
  campanhaNome: string
  enviadoEm: string
  enviadoPorUsername: string
  id: number
  nomeArquivo: string
  tipoConteudo: string
}

export type AcompanhamentoCampanha = {
  campanhaId: number
  campanhaNome: string
  documentos: CampanhaDocumento[]
  personagens: AcompanhamentoPersonagem[]
}
