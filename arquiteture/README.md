# Arquitetura da API Dropmessage

Esta pasta reúne a documentação arquitetural do backend para pessoas e assistentes de IA que precisem entender o projeto antes de propor ou implementar mudanças.

## Documentos

- [Visão geral](./01-visao-geral.md): propósito, stack e contexto do sistema.
- [Estrutura e camadas](./02-estrutura-e-camadas.md): pastas, responsabilidades e fluxo de requisição.
- [Domínios funcionais](./03-dominios-funcionais.md): principais áreas de negócio e onde encontrá-las.
- [Dados e integrações](./04-dados-e-integracoes.md): persistência, serviços externos, configuração e tarefas de fundo.
- [Fluxos principais](./05-fluxos-principais.md): inicialização, autenticação, mídias, expiração e tempo real.
- [Chat global](./06-chat-global.md): endpoints, modelo de dados e eventos Socket.IO.
- [Desenvolvimento e manutenção](./07-desenvolvimento-e-manutencao.md): comandos e orientações para evoluir o backend.

## Orientação para assistentes de IA

1. Leia este índice e os documentos relacionados à tarefa antes de sugerir alterações.
2. Trate o código como fonte de verdade quando houver divergência com esta documentação. Comece por `src/routes.ts`, `src/server.ts`, `prisma/schema.prisma` e pelo módulo funcional relevante.
3. Preserve os padrões existentes, mas confira cada módulo: a separação entre controller, use case e repository é comum, não uniforme.
4. Não solicite, copie para documentação ou exponha valores de `.env`, tokens, chaves ou credenciais. Consulte apenas os nomes das variáveis em `src/env.ts`.
5. Ao alterar comportamento ou estrutura, atualize os documentos afetados e valide a mudança com os scripts existentes.

## Escopo e manutenção

Esta documentação descreve a arquitetura observada no código. Não substitui contratos de API, schema do Prisma nem configuração de produção. Atualize-a junto com mudanças arquiteturais relevantes e evite registrar valores secretos ou dados reais.

- [Segurança e notificações](./08-seguranca-e-notificacoes.md): alterações, riscos encontrados, dependências e requisitos de implantação.

- [Prompt para o frontend](./09-prompt-frontend-notificacoes.md): contrato e instruções para integrar notificações do chat global.

- [Upload direto para Cloudinary](./10-upload-direto-cloudinary.md): autorização, callbacks, recuperação, segurança e implantação.
- [Prompt do frontend: upload direto](./11-prompt-frontend-upload-direto.md): chat global e indicador de progresso sobre a foto.
