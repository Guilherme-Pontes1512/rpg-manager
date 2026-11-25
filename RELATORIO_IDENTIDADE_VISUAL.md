# Reformulação visual — RPG Manager

Data: 24/11/2026. Branch: `visual/identidade-investigacao`, criada a partir de `teste_design`. O repositório estava sem alterações locais no início. As alterações permanecem sem commit.

## Análise e plano executado

O frontend utiliza React 19, TypeScript e Vite, com CSS nativo separado por tela. Font Awesome fornece os dados dos ícones de dados; os demais ícones são SVG. Não existe biblioteca de componentes, roteador externo ou framework de testes de frontend. A aplicação já possuía tokens CSS e alternância de tema persistida em `localStorage`.

Foram identificados cantos entre 8 e 32px, botões em cápsula, sombras grandes, gradientes e cores literais inconsistentes. Os indicadores vermelho/azul do acompanhamento dominavam a composição; nomes longos e ações dos NPCs competiam pelo espaço na mesma linha.

O trabalho seguiu quatro etapas: revisar a arquitetura existente; substituir os tokens e padronizar componentes; reformular os dossiês e fichas; executar build, testes e inspeção visual. Foram mantidos os componentes, os layouts funcionais e os clientes HTTP existentes.

## Resumo das alterações

- Identidade editorial de investigação, com títulos serifados, superfícies sóbrias, divisores finos e bronze discreto.
- Tema escuro como padrão para quem ainda não escolheu um tema; escolha explícita pelo tema claro continua respeitada.
- Tema claro equivalente, inspirado em papel e tinta, sem textura de pergaminho.
- Botões primários em bronze, secundários contornados e destrutivos em vermelho discreto.
- Campos, tabelas, modais, notificações, estados vazios e carregamento com linguagem visual coerente.
- Menu ativo identificado por texto, superfície e sublinhado; navegação móvel mais compacta.
- Cards de personagens como pequenos registros: retrato emoldurado, nome em duas linhas reservadas, informações secundárias truncadas e ações compactas.
- Vida e sanidade exibidas numericamente em superfície neutra, com marcas laterais e barra fina de vida.
- NPCs diferenciados pelo detalhe superior; vida zero recebe borda superior tracejada e retrato em escala de cinza, sem inferir novas regras de morte ou incapacidade.
- Fichas com atributos organizados em células, perícias com divisores e blocos narrativos com títulos editoriais.
- Sanidade atual também exibida numericamente nas fichas, inclusive quando o valor está fora do intervalo dos botões existentes.

## Decisões de design

### Cores

As cores estão centralizadas em `frontend/src/styles/base.css`. A base escura utiliza os valores solicitados: fundo `#151412`, superfície `#1E1C19`, superfície secundária `#27241F`, divisores `#3D3830`, texto `#E4DDCF`, texto secundário `#A69D8D` e bronze `#B49A68`. Vida, sanidade, sucesso e alerta possuem tokens próprios. Mensagens usam cores de texto adicionais para manter legibilidade sobre superfícies escuras.

### Tipografia e composição

Títulos, nomes e seções narrativas usam uma pilha serifada com Libre Baskerville, Iowan Old Style, Palatino e Georgia; informações funcionais usam Inter, Source Sans 3 e Segoe UI, seguidas de alternativas do sistema. Não foram adicionados downloads de fontes nem dependências: o navegador utiliza a primeira fonte instalada disponível. A aparência exata pode variar entre sistemas.

Os cantos passam a 2–4px, as sombras ficam restritas a elementos sobrepostos e os gradientes foram removidos. Os formulários usam espaçamento regular e os cards mantêm densidade suficiente para consulta simultânea. O cabeçalho redundante “Campanhas” fica oculto durante o acompanhamento e a consulta às fichas, sem remover controles ou alterar a navegação.

### Usabilidade

O foco por teclado tem contorno explícito. Inputs de upload visualmente escondidos continuam acessíveis pelo teclado. O campo de senha recebeu nome acessível. Animações respeitam `prefers-reduced-motion`. Números usam alinhamento tabular nos vitais. Nomes completos continuam no DOM, no atributo `title` e na ficha; a truncagem evita desalinhamento dos cards.

Não foram alterados cálculos, regras, normalização, permissões, autenticação, contratos HTTP, banco de dados ou código Java. O tratamento visual de vida zero não atualiza o status do personagem. Valores negativos de sanidade não são limitados ou convertidos pela apresentação.

## Telas reformuladas

- Login, cadastro e recuperação/redefinição de senha.
- Listagem, criação e edição de campanhas e tabela de participantes.
- Acompanhamento do mestre: personagens, NPCs e documentos compartilhados.
- Listagem e ficha de personagens: atributos, vitais, ocupação, perícias, inventário, armas, rituais e textos narrativos existentes.
- Criação e edição de NPCs, incluindo histórico, aparência, relações e segredos existentes.
- Confirmação de exclusão de personagem, notificações e menus de documentos.
- Estrutura global, estados vazios e carregamento. A área Sessões continua sendo a área ainda não implementada já existente.

## Arquivos e componentes modificados

| Arquivo | Alteração |
| --- | --- |
| `frontend/src/styles/base.css` | Tokens dos dois temas, tipografia e componentes globais |
| `frontend/src/App.tsx` | Tema inicial escuro com preferência salva preservada |
| `frontend/src/layout/LayoutAplicacao.css` | Cabeçalho, navegação, notificações e responsividade |
| `frontend/src/layout/BarraMenuSuperior.tsx` | Identificação acessível da página ativa |
| `frontend/src/theme/BotaoTema.tsx` | SVGs consistentes para tema claro/escuro |
| `frontend/src/auth/TelaAutenticacao.css` | Composição editorial da autenticação |
| `frontend/src/auth/TelaAutenticacao.tsx` | Texto de apresentação da plataforma |
| `frontend/src/auth/FormularioLogin.tsx` | Nome acessível do campo de senha |
| `frontend/src/campanhas/ListaCampanhas.tsx` | Texto do estado vazio sem terminologia técnica |
| `frontend/src/campanhas/TelaCampanhas.css` | Cards, editor, tabela, badges e ações |
| `frontend/src/campanhas/TelaAcompanhamentoMestre.css` | Dossiês compactos, vitais e documentos |
| `frontend/src/campanhas/TelaAcompanhamentoMestre.tsx` | Classes visuais de NPC/vida zero, nomes completos e sanidade atual |
| `frontend/src/personagens/TelaPersonagemCoc.css` | Fichas, perícias, atributos, modais e uploads focáveis |
| `frontend/src/personagens/TelaPersonagemCoc.tsx` | Exibição numérica da sanidade atual |
| `frontend/src/notificacoes/Notificacoes.css` | Mensagens adaptadas aos dois temas |
| `frontend/scripts/validate-visual.mjs` | Validação de navegador reprodutível com API simulada |
| `frontend/validation/` | 20 capturas de tela e resultados estruturados |
| `frontend/dist/` | Build atualizado; estes artefatos já eram versionados no projeto |
| `RELATORIO_IDENTIDADE_VISUAL.md` | Este relatório |

## Testes e validações

| Comando/verificação | Resultado |
| --- | --- |
| `cd frontend && npm ci --cache /tmp/rpg-manager-npm-cache --no-audit --no-fund --fetch-retries=0 --fetch-timeout=20000` | Dependências existentes instaladas; lockfile preservado |
| `cd frontend && npm run build` | TypeScript e build de produção aprovados |
| `bash ./mvnw -f backend/pom.xml test -Dmaven.repo.local=/tmp/rpg-manager-m2 -B` | 13 testes aprovados, zero falhas/erros, H2 em memória, perfis dev/h2 |
| `cd frontend && npm test -- --run` | Não executável: o projeto não possui script `test` |
| `cd frontend && npm run lint` | Bloqueado pela ausência pré-existente de `eslint.config.*` |
| `git diff --check` | Sem erros de whitespace |
| Chrome headless com script de validação | 20 capturas, 13 verificações aprovadas, zero exceções de execução |

A primeira tentativa de baixar dependências Maven falhou pela restrição de rede do sandbox; a execução com acesso de rede permitido terminou com sucesso. O ambiente executou os testes com Java 25, compilando para a versão 21 configurada pelo projeto; não houve validação em uma JVM 21 separada.

### Navegador

Foram exercitados cadastro e confirmação, login, recuperação, navegação entre campanhas, editor de campanha, abertura de ficha, criação de PC/NPC e edição de PC/NPC. Foram verificados o salvamento automático existente, os métodos POST/PUT e a preservação de vida zero e sanidade negativa nos payloads simulados. A confirmação de exclusão foi aberta sem excluir dados reais.

Foram avaliadas larguras de 320, 390, 768, 1366 e 1440px, além dos temas claro e escuro. Não houve transbordamento horizontal nas telas capturadas. Cards de PC e NPC mantiveram altura equivalente, inclusive com nomes e profissões extensos. A revisão visual das capturas também corrigiu ações de NPC empilhadas e espaço excessivo no menu móvel.

Evidências:

- [Acompanhamento escuro](frontend/validation/08-acompanhamento-desktop.png)
- [Acompanhamento claro](frontend/validation/11-acompanhamento-claro-desktop.png)
- [Acompanhamento em 320px](frontend/validation/20-acompanhamento-mobile-320.png)
- [Ficha de investigador](frontend/validation/12-ficha-investigador.png)
- [Ficha de NPC](frontend/validation/19-npc-existente.png)
- [Resultados completos](frontend/validation/browser-results.json)

### Reproduzir a validação visual

Pré-requisitos: Node com WebSocket nativo (foi utilizado Node 24) e Chrome instalado. Em um terminal:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

Em outro terminal, na raiz do repositório:

```bash
RPG_VALIDATION_URL=http://127.0.0.1:5174 node frontend/scripts/validate-visual.mjs
```

O executável padrão é `/usr/bin/google-chrome`; pode ser substituído por `RPG_CHROME_BINARY`. O script cria perfil temporário de navegador, simula respostas HTTP antes da aplicação iniciar e grava capturas/resultados em `frontend/validation/`. Não exige credenciais nem alterações no banco.

## Problemas encontrados e limitações

- A validação visual usa dados simulados; não comprova autenticação real, entrega de e-mails ou persistência do navegador no backend. Os testes Java existentes validam suas integrações separadamente.
- Upload/download de documentos e notificações SSE reais não foram exercitados. Seus controles foram estilizados preservando os handlers existentes.
- A ausência de configuração do ESLint e de suíte frontend é anterior à reformulação e foi mantida fora do escopo.
- Não foi realizada auditoria completa de acessibilidade, uso de leitor de tela ou teste em Safari/Firefox; a inspeção automatizada ocorreu no Chrome.
- Os botões de sanidade mantêm o intervalo existente. A nova exibição numérica informa o valor armazenado mesmo fora desse intervalo, sem introduzir outra forma de edição.
- Fontes locais podem produzir métricas diferentes; há fallbacks e truncagem controlada para reduzir desalinhamentos.
- O Maven emite avisos pré-existentes sobre dependências duplicadas de validação/teste; os 13 testes passam.

## Como reverter

Nenhum commit foi criado. Trocar de branch sozinho não descarta alterações ainda não commitadas. Antes de reverter, revise `git status` e preserve qualquer trabalho feito posteriormente.

Para guardar um patch dos arquivos já rastreados:

```bash
git diff --binary > /tmp/rpg-manager-identidade-visual.patch
```

O patch não inclui os arquivos novos não rastreados; copie o relatório, `frontend/scripts/validate-visual.mjs`, `frontend/validation/` e os novos assets de `frontend/dist/` se desejar preservá-los.

Para restaurar os arquivos rastreados do frontend à branch original, enquanto ela continuar apontando para a base desta experiência:

```bash
git restore --source=teste_design -- frontend/src frontend/dist
```

Esse comando substitui também alterações posteriores nesses caminhos: faça a cópia de segurança antes. Os arquivos novos do experimento continuam presentes; podem ser removidos individualmente após revisão com `git status`. Não é necessário alterar o backend, o banco ou dados de campanhas para reverter a identidade.

Se as mudanças forem commitadas futuramente, prefira reverter o commit específico com `git revert <hash-do-commit>` para preservar o histórico.
