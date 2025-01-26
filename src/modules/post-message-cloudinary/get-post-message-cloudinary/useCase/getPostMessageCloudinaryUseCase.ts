import { GetPostMessageCloudinaryRepository } from "./getPostMessageCloudinaryRepository";

export class GetPostMessageCloudinaryUseCase {
  private repository: GetPostMessageCloudinaryRepository;
  activeSubscription: boolean = false;

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

    const userSignature = await this.repository.activeSubscription(userId);

    if (!userSignature || userSignature.status === "canceled") {
      this.activeSubscription = false;
    } else {
      this.activeSubscription = true;
    }

    if (likesForUserVideoReward?.mustWatchVideoReword === true) {
      const noRewardResponseAndNoMatches = [
        { id: "watch-video-reward", typeExpirationTimer: "no-expiration" },
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

    const formattedData = getPostMessageCloudinary.map((data: any) => ({
      ...data,
      user: {
        ...data.user,
        UserLocation: this.activeSubscription
          ? data.user.UserLocation
          : { city: null, stateCode: null },
      },
    }));

    if (
      page === totalPages ||
      (page === 1 && totalPages === 0) ||
      getPostMessageCloudinary.length === 0
    ) {
      formattedData.push({
        id: "no-matches",
        typeExpirationTimer: "no-expiration",
      });

      return {
        currentPage: page,
        totalPages,
        perPage: limit,
        totalItems,
        data: formattedData,
      };
    }

    return {
      currentPage: page,
      totalPages,
      perPage: limit,
      totalItems,
      data: formattedData,
    };
  }
}
