# Deploy no Render

O Dockerfile compila o React e inclui o resultado no JAR do Spring Boot.
A interface e a API usam o mesmo endereço; não é necessário publicar um Static Site.

## Configuração do serviço

- Tipo: Web Service, runtime Docker.
- Root Directory: deixe vazio (raiz do repositório com backend/ e frontend/).
- Dockerfile Path: backend/Dockerfile.
- Docker Build Context Directory: .
- Não é necessário definir Build Command ou Start Command.

O Dockerfile.dockerignore ao lado do Dockerfile exclui arquivos .env,
dependências locais e builds anteriores do contexto enviado ao Docker.

## Variáveis de ambiente

Cadastre no painel do Render, sem enviar o .env ao repositório:

```dotenv
SPRING_PROFILES_ACTIVE=mysql
MYSQL_URL=jdbc:mysql://HOST_TIDB:4000/rpg_manager?sslMode=VERIFY_IDENTITY&serverTimezone=America/Sao_Paulo
MYSQL_USER=USUARIO_COMPLETO_TIDB
MYSQL_PASSWORD=SENHA_ATUAL
APP_EMAIL_ENABLED=false
FRONTEND_BASE_URL=https://SEU_SERVICO.onrender.com
```

O Spring lê PORT fornecida pelo Render. Secret Files não são necessários
quando o certificado do TiDB é validado pelo truststore padrão da JVM.
Se houver regras de firewall no TiDB, autorize os endereços de saída do serviço.

Para habilitar e-mail, configure APP_EMAIL_ENABLED=true e SMTP_PASSWORD.
A conta remetente padrão está em application.yml e pode ser substituída por
APP_EMAIL_USERNAME e APP_EMAIL_FROM. Render Free bloqueia SMTP na porta 587.

## Validação local do container de produção

Na raiz do repositório:

```powershell
docker build -f backend/Dockerfile -t rpg-manager .
docker run --rm --env-file backend/.env -e SPRING_PROFILES_ACTIVE=mysql -p 8080:8080 rpg-manager
```

Esse comando usa o banco definido no .env e executa Liquibase na inicialização.
Abra http://localhost:8080. O Compose continua oferecendo Vite em :5173 para
desenvolvimento; a imagem do backend também serve o frontend compilado em :8080.

No Render, confira a inicialização do Liquibase e a mensagem Started
RpgManagerApplication. Abra a raiz, /login e /cadastro, teste login e campanhas
e confirme que /api/auth/me sem credenciais retorna 401.

O React atual usa estado e query strings na raiz, sem roteador de páginas.
Somente /login e /cadastro encaminham para index.html; endpoints /api e recursos
ausentes não recebem um fallback genérico de HTML.
