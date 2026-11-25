# Docker

Este diretorio contem a preparacao Docker do backend Spring Boot.

## Rodar localmente

```powershell
docker compose up --build
```

A API ficara em `http://localhost:8080`.
O frontend ficara em `http://localhost:5173`.

O `docker-compose.yml` sobe:

- `mysql`: banco MySQL local com volume persistente.
- `backend`: aplicacao Spring Boot com perfil `mysql`.
- `frontend`: aplicacao React/Vite servida pelo Node em modo dev.

Para rodar em segundo plano:

```powershell
docker compose up --build -d
```

Para parar mantendo os dados:

```powershell
docker compose down
```

Para apagar o banco local e recriar do zero:

```powershell
docker compose down -v
docker compose up --build
```

## Variaveis principais

| Variavel | Uso | Padrao local |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Perfil Spring ativo | `mysql` |
| `MYSQL_URL` | JDBC URL do MySQL | `jdbc:mysql://localhost:3306/rpg_manager?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo` |
| `MYSQL_USER` | Usuario do MySQL | `root` |
| `MYSQL_PASSWORD` | Senha do MySQL | `rpg10` |
| `PORT` | Porta HTTP usada em plataformas como Render | `8080` |
| `APP_EMAIL_ENABLED` | Liga/desliga envio de emails | `true` na app, `false` no compose |
| `SMTP_PASSWORD` | Senha SMTP quando email estiver ativo | vazio |
| `FRONTEND_BASE_URL` | URL publica do frontend usada em links de email | `http://localhost:5173` |

## Observacoes

Dentro do Docker, o backend deve usar o host `mysql`, nao `localhost`, porque cada container tem sua propria rede.

O frontend compartilha a rede do backend para manter o proxy do Vite apontando para `localhost:8080`.

## Atualizar o backend após mudanças no código

O frontend usa um volume com os arquivos locais e o Vite atualiza a interface durante o desenvolvimento. O backend executa o JAR compilado dentro da imagem: alterações em controllers, serviços, DTOs ou migrations exigem recompilar a imagem. Reiniciar o container sem rebuild mantém o JAR anterior.

Para preparar a imagem atualizada, a partir da raiz do repositório:

```sh
docker compose -f backend/docker-compose.yml build backend
```

Depois de conferir o banco configurado e preparar a atualização dos seus dados, aplique a imagem no ambiente desejado:

```sh
docker compose -f backend/docker-compose.yml up -d --no-deps backend
```

O Liquibase executa na inicialização. No módulo de Sessões, a migration `012-simplify-sessoes` permite números nulos e remove somente as antigas datas da sessão; datas de eventos e timestamps técnicos são preservados. Não utilize recriação de volumes para atualizar código. Se o frontend novo consultar um backend antigo, os endpoints de Sessões podem não existir, mesmo que campanhas e personagens continuem funcionando.

Se voce iniciou containers manualmente pelo Docker Desktop, prefira recriar pelo Compose para garantir que backend e banco estejam na mesma rede:

```powershell
docker compose down -v
docker compose up --build
```
