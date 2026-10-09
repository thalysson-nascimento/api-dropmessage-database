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
  "author": { "id": "public-user-hash", "name": "Nome", "avatarUrl": null },
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

`GET /global-chat?cursor=<id>`

Cada resposta carrega no máximo 15 mensagens, ordenadas da mais nova para a mais antiga. Na primeira chamada, não envie `cursor`; nas próximas chamadas, envie o `nextCursor` retornado pela resposta anterior. Quando `nextCursor` for `null`, não há mais mensagens antigas para carregar.

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

O front deve mostrar um indicador de visualização única e aguardar o clique. Ao clicar, envie:

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

A publicação, reação, comentário, abertura e exclusão continuam sendo feitas pelos endpoints HTTP autenticados; o Socket.IO distribui o resultado para os demais clientes em tempo real. O evento `global-chat:view-once-read` não contém `imageUrl`, então somente a resposta do usuário que clicou revela a mídia. O front não deve inserir novamente a resposta do próprio `POST` quando também receber o evento correspondente.

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

Criar: `POST /global-chat/:id/comments`

```json
{ "content": "Comentário", "replyToId": null }
```

Listar: `GET /global-chat/:id/comments`

## Apagar

`DELETE /global-chat/:id` só permite apagar mensagens criadas pelo usuário autenticado. A imagem correspondente também é removida do Cloudinary.
