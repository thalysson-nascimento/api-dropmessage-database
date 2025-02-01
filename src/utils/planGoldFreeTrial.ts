import { prismaCliente } from "../database/prismaCliente";

export class PlanGoldFreeTrial {
  async activePlan(userId: string) {
    const activePlanGoldFreeTrial =
      await prismaCliente.adminActivePlanGoldFreeTrial.findFirst({
        where: { activePlan: true },
      });

    if (activePlanGoldFreeTrial) {
      // Verfica se existe qualquer plano ativo, pois o usuario pode ter fechado a tela e antes
      // e não ter compartilhado nada e ter assinado algum plano
      const userActivityStripeSignature =
        await prismaCliente.stripeSignature.findFirst({
          where: {
            userId: userId,
          },
        });

      if (userActivityStripeSignature) {
        console.log("tem assinatura");
        return null;
      } else {
        console.log("nao tem assinatura");
        const userViewCardOrFirstPublicationPost =
          await prismaCliente.viewCardOrFirstPublicationPlanGoldFreeTrial.findFirst(
            {
              where: {
                userId: {
                  equals: userId,
                },
              },
              select: {
                firstPublicationPostMessage: true,
                viewCardFreeTrial: true,
              },
            }
          );

        if (!userViewCardOrFirstPublicationPost) {
          await prismaCliente.viewCardOrFirstPublicationPlanGoldFreeTrial.create(
            {
              data: {
                userId: userId,
              },
              select: {
                firstPublicationPostMessage: true,
                viewCardFreeTrial: true,
              },
            }
          );
        } else {
          return userViewCardOrFirstPublicationPost;
        }
      }
    }
  }
}
