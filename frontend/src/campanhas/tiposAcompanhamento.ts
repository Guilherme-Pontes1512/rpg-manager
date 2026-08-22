export type AcompanhamentoPersonagem = {
  id: number
  jogadorUsername: string
  nome: string
  retratoUrl?: string
  sanidade?: number
  vidaAtual?: number
  vidaMaxima?: number
}

export type AtributosNpcCoc = {
  constituicao: number
  destreza: number
  forca: number
  inteligencia: number
  vontade: number
}

export type PericiaNpcCoc = {
  base: number
  nome: string
  valor: number
}

export type FichaNpcCoc = {
  aparencia?: string
  armas?: string
  atributos: AtributosNpcCoc
  esquiva: number
  historico?: string
  importantes?: string
  pericias: PericiaNpcCoc[]
  profissao?: string
  retratoUrl?: string
  rituais?: string
  sanidade: number
  segredos?: string
  vidaAtual: number
  vidaMaxima: number
}

export type CampanhaNpc = {
  campanhaId?: number
  dadosFichaJson: FichaNpcCoc
  id?: number
  imageUrl?: string
  nome: string
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
  npcs?: CampanhaNpc[]
  personagens: AcompanhamentoPersonagem[]
}
