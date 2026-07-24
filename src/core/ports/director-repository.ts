import type { DirectorSnapshot, DirectorProposal } from "../domain/game-director.ts";

export interface DirectorRepository {
  loadSnapshot(playerId: string): Promise<DirectorSnapshot>;
  recordObservation(snapshot: DirectorSnapshot): Promise<string>;
  recordProposal(observationId: string, proposal: DirectorProposal): Promise<void>;
}
