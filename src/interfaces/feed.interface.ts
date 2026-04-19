export type FeedPostCard =
  | FeedPost
  | FeedAISuggestion
  | FeedWatchVideo
  | FeedLikeLimit;

export type FeedPost = {
  id: string;
  image: string;
  expirationTimer: Date;
  typeExpirationTimer: string;

  user: {
    name: string;

    avatar: {
      image: string;
    };

    UserLocation: {
      city: string | null;
      stateCode: string | null;
    };
  };
};

export type FeedAISuggestion = {
  type: ["AI_SUGGESTION"];
};

export type FeedWatchVideo = {
  type: ["WATCH_VIDEO"];
};

export type FeedLikeLimit = {
  type: ["LIKE_LIMIT"];
};
