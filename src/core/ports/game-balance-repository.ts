export type ActiveBalanceTable = {
  tableKey: string;
  version: number;
  payload: unknown;
  activatedAt: Date | null;
};

/** The Motor must fail closed whenever a required active balance table is absent. */
export interface GameBalanceRepository {
  getActive(tableKey: string): Promise<ActiveBalanceTable | null>;
}

export async function requireActiveBalanceTable(repository: GameBalanceRepository, tableKey: string): Promise<ActiveBalanceTable> {
  const table = await repository.getActive(tableKey);
  if (!table) throw new Error(`Missing active game balance table: ${tableKey}`);
  return table;
}
