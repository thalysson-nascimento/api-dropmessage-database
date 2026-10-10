# Upload direto de imagens: contrato e operação

Data: 10/10/2026. Primeira etapa: chat global. Publicações/feed, chat privado e avatares continuam usando suas rotas existentes. A assinatura, validação de webhook, sessões e fila de limpeza formam a base para as próximas etapas; cada domínio ainda precisará preservar suas regras de plano, publicidade, match e acesso.

## Fluxo

1. Usuário termina o fluxo atual de publicidade/recompensa no aplicativo. O frontend adiciona uma foto provisória somente à sua lista local.
2. Frontend solicita autorização JSON autenticada em POST /global-chat/uploads. A API armazena intenção de publicação, sem receber a imagem.
3. Frontend envia multipart diretamente ao uploadUrl do Cloudinary, copiando os fields retornados e acrescentando o arquivo em file. Não enviar o JWT da aplicação para o Cloudinary.
4. Cloudinary envia metadados ao POST /cloudinary/webhook. A API verifica a assinatura sobre os bytes exatos do JSON e associa o public_id à sessão emitida pelo servidor.
5. Em transação com bloqueio da sessão, a API publica uma mensagem IMAGE e marca a sessão como PUBLISHED. Expiração da mensagem começa na publicação, não na solicitação da assinatura.
6. Servidor emite global-chat:new-message com uploadId e upload:status na sala privada do autor. Frontend substitui o item provisório, sem adicionar outro.
7. Se o socket ou webhook falhar, o autor consulta status e pode solicitar reconciliação; a API consulta apenas os metadados do recurso conhecido no Cloudinary, sem baixar o arquivo.

O endpoint de autorização não é prova de que um anúncio foi assistido. Não existia comprovação servidor-a-servidor de publicidade no chat global; as regras existentes foram mantidas. Não confiar em um novo booleano adWatched enviado pelo cliente como prova. Uma validação AdMob SSV é uma evolução separada.

## Autorização

POST /global-chat/uploads — Bearer JWT, application/json.

```json
{
  "clientRequestId": "0b098de5-e85b-4018-b92c-e5904b068ca4",
  "fileName": "photo.jpg",
  "bytes": 240000,
  "mimeType": "image/jpeg",
  "content": "Legenda opcional",
  "viewOnce": true,
  "expiresInSeconds": 86400
}
```

replyToId é opcional, UUID de uma mensagem ativa. content tem no máximo 2000 caracteres neste fluxo. viewOnce é booleano JSON. expiresInSeconds é inteiro entre 60 e 604800, padrão 86400. bytes é o tamanho do arquivo efetivamente enviado, inteiro positivo até 5242880. Formatos: JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF e AVIF; MIME application/octet-stream também aceito como declaração auxiliar.

Resposta 201 (campos ilustrativos; não guardar assinatura em logs):

```json
{
  "uploadId": "0b098de5-e85b-4018-b92c-e5904b068ca3",
  "clientRequestId": "0b098de5-e85b-4018-b92c-e5904b068ca4",
  "status": "PENDING",
  "expiresAt": "2026-10-10T15:15:00.000Z",
  "messageId": null,
  "message": null,
  "unavailable": false,
  "errorCode": null,
  "upload": {
    "uploadUrl": "https://api.cloudinary.com/v1_1/SEU_CLOUD/image/upload",
    "fields": {
      "timestamp": "TIMESTAMP_RETORNADO",
      "public_id": "direct-uploads/global-chat/0b098de5-e85b-4018-b92c-e5904b068ca3",
      "type": "authenticated",
      "overwrite": "false",
      "allowed_formats": "jpg,jpeg,png,webp,gif,bmp,tiff,heic,heif,avif",
      "notification_url": "https://SUA_API/cloudinary/webhook",
      "api_key": "CHAVE_PUBLICA",
      "signature": "ASSINATURA_RETORNADA"
    },
    "maxBytes": 5242880,
    "allowedFormats": ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "heic", "heif", "avif"]
  }
}
```

Copiar todos os fields como strings, sem acrescentar parâmetros Cloudinary opcionais. Acrescentar file como binário. Não definir manualmente Content-Type do FormData, pois o cliente deve gerar o boundary. API secret nunca sai do backend.

clientRequestId torna a solicitação idempotente por usuário/domínio: mesma chave e mesmos dados retornam a sessão existente; reutilizar a chave com dados diferentes retorna 409. Se a sessão já estiver concluída ou vencida, upload será null. Não emitir outra requisição de criação de mensagem para a mesma foto.

Quotas de emissão: 3 sessões simultâneas não vencidas e 30 novas sessões por usuário por hora, com verificação transacional válida entre réplicas. 429 indica aguardar. A solicitação é JSON com metadados; nenhum base64 ou URL remota é aceito.

## Status, cancelamento e recuperação

- GET /global-chat/uploads/:uploadId — somente o autor. Retorna os campos externos da autorização, sem upload/assinatura. Em PUBLISHED, message contém a serialização habitual da mensagem e uploadId. Imagens de visualização única permanecem ocultas para o autor nessa resposta.
- DELETE /global-chat/uploads/:uploadId — cancela uma sessão pendente, sem publicar. Um webhook tardio será descartado e o recurso removido. Uma sessão publicada retorna 409: usar DELETE /global-chat/:messageId.
- POST /global-chat/uploads/:uploadId/reconcile — sem corpo, somente o autor. Consulta metadados pela credencial do servidor e publica pela mesma transação se o upload existir e for válido. Não aceita public_id, URL ou metadados do cliente. Limite adicional de 6 chamadas por minuto por usuário por processo; evitar polling desse endpoint. 404 do recurso no Cloudinary mantém PENDING. Falha externa retorna 503.

Estados: PENDING (autorizado para upload), AWAITING_CONFIRMATION (prazo de upload terminou; ainda há janela para callbacks/reconciliação), PUBLISHED, CANCELED, REJECTED e EXPIRED. Autorização de aplicação: 15 minutos para concluir o upload no Cloudinary, mais 20 minutos para confirmar um upload concluído dentro do prazo. created_at do Cloudinary é conferido; não é possível publicar um upload tardio apenas reusando a assinatura.

unavailable=true e message=null indicam mensagem publicada que já foi removida ou expirou. Não recriar essa mensagem no frontend. REJECTED informa errorCode, por exemplo INVALID_ASSET, UPLOAD_EXPIRED, REPLY_UNAVAILABLE ou USER_UNAVAILABLE.

## Eventos

- upload:status — sala interna do autor, autenticada pelo servidor. Payload: uploadId, clientRequestId, status, messageId e errorCode. Nunca inclui URL da imagem. Não entrar manualmente em salas arbitrárias.
- global-chat:new-message — contrato existente, com uploadId adicional para fotos do fluxo direto. A mensagem só chega depois da confirmação. Não inclui clientRequestId; fotos de visualização única têm imageUrl=null e fileName=null.
- GET /global-chat também inclui uploadId nas mensagens vinculadas à sessão, permitindo reconciliação após reconexão.

No evento público isMine não deve determinar sozinho o autor: comparar author.id com o hash público do usuário atual. A consulta HTTP retorna isMine personalizado. Deduplicar pelo id da mensagem e reconciliar a foto provisória pelo uploadId. Notificações de reações/comentários e eventos de leitura/exclusão continuam iguais.

## Segurança e limpeza

Cloudinary recebe parâmetros assinados de formato, public_id, tipo authenticated, overwrite=false e notification_url. Identificadores são gerados pelo servidor; destino e metadados de publicação não vêm do webhook como identidade do usuário.

Webhook: corpo JSON bruto de até 64 KB, headers X-Cld-Signature e X-Cld-Timestamp, SHA-1/SHA-256, comparação em tempo constante. Timestamp até 2 horas no passado e tolerância de 60 segundos no futuro. Verifica formato, resource_type=image, entrega authenticated, tamanho real até 5 MB, dimensões positivas e limite de 100 milhões de pixels. Eventos de outros recursos são ignorados. Uma assinatura do upload devolvida pelo frontend não substitui a assinatura do webhook.

O limite de 5 MB é validado pelos metadados após o upload; a declaração do cliente não é uma barreira de segurança. A documentação atual do Cloudinary informa que presets não têm limite de tamanho por preset. Um arquivo grande pode consumir recursos no Cloudinary antes de ser rejeitado/removido; não consome memória de imagem na API. Configurar limites/alertas na conta e otimização no cliente para reduzir esse custo.

resource_type não faz parte da assinatura de upload Cloudinary. A publicação só aceita imagens autenticadas, mesmo se um cliente mudar a rota remota para raw/video. Recursos inadequados de uma sessão conhecida são removidos; nada é publicado.

A assinatura Cloudinary não é um token revogável/consumível instantaneamente. Sessão, overwrite=false e transação garantem uma publicação por intenção. Cancelamentos e callbacks tardios não recriam mensagens. Reutilização após exclusão gera limpeza, mas não deve ser descrita como impossibilidade absoluta de consumo remoto. Manter controle de custos na conta.

Exclusão de mensagens diretas enfileira a remoção antes de excluir o registro; em caso de falha, a tarefa repete a exclusão com invalidação de CDN. A cada minuto, processa até 20 itens em sequência e enfileira imagens diretas publicadas cujo prazo acabou. A invalidação no CDN pode levar tempo. Mídias anteriores ao fluxo direto mantêm o comportamento existente. Não são baixados arquivos na tarefa de limpeza.

## Configuração e implantação

1. Aplicar a migration aditiva 20261010120000_direct_upload_sessions e gerar o Prisma Client antes de subir o novo backend. Não usar migrate dev/reset/db push em produção.
2. Manter CLOUDINARY_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET existentes. Não enviar valores para o chat nem incluí-los no frontend.
3. Preferencialmente configurar CLOUDINARY_NOTIFICATION_URL=https://DOMINIO_PUBLICO_DA_API/cloudinary/webhook na Railway. Se ausente, a API deriva esse caminho de BASE_URL, que deve ser a URL pública HTTPS da própria API. No ambiente local inspecionado, BASE_URL aponta para api-dropmessage-database-production.up.railway.app; conferir a mesma variável no serviço Railway.
4. Não é necessário criar um preset nem cadastrar um webhook global no painel: notification_url já faz parte de cada autorização assinada. O endpoint público precisa estar acessível na versão implantada.
5. Conferir no Cloudinary Console, Settings > Webhook Notifications / API Keys, qual chave assina callbacks. Por padrão, Cloudinary usa a chave ativa mais antiga, que pode ser diferente da chave de upload. Se necessário, colocar o segredo correspondente em CLOUDINARY_WEBHOOK_API_SECRET na Railway; na ausência dele, é usado CLOUDINARY_API_SECRET. Jamais fornecer esse segredo ao frontend.
6. Atualizar o frontend conforme o prompt associado. Só depois habilitar CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY=true. Sem a variável, o endpoint legado /global-chat mantém multipart para clientes antigos. Com true, multipart é recusado antes de buffering, retornando 415 e code=DIRECT_UPLOAD_REQUIRED; mensagens de texto JSON continuam funcionando.
7. Validar em homologação um upload direto real, callback/reconciliação, leitura única, cancelamento, expiração e exclusão. Os testes automatizados usam mocks de Cloudinary/banco; não foram criadas fotos de clientes para testes.

A base fica preparada para novos domínios, mas esta etapa não muda o upload do feed, chat privado ou avatar. Não aplicar o novo contrato aos outros fluxos antes de seus endpoints específicos serem implementados.

## Referências

- [Cloudinary: upload direto](https://cloudinary.com/documentation/client_side_uploading).
- [Cloudinary: parâmetros e assinatura do Upload API](https://cloudinary.com/documentation/image_upload_api_reference).
- [Cloudinary: verificação de callbacks](https://cloudinary.com/documentation/notification_signatures).
- [Cloudinary: retries de webhook](https://cloudinary.com/documentation/notifications).
- [Cloudinary: limitações de presets](https://cloudinary.com/documentation/upload_presets).

## Verificação desta entrega

58 testes aprovados, incluindo o fluxo direto e regressões dos chats, notificações e uploads legados. TypeScript sem erros. A migration de sessões foi aplicada em 10/10/2026 ao banco configurado: 254 clientes antes/depois e os mesmos identificadores; nenhuma sessão de cliente foi criada para testes. Validação ponta a ponta com o frontend/Cloudinary permanece necessária antes de habilitar DIRECT_ONLY.
