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
  marcada?: boolean
  nome: string
  valor: number
}

export type ArmaCoc = {
  alcance: string
  arma: string
  dano: string
  modificador?: string
  municao?: string
}

export type RitualCoc = {
  alvo: string
  custo: string
  descricao: string
  ritual: string
}

export type FichaCoc = {
  anotacoes?: string
  aparencia?: string
  armas?: ArmaCoc[]
  atributos: AtributosCoc
  esquiva: number
  historico?: string
  idade?: number
  importantes?: string
  inventario?: string
  nacionalidade?: string
  ocupacao?: string
  ocupacaoPericias?: string
  pericias: PericiaCoc[]
  pontosDeDestino?: number
  profissao?: string
  retratoUrl?: string
  rituais?: RitualCoc[]
  sanidade: number
  sexo?: string
  sorte: number
  origem?: string
  origemPericias?: string
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

export type PersonagemCocResumo = {
  campanhaId: number
  id?: number
  imageUrl?: string
  nome: string
}

export type PersonagemCocForm = {
  campanhaId: string
  ficha: FichaCoc
  id?: number
  imageUrl?: string
  nome: string
}
