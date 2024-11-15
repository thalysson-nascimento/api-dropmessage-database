// lib/redis.ts
import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

// Cliente padrão para leitura/escrita
const client = createClient({ url: `${redisHost}:${redisPort}` });
client.on("error", (err) => console.log("Redis Client Error", err));

// Cliente exclusivo para assinaturas
const subscriberClient = createClient({ url: `${redisHost}:${redisPort}` });
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  await client.connect();
  await subscriberClient.connect(); // Conecta o cliente de assinatura também
})();

export { client, subscriberClient };
