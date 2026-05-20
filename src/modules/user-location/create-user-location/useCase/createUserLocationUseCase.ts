import { PrismaClient } from "@prisma/client";

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

    const createUserLocation = await prisma.userLocation.upsert({
      where: {
        userId: userId,
      },
      update: {
        state: state,
        stateCode: stateCode,
        city: city,
        continent: continent,
        country: country,
        countryCode: countryCode,
        currency: currency,
      },
      create: {
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
