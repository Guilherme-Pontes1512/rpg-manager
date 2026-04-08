export type AtributosCoc = {
  constituicao: number
  destreza: number
  forca: number
  inteligencia: number
  presenca: number
  vontade: number
}

export type PericiaCoc = {
  base: number
  nome: string
  valor: number
}

export type FichaCoc = {
  anotacoes?: string
  aparencia?: string
  armas?: string
  atributos: AtributosCoc
  historico?: string
  idade?: number
  importantes?: string
  inventario?: string
  nacionalidade?: string
  ocupacao?: string
  origem?: string
  origemBuff?: string
  origemHabilidade?: string
  origemPericias?: string
  pericias: PericiaCoc[]
  pontosDeDestino: number
  retratoUrl?: string
  rituais?: string
  sanidade: number
  sexo?: string
  vidaAtual: number
  vidaMaxima: number
}

export type PersonagemCoc = {
  aparencia?: string
  campanhaId: number
  dadosFichaJson: FichaCoc
  historia?: string
  id?: number
  imageUrl?: string
  nome: string
  status?: 'ATIVO' | 'INATIVO' | 'MORTO'
}

export type PersonagemCocForm = {
  campanhaId: string
  ficha: FichaCoc
  id?: number
  imageUrl?: string
  nome: string
}
