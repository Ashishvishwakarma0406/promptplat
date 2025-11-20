// infrastructure/persistence/transactionRepo.js
import TransactionModel from "@/models/transaction";

/**
 * transactionRepo - adapter for token transaction persistence
 */
export const transactionRepo = {
  async create(tx) {
    if (!tx || !tx.userId || !tx.type || !Number.isFinite(tx.tokens)) {
      throw new Error("transactionRepo.create: userId, type and numeric tokens are required");
    }
    const doc = new TransactionModel({
      userId: String(tx.userId),
      type: String(tx.type),
      tokens: Math.floor(Number(tx.tokens)),
      reason: tx.reason || "",
      metadata: tx.metadata || {},
      createdAt: tx.createdAt || new Date(),
    });
    const saved = await doc.save();
    return saved.toObject();
  },

  async findByUser(userId, { limit = 20, skip = 0 } = {}) {
    if (!userId) throw new Error("transactionRepo.findByUser: userId required");
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const s = Math.max(0, Number(skip) || 0);
    const recs = await TransactionModel.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .skip(s)
      .limit(l)
      .lean();
    return recs || [];
  },
};

export default transactionRepo;
