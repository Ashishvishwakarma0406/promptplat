// infrastructure/openai/gptClient.js
// Updated to use Google Gemini 2.5 Flash
import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY not set — gptClient will fail if called in server runtime.");
}

const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;
// Using Gemini 2.0 Flash Experimental (latest) - can be changed to "gemini-1.5-flash" for stable version
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

/**
 * gptClient - low-level Gemini 2.5 Flash caller
 * @param {Object} options
 * @param {string} options.prompt - user or AI-generated text
 * @param {"humanize"|"rephrase"} [options.mode="humanize"] - behavior control
 * @returns {Promise<{ output: string, usage: { inputTokens: number, outputTokens: number, totalTokens: number } }>}
 */
export async function gptClient({ prompt, mode = "humanize" } = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("gptClient: prompt text is required and must be a string");
  }

  if (!genAI) {
    throw new Error("gptClient: Google API key not configured");
  }

  const systemPrompt =
    mode === "rephrase"
      ? `You are a Prompt Refiner. Rephrase the given prompt to be clear, concise, and optimized for AI responses while preserving intent.`
      : `You are an AI Humanizer. Rewrite the given text so it sounds natural, human, expressive, and idiomatic while preserving meaning.`;

  // Combine system prompt and user prompt for Gemini
  const fullPrompt = `${systemPrompt}\n\nUser text:\n${prompt}`;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 512,
      },
    });

    const response = await result.response;
    
    // Get text from response - handle potential errors
    let output = "";
    try {
      output = response.text().trim();
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
    
    // Extract usage information from Gemini response
    const usageMetadata = response.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || 0;
    const outputTokens = usageMetadata.candidatesTokenCount || usageMetadata.completionTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

    return {
      output,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    };
  } catch (err) {
    // surface helpful message but keep original logged for debugging
    console.error("gptClient error:", err?.message ?? err);
    throw new Error("gptClient: failed to call Google Gemini API");
  }
}

export default gptClient;
