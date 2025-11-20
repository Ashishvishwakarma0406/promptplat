// app/api/prompts/publicprompt/route.js
import dbConnect from "@/lib/dbconnect";
import Prompt from "@/models/prompt";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const { sanitizeSearchQuery, sanitizeString } = await import("@/lib/validation");
    
    const rawQ = searchParams.get("q")?.trim() || "";
    const q = sanitizeSearchQuery(rawQ); // Prevent regex injection
    const category = sanitizeString(searchParams.get("category")?.trim() || "", 50);
    const sort = (searchParams.get("sort") || "recent").toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = Math.max(parseInt(searchParams.get("cursor") || "0", 10), 0);
    const sample = searchParams.get("sample"); // "1" for first paint

    const where = { visibility: "public" };
    if (q) where.title = { $regex: q, $options: "i" };
    if (category) where.category = category;

    // FIRST-LOAD SAMPLE: only when no q & no category & cursor===0
    if ((sample === "1" || sample === "true") && !q && !category && cursor === 0) {
      // Use aggregation sample for quick diverse results
      const pipeline = [
        { $match: { visibility: "public" } },
        { $sample: { size: limit } },
      ];

      const raw = await Prompt.aggregate(pipeline);
      // Populate owner after aggregate
      const items = await Prompt.populate(raw, { path: "owner" });

      const total = await Prompt.countDocuments({ visibility: "public" });
      return Response.json({
        prompts: items,
        total,
        nextCursor: limit, // next page starts after sample
        hasMore: limit < total,
      });
    }

    // NORMAL PAGING
    const sortSpec =
      sort === "likes" ? { likes: -1, createdAt: -1 } : { createdAt: -1, _id: -1 };

    const [items, total] = await Promise.all([
      Prompt.find(where)
        .sort(sortSpec)
        .skip(cursor)
        .limit(limit)
        .populate("owner")
        .lean(),
      Prompt.countDocuments(where),
    ]);

    return Response.json({
      prompts: items,
      total,
      nextCursor: cursor + items.length,
      hasMore: cursor + items.length < total,
    });
  } catch (e) {
    console.error("GET /api/prompts/publicprompt error:", e);
    return Response.json({ error: "Failed to fetch public prompts" }, { status: 500 });
  }
}