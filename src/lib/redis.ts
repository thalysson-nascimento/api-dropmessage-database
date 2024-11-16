// lib/redis.ts
import { createClient } from "redis";

const redisHost = process.env.REDISHOST;
const redisPort = process.env.REDISPORT;
const redisPassword = process.env.REDISPASSWORD;

// Cliente padrão para leitura/escrita
const client = createClient({
  url: `redis://${redisHost}:${redisPort}`,
  password: redisPassword,
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
