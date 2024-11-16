// lib/redis.ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

console.log("========================", { redisUrl });

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.log("Redis Client Error", err));

// Cliente exclusivo para assinaturas
const subscriberClient = createClient({
  url: redisUrl,
});
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  await client.connect();
  await subscriberClient.connect(); // Conecta o cliente de assinatura também
})();

export { client, subscriberClient };
