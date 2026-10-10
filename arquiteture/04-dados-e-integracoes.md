# Dados e integrações

## Persistência relacional

- PostgreSQL é acessado por Prisma.
- O schema está em `prisma/schema.prisma`; migrations ficam em `prisma/migrations/`.
- A instância compartilhada do cliente é criada em `src/database/prismaCliente.ts`.
- Seeds estão em `prisma/seeds/` e são organizados por conteúdo, como hobbies e perfis/configuração de IA.

Use migrations para mudanças estruturais do banco e mantenha schema e histórico de migrations coerentes. Não edite tabelas diretamente como substituto de uma migration versionada.

## Redis

`src/lib/redis.ts` cria um cliente Redis e um cliente subscriber, ambos usando `REDIS_URL`. O bootstrap em `src/server.ts` garante a conexão antes de começar a escutar HTTP.

O listener em `src/work/postExpirationListener.ts` assina eventos de chaves expiradas do Redis e atualiza a situação de publicações no banco; quando aplicável, emite o evento Socket.IO `post-expired`. A configuração do Redis precisa publicar eventos de expiração para que esse fluxo funcione.

## Socket.IO

`src/lib/socket.ts` conecta Socket.IO ao servidor HTTP. O handshake espera um JWT em `auth.token`; o token é verificado e o usuário é carregado pelo identificador interno. A conexão entra em salas privadas/públicas do usuário e na sala global `global-chat`. Mensagens privadas também podem entrar em sala pelo evento `join-send-message`.

Eventos e payloads pertencentes a cada funcionalidade devem ser documentados junto do módulo que os emite.

## Cloudinary

As credenciais são lidas de variáveis de ambiente configuradas em `src/config/cloudinary.ts`. A camada `src/service/cloudinary.service.ts` faz upload de imagens autenticadas, constrói URLs assinadas e exclui recursos. A configuração de Multer está em `src/lib/multerCloudinary.ts`.

- Avatares usam a pasta `user-avatar`.
- Publicações e imagens do chat global usam `user-posts` no serviço de upload autenticado atual.
- A pasta do Cloudinary é um parâmetro do upload e é criada pelo serviço conforme necessário; não é preciso criá-la manualmente no painel.
- O banco guarda identificadores de mídia, não deve ser usado para armazenar o conteúdo binário.

## Outros serviços externos

| Serviço | Uso no código |
| --- | --- |
| Stripe | Assinaturas, pagamentos e processamento de webhook. |
| OpenAI | Integração de IA configurada em `src/lib/openAIGptMini.ts` e módulos relacionados. |
| Brevo | E-mails transacionais e confirmação de conta. |
| Loki | Envio de logs configurado em `src/config/logger-loki.ts`. |
| Geolocalização por IP | Consulta auxiliar em `src/service/GetLocationByIpService.ts`. |

## Configuração segura

`src/env.ts` lista as variáveis esperadas pelo projeto. Entre elas existem segredos e chaves de terceiros; use apenas nomes de variáveis ao documentar requisitos. Nunca copie valores de `.env`, logs de autenticação ou credenciais para arquivos versionados.

O serviço cloudinaryDirectUpload.service.ts assina autorizações e verifica callbacks para upload direto. DirectUploadSession registra a intenção e a publicação idempotente. O webhook POST /cloudinary/webhook usa corpo bruto; não depende do segredo Stripe. Veja 10-upload-direto-cloudinary.md para configuração, retries e limites.
