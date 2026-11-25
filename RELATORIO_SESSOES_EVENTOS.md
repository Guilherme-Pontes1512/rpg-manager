# Módulo de Sessões e Eventos Narrativos

Data: 24/11/2026. Alterações locais, sem commit. Nenhum banco real foi utilizado nas validações.

## Resumo

Implementado um arquivo narrativo privado por campanha, com Sessões e Banco de Eventos. O mestre pode preparar acontecimentos sem sessão, planejar e ordenar eventos, iniciar uma sessão, acompanhar fichas existentes, registrar realizações e anotações, revisar pendências no encerramento e consultar os registros posteriormente.

O módulo complementa o acompanhamento existente. Não altera atributos, cálculos, regras de RPG ou o armazenamento das fichas. Não executa eventos automaticamente e não utiliza inteligência artificial.

## Análise e decisões arquiteturais

- Backend existente: Spring Boot, Java 21, Spring Data JPA, DTOs explícitos, serviços e controllers REST. Tratamento de erros centralizado em `ApiExceptionHandler`.
- Banco gerenciado por Liquibase; Hibernate continua com `ddl-auto: validate`. A nova migration é aditiva.
- Frontend existente: React/TypeScript, navegação por estado, clientes HTTP com autenticação Basic e CSS nativo com tokens compartilhados. Não há framework de testes frontend configurado.
- Autorizações existentes distinguem MESTRE e JOGADOR; TODOS é usado como opção genérica e não representa um administrador de campanha. O acesso narrativo exige MESTRE na campanha solicitada, incluindo usuários adicionais com esse mesmo papel.
- O pacote `narrativa` concentra o novo domínio. Controllers recebem DTOs validados; `NarrativaService` centraliza integridade, transições, transferências e encerramento.
- As operações narrativas usam transações e bloqueio pessimista da campanha. Isso serializa decisões concorrentes, inclusive numeração, início de sessão e planejamento exclusivo de eventos, sem depender do frontend.
- Relacionamentos JPA reutilizam `Personagem` e `CampanhaNpc`; nenhuma ficha é copiada. Coleções narrativas usam carregamento em lotes. Listagens agregam associações e contagens por campanha, evitando consultas individuais para cada contador.
- Datas narrativas são texto livre de até 255 caracteres; datas reais são opcionais. Textos narrativos extensos usam colunas textuais.

## Entidades e relacionamentos

| Entidade | Responsabilidade e relacionamentos |
| --- | --- |
| `Sessao` | Campanha, número, título, descrição, datas, status, resumo, início/fim, timestamps, participantes e NPCs existentes |
| `Evento` | Definição independente da campanha, classificação, status geral, local, data narrativa, condições, orientações privadas, evidências, consequências, participantes e NPCs |
| `SessaoEvento` | Associação histórica única sessão/evento, ordem, status local, observações, resultado, consequências/evidências efetivas e horário de realização |
| `NotaSessao` | Diário cronológico, título opcional, conteúdo, categoria, personagens/NPCs, evento opcional e timestamps |

As categorias de notas, os quatro tipos de eventos, os quatro status de sessão, os três status gerais de evento e os quatro status de associação são representados por enums próprios.

## Migration

`backend/src/main/resources/db/changelog/changes/2026-2/011-create-narrativa.yaml`, incluída no master existente.

Cria `sessoes`, `eventos`, `sessao_eventos`, `notas_sessao` e seis tabelas de vínculos com personagens/NPCs. Inclui chaves estrangeiras, índices por campanha/status, evento/status e diário/data, unicidade de campanha/número e de sessão/evento.

As colunas narrativas usam `text` em PostgreSQL/MySQL e `varchar(1000000000)` em H2. Essa diferença evita que o Liquibase converta `text` em CLOB no H2, incompatível com o mapeamento JPA sem `@Lob`. As migrations anteriores não foram alteradas.

O teste de atualização aplica primeiro o changelog anterior, insere dados fictícios de campanha, usuário, membro, personagem e NPC, aplica a migration nova e verifica a preservação dos valores e das fichas.

## API

Prefixo de todos os endpoints: `/api/campanhas/{campanhaId}/narrativa`.

| Método | Caminho | Operação |
| --- | --- | --- |
| GET / POST | `/sessoes` | Listar / criar sessão |
| GET / PUT / DELETE | `/sessoes/{id}` | Consultar / editar / excluir sessão |
| POST | `/sessoes/{id}/iniciar` | Iniciar sessão planejada |
| POST | `/sessoes/{id}/cancelar` | Cancelar sessão planejada ou em andamento |
| POST | `/sessoes/{id}/encerrar` | Aplicar revisão e concluir atomicamente |
| GET / POST | `/eventos` | Listar / criar acontecimento independente |
| GET / PUT / DELETE | `/eventos/{id}` | Consultar / editar / excluir evento |
| GET / POST | `/sessoes/{sessaoId}/eventos` | Listar / associar evento existente |
| POST | `/sessoes/{sessaoId}/eventos/novo` | Criar evento e associação na mesma transação |
| PUT | `/sessoes/{sessaoId}/eventos/ordem` | Reordenar com lista completa de IDs |
| PUT / DELETE | `/sessoes/{sessaoId}/eventos/{id}` | Registrar desfecho / remover associação não utilizada |
| POST | `/sessoes/{sessaoId}/eventos/{id}/transferir` | Preservar origem como adiada e criar associação de destino |
| POST | `/sessoes/{sessaoId}/eventos/{id}/banco` | Liberar planejamento, preservando origem como adiada |
| GET / POST | `/sessoes/{sessaoId}/notas` | Consultar diário / criar anotação |
| PUT / DELETE | `/sessoes/{sessaoId}/notas/{id}` | Editar / excluir anotação |

Sessões aceitam `busca` e `status`. Eventos aceitam `busca`, `tipo`, `status`, `npcId`, `sessaoId` e `semSessao`. O filtro de sessão do Banco de Eventos representa o planejamento ativo; associações históricas são consultadas dentro das sessões. Notas aceitam `pesquisa` (ou `busca`) e `categoria`. As listagens não são paginadas nesta entrega; o frontend também filtra localmente os dados carregados.

Criações retornam 201; exclusões, reordenação e retorno ao banco retornam 204. Consultas, edições e demais ações retornam 200. Falhas de autorização retornam 403; recursos fora da campanha retornam 404; entradas inválidas retornam 400; conflitos de negócio retornam 409.

Os contratos completos, incluindo revisão de encerramento, estão em `NarrativaDtos.java`. Todos os resultados são DTOs, sem serializar entidades JPA ou fichas privadas por caminhos públicos.

## Regras de negócio e exclusão

- Numeração sugerida pelo maior número atual da campanha mais um; o mestre pode editar. A unicidade também é garantida no banco.
- Apenas sessões planejadas podem iniciar. Uma campanha só pode manter uma sessão em andamento. Sessões concluídas podem ter dados gerais, participantes, resumo, anotações e resultados complementados.
- O cancelamento libera planejamentos pendentes como associações adiadas e mantém os eventos no banco.
- Um evento pode existir sem sessão e ser realizado fora de cena. O tipo é apenas uma classificação; o padrão escolhido para cadastro rápido é Opcional.
- Um evento só pode ter uma associação pendente por vez. Uma associação histórica impede novo vínculo do mesmo evento à mesma sessão.
- Realizar uma associação atualiza também o evento geral. Adiar ou descartar apenas naquela sessão não descarta o evento geral.
- Transferências exigem outra sessão planejada, preservam a origem como Adiado e criam um novo vínculo. Retornar ao banco também preserva o vínculo como Adiado.
- Associações com desfecho não são reabertas nem mudam para outro desfecho; seus textos de resultado podem ser corrigidos. Eventos realizados não podem voltar a pendentes/descartados. Essa política preserva o histórico.
- O encerramento exige decisão explícita para cada pendência ou a opção coletiva de retorno ao banco. As opções individuais incluem transferir, criar sessão futura e transferir, retornar ao banco, realizar fora de cena e os dois tipos de descarte.
- Nenhuma pendência é implicitamente realizada ou descartada. Resumo final é opcional. Falhas em qualquer decisão revertem toda a operação.
- Uma sessão em andamento ou com evento realizado não pode ser excluída. Nas demais, a confirmação de exclusão remove suas notas e associações; os eventos originais permanecem.
- Eventos com qualquer associação histórica, anotação relacionada ou status Realizado têm exclusão restrita. Ideias sem esses registros podem ser excluídas; eventos com histórico pendente podem ser descartados narrativamente.
- Campanhas com sessões/eventos não podem ser excluídas diretamente: a API retorna conflito explicativo, protegendo o arquivo narrativo. Campanhas sem esses registros mantêm o comportamento anterior.
- Excluir personagem/NPC pelos mecanismos existentes remove apenas seus vínculos narrativos, sem excluir sessões, eventos ou notas.

## Autorização e integridade

Toda operação, incluindo listagens e buscas, valida o papel MESTRE na campanha. A navegação interna também oculta o módulo para jogadores. A segurança não depende dessa ocultação.

Sessões, eventos, notas e associações são consultados no contexto da campanha solicitada. Os IDs de personagens e NPCs são validados contra a campanha antes da persistência; notas também validam o evento relacionado. Tentativas de combinar recursos de campanhas distintas são rejeitadas.

Rascunhos no navegador são isolados por usuário/campanha/sessão/contexto. São dados locais ao navegador, não uma forma de compartilhar registros com jogadores. A publicação de resumos não foi implementada.

## Telas e componentes

- Navegação Sessões dentro da campanha, com áreas Sessões e Banco de Eventos; o menu global orienta a abrir uma campanha.
- Listagem com busca, filtros, indicadores, contagens e destaque da sessão ativa.
- Formulários de sessão, evento e anotação, com seleção de personagens/NPCs existentes.
- Abas Visão geral, Eventos, Anotações, Personagens e Resumo; Mesa disponível durante a sessão.
- Eventos expansíveis, ações rápidas, drag-and-drop e alternativa por botão de reordenação.
- Diário cronológico com registro rápido, categorias, pesquisa, edição e exclusão.
- Resumo manual acompanhado de realizações, evidências, consequências e pendências já registradas.
- Mesa em colunas no desktop e seções no celular, com notas rápidas, eventos, personagens e NPCs. Usa card, fichas e atualização em tempo real existentes. O contador de tempo é atualizado periodicamente.
- Revisão antes de encerrar, com participantes, registros, eventos agrupados por status e decisão sobre pendências.
- Rascunhos de formulários, diário, resumo, resultados e revisão preservados no armazenamento local; confirmação ao descartar e proteção contra fechamento acidental.
- CSS utiliza paleta, tipografia, superfícies, botões e tokens atuais, sem dependências visuais adicionais.

## Arquivos criados e modificados

Backend criado sob `backend/src/main/java/com/ducke/rpg_manager/narrativa/`:

- `NarrativaController.java`.
- `dtos/NarrativaDtos.java`.
- `service/NarrativaService.java`.
- `entidade/Sessao.java`, `Evento.java`, `SessaoEvento.java`, `NotaSessao.java`.
- `entidade/StatusSessao.java`, `TipoEvento.java`, `StatusEvento.java`, `StatusSessaoEvento.java`, `CategoriaNota.java`.
- `repository/CampanhaNarrativaRepository.java`, `SessaoRepository.java`, `EventoRepository.java`, `SessaoEventoRepository.java`, `NotaSessaoRepository.java`.

Outros arquivos backend:

- Criados `backend/src/test/java/com/ducke/rpg_manager/NarrativaIntegrationTests.java` e `NarrativaMigrationTests.java`.
- Criada migration `011-create-narrativa.yaml`; modificado `db.changelog-master.yaml`.
- Modificado `campanha/service/CampanhaService.java` para proteger a exclusão de campanhas com registros narrativos e compartilhar o bloqueio transacional.

Frontend:

- Criados `frontend/src/campanhas/clienteNarrativa.ts`, `NarrativaFormulario.tsx`, `TelaSessoes.tsx` e `TelaSessoes.css`.
- Modificados `frontend/src/App.tsx`, `frontend/src/layout/BarraMenuSuperior.tsx`, `frontend/src/campanhas/TelaCampanhas.tsx` e `TelaAcompanhamentoMestre.tsx` para navegação e reutilização das fichas.
- Atualizados `frontend/dist/index.html` e bundles versionados por meio do build; os arquivos anteriores com hash são substituídos pelos novos.
- Criados `frontend/validation/narrativa-e2e.mjs`, capturas PNG e `frontend/validation/narrativa/browser-results.json`.
- Criado este relatório.

## Testes e resultados

| Validação executada | Resultado |
| --- | --- |
| Backend: `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 bash mvnw -f backend/pom.xml verify -q` | Sucesso, empacotamento incluído; 29 testes, zero falhas, zero erros |
| `NarrativaIntegrationTests` | 15 testes de integração API/persistência aprovados |
| `NarrativaMigrationTests` | 1 teste de atualização de schema e preservação de dados aprovado |
| `RpgManagerApplicationTests` existente | 13 testes aprovados |
| Frontend: `npm run build` | Sucesso, TypeScript e Vite |
| Chrome: `node frontend/validation/narrativa-e2e.mjs` | 18 verificações aprovadas, 10 capturas, zero erros de execução e nenhum overflow horizontal |
| Frontend: `npm test -- --run` | Não executável: script `test` não existe no projeto |
| Frontend: `npm run lint` | Não executável: configuração `eslint.config.*` ausente no projeto |
| `git diff --check` | Sem erros |

Os testes de integração cobrem CRUD, numeração, duplicidade, transições, sessão ativa exclusiva, edição após conclusão, eventos sem sessão, criação na sessão, reordenação, realização, adiamento, transferência, retorno ao banco, descartes, histórico, notas, pesquisa, autorização e relacionamentos entre campanhas.

O teste de rollback usa requisições sem transação externa de teste: uma decisão altera o primeiro evento e outra falha por destino inexistente. Consultas posteriores confirmam que status, resumo, planejamentos e associações permanecem como antes.

As verificações Chrome usam aplicação real e API interceptada com dados fictícios. Elas cobrem navegação, formulários, sessão em andamento, cards existentes, recuperação de rascunhos após recarregar, ficha NPC com retorno à aba Mesa, notas, resultados, encerramento, edição posterior, erro/retry e responsividade em 1440px e 390px. A inspeção visual confirmou a paleta existente, eventos compactos e o diário antes dos eventos no celular. Resultados e capturas reproduzíveis estão em `frontend/validation/narrativa/`. Essa validação visual **não é um teste HTTP integrado entre frontend e backend**; a API e a persistência são verificadas separadamente pelos testes Java.

## Problemas encontrados e correções

- O Maven Wrapper não tem permissão de execução neste checkout; os comandos usam `bash mvnw`, sem alterar permissões do arquivo.
- O sandbox inicialmente impediu gravar um provider de testes em `~/.m2`. A execução permitida com Java 21 concluiu os testes e o empacotamento.
- O Liquibase traduzia `text` para CLOB em H2; a migration recebeu tipo específico para H2 mantendo `text` em PostgreSQL/MySQL.
- A desserialização rejeitava o booleano primitivo omitido na revisão; o DTO passou a aceitar `Boolean` opcional e o serviço assume falso quando ausente.
- O projeto já não possui script de testes frontend nem configuração ESLint utilizável. Não foram adicionadas dependências para encobrir essas lacunas; o build e o script de navegador independente foram executados.

## Limitações e validações não realizadas

- Não houve conexão com PostgreSQL/MySQL real, nem restauração de backup de produção. A atualização com dados foi validada em H2; os demais bancos precisam de homologação antes do rollout.
- Não houve fluxo de navegador conectado à API real. Não foram validados Safari/Firefox, leitores de tela ou auditoria completa de acessibilidade.
- O teste de exclusividade de sessão ativa verifica a regra pela API; não houve teste de carga com múltiplas instâncias concorrentes. A proteção usa bloqueio de linha no banco.
- Listagens carregam os registros da campanha; paginação para arquivos muito grandes não faz parte desta entrega.
- A numeração sugerida considera o maior número atual, podendo reutilizar o último número após exclusão.
- Associações históricas não podem ser reabertas, e novos planejamentos são aceitos apenas em sessões planejadas/em andamento. Sessões concluídas continuam editáveis nos dados, notas, resumos e textos dos registros existentes.
- Rascunhos ficam no navegador atual; não há sincronização entre dispositivos ou edição colaborativa desses rascunhos. A atualização em tempo real reaproveitada se refere às fichas, não aos textos narrativos editados em outras abas.
- A ordenação de eventos é organizacional, sem execução obrigatória. Transferir de volta para uma sessão que já contém associação histórica do mesmo evento é rejeitado pela unicidade requerida.

## Fora do escopo

Módulos próprios de locais e evidências, linha do tempo geral, histórico específico de interações com NPCs, compartilhamento seletivo, resumos públicos, IA, calendários fictícios estruturados, execução agendada e avaliação automática de condições.

## Executar e validar

1. Use Java 21 e dependências Maven disponíveis. Execute `bash mvnw -f backend/pom.xml verify` para testes e pacote. Os testes configuram H2 em memória e desativam e-mail.
2. Para um backend manual isolado, execute `bash mvnw -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=dev,h2 -Dspring-boot.run.arguments=--app.email.enabled=false`. Não use os perfis MySQL/PostgreSQL com credenciais reais para testes exploratórios.
3. Em `frontend`, execute `npm run build` ou `npm run dev`. O proxy existente encaminha a API para a porta 8080.
4. Para repetir exclusivamente a validação visual fictícia, inicie `npm run dev -- --host 127.0.0.1 --port 5174` e, na raiz, execute `node frontend/validation/narrativa-e2e.mjs`. Requer Google Chrome em `/usr/bin/google-chrome`; o script utiliza perfil temporário e intercepta as APIs.
5. Na aplicação, abra uma campanha como mestre e selecione Sessões. Crie um evento no banco, uma sessão e seus participantes; associe ou crie acontecimentos, inicie a sessão, registre resultados e notas, revise pendências e encerre. Reabra a sessão concluída para complementar o resumo.
6. Antes de aplicar em produção, homologue a migration e os fluxos no mesmo SGBD da instalação, com cópia de dados e o procedimento habitual de backup do projeto.
