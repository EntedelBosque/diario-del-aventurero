import type { DiaryEntry } from "../domain/diary-entry.ts";

export type OracleContext = {
  language: string;
  activeStats: Record<string, number>;
  relevantEntities: Array<{ id: string; type: string; name: string; aliases: string[]; title?: string; description?: string }>;
  activeContractIds: string[];
  activeBossIds: string[];
};

export interface OracleAgent {
  interpret(entry: DiaryEntry, context: OracleContext): Promise<unknown>;
}
