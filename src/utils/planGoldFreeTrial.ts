import { prismaCliente } from "../database/prismaCliente";

export class PlanGoldFreeTrial {
  async activePlan(userId: string) {
    const activePlanGoldFreeTrial =
      await prismaCliente.adminActivePlanGoldFreeTrial.findFirst({
        where: { activePlan: true },
      });

    if (!activePlanGoldFreeTrial) {
      return null;
    }

    // Verifica se o usuário já visualizou o card ou fez a primeira publicação
    const userViewCardOrFirstPublicationPost =
      await prismaCliente.viewCardOrFirstPublicationPlanGoldFreeTrial.findFirst(
        {
          where: { userId },
          select: {
            firstPublicationPostMessage: true,
            viewCardFreeTrial: true,
          },
        }
      );

    return userViewCardOrFirstPublicationPost;
  }

  async createPlanGoldFreeTrial(userId: string) {
    const existingPlan =
      await prismaCliente.viewCardOrFirstPublicationPlanGoldFreeTrial.findFirst(
        {
          where: { userId },
          select: {
            firstPublicationPostMessage: true,
            viewCardFreeTrial: true,
          },
        }
      );

    // Se já existir, retorna os dados existentes
    if (existingPlan) {
      return existingPlan;
    }

    // Cria o registro caso não exista
    return await prismaCliente.viewCardOrFirstPublicationPlanGoldFreeTrial.create(
      {
        data: { userId },
        select: {
          firstPublicationPostMessage: true,
          viewCardFreeTrial: true,
        },
      }
    );
  }
}
