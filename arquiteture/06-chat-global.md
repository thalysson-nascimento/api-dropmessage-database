# Chat global

O módulo fica em `src/modules/global-chat/`; rotas HTTP são registradas em `src/routes.ts`, persistência está em `globalChatRepository.ts` e regras/serialização estão em `globalChatUseCase.ts`. O contrato funcional mais detalhado também está em `src/modules/global-chat/README.md`.

## Rotas atuais

Todas as rotas abaixo usam o middleware JWT de autenticação:

| Método e caminho | Ação |
| --- | --- |
| `GET /global-chat` | Lista mensagens paginadas; aceita cursor e limite. |
| `POST /global-chat` | Cria mensagem de texto, imagem ou texto com imagem. Usa multipart e campo de arquivo `file`. |
| `POST /global-chat/:id/reactions` | Alterna uma reação do usuário à mensagem. |
| `POST /global-chat/:id/comments` | Cria comentário para a mensagem. |
| `GET /global-chat/:id/comments` | Lista comentários. |
| `POST /global-chat/:id/view` | Registra abertura de mídia de visualização única. |
| `DELETE /global-chat/:id` | Exclui mensagem própria. |

Consulte `src/routes.ts` e o README do módulo caso a tabela esteja desatualizada.

## Dados e mídia

O Prisma define `GlobalChatMessage`, `GlobalChatReaction`, `GlobalChatComment` e `GlobalChatMessageView`. Uma mensagem pode ser textual ou conter uma imagem, pode responder a outra mensagem, ter prazo de expiração ou usar visualização única.

As imagens são carregadas pelo serviço Cloudinary usado também pelas publicações, atualmente na pasta `user-posts`, com entrega autenticada. O chat não requer criar uma pasta manualmente no Cloudinary.

## Regras que afetam o contrato

- A criação requer texto ou arquivo; a rota recebe imagens pelo campo multipart `file`.
- Imagens podem ter `viewOnce=true` e expiração configurável dentro dos limites validados pelo use case.
- A listagem oculta mensagens apagadas ou expiradas e usa paginação por cursor.
- Imagens de visualização única não são incluídas no preview inicial; a chamada de abertura retorna a mídia revelada ao usuário que a abriu.
- O evento de socket de leitura comunica o estado de leitura, não a URL da mídia.
- IDs públicos de usuário retornados em objetos de autor/leitor não são necessariamente os UUIDs internos de relacionamento no banco.

## Eventos Socket.IO

As conexões autenticadas são adicionadas à sala `global-chat`. O controller publica os eventos:

- `global-chat:new-message`
- `global-chat:reaction-updated`
- `global-chat:comment-created`
- `global-chat:message-deleted`
- `global-chat:view-once-read`

O comportamento e os exemplos de payloads estão em `src/modules/global-chat/README.md`. Ao mudar um evento, atualize os consumidores e a documentação contratual.

## Notificações privadas de interações

Adicionar uma reação cria uma notificação LIKE para o autor da mensagem; remover a reação não cria notificação. Um comentário cria uma notificação COMMENT para esse mesmo autor. Interações do próprio autor não notificam. A criação da interação e da notificação acontece na mesma transação PostgreSQL. Não há retroatividade para interações anteriores à implantação.

O destinatário vem do proprietário da mensagem no banco, e o ator vem do JWT. Os eventos notification:new e notification:unread são enviados somente à sala interna do destinatário. Os eventos públicos global-chat:* continuam existindo.

GET /notification retorna os registros do usuário autenticado. Para o chat global, target tem id da mensagem, type: "global-chat" e thumbnailUrl: null. LIKE inclui meta.emotion; COMMENT inclui meta.commentText com o texto daquele comentário. Os tipos LIKE e COMMENT existentes foram preservados. O frontend precisa reconhecer target.type === "global-chat" para navegar à mensagem. Nenhuma URL de imagem é colocada nessa notificação, preservando visualização única.

A migration 20261010000000_global_chat_notifications deve ser aplicada antes de iniciar a versão nova da API. Ela acrescenta campos opcionais, preserva dados existentes e exclui as notificações associadas quando a mensagem é removida.

## Uploads

O campo multipart continua sendo file, com limite de 5 MB e uma imagem por requisição. Há validação de MIME e assinatura binária antes do controller e novamente no serviço Cloudinary. São aceitos JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF e AVIF; application/octet-stream é aceito apenas quando os bytes identificam uma dessas imagens. SVG, HTML, PDF, executáveis e arquivos compactados são recusados. O MIME usado na persistência é normalizado ao formato detectado.

A assinatura binária é uma barreira inicial, não um antivírus nem uma decodificação completa. A interpretação da imagem permanece no Cloudinary com resource_type=image. As limitações e próximos passos estão em arquiteture/08-seguranca-e-notificacoes.md.

## Evolução: upload direto

O fluxo novo de fotos usa sessões persistentes e envio frontend → Cloudinary → webhook assinado da API, sem bytes de imagem na API. Contrato e implantação: [Upload direto](./10-upload-direto-cloudinary.md). A compatibilidade multipart só é desligada com CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY=true após a migração do frontend.
