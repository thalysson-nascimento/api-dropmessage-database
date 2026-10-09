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
