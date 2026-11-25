import './Abas.css'

type Aba = { valor: string; titulo: string }

export function Abas({ itens, ativa, onChange, label }: {
  itens: Aba[]
  ativa: string
  onChange: (valor: string) => void
  label: string
}) {
  return <nav className="section-tabs" aria-label={label}>
    {itens.map((item) => <button
      key={item.valor}
      type="button"
      aria-current={ativa === item.valor ? 'page' : undefined}
      onClick={() => onChange(item.valor)}
    >{item.titulo}</button>)}
  </nav>
}
