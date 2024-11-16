// lib/redis.ts
import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

// Cliente padrão para leitura/escrita
const redisUrl = `redis://default:${redisPassword}@${redisHost}:${redisPort}`;

console.log("========================", { redisUrl });
console.log({ redisHost, redisPort, redisPassword });

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.log("Redis Client Error", err));

// Cliente exclusivo para assinaturas
const subscriberClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  await client.connect();
  await subscriberClient.connect(); // Conecta o cliente de assinatura também
})();

export { client, subscriberClient };
