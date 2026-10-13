# Prompt para adaptar o frontend — uploads sem Multer

## Resultado da análise da API

O avatar do cadastro já usa upload direto em POST /media/uploads com domain=avatar. Os logs HTTP da Railway confirmaram POST /avatar-and-about respondendo 415: a versão instalada ainda tenta o contrato antigo. O frontend local já contém serviços diretos; conferir todas as chamadas residuais e gerar/distribuir a versão atualizada.

A remoção de Multer foi concluída localmente em 13/10/2026. Foram removidos multer, multer-storage-cloudinary, @types/multer e os três adaptadores de parsing. Nenhuma migration ou alteração de dados foi executada. Build e 110 testes aprovados. Os testes usam provedores simulados; homologar o aplicativo e a entrega do webhook na produção após implantação. Código antigo de serviço/repositório foi preservado internamente para reduzir risco de regressão, mas não existe rota conectada a um parser de arquivos. As flags DIRECT_ONLY deixam de controlar compatibilidade: multipart não é mais aceito por essas rotas, mesmo ausentes ou false.

## Prompt completo

Leia a arquitetura do frontend, arquiteture/12-midias-diretas-multidominio.md, arquiteture/examples/media-upload-contract.json e arquiteture/13-prompt-frontend-avatar-cadastro.md da API. Adapte TODOS os uploads para que os arquivos nunca passem pela API. Preserve cadastro/login, publicidade/recompensa, notificações, assinaturas, mensagens de texto, histórico, leitura única e exclusão. Reutilize MediaDirectUploadService, GlobalChatDirectUploadService, CloudinaryTransferService e ImageCompressionService já existentes; não crie uma implementação duplicada.

### Contratos

- POST /media/uploads com Bearer JWT e JSON autoriza avatar, avatar-update, timeline e private-chat. Corpo: { clientRequestId, domain, assets, metadata }. clientRequestId é UUID-v4 estável por intenção. assets: [{ role, fileName, bytes, mimeType, width?, height? }]. Consulte os exemplos completos, sem enviar arquivos/base64/URLs à API.
- avatar: image + thumbnail; metadata={ dateOfBirth, gender, interests }. dateOfBirth mantém formato existente com 10 caracteres; gender=male/female/notBinary; interests=male/female/both.
- avatar-update: image + thumbnail; metadata={}.
- timeline: somente image; metadata={ expirationTimer }, com addThirtyMin/addOneHour/addOneday/addOneWeek. Preserve as quatro durações atuais para todos os planos.
- private-chat: somente image; metadata={ matchId, viewOnce }, com matchId UUID e viewOnce booleano. A API valida os participantes. Não enviar thumbnail da foto privada.
- POST /avatar-and-about, PATCH /update-avatar e POST /post-message são aliases JSON para autorizar os respectivos domínios. Aceitam o mesmo envelope assets/metadata/clientRequestId, com domain opcional inferido pela URL; domain incompatível retorna 400. Agora retornam uma sessão de autorização, não o antigo resultado imediato. Prefira o endpoint único /media/uploads.
- POST /send-message permanece exclusivamente para texto JSON no contrato atual (matchId, userHashPublic, content e viewOnce=false/omitido). Fotos usam /media/uploads, domain=private-chat. Não enviar outro POST /send-message após publicar a foto: o backend já cria a mensagem.
- POST /global-chat permanece para texto. Fotos do global usam POST /global-chat/uploads e o contrato próprio com {clientRequestId,fileName,bytes,mimeType,content?,replyToId?,viewOnce,...campos existentes}. Retorno global usa upload singular e message; os outros domínios usam uploads array por role e result. Não misturar esses envelopes. Preserve a persistência atual do global: não acrescentar expiração nova baseada em parâmetros legados.

### Transferência e confirmação

Cada arquivo final tem no máximo 5242880 bytes. Para avatars, gerar thumbnail real quadrada de até 160x160 JPEG/PNG/WebP. Preparar a imagem no cliente, preservando orientação e qualidade visual. Nome, MIME, extensão e bytes declarados devem corresponder ao arquivo final.

A autorização retorna uploadId, status, expiresAt e grants. Fazer POST FormData exclusivamente ao uploadUrl do Cloudinary: copiar todos os fields exatamente e acrescentar file. Não definir Content-Type manualmente nem incluir JWT/cookies da aplicação. Limitar interceptors de autenticação à origem da API. Nunca colocar API_SECRET no frontend; nem alterar parâmetros assinados.

Depois do upload, aguardar publicação pela API: GET /media/uploads/:uploadId retorna status e result; GET /global-chat/uploads/:uploadId retorna status e message. Socket upload:status é um aviso privado para consultar status. Não chamar webhook do frontend. HTTP 200 do Cloudinary significa transferência, não publicação concluída.

Se o callback atrasar, usar o POST /media/uploads/:uploadId/reconcile ou equivalente global, sem corpo significativo, após espera de 10–15 segundos. Respeitar 6 requisições/minuto e backoff; não usar reconcile como polling contínuo. Estados PENDING/AWAITING_CONFIRMATION não significam sucesso. PUBLISHED com unavailable=true ou resultado nulo não deve recriar mídia removida.

Retentativas da mesma intenção mantêm UUID e metadados; subir apenas roles ausentes. Dados diferentes exigem nova intenção. Cancelamento usa DELETE do endpoint de sessão correspondente; publicação concluída usa a exclusão de recurso já existente. Preservar assinaturas de leitura e endpoints de visualização única: não abrir fotos automaticamente, não consumir leitura ao consultar status e não expor URLs ocultas por viewOnce.

### Cadastro e interface

No onboarding, garantir JWT e userVerificationData.userHashPublic persistidos antes do upload; aguardar a gravação das Preferences antes de navegar/iniciar o serviço. Sem hash local o serviço atual pode falhar com AUTH_REQUIRED antes de enviar qualquer request. Quando avatar ficar PUBLISHED, aplicar result={image,thumbnailUrl,createdAt,user:{name,email}}, atualizar sessão/cache e isUploadAvatar=true; só então avançar a tela. Avatar inicial usa avatar; troca usa avatar-update. Em AVATAR_EXISTS, recuperar o perfil existente em vez de repetir criação.

Timeline: usar result para preservar listActivePost, showADS e flags do plano/free trial. Avatar-update: aplicar result.avatarUrl e result.thumbnailUrl. Chat privado: aplicar result e deduplicar pelo ID/uploadId com o socket send-message. Chat global: após publicidade concluída, manter preview local, progresso circular cinza/verde no canto superior direito, entrada/saída suave e estado de confirmação. Não publicar localmente para outros usuários antes da confirmação. Deduplique socket/history por ID e uploadId.

Avatares em listas usam thumbnailUrl/avatarThumbnailUrl com fallback para a imagem principal em contas antigas. Perfil usa imagem principal. Preserve essas diferenças entre contratos.

### Diagnóstico e testes

Registrar apenas etapa, status HTTP, code, uploadId e role. Nunca registrar JWT, assinatura Cloudinary, foto/base64 ou dados pessoais. Exibir o erro retornado com mensagem amigável e encerrar loading em falha/cancelamento. Diferenciar falha local, autorização API, transferência e publicação. Tratar 400/401/403/404/409/413/415/422/429/503 sem loops ou duplicação.

Testar onboarding novo, atualização de avatar, duas roles, falha parcial/retry, callback atrasado, reconexão, expiração de assinatura, cancelamento, arquivo inválido, timeline nas quatro durações, chat privado de texto/foto/leitura única e exclusão global/privada. Verificar que nenhuma chamada envia FormData/base64 à API; os únicos binários saem para api.cloudinary.com. Gerar novo APK release com a chave existente e distribuir o frontend atualizado. Informar arquivos alterados e testes executados.
