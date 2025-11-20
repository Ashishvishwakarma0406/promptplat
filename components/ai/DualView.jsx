export default function DualView({ original, cleaned }) {
    return (
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-[#1a1828] p-4 border border-[#2a273b] rounded-lg">
          <h3 className="text-[#8B5CF6] font-semibold mb-2">Original Prompt</h3>
          <p className="whitespace-pre-wrap text-gray-300">{original}</p>
        </div>
        <div className="bg-[#1a1828] p-4 border border-[#2a273b] rounded-lg">
          <h3 className="text-[#8B5CF6] font-semibold mb-2">Cleaned Prompt</h3>
          <p className="whitespace-pre-wrap text-gray-300">{cleaned}</p>
        </div>
      </div>
    );
  }
  