/**
 * domain/entities/TokenBalance.js
 *
 * TokenBalance entity representing user's token state.
 *
 * Fields:
 *  - userId (string)
 *  - tokens (number)
 *  - freeTrialUsed (boolean)
 *  - updatedAt (Date)
 */
function _ensureUserId(userId) {
  if (!userId) throw new Error("TokenBalance requires userId");
  return String(userId);
}

export default class TokenBalance {
  constructor({ userId, tokens = 0, freeTrialUsed = false, updatedAt = null } = {}) {
    this.userId = _ensureUserId(userId);
    this.tokens = Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0;
    this.freeTrialUsed = Boolean(freeTrialUsed);
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
  }

  /**
   * returns a new TokenBalance with added tokens
   * @param {number} amount positive integer
   */
  add(amount) {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("TokenBalance.add: amount must be positive");
    return new TokenBalance({
      userId: this.userId,
      tokens: this.tokens + Math.floor(amount),
      freeTrialUsed: this.freeTrialUsed,
      updatedAt: new Date(),
    });
  }

  /**
   * returns a new TokenBalance after deducting tokens
   * throws if insufficient tokens
   * @param {number} amount
   */
  deduct(amount) {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("TokenBalance.deduct: amount must be positive");
    const amt = Math.floor(amount);
    if (this.tokens < amt) throw new Error("TokenBalance.deduct: insufficient tokens");
    return new TokenBalance({
      userId: this.userId,
      tokens: this.tokens - amt,
      freeTrialUsed: this.freeTrialUsed,
      updatedAt: new Date(),
    });
  }

  markTrialUsed() {
    return new TokenBalance({
      userId: this.userId,
      tokens: this.tokens,
      freeTrialUsed: true,
      updatedAt: new Date(),
    });
  }

  toJSON() {
    return {
      userId: this.userId,
      tokens: this.tokens,
      freeTrialUsed: this.freeTrialUsed,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromRecord(record = {}) {
    if (!record) throw new Error("TokenBalance.fromRecord: record required");
    return new TokenBalance({
      userId: record.userId ?? record.user ?? record.owner,
      tokens: record.tokens ?? 0,
      freeTrialUsed: !!record.freeTrialUsed,
      updatedAt: record.updatedAt ?? record.updatedAt ?? new Date(),
    });
  }
}
