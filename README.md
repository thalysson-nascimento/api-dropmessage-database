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