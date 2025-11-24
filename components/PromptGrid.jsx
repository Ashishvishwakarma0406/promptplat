// components/PromptGrid.jsx
import PromptCard from "./PromptCard";

export default function PromptGrid({ items, onEdit, onDelete }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => (
        <PromptCard
          key={p.id}
          id={p.id}
          title={p.title}
          category={p.category}
          visibility={p.visibility}
          promptSnippet={p.promptContent?.slice(0, 100)}
          imageUrl={p.media?.[0] || null}
          authorName={p.owner?.name || p.owner?.username}
          likes={p.likesCount}
          showLikeCount={false}
          onUpdate={onEdit ? () => onEdit(p) : undefined}
          onDelete={onDelete ? () => onDelete(p.id) : undefined}
        />
      ))}
    </section>
  );
}
