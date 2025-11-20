// lib/openaiClient.js
import fetch from "node-fetch"; // not required in Next 13+ node environment, but safe
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

if (!OPENAI_KEY) {
  console.warn("OPENAI_API_KEY not set in environment");
}

export async function callOpenAI({ prompt, maxTokens = 1024, temperature = 0.7 }) {
  if (!OPENAI_KEY) {
    throw new Error("OpenAI API key not configured.");
  }

  const body = {
    model: OPENAI_MODEL,
    input: prompt,
    // model-specific params go here depending on provider; adjust as your infra expects
    temperature,
    // If your provider requires a different shape, adapt accordingly
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  // adapt extraction per actual API response shape:
  // e.g., data.output_text or data.output[0].content[0].text
  // Here we try a common shape:
  const output = (data?.output?.[0]?.content?.map(c => c?.text || c?.content).join("") || data?.output_text || JSON.stringify(data));
  // token usage maybe in data.usage or similar; extract defensively
  const usage = data?.usage ?? null;

  return { data, output, usage };
}
