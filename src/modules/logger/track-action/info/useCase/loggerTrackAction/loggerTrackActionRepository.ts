import logger from "../../../../../../config/logger-loki";

interface TrackAction {
  pageView: string;
  event: string;
  category: string;
  message: string;
  statusCode: number;
  level: string;
}

export class LoggerTrackActionRepository {
  async info(userId: string, loggerAction: TrackAction) {
    const payload = {
      streams: [
        {
          stream: {
            userId: userId,
            pageView: loggerAction.pageView,
            event: loggerAction.event,
            category: loggerAction.category,
          },
          values: [
            [
              `${Date.now()}000000`,
              JSON.stringify({
                message: loggerAction.message,
                statusCode: loggerAction.statusCode,
              }),
            ],
          ],
        },
      ],
    };

    logger.info(payload);
  }
}
