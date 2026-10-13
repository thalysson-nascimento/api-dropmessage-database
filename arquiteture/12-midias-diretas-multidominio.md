# Mídias diretas — avatar, timeline e chat privado

Extensão compatível do contrato de upload direto global. Os nomes exatos usados pelo Angular são preservados. Não há processamento, download, buffering, arquivo base64 ou geração de thumbnails na API neste fluxo. Nenhum arquivo do frontend foi alterado.

## Endpoints autenticados

| Método | Endpoint | Resultado |
| --- | --- | --- |
| POST | /media/uploads | Autoriza intenção idempotente JSON; retorna grants apenas dos assets ausentes |
| GET | /media/uploads/:uploadId | Status exclusivo do autor, sem assinaturas |
| POST | /media/uploads/:uploadId/reconcile | Sem corpo; confirma metadados pela API Cloudinary; limite adicional de 6/minuto/usuário por processo |
| DELETE | /media/uploads/:uploadId | Cancela sessão pendente e enfileira todas as mídias; publicado retorna 409 |

O POST /cloudinary/webhook existente continua validando corpo bruto, headers de assinatura e timestamp antes de acessar sessões. O dispatch de novos assets é feito pelo public_id conhecido no banco; domínio/autor não vêm do callback. O fluxo /global-chat/uploads e seu envelope message permanecem iguais, com acréscimo compatível dos campos de miniatura nos autores.

## Contrato JSON e domínios

Envelope de autorização: clientRequestId UUID-v4, domain, assets e metadata. Cada asset contém role, fileName, bytes e mimeType; width/height são opcionais e auxiliares. Extensão/MIME coerentes; sem caminhos de arquivo. Limite por asset: 5242880 bytes. Campos inesperados, roles repetidas e URLs/public_id fornecidos pelo cliente são rejeitados.

| domain | assets | metadata |
| --- | --- | --- |
| avatar | image + thumbnail | dateOfBirth (string de 10 caracteres no formato existente), gender=male/female/notBinary, interests=male/female/both |
| avatar-update | image + thumbnail | {} |
| timeline | image | expirationTimer=addThirtyMin/addOneHour/addOneday/addOneWeek |
| private-chat | image | matchId UUID, viewOnce booleano JSON |

Por confirmação expressa do usuário, as QUATRO durações atuais continuam permitidas para todos os planos. Não foi introduzida restrição nova por assinatura. A API mantém showADS, free trial e primeiro post conforme a lógica existente.

Principais formatos: JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF, AVIF. Thumbnail de avatar: JPEG/PNG/WebP, dimensões reais quadradas de até 160×160; não aceita GIF, HEIC ou TIFF nessa role. Nenhuma thumbnail de fotos privadas é aceita. Validação real: resource_type=image, type=authenticated, formato permitido, bytes positivos até 5 MB, dimensões positivas e até 100 milhões de pixels. Metadados enviados pelo navegador não são prova de integridade. O Cloudinary interpreta os pixels; a API verifica metadados assinados ou consultados com suas próprias credenciais.

A lista de assets é normalizada por role. Mesmo UUID/domínio/metadata/assets retorna a mesma sessão; mudança de dados com chave repetida retorna 409. Quotas compartilhadas com o global: até 3 sessões ativas por conta e 30 novas sessões por hora, protegidas por transação/bloqueio, inclusive entre réplicas.

## Respostas e progresso parcial

Envelope dos novos domínios: uploadId, clientRequestId, domain, status, expiresAt, resourceId, result, unavailable, errorCode, confirmedRoles. POST PENDING inclui uploads, array de grants com role, uploadUrl, fields (strings), maxBytes e allowedFormats. Não inclui message no topo. GET/reconcile não incluem grants. API secret nunca é devolvido.

Cada grant tem public_id exclusivo gerado pelo servidor, type=authenticated, overwrite=false, allowed_formats e notification_url assinados. O frontend copia TODOS os fields e acrescenta apenas file diretamente ao Cloudinary; não envia seu JWT ao Cloudinary e não define manualmente Content-Type.

No POST idempotente, assets ainda não confirmados são consultados por reconciliação antes de reemitir grants. Uma foto principal já enviada, mesmo com callback perdido, não precisa ser reenviada só porque falta thumbnail. confirmedRoles informa apenas os arquivos que o servidor já verificou. Um POST novo não consulta recursos que ainda não foram enviados.

Estados: PENDING; AWAITING_CONFIRMATION após 15 minutos; PUBLISHED; CANCELED; REJECTED; EXPIRED. Upload deve concluir em 15 minutos; há mais 20 minutos para confirmação de uploads concluídos no prazo. Nenhuma assinatura nova é emitida fora de PENDING, e o prazo da sessão não é renovado implicitamente.

## Publicação e resultados

### Avatar

Ambos os assets devem ser válidos antes de publicar. A intenção mais recente de avatar vence: uma revisão monotônica por usuário impede callbacks antigos de restaurarem um avatar anterior. Foto, thumbnail, dados iniciais e isUploadAvatar são gravados atomicamente. No cancelamento/erro, o avatar anterior é mantido. Somente após o sucesso são enfileiradas as mídias antigas para remoção. As trocas legadas também participam da revisão; passam a usar IDs novos, sem sobrescrever a imagem anterior antes do commit. Uma troca legada sem thumbnail limpa o vínculo da miniatura anterior e devolve thumbnailUrl=null.

- avatar: result={ image, thumbnailUrl, createdAt, user:{name,email} }.
- avatar-update: result={ message:"Avatar updated successfully", avatarUrl, thumbnailUrl }.

Uma sessão publicada cujo avatar foi substituído retorna unavailable=true, result=null. Não restaura os arquivos antigos.

### Timeline

O servidor cria PostMessageCloudinary a partir dos metadados reais. Expiração começa na publicação. result mantém expirationTimer, expirationDate, expirationInSeconds, expirationAmount, expirationUnit, listActivePost e as flags sharedPostSuccess, planGoldFreeTrialCongratulations e showADS segundo assinatura/trial/admin existentes.

Marcadores de free trial e primeiro post são gravados na transação da publicação. Stripe e Redis não participam de uma transação PostgreSQL: tarefas persistentes criadas na mesma transação executam esses efeitos após commit e repetem em falha. Stripe usa chave de idempotência por usuário e procura uma assinatura já concluída antes de repetir a criação, inclusive após resposta perdida. A concessão externa pode finalizar depois do recurso; o webhook Stripe existente continua atualizando a assinatura efetiva.

Publicações removidas/expiradas retornam unavailable=true e result=null. A tarefa enfileira sua mídia para limpeza. Os demais comportamentos da timeline legada foram preservados; não foi criado um evento público novo de timeline, pois o fluxo atual só responde por HTTP.

### Chat privado

Match deve existir, estar ativo, incluir o autor e ter participantes ativos tanto na emissão quanto na publicação. Bloqueios/encerramentos representados por unMatch são respeitados; não existe outra entidade de bloqueio no schema atual. A publicação bloqueia match/participantes durante a conferência. Não aceita userHashPublic do frontend para identificar o autor.

result mantém a serialização existente de send-message, com uploadId adicional. Para viewOnce=true, imageUrl e fileName ficam null em status, socket e listagem, inclusive para o autor. A leitura continua exclusivamente em POST /send-message/:messageId/view, usando o registro único/atômico existente. Status reflete READ sem consumir a mídia. AvatarThumbnailUrl do autor refere-se exclusivamente ao avatar, nunca à foto enviada.

send-message só é emitido após commit. A tarefa tem uma única tentativa de emissão por publicação, evitando callbacks duplicados; perdas de socket ou queda do processo são recuperadas por status/histórico. Não há promessa de entrega exatamente uma vez em uma rede desconectável: o frontend ainda deve deduplicar por ID/uploadId. O cache auxiliar mantém o mecanismo de invalidação existente. Não foi criada uma notificação extra de MESSAGE: o fluxo privado atual emite send-message; os contratos existentes de notificações permanecem intactos.

## Miniaturas nas consultas

- Login por credenciais/Google: avatar.image preservado; avatar.thumbnailUrl nullable.
- Dados de usuário/perfil: imagem principal e thumbnailUrl nullable.
- GET /global-chat e autores de comentários/leitores/sockets: avatarUrl preservado e avatarThumbnailUrl nullable.
- GET /send-message: match.otherUser.avatar preservado e avatarThumbnailUrl; autores também recebem a miniatura de avatar. Mensagens diretas incluem uploadId.
- GET /list-chat: avatar preservado e avatarThumbnailUrl nullable.
- Contas antigas sem miniatura retornam null; o frontend pode usar a imagem principal como fallback.

## Eventos, falhas e limpeza

upload:status dos novos domínios é emitido somente à sala privada do autor: { uploadId, clientRequestId, domain, status, resourceId, errorCode }, sem URL nem assinatura. O payload global antigo não recebe esses campos novos.

Cancelamento enfileira todas as roles, inclusive ausentes, e callbacks posteriores enfileiram de novo o recurso correspondente. Cleanup é persistente, idempotente por public_id/resource_type/type e não baixa arquivos. Registros de limpeza sobrevivem à exclusão de conta; callbacks tardios são reconhecidos por esses IDs já conhecidos, sem recriar dados. Recursos desconhecidos não são apagados.

A tarefa por minuto processa lotes limitados de 20, confirma expiração, repete remoções externas e efeitos persistentes. Invalidação de CDN pode levar tempo. O limite de 5 MB é conferido após receber metadados: um cliente malicioso ainda pode consumir capacidade do Cloudinary antes da rejeição, mas não memória de imagens da API. Usar controles/alertas da conta Cloudinary; a assinatura de upload não é revogada instantaneamente por cancelamento.

Erros de entrada/negócio têm code estável: INVALID_UPLOAD_INPUT (400), INVALID_ASSET_ROLES (422), IMAGE_TOO_LARGE (413), UNSUPPORTED_IMAGE (415), INVALID_FILE_NAME (400), UPLOAD_KEY_CONFLICT/AVATAR_SUPERSEDED/AVATAR_EXISTS/UPLOAD_ALREADY_PUBLISHED (409), USER_UNAVAILABLE/MATCH_FORBIDDEN (403), MATCH_UNAVAILABLE/UPLOAD_NOT_FOUND (404), UPLOAD_QUOTA (429), CLOUDINARY_UNAVAILABLE/CLOUDINARY_METADATA_INVALID/TRIAL_NOT_CONFIGURED (503). JWT mantém o middleware e HTTP 401 atuais. Confirmações rejeitadas são reconhecidas no webhook com HTTP 200 e errorCode no status, evitando retries que não podem corrigir a regra de negócio; falhas de infraestrutura retornam erro para retry.

## Implantação e exemplos

1. Migration aditiva: 20261010180000_multi_domain_direct_media. Nenhum reset/db push. Acrescenta campos nullable de miniatura, revisão de avatar, assets, resultados e tarefas; preserva dados existentes.
2. Gerar Prisma Client e implantar o backend; Cloudinary usa as mesmas chaves, URL e validação do global. Sem credenciais novas obrigatórias.
3. Atualização em 13/10/2026: Multer e o parsing multipart foram removidos. Uploads são diretos independentemente das flags CLOUDINARY_MEDIA_DIRECT_ONLY/CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY. POST /avatar-and-about, PATCH /update-avatar e POST /post-message autorizam JSON no contrato de /media/uploads com domínio inferido. POST /send-message e POST /global-chat mantêm texto JSON; suas fotos usam os endpoints diretos. Frontends antigos com multipart recebem 415 e precisam ser atualizados.
4. [Exemplos completos dos quatro domínios](./examples/media-upload-contract.json): POST de autorização, grants, retry parcial, GET pendente/publicado e reconciliação. Assinaturas/chaves são placeholders, não valores de ambiente.
5. npm run verify:cloudinary-direct realiza upload assinado de um PNG sintético, verifica assinatura da resposta e consulta metadados reais, removendo o recurso ao final. Não publica avatar/post/mensagem nem cria dados de clientes. A entrega real do callback deve ser conferida nos logs do painel Cloudinary. Homologar a publicação ponta a ponta do Angular antes de ativar a flag.

A otimização/rotação/qualidade e geração de thumbnail no navegador já preparada pelo frontend não foi alterada. A API não depende dessas decisões como barreira de segurança.

A verificação externa confirmou que a rota raw aceita a assinatura de imagem e acrescenta a extensão do arquivo ao public_id. O backend normaliza esse ID apenas para localizar a intenção original; rejeita a publicação e registra o ID remoto completo para remoção, também em callbacks tardios/cancelados. Essa proteção foi aplicada ao global sem alterar seu envelope.

## Verificação da entrega

99 testes aprovados e build completo sem erros. Os testes de banco/Redis/Stripe/Cloudinary são simulados e não criam dados de clientes. Foi realizado upload assinado real de um PNG sintético (67 bytes, 1x1), verificada a assinatura da resposta e consultados os metadados reais; o recurso foi removido. Também foi confirmado e removido um recurso sintético raw com extensão acrescentada pelo provedor, motivando a proteção descrita acima.

Migration aplicada em 10/10/2026. Conferência antes/depois: 256 clientes, 82 avatares, 7 mensagens e 46 posts. Fingerprints agregados dos campos existentes de clientes e avatares permaneceram iguais. Nenhum asset/efeito de cliente foi criado para testes.

A leitura privada também revalida match/participantes dentro da transação que consome a leitura única. O global usa a fila durável para não perder remoções de tipos diferentes. A publicação real pelo Angular e o recebimento do callback assinado no ambiente implantado ainda precisam ser homologados antes de ativar CLOUDINARY_MEDIA_DIRECT_ONLY; nenhuma flag de produção foi ativada nesta tarefa.

## Atualização de 13/10/2026

Build e 110 testes aprovados após remover os adaptadores Multer. Nenhuma migration, exclusão de dados ou implantação nesta atualização. Leia [prompt completo do frontend](./14-prompt-frontend-uploads-sem-multer.md). As notas históricas de rollout acima descrevem a entrega de 10/10; a atualização de 13/10 encerra a compatibilidade multipart.
