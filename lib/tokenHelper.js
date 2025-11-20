export function estimateTokens(input, output) {
    const inputTokens = Math.ceil((input?.length || 0) / 4);
    const outputTokens = Math.ceil((output?.length || 0) / 4);
    return { input: inputTokens, output: outputTokens };
  }
  