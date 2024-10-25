// lib/redis.ts
import { createClient } from "redis";

// Cliente padrão para leitura/escrita
const client = createClient({ url: "redis://localhost:6379" });
client.on("error", (err) => console.log("Redis Client Error", err));

// Cliente exclusivo para assinaturas
const subscriberClient = createClient({ url: "redis://localhost:6379" });
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  await client.connect();
  await subscriberClient.connect(); // Conecta o cliente de assinatura também
})();

export { client, subscriberClient };
