import { Request, Response } from "express"; // Não esqueça de importar Response
import { GetPostMessageUseCase } from "./getPostMessageUseCase";

export class GetPostMessageController {
  async handle(request: Request, response: Response) {
    try {
      // Captura page e limit da query string, fornecendo um valor padrão se forem inválidos
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 10;

      // Se page ou limit forem NaN ou menores que 1, defina como valores padrões
      if (page < 1 || limit < 1) {
        return response
          .status(400)
          .json({ message: "Page e limit devem ser maiores que 0" });
      }

      const getPostMessageUseCase = new GetPostMessageUseCase();
      const result = await getPostMessageUseCase.execute(page, limit);

      return response.json(result); // Envia a resposta como JSON
    } catch (error) {
      console.error("Erro no processamento:", error);
      return response.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  }
}
