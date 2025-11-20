export default function LivePreview({ text }) {
  return (
    <div className="mt-6 bg-[#1a1828] border border-[#2a273b] p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-[#8B5CF6] mb-2">AI Output</h2>
      <p className="whitespace-pre-wrap text-gray-200">{text || "Waiting for output..."}</p>
    </div>
  );
}
