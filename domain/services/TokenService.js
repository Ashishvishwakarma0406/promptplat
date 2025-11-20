/**
 * domain/services/TokenService.js
 *
 * Responsible for token accounting and transaction recording.
 *
 * Expects:
 *  - tokenRepo: { get(userId), createOrUpdate(recordObj) } (createOrUpdate returns saved record)
 *  - transactionService: { record(txDto) }
 *
 * Behavior:
 *  - addTokens: increments balance and records a transaction
 *  - deductTokens: decrements balance and records a transaction (throws if insufficient)
 *  - consumeForOperation: deducts combined input+output
 *  - grantFreeTrialIfEligible: one-time grant
 */
export default class TokenService {
  constructor({ tokenRepo, transactionService } = {}) {
    if (!tokenRepo) throw new Error("TokenService requires tokenRepo");
    if (!transactionService) throw new Error("TokenService requires transactionService");
    this.tokenRepo = tokenRepo;
    this.transactionService = transactionService;
  }

  async getBalance(userId) {
    if (!userId) throw new Error("getBalance requires userId");
    const rec = await this.tokenRepo.get(String(userId));
    return rec ? Number(rec.tokens || 0) : 0;
  }

  async addTokens(userId, amount, reason = "manual", metadata = {}) {
    if (!userId) throw new Error("addTokens requires userId");
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) throw new Error("addTokens amount must be > 0");

    // load or create
    let balance = await this.tokenRepo.get(String(userId));
    if (!balance) {
      balance = {
        userId: String(userId),
        tokens: amount,
        freeTrialUsed: false,
        updatedAt: new Date(),
      };
    } else {
      balance.tokens = (Number(balance.tokens) || 0) + amount;
      balance.updatedAt = new Date();
    }

    const saved = await this.tokenRepo.createOrUpdate(balance);
    await this.transactionService.record({
      userId: String(userId),
      type: "add",
      tokens: amount,
      reason,
      metadata,
    });

    return saved;
  }

  async deductTokens(userId, amount, reason = "usage", metadata = {}) {
    if (!userId) throw new Error("deductTokens requires userId");
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) throw new Error("deductTokens amount must be > 0");

    const balance = await this.tokenRepo.get(String(userId));
    const current = Number(balance?.tokens || 0);
    if (current < amount) throw new Error("insufficient tokens");

    balance.tokens = current - amount;
    balance.updatedAt = new Date();
    const saved = await this.tokenRepo.createOrUpdate(balance);

    await this.transactionService.record({
      userId: String(userId),
      type: "deduct",
      tokens: amount,
      reason,
      metadata,
    });

    return saved;
  }

  async consumeForOperation(userId, inputTokens = 0, outputTokens = 0, reason = "ai_operation", metadata = {}) {
    if (!userId) throw new Error("consumeForOperation requires userId");
    inputTokens = Math.max(0, Math.floor(Number(inputTokens) || 0));
    outputTokens = Math.max(0, Math.floor(Number(outputTokens) || 0));
    const total = inputTokens + outputTokens;
    if (total <= 0) return await this.getBalance(userId);
    return await this.deductTokens(userId, total, reason, { ...metadata, breakdown: { inputTokens, outputTokens } });
  }

  /**
   * grantFreeTrialIfEligible:
   * - if user has no record: create with freeAmount and mark freeTrialUsed
   * - if user exists and freeTrialUsed=false: increment tokens and set freeTrialUsed
   * - otherwise return existing record unchanged
   */
  async grantFreeTrialIfEligible(userId, freeAmount = 1000) {
    if (!userId) throw new Error("grantFreeTrialIfEligible requires userId");
    freeAmount = Math.max(0, Math.floor(Number(freeAmount) || 0));
    if (freeAmount <= 0) throw new Error("freeAmount must be > 0");

    let balance = await this.tokenRepo.get(String(userId));
    if (!balance) {
      const record = {
        userId: String(userId),
        tokens: freeAmount,
        freeTrialUsed: true,
        updatedAt: new Date(),
      };
      const saved = await this.tokenRepo.createOrUpdate(record);
      await this.transactionService.record({
        userId: String(userId),
        type: "trial",
        tokens: freeAmount,
        reason: "free_trial",
        metadata: {},
      });
      return saved;
    }

    if (balance.freeTrialUsed) {
      return balance;
    }

    balance.tokens = (Number(balance.tokens) || 0) + freeAmount;
    balance.freeTrialUsed = true;
    balance.updatedAt = new Date();
    const saved = await this.tokenRepo.createOrUpdate(balance);
    await this.transactionService.record({
      userId: String(userId),
      type: "trial",
      tokens: freeAmount,
      reason: "free_trial",
      metadata: {},
    });
    return saved;
  }
}
