# Desenvolvimento e manutenção

## Comandos existentes

Os scripts abaixo são declarados em `package.json`:

| Comando | Uso |
| --- | --- |
| `npm run dev` | Executa o servidor de desenvolvimento com `ts-node-dev` e carrega `.env`. |
| `npm run build` | Compila TypeScript com `tsc`. |
| `npm start` | Inicia o JavaScript compilado em `dist/server.js`. |
| `npm run seed:hobbies` | Executa seed de hobbies. |
| `npm run seed:ia` | Executa seeds de IA. |
| `npm run seed:admin-active-plan` | Executa seed de estado de plano administrativo. |

O script `npm test` executa testes dos chats, uploads e notificações. Esses testes usam mocks para banco e Cloudinary; não substituem validação integrada no ambiente de homologação.

## Alterações de banco

1. Atualize `prisma/schema.prisma`.
2. Gere uma migration local apropriada com o fluxo Prisma usado pelo projeto.
3. Gere/atualize o Prisma Client.
4. Verifique que schema, migration e código compilam juntos.

Não execute operações de reset em bancos compartilhados ou de produção. Confirme o alvo antes de qualquer ação destrutiva.

## Convenções para mudanças

- Localize a rota existente em `src/routes.ts` antes de adicionar endpoint.
- Coloque regras de negócio no use case quando o módulo já seguir esse padrão.
- Reutilize os serviços e clientes existentes para Prisma, Cloudinary, Redis, Socket.IO e provedores externos.
- Valide entradas e mantenha consistente o contrato HTTP e o payload dos eventos em tempo real.
- Atualize documentação de API/arquitetura relacionada à mudança.
- Não altere arquivos gerados em `dist/` como substituto da fonte em `src/`.
- Não versione `.env`, chaves, tokens, URLs com credenciais ou dados pessoais reais.

## Pontos de atenção para manutenção

- O projeto contém módulos de diferentes gerações; os padrões internos não são uniformes.
- O `src/env.ts` descreve variáveis de ambiente, mas não inclua seus valores em documentação.
- O nome de um middleware ou de uma pasta não garante seu comportamento; leia a implementação.
- Documentos arquiteturais são mapas de navegação. Em caso de divergência, confirme no código, no schema e nos contratos do módulo.
