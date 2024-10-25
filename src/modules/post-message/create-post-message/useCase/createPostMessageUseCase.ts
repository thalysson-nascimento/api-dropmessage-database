import { PrismaClient } from "@prisma/client";

import { addDays, addHours, addMinutes } from "date-fns";
import { client as redisClient } from "../../../../lib/redis";
import { getSocketIO } from "../../../../lib/socket";

const prisma = new PrismaClient();

export class CreatePostMessageUseCase {
  async execute(data: {
    fileImage: string;
    expirationTimer: string;
    userId: string;
  }) {
    const { fileImage, expirationTimer, userId } = data;

    // Obtém o tempo atual
    let expirationDate: Date = new Date();
    let expirationInSeconds;

    // Aplica a lógica baseada no valor de expirationTimer
    switch (expirationTimer) {
      case "addThirtyMin":
        console.log("thirtyMin");
        expirationDate = addMinutes(expirationDate, 30);
        expirationInSeconds = 30 * 60; // 30 minutos em segundos

        break;
      case "addOneHour":
        console.log("addOneHour");
        expirationDate = addHours(expirationDate, 1);
        expirationInSeconds = 60 * 60; // 60 minutos em segundos

        break;
      case "addOneday":
        console.log("addOneday");
        expirationDate = addDays(expirationDate, 1);
        expirationInSeconds = 24 * 60 * 60; // 24 horas em segundos

        break;
      default:
        throw new Error(
          "Valor inválido para timerExpiration:" + expirationTimer
        );
    }

    const post = await prisma.postMessage.create({
      data: {
        image: fileImage,
        expirationTimer: expirationDate,
        typeExpirationTimer: expirationTimer, // Aqui passa o valor recebido na requisição
        user: {
          connect: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
        image: true,
        expirationTimer: true,
        typeExpirationTimer: true,
      },
    });

    // Armazena o post no Redis com expiração
    await redisClient.setEx(
      `post:${post.id}`,
      expirationInSeconds,
      JSON.stringify(post)
    );

    const io = getSocketIO();
    io.emit("add-new-post-message", post);

    return post;
  }
}
