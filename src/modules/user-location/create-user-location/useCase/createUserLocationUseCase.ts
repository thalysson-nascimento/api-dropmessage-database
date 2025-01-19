import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";

const prisma = new PrismaClient();
export class CreateUserLocationUseCase {
  async execute(data: {
    state: string;
    stateCode: string;
    city: string;
    userId: string;
    continent: string;
    country: string;
    countryCode: string;
    currency: string;
  }) {
    const {
      state,
      stateCode,
      city,
      userId,
      continent,
      country,
      countryCode,
      currency,
    } = data;

    const existUserLocation = await prisma.userLocation.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });

    if (existUserLocation) {
      throw createHttpError(402, "localização existente");
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        validatorLocation: true,
      },
    });

    const createUserLocation = await prisma.userLocation.create({
      data: {
        state: state,
        stateCode: stateCode,
        city: city,
        userId: userId,
        continent: continent,
        country: country,
        countryCode: countryCode,
        currency: currency,
      },
      select: {
        state: true,
        stateCode: true,
        city: true,
      },
    });
    return createUserLocation;
  }
}
