import redis from "./src/lib/redis";

(async () => {
  try {
    await redis.setEx("test-key", 10, "some-value");
    const value = await redis.get("test-key");
    console.log("Valor:", value); // Deve mostrar "some-value"
  } catch (error) {
    console.error("Erro ao interagir com o Redis:", error);
  } finally {
    await redis.quit(); // Certifique-se de desconectar ao final do teste
  }
})();
