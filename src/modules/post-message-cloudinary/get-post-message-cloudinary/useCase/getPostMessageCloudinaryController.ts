import { Request, Response } from "express"; // Não esqueça de importar Response
import { GetPostMessageCloudinaryUseCase } from "./getPostMessageCloudinaryUseCase";

export class GetPostMessageCloudinaryController {
  private useCase: GetPostMessageCloudinaryUseCase;

  constructor() {
    this.useCase = new GetPostMessageCloudinaryUseCase();
  }

  async handle(request: Request, response: Response) {
    // Captura page e limit da query string, fornecendo um valor padrão se forem inválidos
    const userId = request.id_client;
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    // Se page ou limit forem NaN ou menores que 1, defina como valores padrões
    if (page < 1 || limit < 1) {
      return response
        .status(400)
        .json({ message: "Page e limit devem ser maiores que 0" });
    }

    try {
      const getPostMessageCloudinary = await this.useCase.execute(
        userId,
        page,
        limit
      );

      return response.status(200).json(getPostMessageCloudinary);
    } catch (error) {
      console.error("Erro no processamento:", error);
      return response.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  }
}
