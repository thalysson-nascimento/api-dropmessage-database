# Estrutura e camadas

## Estrutura relevante

```text
.
├── src/
│   ├── server.ts
│   ├── routes.ts
│   ├── env.ts
│   ├── modules/
│   ├── database/
│   ├── middlewares/
│   ├── service/
│   ├── lib/
│   ├── config/
│   ├── work/
│   ├── utils/
│   ├── interfaces/
│   ├── enums/
│   └── @types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── template-email/
└── dist/                 # saída de build; gerada
```

## Responsabilidade das pastas

| Caminho | Responsabilidade |
| --- | --- |
| `src/server.ts` | Configura Express, middlewares globais, servidor HTTP, Socket.IO e bootstrap do Redis e do listener de expiração. |
| `src/routes.ts` | Registra endpoints, middlewares por rota e controllers. |
| `src/modules/` | Funcionalidades organizadas por domínio ou caso de uso. |
| `src/middlewares/` | Middlewares reutilizáveis, incluindo validação do JWT nas rotas protegidas. |
| `src/database/` | Instância compartilhada do Prisma Client. |
| `src/service/` | Integrações e serviços reutilizados por módulos, como Cloudinary e e-mail. |
| `src/lib/` | Clientes e utilitários de infraestrutura, como Redis e Socket.IO. |
| `src/config/` | Configuração dos SDKs e serviços externos. |
| `src/work/` | Listeners e tarefas de fundo ligados ao ciclo de vida da aplicação. |
| `src/utils/` | Funções utilitárias sem responsabilidade direta por rotas. |
| `src/interfaces/`, `src/enums/`, `src/@types/` | Tipos, enums e declarações TypeScript compartilhados. |
| `prisma/` | Schema, histórico de migrations e scripts de seed. |
| `template-email/` | Templates usados nas mensagens de e-mail. |

## Camadas dos módulos

O projeto frequentemente separa:

- **Controller**: adapta `Request`/`Response`, chama o caso de uso e emite eventos quando aplicável.
- **Use case**: valida e executa regras do domínio, coordenando persistência e serviços.
- **Repository**: encapsula consultas e comandos Prisma.

Os nomes e a organização variam entre módulos antigos e novos. Siga o estilo local sem assumir que todas as funcionalidades possuem as três camadas.

## Fluxo HTTP

1. `src/server.ts` carrega o ambiente, configura Express, CORS e parsers.
2. O tratamento especial da requisição do webhook do Stripe preserva o corpo bruto esperado pelo webhook.
3. As rotas de `src/routes.ts` selecionam o middleware e o controller.
4. Rotas autenticadas usam `ensureAuthenticateUserAdmin`, que valida o JWT e disponibiliza o identificador interno em `request.id_client`.
5. O controller chama a lógica do módulo e retorna a resposta HTTP.
6. Erros não tratados pelas rotas passam pelo middleware global de erro.

O nome `ensureAuthenticateUserAdmin` não significa, por si só, que haja verificação de papel administrativo: o código atual desse middleware valida token e extrai o `sub`.

## Módulo como ponto de entrada

Para implementar uma funcionalidade, localize primeiro seu registro em `src/routes.ts`. Em seguida, siga as chamadas do controller para o use case e, se existir, para o repository/serviço. Não crie uma nova convenção de pasta antes de comparar com módulos próximos.
