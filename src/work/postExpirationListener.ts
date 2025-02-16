import { Server } from "socket.io";
import { prismaCliente } from "../database/prismaCliente";
import { subscriberClient } from "../lib/redis"; // Importa o cliente de assinatura
import { getSocketIO } from "../lib/socket";

const io = new Server();

export async function monitorExpiredPosts() {
  await subscriberClient.pSubscribe(
    "__keyevent@0__:expired",
    async (message) => {
      console.log(`🔔 Chave expirada detectada: ${message}`);

      if (message.startsWith("post:")) {
        // Extraindo o postId corretamente
        const postId = message.replace("post:", "");

        const postExists = await prismaCliente.postMessageCloudinary.findUnique(
          {
            where: { id: postId },
          }
        );

        if (!postExists) {
          console.error(`Postagem com ID ${postId} não encontrada no banco.`);
          return;
        }

        try {
          await prismaCliente.postMessageCloudinary.update({
            where: { id: postId },
            data: { isExpired: true },
          });

          console.log(
            `✅ Post ID ${postId} expirou e foi atualizado no banco.`
          );
          const io = getSocketIO();
          io.emit("post-expired", postId);
        } catch (error: any) {
          console.error(`❌ Erro ao atualizar post expirado: ${error.message}`);
        }
      } else if (message.startsWith("countLikePostMessage:")) {
        console.log(`ℹ️ Contador de likes expirado: ${message}`);
      } else {
        console.warn(`⚠️ Chave desconhecida expirada: ${message}`);
      }
    }
  );

  console.log("🚀 Monitorando expiração de posts no Redis...");
}
