# Visão geral

## Propósito

Dropmessage é um backend para uma plataforma social. A API atende contas e perfis, descoberta e interação entre usuários, publicações com mídia, conversas, notificações, assinaturas e funcionalidades baseadas em IA.

O processo principal é uma aplicação Node.js escrita em TypeScript. Ela oferece endpoints HTTP com Express e comunicação em tempo real com Socket.IO. Os dados relacionais são persistidos em PostgreSQL por meio do Prisma.

## Tecnologias principais

| Área | Tecnologia observada no projeto |
| --- | --- |
| Runtime e linguagem | Node.js, TypeScript |
| HTTP | Express |
| Persistência relacional | PostgreSQL, Prisma |
| Cache, pub/sub e expiração | Redis |
| Tempo real | Socket.IO |
| Imagens | Cloudinary |
| Pagamentos | Stripe |
| IA | OpenAI |
| E-mail transacional | Brevo |
| Logging | Pino e Loki |

As versões e dependências declaradas estão em `package.json`; a definição efetiva do modelo de dados está em `prisma/schema.prisma`.

## Arquitetura em alto nível

```text
Cliente HTTP / Socket.IO
          |
          v
Express (src/server.ts) --- Socket.IO (src/lib/socket.ts)
          |
          v
Rotas e middlewares (src/routes.ts)
          |
          v
Módulos de negócio (controllers / use cases / repositories)
          |
          +------> Prisma ------> PostgreSQL
          +------> Redis
          +------> Cloudinary, Stripe, OpenAI, Brevo e outros serviços
```

O sistema é organizado por funcionalidades em `src/modules/`. O encadeamento típico de uma operação é:

```text
rota -> middleware -> controller -> use case -> repository/serviço -> resposta
```

Nem todo módulo implementa todas as camadas: algumas operações acessam a infraestrutura diretamente no use case ou no controller. Confirme o padrão existente no módulo antes de adicionar uma camada.

## Fontes de verdade

- Rotas HTTP: `src/routes.ts`.
- Inicialização HTTP e tarefas de bootstrap: `src/server.ts`.
- Entidades, enums e relações: `prisma/schema.prisma`.
- Variáveis obrigatórias esperadas: `src/env.ts`.
- Scripts e dependências: `package.json`.
- Contrato do chat global: `src/modules/global-chat/README.md`.

Os arquivos de build em `dist/` são artefatos gerados e não devem ser tratados como fonte primária.
