import { GetPostMessageCloudinaryRepository } from "./getPostMessageCloudinaryRepository";

export class GetPostMessageCloudinaryUseCase {
  private repository: GetPostMessageCloudinaryRepository;

  constructor() {
    this.repository = new GetPostMessageCloudinaryRepository();
  }

  async execute(userId: string, page: number, limit: number) {
    const totalItems = await this.repository.totalItemsPostMessageCloudinary(
      userId
    );
    const totalPages = Math.ceil(totalItems / limit);

    // Definir o offset para o banco de dados
    const offset = (page - 1) * limit;

    const userPreferences = await this.repository.userPreferences(userId);
    const userPreferencesInterests = userPreferences?.interests || "ambos"; // Valor padrão

    const likesForUserVideoReward = await this.repository.movieReward(userId);

    if (likesForUserVideoReward?.mustWatchVideoReword === true) {
      const noRewardResponseAndNoMatches = [
        { id: "watch-video-reward", typeExpirationTimer: "no-expiration" },
        // {
        //   id: "no-matches",
        //   typeExpirationTimer: "no-expiration",
        // },
      ];
      const noRewardResponse = {
        currentPage: page,
        totalPages: 0,
        perPage: limit,
        totalItems: 0,
        data: noRewardResponseAndNoMatches,
      };

      return noRewardResponse;
    }

    const getPostMessageCloudinary =
      await this.repository.getPostMessageCloudinary(
        userId,
        userPreferencesInterests,
        offset,
        limit
      );

    if (
      page === totalPages ||
      (page === 1 && totalPages === 0) ||
      getPostMessageCloudinary.length === 0
    ) {
      const addNoMatchs = getPostMessageCloudinary.map(
        // manipular o no match
        (data: { id: string; typeExpirationTimer: string }) => ({
          ...data,
        })
      );
      // manipular o no match
      addNoMatchs.push({
        id: "no-matches",
        typeExpirationTimer: "no-expiration",
      });
      return {
        currentPage: page,
        totalPages,
        perPage: limit,
        totalItems,
        data: addNoMatchs,
      };
    }

    return {
      currentPage: page,
      totalPages,
      perPage: limit,
      totalItems,
      data: getPostMessageCloudinary,
    };
  }
}
