// application/adapters/openaiAdapter.js
// Updated to use Google Gemini 2.5 Flash
import { GoogleGenerativeAI } from "@google/generative-ai";
import { estimateTokens } from "@/lib/tokenHelper";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY not set — GPTClient will fail if called in server runtime.");
}

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

/**
 * GPTClient
 * Thin wrapper around the Google Gemini API.
 * Provides two helpers used in the app: rewriteText and rephrasePrompt.
 *
 * Both methods return: { output: string, usage: { input: number, output: number, total?: number } }
 * They throw on unrecoverable errors.
 */
export class GPTClient {
  constructor({ model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp" } = {}) {
    this.model = model;
  }

  async _callChat(messages = []) {
    if (!genAI) {
      throw new Error("Google Gemini client is not configured.");
    }

    try {
      const model = genAI.getGenerativeModel({ model: this.model });

      // Convert messages format for Gemini
      // Gemini uses a different format - combine system and user messages
      let fullPrompt = "";
      for (const msg of messages) {
        if (msg.role === "system") {
          fullPrompt += `${msg.content}\n\n`;
        } else if (msg.role === "user") {
          fullPrompt += `${msg.content}\n`;
        }
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt.trim() }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        },
      });

      const response = await result.response;
      
      // Get text from response - handle potential errors
      let output = "";
      try {
        output = response.text() ?? "";
      } catch (textError) {
        // If text() fails, try alternative methods
        const candidates = response.candidates || [];
        if (candidates.length > 0 && candidates[0].content) {
          const parts = candidates[0].content.parts || [];
          output = parts.map(part => part.text || "").join("").trim();
        }
        if (!output) {
          throw new Error("Failed to extract text from Gemini response");
        }
      }
      
      // Extract usage information
      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || usageMetadata.completionTokenCount || 0;
      const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

      // Normalize usage shape to match expected format
      const normalizedUsage = {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens || (inputTokens + outputTokens),
      };

      // Fallback to estimation if usage not available
      if (normalizedUsage.input === 0 && normalizedUsage.output === 0) {
        const estimated = estimateTokens(messages.map(m => m.content).join("\n"), output);
        normalizedUsage.input = estimated.input || 0;
        normalizedUsage.output = estimated.output || 0;
        normalizedUsage.total = normalizedUsage.input + normalizedUsage.output;
      }

      return { output: String(output), usage: normalizedUsage };
    } catch (err) {
      // bubble a helpful error while preserving original
      const e = new Error("Gemini request failed: " + (err?.message ?? String(err)));
      e.original = err;
      throw e;
    }
  }

  /**
   * Rewrite text to sound natural and human.
   * @param {string} text
   * @returns {Promise<{output:string, usage:object}>}
   */
  async rewriteText(text) {
    if (!text || typeof text !== "string") {
      throw new Error("rewriteText requires a non-empty string.");
    }

    const messages = [
      {
        role: "system",
        content:
          "Rewrite the given text to sound natural, human, expressive, and idiomatic while preserving meaning. Keep formatting, do not invent facts, and keep any code blocks or examples intact.",
      },
      { role: "user", content: text },
    ];

    return await this._callChat(messages);
  }

  /**
   * Rephrase and optimize a prompt for clarity and quality.
   * @param {string} prompt
   * @returns {Promise<{output:string, usage:object}>}
   */
  async rephrasePrompt(prompt) {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("rephrasePrompt requires a non-empty string.");
    }

    const messages = [
      {
        role: "system",
        content:
          "You are an expert prompt engineer. Rewrite the prompt to be clearer, concise, and optimized for AI response quality. Keep intent unchanged, keep required constraints, and add short suggestions (1-2 lines) after the rewritten prompt if useful.",
      },
      { role: "user", content: prompt },
    ];

    return await this._callChat(messages);
  }
}

export default GPTClient;
