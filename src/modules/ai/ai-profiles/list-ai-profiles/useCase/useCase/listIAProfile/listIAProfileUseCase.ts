import { getImageAvatarAI } from "../../../../../../../service/cloudinary.service";
import { ListIAProfileRepository } from "./listIAProfileRepository";

export class ListIAProfileUseCase {
  private repository: ListIAProfileRepository;

  constructor() {
    this.repository = new ListIAProfileRepository();
  }

  async execute(userId: string) {
    const user = await this.repository.userLanguage(userId);
    const profiles = await this.repository.list(user.language, user.interests);

    const formatted = profiles.map((profile) => ({
      slug: profile.slug,
      name: profile.name,
      description: profile.description,
      age: profile.age,
      height: profile.height,
      zodiac: profile.zodiac,
      bio: profile.bio,
      country: profile.country,
      city: profile.city,
      avatarUrl: getImageAvatarAI(profile.avatarUrl),
      personality: profile.personality,
      style: profile.style,

      traits: profile.traits.map((t) => ({
        key: t.trait.key,
        name: t.trait.translations[0]?.name,
      })),

      interests: profile.interests.map((i) => ({
        key: i.hobby.key,
        icon: i.hobby.icon,
        name: i.hobby.translations[0]?.name,
      })),

      lifestyles: profile.lifestyles.map((l) => ({
        key: l.hobby.key,
        icon: l.hobby.icon,
        name: l.hobby.translations[0]?.name,
      })),
    }));

    return formatted;
  }
}
