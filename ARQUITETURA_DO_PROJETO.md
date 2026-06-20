# Arquitetura do Projeto

## 1. Visão Geral da Arquitetura
O projeto é uma API REST em TypeScript, com suporte a comunicação em tempo real e integração com múltiplos serviços externos. A estrutura foi organizada para separar responsabilidades por domínio funcional.

## 2. Padrão de Organização
A base da aplicação está em:
- `src/` → código-fonte principal.
- `prisma/` → schema, migrations e seeds.
- `config/` → configurações específicas de ambiente.
- `template-email/` → templates HTML para envio de e-mails.
- `image/` → arquivos estáticos ou recursos de imagem.

## 3. Estrutura de Pastas

### Raiz do projeto
- `src/` → aplicação principal.
- `prisma/` → modelagem do banco e migrações.
- `config/` → arquivos auxiliares de configuração.
- `template-email/` → templates de e-mail.
- `image/` → imagens estáticas.
- `dist/` → build gerado após compilação.

### Diretório `src`
- `server.ts` → inicialização da API e configuração global.
- `routes.ts` → definição das rotas HTTP e injeção dos controllers.
- `env.ts` → validação das variáveis de ambiente.
- `database/` → conexão com o Prisma.
- `modules/` → módulos de negócio organizados por funcionalidade.
- `service/` → serviços compartilhados e integrações auxiliares.
- `lib/` → bibliotecas e conexões com Redis, Socket.IO e outros utilitários.
- `config/` → configuração de Cloudinary, Stripe, uploads, logging.
- `middlewares/` → validações globais, como autenticação.
- `utils/` → helpers e funções utilitárias.
- `work/` → tarefas e listeners de background.
- `interfaces/` → contratos e tipos.
- `enums/` → enums usados no domínio.
- `@types/` → declarações extras do TypeScript.

## 4. Fluxo de Requisição
1. A requisição chega em `server.ts`.
2. O middleware de CORS, parsing JSON e autenticação é aplicado.
3. A rota é resolvida em `routes.ts`.
4. O controller recebe a chamada.
5. O controller invoca um use case.
6. O use case usa repositórios/services para acessar dados ou integrações.
7. A resposta é retornada ao cliente.

## 5. Estrutura de um Módulo
Cada módulo em `src/modules/` normalmente segue um padrão similar:
- `useCase/` → lógica de negócio.
- `controller.ts` → recebimento da requisição.
- `useCase.ts` → implementação da regra.
- `repository.ts` → acesso ao banco ou serviços.

Exemplo de domínio coberto:
- `account/` → criação e autenticação.
- `user/` → consulta de usuários.
- `post-message-cloudinary/` → postagem com mídia.
- `like-post-message/` → curtidas.
- `send-message/` → envio de mensagens.
- `notification/` → notificações.
- `stripe-webhook/` → webhook do Stripe.
- `subscription-ai/` → integração com IA.

## 6. Camadas da Aplicação

### Camada de Entrada
- `server.ts`
- `routes.ts`
- middlewares globais

### Camada de Aplicação
- controllers
- use cases
- regras de negócio

### Camada de Infraestrutura
- Prisma Client
- Redis
- Socket.IO
- Cloudinary
- Stripe
- OpenAI
- Brevo

## 7. Banco de Dados
O projeto usa Prisma com PostgreSQL.

### Principais responsabilidades do schema
- usuários;
- perfis e descrição;
- posts e mídias;
- likes/deslikes;
- matches e mensagens;
- notificações;
- assinatura e recorrência;
- dados de localização;
- preferências/hobbies;
- logs de usuários online.

## 8. Integrações Principais
- `Redis` → cache, filas e expiração de posts.
- `Socket.IO` → comunicação em tempo real.
- `Cloudinary` → armazenamento e transformação de imagens.
- `Stripe` → pagamentos e webhooks.
- `OpenAI` → geração de sugestões/assistência via IA.
- `Brevo` → envio de e-mails transacionais.
- `Loki` → logs centralizados.

## 9. Observações de Arquitetura
- O projeto mistura padrões de controller/use-case com organização por domínio.
- Há uma forte separação entre regras de negócio e infraestrutura.
- A comunicação em tempo real e o monitoramento de expiração de posts são tratados por listeners/background workers.
- O projeto foi pensado para suportar múltiplos fluxos de negócio com alta dependência de serviços externos.

## 10. Tecnologias e Versões
| Tecnologia | Versão / Referência |
|---|---|
| TypeScript | 4.9.4 |
| Express | 4.19.2 |
| Prisma | ^4.8.1 |
| @prisma/client | ^4.8.1 |
| Socket.IO | ^4.7.5 |
| Redis | ^4.7.0 |
| Stripe | ^17.5.0 |
| OpenAI | ^4.77.0 |
| Cloudinary | ^1.41.3 |
| Multer | ^1.4.5-lts.1 |
| Zod | ^3.23.8 |
| Joi | ^17.13.3 |
| JWT | ^9.0.2 |
| Axios | ^1.7.2 |
| Cors | ^2.8.5 |
| Dotenv | ^16.4.5 |
| Pino | ^9.6.0 |
| Pino Loki | ^2.4.0 |
| Brevo SDK | ^3.0.1 |

## 11. Resumo Executivo
A aplicação é uma API backend escalável para uma rede social de relacionamento, com forte uso de integrações externas, arquitetura modular e comunicação em tempo real. O design favorece organização por domínio e clareza na separação entre regras de negócio e infraestrutura.
