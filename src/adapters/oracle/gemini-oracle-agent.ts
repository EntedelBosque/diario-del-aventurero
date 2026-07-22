import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DiaryEntry } from "../../core/domain/diary-entry.ts";
import { GroqOracleAgent } from "./groq-oracle-agent.ts";
import type { OracleAgent, OracleContext } from "../../core/ports/oracle-agent.ts";

export class GeminiOracleAgent implements OracleAgent {
  async interpret(entry: DiaryEntry, context: OracleContext): Promise<unknown> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is required");
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
      { model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } },
      { apiVersion: "v1" }
    );
    const result = await model.generateContent(JSON.stringify({ entry: { text: entry.text, occurredAt: entry.occurredAt.toISOString() }, context }));
    return JSON.parse(result.response.text());
  }
}

export function createOracleAgent(): OracleAgent {
  const provider = process.env.AI_PROVIDER ?? "groq";
  if (provider === "groq") return new GroqOracleAgent();
  if (provider === "gemini") return new GeminiOracleAgent();
  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
