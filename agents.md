# AGENTS.md

## Projeto
Aplicação web para gerenciamento de RPG. O objetivo do projeto é criar uma plataforma para 
mestres e jogadores organizarem campanhas, personagens, sessões e recursos relacionados.
O projeto é dividido em backend (Java + Spring Boot) e frontend (React + TypeScript), com uma API REST para comunicação entre os dois. O backend é responsável por toda a lógica de negócio, persistência e segurança, enquanto o frontend é focado na experiência do usuário, apresentando dados e interagindo com a API.


## Stack
- Backend: Java 21 + Spring Boot
- Frontend: React + TypeScript
- Banco: PostgreSQL
- Build backend: Maven Wrapper
- Build frontend: npm

## Estrutura
- `src/main/java`: backend Spring Boot
- `src/main/resources`: configs e recursos do backend
- `frontend/`: aplicação React
- `.codex/`: configuração local do Codex

## Objetivo dos agentes
Manter backend e frontend separados, com mudanças pequenas, seguras e fáceis de revisar.

## Regras gerais
- Antes de alterar código, entender a estrutura atual e resumir o plano.
- Não remover ou renomear arquivos sem explicar o motivo.
- Não adicionar dependências novas sem justificar.
- Preservar o padrão já existente no projeto.
- Sempre preferir mudanças incrementais.
- Quando encontrar código legado do Vaadin, não remover em massa sem antes mapear impacto.

## Papéis dos subagentes
### planner
Responsável por:
- quebrar a tarefa em etapas
- identificar arquivos envolvidos
- listar riscos
- definir critérios de aceite

### backend-implementer
Responsável por:
- controllers REST
- services
- entities
- DTOs
- validação
- testes backend

### frontend-implementer
Responsável por:
- páginas React
- componentes
- hooks
- integração com API
- estados de loading/erro

### tester
Responsável por:
- identificar cenários de teste
- rodar testes relevantes
- apontar regressões
- sugerir cobertura faltante

### reviewer
Responsável por:
- revisar consistência entre backend e frontend
- apontar riscos
- procurar débito técnico e divergência de contrato

## Quando usar subagentes
Use subagentes em tarefas de:
- exploração do codebase
- planejamento de feature
- implementação full-stack
- revisão de testes
- revisão final

Não use subagentes para mudanças muito pequenas e locais.

## Backend - padrões
- Controllers finos
- Regra de negócio em services
- DTOs explícitos para request/response
- Bean Validation para entradas
- Endpoints sob `/api`
- Preferir código compatível com Java 21

## Frontend - padrões
- React com TypeScript
- Componentes pequenos e reutilizáveis
- Separar UI, hooks e cliente HTTP
- Tratar loading, erro e empty state explicitamente

## Comandos esperados
### Backend
- `./mvnw test`

### Frontend
- `cd frontend && npm test`
- `cd frontend && npm run build`

## Formato de resposta esperado
Sempre responder com:
1. plano resumido
2. arquivos alterados
3. comandos executados
4. resultado dos testes
5. riscos, pendências ou próximos passos