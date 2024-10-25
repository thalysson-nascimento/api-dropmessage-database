// // lib/redisSubscriber.ts
// import { createClient } from "redis";

// // Cliente dedicado para assinaturas (Pub/Sub)
// const subscriber = createClient({
//   url: "redis://localhost:6379", // URL de conexão ao Redis
// });

// subscriber.on("error", (err) => console.log("Redis Subscriber Error", err));

// (async () => {
//   await subscriber.connect();
//   // Inscreva-se no canal de eventos de expiração
//   await subscriber.pSubscribe("__keyevent@0__:expired", (message) => {
//     console.log(`Post expirado: ${message}`);
//     // Aqui você pode adicionar a lógica para lidar com o post expirado
//   });
// })();

// export default subscriber;
