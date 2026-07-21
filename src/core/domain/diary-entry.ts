export type DiaryEntry = {
  id: string;
  playerId: string;
  idempotencyKey: string;
  text: string;
  occurredAt: Date;
  submittedAt: Date;
};

export type RecordDiaryEntry = {
  id: string;
  playerId: string;
  idempotencyKey: string;
  text: string;
  occurredAt: Date;
  submittedAt: Date;
};

const MAX_ENTRY_LENGTH = 10_000;

export function createDiaryEntry(command: RecordDiaryEntry): DiaryEntry {
  requireText(command.id, "id");
  requireText(command.playerId, "playerId");
  requireText(command.idempotencyKey, "idempotencyKey");

  const text = command.text.trim();
  if (text.length === 0 || text.length > MAX_ENTRY_LENGTH) {
    throw new Error(`text must contain between 1 and ${MAX_ENTRY_LENGTH} characters`);
  }

  requireValidDate(command.occurredAt, "occurredAt");
  requireValidDate(command.submittedAt, "submittedAt");

  return { ...command, text };
}

function requireText(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function requireValidDate(value: Date, field: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
}
