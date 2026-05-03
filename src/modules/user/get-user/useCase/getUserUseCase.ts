import { differenceInYears, parse } from "date-fns";
import { GetUserInterface } from "../../../../interfaces/get-user.interface";
import { GetUserRepository } from "./getUserRepository";

export class GetUserUseCase {
  private repository: GetUserRepository;

  constructor() {
    this.repository = new GetUserRepository();
  }

  async execute(userId: string): Promise<GetUserInterface> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const language = await this.repository.getUserLanguage(userId);

    const hobbiesRaw = await this.repository.getUserHobbiesTranslated(
      userId,
      language,
    );

    let age = 0;

    if (user.About?.dateOfBirth) {
      const birthDate = parse(user.About.dateOfBirth, "MM/dd/yyyy", new Date());

      age = differenceInYears(new Date(), birthDate);
    }

    const hobbies = hobbiesRaw.map((item) => ({
      icon: item.hobby.icon,
      label: item.hobby.translations[0]?.name ?? item.hobby.key,
    }));

    return {
      details: {
        name: user.name,
        age,
        language,
        userDescription: user.UserDescription?.description ?? null,
        profession: user.About?.profession ?? null,
        interests: user.About?.interests ?? null,
      },
      hobbies,
      location: {
        country: user.UserLocation?.country ?? null,
        city: user.UserLocation?.city ?? null,
      },
    };
  }
}
