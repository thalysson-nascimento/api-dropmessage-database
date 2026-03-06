import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ListUserHobbiesRepository {
  async listUserHobbiesById(userId: string) {
    const language = prisma.language.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });

    return language;
    // // 1️⃣ Buscar país do usuário
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: {
    //     countryId: true,
    //   },
    // });

    // if (!user) {
    //   throw new Error("User not found");
    // }

    // // 2️⃣ Buscar hobbies disponíveis para o país
    // const hobbies = await prisma.hobby.findMany({
    //   where: {
    //     countries: {
    //       some: {
    //         countryId: user.countryId,
    //       },
    //     },
    //   },
    //   include: {
    //     category: true,
    //     translations: {
    //       where: { language },
    //       select: { name: true },
    //     },
    //     users: {
    //       where: { userId },
    //       select: { hobbyId: true },
    //     },
    //   },
    //   orderBy: {
    //     category: {
    //       name: "asc",
    //     },
    //   },
    // });

    // // 3️⃣ Formatar resposta
    // return hobbies.map((hobby) => ({
    //   id: hobby.id,
    //   key: hobby.key,
    //   icon: hobby.icon,
    //   color: hobby.color,
    //   category: hobby.category.name,
    //   name: hobby.translations[0]?.name ?? hobby.key,
    //   isSelected: hobby.users.length > 0,
    // }));
  }
}
