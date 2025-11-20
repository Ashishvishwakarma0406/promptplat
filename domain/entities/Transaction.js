/**
 * domain/entities/Transaction.js
 *
 * Transaction entity (immutable-like).
 *
 * Fields:
 *  - id (string|null)
 *  - userId (string)
 *  - type (string) : 'add'|'deduct'|'subscription'|'refund'|'trial' etc.
 *  - tokens (number) positive integer
 *  - reason (string)
 *  - metadata (object)
 *  - createdAt (Date)
 */
export default class Transaction {
  constructor({
    id = null,
    userId,
    type,
    tokens,
    reason = "",
    metadata = {},
    createdAt = null,
  } = {}) {
    if (!userId) throw new Error("Transaction requires userId");
    if (!type) throw new Error("Transaction requires type");
    if (!Number.isFinite(tokens)) throw new Error("Transaction requires numeric tokens");

    this.id = id ?? null;
    this.userId = String(userId);
    this.type = String(type);
    this.tokens = Math.max(0, Math.floor(tokens));
    this.reason = String(reason || "");
    this.metadata = metadata && typeof metadata === "object" ? metadata : {};
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }

  isCredit() {
    return ["add", "subscription", "trial"].includes(this.type);
  }

  isDebit() {
    return this.type === "deduct" || this.type === "usage";
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      tokens: this.tokens,
      reason: this.reason,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
    };
  }

  static fromRecord(record = {}) {
    if (!record) throw new Error("Transaction.fromRecord: record required");
    return new Transaction({
      id: record.id ?? record._id ?? null,
      userId: record.userId ?? record.user ?? record.owner,
      type: record.type,
      tokens: record.tokens ?? 0,
      reason: record.reason ?? "",
      metadata: record.metadata ?? {},
      createdAt: record.createdAt ?? record.createdAt ?? new Date(),
    });
  }
}
