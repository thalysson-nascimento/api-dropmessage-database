# Fluxos principais

## Inicialização do servidor

1. `src/server.ts` carrega `dotenv/config`, cria a aplicação Express e configura CORS e parsers.
2. As rotas são registradas a partir de `src/routes.ts`.
3. Um servidor HTTP é criado e passado a `initializeSocket`.
4. O bootstrap conecta os clientes Redis, inicia `monitorExpiredPosts()` e então chama `listen`.
5. Em caso de falha no bootstrap, o erro é registrado e o processo termina.

## Autenticação HTTP

1. O cliente envia `Authorization: Bearer <token>` nas rotas protegidas.
2. `ensureAuthenticateUserAdmin` verifica o JWT com `JWT_SECRET`.
3. O campo `sub` do token é colocado em `request.id_client`.
4. A rota encaminha a requisição ao controller.

O identificador interno do usuário deve ser distinguido de identificadores públicos usados em respostas. Verifique a serialização específica do domínio antes de expor IDs.

## Upload de imagem

1. A rota aplica `upload.single("file")`; Multer recebe o arquivo em memória.
2. O controller disponibiliza `request.file` ao fluxo da funcionalidade.
3. O use case chama os métodos de `src/service/cloudinary.service.ts`.
4. O Cloudinary retorna um `public_id`, persistido no registro correspondente.
5. A resposta pode construir uma URL autenticada e assinada para entrega da imagem.

As imagens de avatar e as imagens de publicações/chat usam pastas configuradas no fluxo de upload. Consulte o módulo e o serviço para confirmar o destino de cada novo caso.

## Expiração de publicações

O listener Redis em `src/work/postExpirationListener.ts` processa eventos de expiração para chaves `post:<id>`. O registro da publicação é atualizado no PostgreSQL e o servidor emite `post-expired` aos sockets conectados.

## Comunicação em tempo real

O socket autentica o usuário durante o handshake usando `auth.token`. Após validar JWT e existência do usuário, atualiza presença e adiciona a conexão às salas correspondentes. Módulos chamam os helpers de `src/lib/socket.ts` para transmitir eventos.

## Pagamentos e webhook

As rotas relacionadas ao Stripe estão registradas em `src/routes.ts`. O servidor evita converter o corpo do endpoint `/stripe/webhook` para JSON antes do tratamento do webhook, preservando o formato requerido para verificação da assinatura. Consulte o controller e a configuração Stripe antes de alterar parsers ou middleware desse endpoint.

Uploads nas rotas ativas passam também por validateUploadedImage antes do controller. A validação é reutilizada pelos serviços Cloudinary. Consulte 08-seguranca-e-notificacoes.md para limites e análise de risco.

O bootstrap inicia também a limpeza de uploads diretos em lotes limitados. O parser bruto do webhook Cloudinary é registrado antes do JSON; o webhook Stripe mantém seu fluxo. O novo upload de fotos do chat global não passa pelo Multer; clientes legados ainda podem usar multipart durante a transição.
