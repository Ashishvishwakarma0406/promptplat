export async function getAllPrompts() {
    const r = await fetch("/api/myprompt", { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to fetch all prompts");
    return r.json();
  }
  
  export async function getPublicPrompts() {
    const r = await fetch("/api/myprompt/publicprompt", { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to fetch public prompts");
    return r.json();
  }
  
  export async function getPrivatePrompts(owner) {
    const url = owner
      ? `/api/myprompt/privateprompt?owner=${encodeURIComponent(owner)}`
      : `/api/myprompt/privateprompt`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to fetch private prompts");
    return r.json();
  }

export async function updatePrompt(id, patch) {
  const res = await fetch(`/api/prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deletePrompt(id, { hard = true } = {}) {
  const url = hard ? `/api/prompts/${id}?hard=1` : `/api/prompts/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Delete failed");
  }
  return true;
}