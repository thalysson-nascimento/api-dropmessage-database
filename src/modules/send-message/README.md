# Chat privado

As rotas exigem o JWT da sessão no cabeçalho `Authorization: Bearer <token>`.

## Enviar texto

`POST /send-message` continua aceitando JSON:

```json
{
  "matchId": "uuid-do-match",
  "userHashPublic": "hash-publico-do-remetente",
  "content": "Oi!"
}
```

O servidor compara `userHashPublic` com o hash do usuário autenticado pelo JWT e valida que esse usuário participa do match. Matches desfeitos não aceitam novas mensagens.

## Enviar foto

O mesmo endpoint aceita `multipart/form-data`:

| Campo | Valor |
| --- | --- |
| `matchId` | UUID do match |
| `userHashPublic` | Hash público do usuário autenticado |
| `file` | Arquivo de imagem (máximo 5 MB) |
| `content` | Legenda/texto opcional |
| `viewOnce` | `true` ou `false`; opcional, padrão `false` |

Fotos são armazenadas como recursos autenticados do Cloudinary na pasta `private-chat`. Para fotos normais, a resposta contém `imageUrl`; texto permanece compatível com a resposta JSON anterior. Respostas de criação usam HTTP `200` para texto e `201` para foto.

O formato de mensagem inclui `id`, `matchId`, `createdAt`, `content`, `user`, `imageUrl`, `fileName`, `viewOnce` e `viewOnceStatus`. Em mensagens somente de foto, `content` pode ser `null`.

## Histórico

`GET /send-message?matchId=<uuid>&page=1&limit=15` mantém `match`, `pagination` e `messages`. O acesso é permitido apenas aos participantes do match. Cada mensagem retorna os campos de mídia e estado de visualização. URLs de fotos únicas nunca são retornadas pelo histórico.

O `limit` e a paginação numérica existente são mantidos para preservar o cliente atual.

## Visualização única

O destinatário abre uma foto com:

`POST /send-message/:messageId/view`

```json
{ "matchId": "uuid-do-match" }
```

O autor não pode abrir a própria foto. A visualização do destinatário é consumida com inserção protegida por índice único `(messageId, userId)`; uma tentativa repetida ou concorrente recebe `409`. Somente uma resposta de abertura autorizada contém `imageUrl`, como URL de download autenticado do Cloudinary com validade de 60 segundos. A URL não aparece no histórico nem no evento `send-message`.

O socket `send-message` inclui `matchId`, ID, data, usuário e campos de mídia, mas mantém `imageUrl` e `fileName` nulos para `viewOnce`. O cliente deve continuar filtrando eventos por `matchId`.
