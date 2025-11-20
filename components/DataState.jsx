export default function DataState({ loading, error, items, emptyLabel = "No items found." }) {
    if (loading) {
      return (
        <div className="flex items-center gap-3 text-blue-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
          <span className="text-sm">Loading…</span>
        </div>
      );
    }
    if (error) {
      return (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      );
    }
    if (!items?.length) {
      return (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          {emptyLabel}
        </p>
      );
    }
    return null;
  }