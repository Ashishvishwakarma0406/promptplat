import PromptCard from "./PromptCard";

export default function PromptGrid({ items, onEdit, onDelete }) {
  return (
    <section aria-label="Prompts" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => (
        <PromptCard key={p._id} prompt={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </section>
  );
}