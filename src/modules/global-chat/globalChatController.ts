import { Request, Response } from "express";
import { emitGlobalChatEvent } from "../../lib/socket";
import { GlobalChatUseCase } from "./globalChatUseCase";

export class GlobalChatController {
  private useCase = new GlobalChatUseCase();

  async create(request: Request, response: Response) {
    try {
      const result = await this.useCase.createMessage({
        userId: request.id_client,
        content: request.body.content,
        file: request.file,
        viewOnce: request.body.viewOnce,
        expiresInSeconds: request.body.expiresInSeconds,
        replyToId: request.body.replyToId,
      });
      emitGlobalChatEvent(
        "global-chat:new-message",
        result.viewOnce
          ? {
              ...result,
              imageUrl: null,
              fileName: null,
              isViewOncePreview: true,
              viewOnceStatus: "PENDING",
              viewOnceReaders: [],
            }
          : result,
      );
      return response.status(201).json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async list(request: Request, response: Response) {
    try {
      const result = await this.useCase.listMessages(
        request.id_client,
        request.query.limit as string,
        request.query.cursor as string,
      );
      return response.json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async react(request: Request, response: Response) {
    try {
      const result = await this.useCase.toggleReaction(
        request.params.id,
        request.id_client,
        request.body.emotion,
      );
      emitGlobalChatEvent("global-chat:reaction-updated", result);
      return response.json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async comment(request: Request, response: Response) {
    try {
      const result = await this.useCase.createComment(
        request.params.messageId,
        request.id_client,
        request.body.content,
        request.body.replyToId,
      );
      emitGlobalChatEvent("global-chat:comment-created", {
        ...result.comment,
        messageId: result.messageId,
        commentsCount: result.commentsCount,
      });
      return response.status(201).json(result.comment);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async listComments(request: Request, response: Response) {
    try {
      const result = await this.useCase.listComments(
        request.params.messageId,
        request.id_client,
        request.query.cursor as string,
        request.query.limit as string,
      );
      return response.json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async delete(request: Request, response: Response) {
    try {
      const result = await this.useCase.deleteMessage(
        request.params.id,
        request.id_client,
      );
      emitGlobalChatEvent("global-chat:message-deleted", result);
      return response.json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async markViewed(request: Request, response: Response) {
    try {
      const result = await this.useCase.markViewed(
        request.params.id,
        request.id_client,
      );
      emitGlobalChatEvent("global-chat:view-once-read", result.readEvent);
      return response.json(result);
    } catch (error: any) {
      return response
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }
}
