/**
 * domain/services/TransactionService.js
 *
 * Responsible for persisting transaction records via transactionRepo.
 *
 * transactionRepo must support:
 *  - create(txObj) => savedTx
 *  - findByUser(userId, { limit, skip }) => [tx]
 */
export default class TransactionService {
  constructor({ transactionRepo } = {}) {
    if (!transactionRepo) throw new Error("TransactionService requires transactionRepo");
    this.transactionRepo = transactionRepo;
  }

  /**
   * record
   * @param {object} param0
   * @returns saved transaction
   */
  async record({ userId, type, tokens, reason = "", metadata = {} } = {}) {
    if (!userId) throw new Error("transaction requires userId");
    if (!type) throw new Error("transaction requires type");
    if (!Number.isFinite(tokens)) throw new Error("transaction requires numeric tokens");

    const tx = {
      userId: String(userId),
      type: String(type),
      tokens: Math.max(0, Math.floor(Number(tokens))),
      reason: String(reason || ""),
      metadata: metadata || {},
      createdAt: new Date(),
    };

    return await this.transactionRepo.create(tx);
  }

  async getRecentForUser(userId, { limit = 20, skip = 0 } = {}) {
    if (!userId) throw new Error("getRecentForUser requires userId");
    const clamped = { limit: Math.min(100, Math.max(1, Number(limit) || 20)), skip: Math.max(0, Number(skip) || 0) };
    return await this.transactionRepo.findByUser(String(userId), clamped);
  }
}
