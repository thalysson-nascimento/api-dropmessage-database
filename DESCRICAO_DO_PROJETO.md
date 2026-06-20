# Descrição do Projeto

## Visão Geral
Esta API é responsável por fornecer os serviços backend de uma plataforma de relacionamento e interação social. O sistema lida com autenticação de usuários, perfis, postagens, likes, matches, chat, notificações, uploads de mídia, integração com IA, pagamentos recorrentes e rastreamento de recompensas.

## Objetivo Principal
Oferecer uma infraestrutura robusta para:
- criar e gerenciar contas de usuários;
- armazenar dados pessoais e preferências;
- publicar conteúdo multimídia;
- permitir interações entre usuários (curtidas, matches e mensagens);
- enviar notificações em tempo real;
- integrar serviços externos como Cloudinary, Stripe, OpenAI, Brevo e Redis.

## Principais Funcionalidades
- Autenticação com e-mail/senha e Google OAuth.
- Gerenciamento de perfil, localização, descrição e hobbies.
- Upload e processamento de imagens com Cloudinary.
- Publicação de posts com tempo de expiração.
- Sistema de likes, dislikes e matching.
- Chat entre usuários com suporte a socket.
- Notificações de eventos importantes.
- Gestão de assinatura e planos via Stripe.
- Geração de dicas com IA (OpenAI).
- Envio de e-mails de confirmação via Brevo.

## Fluxo de Negócio
1. O usuário cria uma conta ou autentica-se.
2. O sistema valida dados e gera tokens JWT.
3. O usuário pode completar o perfil com informações adicionais.
4. O usuário publica conteúdo e interage com outros perfis.
5. O backend registra eventos e atualiza caches/Notificações.
6. Serviços externos (Stripe, Cloudinary, Redis, IA, e-mail) complementam o fluxo.

## Arquitetura Conceitual
A API utiliza uma arquitetura modular baseada em controllers, use cases e repositories (na prática, o projeto organiza cada funcionalidade em subpastas com separação de responsabilidades). O fluxo típico é:
- rota → controller → use case → repository/service → banco de dados.

## Persistência e Serviços Externos
- Banco relacional: PostgreSQL via Prisma.
- Cache/expiração: Redis.
- Armazenamento de arquivos: Cloudinary.
- Realtime: Socket.IO.
- Pagamentos: Stripe.
- E-mails: Brevo.
- IA: OpenAI.
- Logs: pino + Loki.

## Observações Importantes
- A API utiliza autenticação JWT.
- Há middleware de validação de acesso para rotas sensíveis.
- Há scripts de seed para popular dados iniciais, como hobbies e configurações de IA.
- O projeto já possui configuração para build em TypeScript e execução via `ts-node-dev`.
