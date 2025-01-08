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

npx prisma generate

npx prisma migrate dev

## Comando para expor a api suando serveo

primeiramente roda esse comando abaixo
ssh -R 80:localhost:3000 serveo.net

depois cola a url de tunelamento no BASE_URL
depois que salvar roda o comando para startar o projeto para ele iniciar com a devida variavel de ambiente
do tunelamento.

##

para gerar os scripts de useCase, repository e controller
acesse a pasta pelo terminal e rode
generate-usecase exemploDeFuncionalidade
ele vai criar os tres scripts
-exemploDeFuncionalidadeUseCase.ts
-exemploDeFuncionalidadeController.ts
-exemploDeFuncionalidadeRepository.ts
