import categories from "@/data/categories.json";

export async function GET() {
  return new Response(JSON.stringify({ categories }), { status: 200 });
}