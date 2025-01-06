import { openAIClient } from "../../../../lib/openAIGptMini";

export class CreateUserDescriptionCompleteRepository {
  async completeDescriptionWithGpt4oMini(userDescription: string) {
    const stream = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "system",
          content:
            "Com base na descrição informada complete e concatene a descrição. Seja mais informau que possivel para um app de relacionamento.",
        },

        {
          role: "system",
          content:
            "O texto final (recebido + completado) corrija erros ortograficos e somando os dois deve dar o mais proximo possivel de 150 caracteres, isso é crucial, retorne somente o objeto como esta no content",
        },
        {
          role: "user",
          content: `{"userDescriprition": "${userDescription}"}`,
        },
      ],
    });

    console.log("===>", stream);

    const content = stream.choices[0]?.message?.content;

    console.log("content ===>", content);

    if (!content) {
      throw new Error("O conteúdo retornado pela API está vazio.");
    }

    return JSON.parse(content);
  }
}
