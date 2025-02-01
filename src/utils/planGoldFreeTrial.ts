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

    const userActivityStripeSignature =
      await prismaCliente.stripeSignature.findFirst({
        where: { userId },
      });

    if (userActivityStripeSignature) {
      console.log("Usuário já tem assinatura ativa.");
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

    if (userViewCardOrFirstPublicationPost) {
      return userViewCardOrFirstPublicationPost; // ✅ Retorna os dados se já existirem
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
