import { UnMatchRepository } from "./UnMatchRepository";

export class UnMatchUseCase {
  private repository: UnMatchRepository;

  constructor() {
    this.repository = new UnMatchRepository();
  }

  async exempleUseCase() {
    // Implemente a lógica aqui
  }
}