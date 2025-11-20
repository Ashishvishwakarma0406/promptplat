export default function Toolbar({ active, onChange, owner, onOwnerChange, onReload }) {
    return (
      <nav aria-label="Prompt filters" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          {["all", "public", "private"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition
              ${active === k
                ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                : "text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"}`}
              aria-pressed={active === k}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
  
        {active === "private" && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="w-full sm:w-80">
              <label htmlFor="owner" className="block text-sm font-medium text-slate-700 mb-1">
                Owner (User ID)
              </label>
              <input
                id="owner"
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Optional: filter by owner _id"
                value={owner}
                onChange={(e) => onOwnerChange(e.target.value)}
              />
            </div>
            <button type="button" className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={onReload}>
              Apply
            </button>
          </div>
        )}
      </nav>
    );
  }