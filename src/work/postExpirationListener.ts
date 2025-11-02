import { prismaCliente } from "../database/prismaCliente";
import { subscriberClient } from "../lib/redis";
import { getSocketIO } from "../lib/socket";

export async function monitorExpiredPosts() {
  console.log("🚀 Iniciando monitoramento de expiração de posts...");

  try {
    if (!subscriberClient.isOpen) {
      await subscriberClient.connect();
    }

    await subscriberClient.pSubscribe(
      "__keyevent@0__:expired",
      async (message) => {
        console.log(`🔔 Chave expirada detectada: ${message}`);

        if (message.startsWith("post:")) {
          const postId = message.replace("post:", "");

          try {
            const postExists =
              await prismaCliente.postMessageCloudinary.findUnique({
                where: { id: postId },
              });

            if (!postExists)
              return console.warn(`Post ID ${postId} não encontrado.`);

            await prismaCliente.postMessageCloudinary.update({
              where: { id: postId },
              data: { isExpired: true },
            });

            const io = getSocketIO();
            io.emit("post-expired", postId);

            console.log(`✅ Post ID ${postId} expirou e foi atualizado.`);
          } catch (error: any) {
            console.error(
              `❌ Erro ao atualizar post expirado: ${error.message}`
            );
          }
        } else {
          console.warn(`⚠️ Chave expirada desconhecida: ${message}`);
        }
      }
    );
  } catch (err) {
    console.error("❌ Erro ao conectar ou assinar Redis:", err);
    setTimeout(() => monitorExpiredPosts(), 5000);
  }
}
