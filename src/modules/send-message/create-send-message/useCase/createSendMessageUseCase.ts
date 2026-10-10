import createHttpError from "http-errors";
import {
  deleteAuthenticatedImage,
  getTemporaryAuthenticatedImageUrl,
  uploadAuthenticatedImage,
} from "../../../../service/cloudinary.service";
import { CreateSendMessageRepository } from "./createSendMessageRepository";

const VIEW_ONCE_URL_LIFETIME_SECONDS = 60;

function parseViewOnce(value: unknown) {
  if (value === undefined || value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  throw createHttpError(400, "viewOnce deve ser true ou false");
}

export class CreateSendMessageUseCase {
  private repository: CreateSendMessageRepository;

  constructor() {
    this.repository = new CreateSendMessageRepository();
  }

  async execute(
    userId: string,
    matchId: string,
    userHashPublic: string,
    contentInput?: string,
    file?: Express.Multer.File,
    viewOnceInput?: unknown,
  ) {
    const content = contentInput?.trim() || undefined;
    if (!content && !file) {
      throw createHttpError(400, "Envie um texto ou uma foto");
    }

    if (file && !file.mimetype.startsWith("image/")) {
      throw createHttpError(400, "O arquivo enviado precisa ser uma imagem");
    }

    const viewOnce = parseViewOnce(viewOnceInput);
    if (viewOnce && !file) {
      throw createHttpError(400, "viewOnce só está disponível para fotos");
    }

    const match = await this.repository.getMatchById(matchId);
    if (!match || match.unMatch) {
      throw createHttpError(404, "Match não encontrado");
    }

    const authenticatedParticipant =
      match.initiatorId === userId
        ? match.initiator
        : match.recipientId === userId
          ? match.recipient
          : null;
    if (
      !authenticatedParticipant ||
      authenticatedParticipant.userHashPublic !== userHashPublic
    ) {
      throw createHttpError(403, "Acesso não autorizado a este match");
    }

    let uploadedImage: string | undefined;
    if (file) {
      const upload = await uploadAuthenticatedImage(file, "private-chat");
      uploadedImage = upload.public_id;
    }

    try {
      return await this.repository.createSendMessage(
        matchId,
        userId,
        content,
        uploadedImage,
        file?.originalname,
        file?.mimetype.split("/")[1],
        viewOnce,
      );
    } catch (error) {
      if (uploadedImage) {
        try {
          await deleteAuthenticatedImage(uploadedImage);
        } catch (cleanupError) {
          console.error("Falha ao remover imagem após erro ao criar mensagem", {
            cleanupError,
          });
        }
      }
      throw error;
    }
  }

  async viewOnceMessage(
    messageId: string,
    matchId: string,
    userId: string,
  ) {
    const message = await this.repository.getMessageForView(messageId);
    if (
      !message ||
      message.matchId !== matchId ||
      message.match.unMatch ||
      !message.viewOnce ||
      !message.image
    ) {
      throw createHttpError(404, "Foto de visualização única não encontrada");
    }

    const isMatchParticipant =
      message.match.initiatorId === userId ||
      message.match.recipientId === userId;
    if (!isMatchParticipant) {
      throw createHttpError(403, "Acesso não autorizado a este match");
    }
    if (message.userId === userId) {
      throw createHttpError(403, "Você não pode abrir sua própria foto");
    }

    const expiresAt =
      Math.floor(Date.now() / 1000) + VIEW_ONCE_URL_LIFETIME_SECONDS;
    const imageUrl = getTemporaryAuthenticatedImageUrl(
      message.image,
      message.format || "jpg",
      expiresAt,
    );

    const registeredView = await this.repository.registerView(messageId, userId);
    if (registeredView.count === 0) {
      throw createHttpError(409, "Essa foto já foi visualizada por você");
    }

    return {
      message: {
        id: message.id,
        matchId: message.matchId,
        createdAt: message.createdAt,
        content: message.content,
        imageUrl,
        fileName: message.fileName,
        viewOnce: true,
        viewOnceStatus: "READ",
        user: {
          userHashPublic: message.user.userHashPublic,
          name: message.user.name,
        },
      },
    };
  }
}
