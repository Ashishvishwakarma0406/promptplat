// application/usecases/HumanizeText.js
import GPTClient from "@/application/adapters/openaiAdapter";
import { TokenService } from "@/domain/services/TokenService";

/**
 * HumanizeText use-case:
 * - calls GPTClient.rewriteText
 * - deducts tokens (best-effort)
 * - returns output + usage and remaining balance
 */
export async function HumanizeText({ text, userId }) {
  if (!text || typeof text !== "string") {
    throw new Error("text is required");
  }
  if (!userId) {
    throw new Error("userId is required");
  }

  const gpt = new GPTClient();
  const result = await gpt.rewriteText(text);

  // normalize usage numbers (fallbacks)
  const usedTokens = Number(result?.usage?.input || 0) + Number(result?.usage?.output || 0);

  try {
    if (usedTokens > 0) {
      await TokenService.deductTokens(userId, usedTokens);
    }
  } catch (err) {
    // don't block returning the result if token deduction fails; log and continue
    console.error("Token deduction failed:", err);
  }

  const remaining = await TokenService.getBalance(userId).catch((e) => {
    console.warn("Failed to fetch balance:", e);
    return null;
  });

  return {
    output: result.output,
    tokensUsed: usedTokens,
    usage: result.usage,
    remaining,
  };
}
