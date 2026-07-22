import OpenAI from "openai";
import type { DiaryEntry } from "../../core/domain/diary-entry.ts";
import type { OracleAgent, OracleContext } from "../../core/ports/oracle-agent.ts";

export class GroqOracleAgent implements OracleAgent {
  async interpret(entry: DiaryEntry, context: OracleContext): Promise<unknown> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is required");
    const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Responde únicamente con un objeto JSON válido, sin texto adicional ni bloques de código." },
        { role: "user", content: JSON.stringify({ entry: { text: entry.text, occurredAt: entry.occurredAt.toISOString() }, context }) }
      ]
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");
    return JSON.parse(content);
  }
}
