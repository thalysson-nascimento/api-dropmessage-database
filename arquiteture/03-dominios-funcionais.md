# Domínios funcionais

O mapeamento abaixo é uma visão de navegação; os nomes exatos dos endpoints e o comportamento vigente devem ser confirmados em `src/routes.ts` e nos módulos correspondentes.

| Domínio | Localização típica | Responsabilidade |
| --- | --- | --- |
| Contas e autenticação | `src/modules/account/`, `src/modules/confirmationCodeEmail/` | Criação de conta, login por credenciais/Google e confirmação de e-mail. |
| Perfil e dados do usuário | `src/modules/my-profile/`, `src/modules/aboutme/`, `src/modules/avatar/`, `src/modules/avatarCloudinary/` | Consulta e atualização de perfil, descrição e avatar. |
| Hobbies e preferências | `src/modules/hobbies/` | Catálogo de hobbies e associação de preferências ao usuário. |
| Publicações e mídia | `src/modules/post-message-cloudinary/`, `src/modules/comment-post-message/` | Publicação de conteúdo, imagens, comentários e fluxos de desbloqueio associados. |
| Interações e descoberta | `src/modules/interactions/`, `src/modules/like-post-message/`, `src/modules/last-like-post-message/`, `src/modules/match/` | Likes, interações, matches e consultas relacionadas. |
| Conversas | `src/modules/send-message/`, `src/modules/list-chat/`, `src/modules/global-chat/` | Mensagens privadas associadas a matches e chat global. |
| Notificações e presença | `src/modules/notification/`, `src/modules/last-logged-users/` | Notificações e informações de usuários online/última atividade. |
| Assinaturas e pagamentos | `src/modules/active-subscription/`, `src/modules/cancel-subscription-stripe/`, `src/modules/stripe-webhook/`, `src/modules/first-publication-register-gold-free/` | Operações de assinatura, integração com Stripe e benefícios relacionados a planos. |
| IA | `src/modules/ai/`, `src/modules/generate-tips-with-gpt4o-mini/` | Perfis e dados de IA e geração de sugestões. Seeds relacionados ficam em `prisma/seeds/ai/`. |
| Recompensas e publicidade | `src/modules/admob-video-reward/` | Fluxos relacionados a recompensa de vídeo/publicidade. |
| Conta e suporte | `src/modules/delete-account/`, `src/modules/report-problem/` | Exclusão de conta e registro de problemas. |
| Observabilidade | `src/modules/logger/` | Registro de ações e eventos de aplicação. |

## Entidades principais

O schema Prisma inclui, entre outras, as entidades:

- usuário, perfil, localização, descrição, avatar e hobbies;
- publicações, comentários, likes, dislikes e matches;
- conversas e mensagens privadas;
- notificações e presença (`LoggedUsers`);
- dados de Stripe e assinaturas;
- perfis, conversas e mensagens de IA;
- mensagens, comentários, reações e visualizações do chat global.

Consulte o schema para relações, restrições, índices, nomes físicos das tabelas e detalhes de exclusão referencial. Não use este resumo como substituto do schema.
