## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Configurando o REDIS

sudo apt update
sudo apt install redis-server
sudo service redis-server start

sudo service redis-server status

VERIFICAR TODAS AS CHAVES NO TERMINAL
redis-cli
"KEYS \*"

Confirmar se as Notificações de Expiração Estão Habilitadas

redis-cli CONFIG GET notify-keyspace-events

deve retornar algo como

1. "notify-keyspace-events"
2. ""

informa que nao esta habilitado

para habilitar após instalar o redis deverá acessar o arquivo redis.conf para adicionar a instrução

- editar
  sudo nano /etc/redis/redis.conf

no nano pode pesquisar a palavra usando o CTRL + W
após isso é só encontrar a palavra e descomentar
"notify-keyspace-events Ex"

restatar o redis

## Comandos para gravar tabela no prisma

npx prisma migrate dev --name add-version-avatar-cloudinary
npx prisma generate

## Comando para expor a api usando o CLOUDFLARE

https://dash.cloudflare.com/zones
depois de startar localmente a api devera rodar o comando

´´´cloudflared tunnel --url http://localhost:3000´´´

e deverá colocar o link
https://excluded-meyer-beauty-gras.trycloudflare.com

no environment.config.ts do app
no .env do BASE_URL da api

OBS: se atentar para nao deixar um espaçamento em branco no final do link copiado

na parte de
...
development: {
baseURL: 'https://excluded-meyer-beauty-gras.trycloudflare.com',
...

OBS: se atentar para o final do path ficar sem "/"

##

para gerar os scripts de useCase, repository e controller
acesse a pasta pelo terminal e rode
generate-usecase exemploDeFuncionalidade
ele vai criar os tres scripts
-exemploDeFuncionalidadeUseCase.ts
-exemploDeFuncionalidadeController.ts
-exemploDeFuncionalidadeRepository.ts

## CLI stripe

stripe listen --forward-to http://localhost:3000/stripe/webhook

para deletar o webhook desnecessario
stripe webhook_endpoints list
stripe webhook_endpoints delete we_1Qi1jjHDW71UiODSrxmHCVDW

Resetar a tabela de dados com prisma
npx prisma migrate reset

## Rodando a funcionalidade para poder criar os hobbies por meio da infra seed

npx prisma db seed

acesso ao pgadmin
$%Thalysson@1987

caso retorne error no redis no ambiente de desenvolvimento devera rodar o comando
=== > redis-server
atenção

para criar os seeds
npm run seed:ai

rodando ngrok
npx ngrok http 3000


## Rodar o redis no windows
após ter baixado o msi no https://github.com/tporadowski/redis/releases/tag/v5.0.14.1
podemos rodar o comando 
Para iniciar: net start redis
Para parar: net stop redis

Observação: rodar como admin no terminal