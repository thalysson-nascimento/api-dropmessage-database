# Chat global

Todos os endpoints exigem `Authorization: Bearer <token>`. Nos objetos `author`, `reader` e comentários, o campo `id` é o `userHashPublic` (identificador público), não o UUID interno do usuário. Os campos `id` das mensagens e comentários continuam sendo os identificadores próprios desses recursos.

## Publicar mensagem

`POST /global-chat` com `multipart/form-data`:

- Somente texto: envie `content`.
- Somente imagem: envie o arquivo no campo `file`.
- Texto com imagem: envie `content` e o arquivo no campo `file`.
- Para imagens, `viewOnce=true` e `expiresInSeconds` entre `60` e `604800` são opcionais. `replyToId` também é opcional em todos os formatos.

É obrigatório enviar pelo menos `content` ou `file`. Imagens expiram por padrão em 24 horas; textos sem imagem não expiram. Quando texto e imagem são enviados juntos, a publicação terá `type: "IMAGE"` e os dois campos serão retornados.

Response `201`:

```json
{
  "id": "uuid",
  "type": "TEXT",
  "content": "Olá",
  "imageUrl": null,
  "fileName": null,
  "viewOnce": false,
  "isViewOncePreview": false,
  "viewOnceStatus": null,
  "viewOnceReaders": [],
  "expiresAt": null,
  "createdAt": "2026-09-19T12:00:00.000Z",
  "isMine": true,
  "author": {
    "id": "public-user-hash",
    "name": "Nome",
    "avatarUrl": null,
    "countryCode": "BR"
  },
  "replyTo": null,
  "reactions": [],
  "commentsCount": 0
}
```

Exemplo de resposta para texto com imagem:

```json
{
  "id": "uuid",
  "type": "IMAGE",
  "content": "Legenda da foto",
  "imageUrl": "https://res.cloudinary.com/...",
  "fileName": "foto.jpg",
  "viewOnce": false,
  "isViewOncePreview": false,
  "viewOnceStatus": null,
  "viewOnceReaders": [],
  "expiresAt": "2026-09-20T12:00:00.000Z",
  "createdAt": "2026-09-19T12:00:00.000Z",
  "isMine": true,
  "author": { "id": "public-user-hash", "name": "Nome", "avatarUrl": null },
  "replyTo": null,
  "reactions": [],
  "commentsCount": 0
}
```

## Listar mensagens

`GET /global-chat?cursor=<id>&limit=20`

Cada resposta carrega até 20 mensagens, começando pelas mais recentes e ordenadas da mais nova para a mais antiga. O limite padrão e máximo é 20; um `limit` menor pode ser enviado para reduzir a página. Na primeira chamada, não envie `cursor`. Para carregar mensagens mais antigas (por exemplo, quando o usuário rolar para cima), envie o `nextCursor` retornado pela resposta anterior. Continue até `nextCursor` ser `null`, que indica que não há mais mensagens antigas. O cursor não deve ser substituído pelo ID da mensagem mais nova.

No cliente com scroll infinito, carregue a primeira página ao abrir a tela. Ao chegar ao topo do histórico e enquanto `nextCursor` não for `null`, busque a próxima página e acrescente as mensagens antigas ao início da lista, preservando a posição visual do scroll. Evite disparar várias requisições simultâneas para o mesmo cursor e deduplique mensagens por `id`.

Response:

```json
{ "messages": [], "nextCursor": null }
```

### Visualização única

Para criar uma imagem de visualização única, envie `viewOnce=true` junto com o arquivo:

```text
POST /global-chat
Content-Type: multipart/form-data

file: foto.jpg
content: Foto da viagem
viewOnce: true
```

Enquanto o usuário ainda não abriu a mensagem, o item continua na lista, mas o contrato retorna:

```json
{
  "id": "uuid",
  "type": "IMAGE",
  "content": "Foto da viagem",
  "imageUrl": null,
  "fileName": null,
  "viewOnce": true,
  "isViewOncePreview": true,
  "viewOnceStatus": "PENDING",
  "viewOnceReaders": []
}
```

Esse preview é retornado tanto ao autor quanto aos demais usuários; nem a resposta de criação nem o histórico expõem a URL ou o nome do arquivo. O autor pode apagar a própria mensagem, mas não pode abrir a imagem nem ser registrado como leitor.

O front deve mostrar um indicador de visualização única e aguardar o clique de outro usuário. Ao clicar, envie:

`POST /global-chat/:id/view`

A resposta é destinada ao usuário que abriu a mensagem e contém a mídia revelada:

```json
{
  "message": {
    "id": "uuid",
    "type": "IMAGE",
    "content": "Foto da viagem",
    "imageUrl": "https://res.cloudinary.com/...",
    "fileName": "foto.jpg",
    "viewOnce": true,
    "isViewOncePreview": false,
    "viewOnceStatus": "READ",
    "viewOnceReaders": [
      {
        "id": "public-user-hash-leitor",
        "name": "Pessoa que leu",
        "avatarUrl": "https://res.cloudinary.com/...",
        "viewedAt": "2026-09-19T12:00:00.000Z"
      }
    ]
  },
  "readEvent": {
    "messageId": "uuid",
    "viewOnceStatus": "READ",
    "reader": {
      "id": "public-user-hash-leitor",
      "name": "Pessoa que leu",
      "avatarUrl": "https://res.cloudinary.com/...",
      "viewedAt": "2026-09-19T12:00:00.000Z"
    }
  }
}
```

Depois da abertura, substitua o preview pelo conteúdo revelado e mostre o avatar em `viewOnceReaders`. A mensagem não deve ser removida do histórico; ela deve mudar para o estado `READ`.

Cada usuário autenticado que não seja o autor pode abrir a imagem uma única vez. Uma segunda tentativa retorna `409 Conflict` sem URL de imagem. A gravação usa a restrição única `(messageId, userId)` para arbitrar atomicamente tentativas concorrentes. A leitura não remove a mensagem do histórico.

## Tempo real com Socket.IO

Conecte usando o JWT no handshake:

```ts
io("http://localhost:3000", {
  auth: { token: jwt },
});
```

Após a autenticação, o socket entra automaticamente na sala global. O front deve escutar:

- `global-chat:new-message`: nova mensagem já serializada no mesmo formato do `POST /global-chat`.
- `global-chat:reaction-updated`: reações agrupadas atualizadas.
- `global-chat:comment-created`: novo comentário.
- `global-chat:message-deleted`: mensagem removida.
- `global-chat:view-once-read`: leitura de uma mensagem de visualização única, contendo `messageId`, `viewOnceStatus: "READ"` e `reader` com o avatar de quem abriu.

A publicação, reação, comentário, abertura e exclusão continuam sendo feitas pelos endpoints HTTP autenticados; o Socket.IO distribui o resultado para os demais clientes em tempo real. O evento `global-chat:view-once-read` contém apenas `messageId`, o estado e os dados públicos do leitor; não inclui URL de imagem nem conteúdo da mensagem. Somente a resposta HTTP da primeira abertura autorizada revela a URL. O front não deve inserir novamente a resposta do próprio `POST` quando também receber o evento correspondente.

## Reações

`POST /global-chat/:id/reactions`

```json
{ "emotion": "like" }
```

A mesma chamada alterna a reação do usuário. Response:

```json
{
  "messageId": "uuid",
  "emotion": "like",
  "reacted": true,
  "reactions": [{ "emotion": "like", "count": 2, "reactedByMe": true }]
}
```

## Comentários

Listar: `GET /global-chat/:messageId/comments?cursor=<comment-id>&limit=20`

Response:

```json
{
  "comments": [
    {
      "id": "comment-id",
      "content": "Olá!",
      "author": {
        "id": "public-user-hash",
        "name": "Nome",
        "avatarUrl": null
      }
    }
  ],
  "nextCursor": null
}
```

A listagem retorna comentários do mais antigo para o mais recente, em páginas de 20 por padrão (máximo 50). O cursor é o ID do último comentário recebido; `nextCursor: null` indica que não há próxima página.

Criar: `POST /global-chat/:messageId/comments`

```json
{ "content": "Comentário" }
```

O envio responde com um item no mesmo formato de `comments`. O conteúdo é aparado nas extremidades e deve ter de 1 a 100 caracteres. As rotas exigem autenticação e só aceitam comentários em mensagens de texto. Fotos não aceitam comentários. O evento `global-chat:comment-created` também informa `messageId` e o `commentsCount` atualizado; a listagem de mensagens calcula `commentsCount` diretamente das relações persistidas.

## País do autor

Cada mensagem inclui `author.countryCode`, no formato ISO 3166-1 alpha-2 em maiúsculas, ou `null` quando ausente/inválido. O mesmo campo está presente na resposta de publicação e no evento `global-chat:new-message`.

## Apagar

`DELETE /global-chat/:id` só permite apagar mensagens criadas pelo usuário autenticado. A imagem correspondente também é removida do Cloudinary.

## Notificações privadas de interações

Adicionar uma reação cria uma notificação LIKE para o autor da mensagem; remover a reação não cria notificação. Um comentário cria uma notificação COMMENT para esse mesmo autor. Interações do próprio autor não notificam. A criação da interação e da notificação acontece na mesma transação PostgreSQL. Não há retroatividade para interações anteriores à implantação.

O destinatário vem do proprietário da mensagem no banco, e o ator vem do JWT. Os eventos notification:new e notification:unread são enviados somente à sala interna do destinatário. Os eventos públicos global-chat:* continuam existindo.

GET /notification retorna os registros do usuário autenticado. Para o chat global, target tem id da mensagem, type: "global-chat" e thumbnailUrl: null. LIKE inclui meta.emotion; COMMENT inclui meta.commentText com o texto daquele comentário. Os tipos LIKE e COMMENT existentes foram preservados. O frontend precisa reconhecer target.type === "global-chat" para navegar à mensagem. Nenhuma URL de imagem é colocada nessa notificação, preservando visualização única.

A migration 20261010000000_global_chat_notifications deve ser aplicada antes de iniciar a versão nova da API. Ela acrescenta campos opcionais, preserva dados existentes e exclui as notificações associadas quando a mensagem é removida.

## Uploads

O campo multipart continua sendo file, com limite de 5 MB e uma imagem por requisição. Há validação de MIME e assinatura binária antes do controller e novamente no serviço Cloudinary. São aceitos JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF e AVIF; application/octet-stream é aceito apenas quando os bytes identificam uma dessas imagens. SVG, HTML, PDF, executáveis e arquivos compactados são recusados. O MIME usado na persistência é normalizado ao formato detectado.

A assinatura binária é uma barreira inicial, não um antivírus nem uma decodificação completa. A interpretação da imagem permanece no Cloudinary com resource_type=image. As limitações e próximos passos estão em arquiteture/08-seguranca-e-notificacoes.md.

## Upload direto — contrato novo

Fotos podem usar POST /global-chat/uploads e envio direto ao Cloudinary; confirmação por webhook assinado publica a mensagem. Consulta/cancelamento em /global-chat/uploads/:uploadId e recuperação em /global-chat/uploads/:uploadId/reconcile. Veja arquiteture/10-upload-direto-cloudinary.md e o prompt em arquiteture/11-prompt-frontend-upload-direto.md.

A compatibilidade multipart permanece durante a transição. Habilitar CLOUDINARY_GLOBAL_CHAT_DIRECT_ONLY=true somente após atualizar o frontend; com essa opção, POST /global-chat aceita texto JSON e recusa arquivos antes de buffering. Feed e chat privado não foram migrados nesta etapa.
