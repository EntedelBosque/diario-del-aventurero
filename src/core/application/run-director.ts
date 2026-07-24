import { evaluateGameDirector } from "../domain/game-director.ts";
import type { DirectorRepository } from "../ports/director-repository.ts";

// DEV-SPEC-018 — El Director observa el estado global y registra PROPUESTAS mediante el dominio
// determinista `evaluateGameDirector`. Nunca ejecuta cambios: solo persiste observación + propuestas.
export class RunDirector {
  constructor(private readonly repository: DirectorRepository) {}

  async execute(playerId: string): Promise<void> {
    const snapshot = await this.repository.loadSnapshot(playerId);
    const observationId = await this.repository.recordObservation(snapshot);
    for (const proposal of evaluateGameDirector(snapshot)) {
      await this.repository.recordProposal(observationId, proposal);
    }
  }
}
