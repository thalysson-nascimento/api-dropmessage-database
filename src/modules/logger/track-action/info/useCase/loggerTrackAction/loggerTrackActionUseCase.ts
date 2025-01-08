import { LoggerTrackActionRepository } from "./loggerTrackActionRepository";

interface TrackAction {
  pageView: string;
  event: string;
  category: string;
  message: string;
  statusCode: number;
  level: string;
}

export class LoggerTrackActionUseCase {
  private repository: LoggerTrackActionRepository;

  constructor() {
    this.repository = new LoggerTrackActionRepository();
  }

  async execute(userId: string, log: TrackAction) {
    await this.repository.info(userId, log);
  }
}
