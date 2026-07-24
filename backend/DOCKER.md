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

Se voce iniciou containers manualmente pelo Docker Desktop, prefira recriar pelo Compose para garantir que backend e banco estejam na mesma rede:

```powershell
docker compose down -v
docker compose up --build
```
