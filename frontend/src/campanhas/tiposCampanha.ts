export type SistemaCampanha = 'COC' | 'DND'

export type PapelCampanha = 'MESTRE' | 'JOGADOR'

export type CampanhaResumo = {
  id: number
  nome: string
  descricao: string
  sistema: SistemaCampanha
  papel: PapelCampanha
  mestreUsername: string
}

export type CampanhaMembro = {
  id: number
  usuarioId: number
  nome: string
  username: string
  email: string
  papel: PapelCampanha
}

export type CampanhaDetalhe = CampanhaResumo & {
  membros: CampanhaMembro[]
}

export type CampanhaFormulario = {
  nome: string
  sistema: SistemaCampanha
  descricao: string
}
