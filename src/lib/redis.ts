import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.log("Redis Client Error", err));

const subscriberClient = createClient({
  url: redisUrl,
});
subscriberClient.on("error", (err) =>
  console.log("Redis Subscriber Client Error", err)
);

(async () => {
  await client.connect();
  await subscriberClient.connect();
})();

export { client, subscriberClient };
