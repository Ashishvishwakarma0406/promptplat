export default function TokenUsage({ usage }) {
    const total = usage.input + usage.output;
    return (
      <div className="mt-4 bg-[#1a1828] border border-[#2a273b] rounded-lg p-3">
        <h3 className="text-lg font-semibold text-[#8B5CF6] mb-2">Token Usage</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p>Input Tokens: {usage.input}</p>
          <p>Output Tokens: {usage.output}</p>
          <p className="text-gray-100 font-semibold">Total: {total}</p>
        </div>
      </div>
    );
  }
  