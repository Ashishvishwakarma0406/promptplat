// infrastructure/persistence/tokenRepo.js
import TokenBalanceModel from "@/models/tokenBalance";

/**
 * tokenRepo - adapter for token balance persistence
 * Methods return plain objects (lean / toObject) or null.
 */
export const tokenRepo = {
  async get(userId) {
    if (!userId) throw new Error("tokenRepo.get: userId required");
    const rec = await TokenBalanceModel.findOne({ userId: String(userId) }).lean();
    return rec || null;
  },

  /**
   * createOrUpdate - upsert token balance record
   * Accepts either partial balance object or full record.
   * Always returns the saved plain object.
   */
  async createOrUpdate(data) {
    if (!data || !data.userId) throw new Error("tokenRepo.createOrUpdate: userId required");
    const filter = { userId: String(data.userId) };
    const set = {
      tokens: Number.isFinite(data.tokens) ? Math.max(0, Math.floor(Number(data.tokens))) : 0,
      freeTrialUsed: !!data.freeTrialUsed,
      updatedAt: new Date(),
      metadata: data.metadata || {},
    };
    const updated = await TokenBalanceModel.findOneAndUpdate(filter, { $set: set }, { upsert: true, new: true }).lean();
    return updated || null;
  },
};

export default tokenRepo;
