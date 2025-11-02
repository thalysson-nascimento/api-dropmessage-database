// src/lib/redis.ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

export const client = createClient({
  url: redisUrl,
});

export const subscriberClient = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.log("Redis Client Error", err));
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  try {
    if (!client.isOpen) await client.connect();
    if (!subscriberClient.isOpen) await subscriberClient.connect();
    console.log("✅ Redis clients conectados com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao conectar Redis clients:", err);
  }
})();
