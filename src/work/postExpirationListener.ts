import { Server } from "socket.io";
import { prismaCliente } from "../database/prismaCliente";
import { subscriberClient } from "../lib/redis"; // Importa o cliente de assinatura
import { getSocketIO } from "../lib/socket";

const io = new Server();

export async function monitorExpiredPosts() {
  await subscriberClient.pSubscribe(
    "__keyevent@0__:expired",
    async (message) => {
      const postId = message.split(":")[1]; // Extrai o postId da chave Redis 'post:postId'

      try {
        await prismaCliente.postMessageCloudinary.update({
          where: {
            id: postId,
          },
          data: {
            isExpired: true,
          },
        });

        console.log(`Post ID ${postId} expirou e foi atualizado no banco.`);
        const io = getSocketIO();
        io.emit("post-expired", postId);
      } catch (error: any) {
        console.error(
          `Erro ao atualizar post expirado no banco: ${error.message}`
        );
      }
    }
  );

  console.log("Monitorando expiração de posts no Redis...");
}
