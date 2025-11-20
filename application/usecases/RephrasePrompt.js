// application/usecases/RephrasePrompt.js
import GPTClient from "@/application/adapters/openaiAdapter";
import { TokenService } from "@/domain/services/TokenService";

export async function RephrasePrompt({ text, userId }) {
  if (!text || typeof text !== "string") throw new Error("text is required");
  if (!userId) throw new Error("userId is required");

  const gpt = new GPTClient();
  const result = await gpt.rephrasePrompt(text);

  const used = Number(result?.usage?.input || 0) + Number(result?.usage?.output || 0);

  try {
    if (used > 0) await TokenService.deductTokens(userId, used);
  } catch (e) {
    console.error("Failed to deduct tokens for rephrase prompt:", e);
  }

  const remaining = await TokenService.getBalance(userId).catch((e) => {
    console.warn("Failed to fetch token balance:", e);
    return null;
  });

  return {
    output: result.output,
    usage: result.usage,
    tokensUsed: used,
    remaining,
  };
}
