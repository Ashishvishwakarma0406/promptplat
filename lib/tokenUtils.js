// lib/tokenUtils.js
export function estimateTokensForText(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  // rough converter: 1 word ~= 1 token for simplicity; change to real tokenizer if needed
  return Math.max(1, Math.ceil(words));
}
