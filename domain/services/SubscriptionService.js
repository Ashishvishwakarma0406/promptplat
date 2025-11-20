/**
 * domain/services/SubscriptionService.js
 *
 * Orchestration around subscriptions. Works with a subscriptionRepo and tokenService.
 *
 * subscriptionRepo must implement:
 *  - create(subscriptionObj)
 *  - getById(id)
 *  - getByRazorpayId(razorpayId)
 *  - getByUserIdActive(userId)
 *  - update(id, changes)
 */
export default class SubscriptionService {
  constructor({ subscriptionRepo, tokenService, razorpayClient = null } = {}) {
    if (!subscriptionRepo) throw new Error("SubscriptionService requires subscriptionRepo");
    if (!tokenService) throw new Error("SubscriptionService requires tokenService");

    this.subscriptionRepo = subscriptionRepo;
    this.tokenService = tokenService;
    this.razorpayClient = razorpayClient;
  }

  /**
   * createSubscription
   * plan: { planId, planName, tokensPerPeriod, price, currency }
   * returns created subscription record from repo
   */
  async createSubscription(userId, plan = {}, { razorpaySubscriptionId = null, startDate = null, nextBillingAt = null } = {}) {
    if (!userId) throw new Error("createSubscription requires userId");
    if (!plan || !plan.planId) throw new Error("createSubscription requires a plan with planId");

    const toCreate = {
      userId: String(userId),
      planId: String(plan.planId),
      planName: plan.planName ?? plan.name ?? "",
      tokensPerPeriod: Math.max(0, Math.floor(plan.tokensPerPeriod || 0)),
      price: Number(plan.price) || 0,
      currency: plan.currency || "INR",
      status: "active",
      startedAt: startDate ? new Date(startDate) : new Date(),
      nextBillingAt: nextBillingAt ? new Date(nextBillingAt) : null,
      razorpaySubscriptionId: razorpaySubscriptionId ?? null,
      metadata: plan.metadata ?? {},
    };

    const created = await this.subscriptionRepo.create(toCreate);

    // grant first-period tokens if configured
    if ((created.tokensPerPeriod || 0) > 0) {
      await this.tokenService.addTokens(created.userId, created.tokensPerPeriod, "subscription_initial", {
        subscriptionId: created.id ?? created._id ?? null,
        planId: created.planId,
      });
    }

    return created;
  }

  /**
   * processRenewal - called by webhook or scheduled job
   * accepts either subscriptionId or razorpaySubscriptionId
   */
  async processRenewal({ subscriptionId = null, razorpaySubscriptionId = null, nextBillingAt = null, amount = null } = {}) {
    if (!subscriptionId && !razorpaySubscriptionId) throw new Error("processRenewal requires subscriptionId or razorpaySubscriptionId");

    let sub = null;
    if (subscriptionId) {
      sub = await this.subscriptionRepo.getById(subscriptionId);
    } else {
      sub = await this.subscriptionRepo.getByRazorpayId(razorpaySubscriptionId);
    }
    if (!sub) throw new Error("Subscription not found");

    const tokensToAdd = Math.max(0, Math.floor(sub.tokensPerPeriod || 0));
    if (tokensToAdd > 0) {
      await this.tokenService.addTokens(sub.userId, tokensToAdd, "subscription_renewal", {
        subscriptionId: sub.id ?? sub._id ?? null,
        planId: sub.planId,
        amount,
      });
    }

    const updated = {
      ...sub,
      status: "active",
      nextBillingAt: nextBillingAt ? new Date(nextBillingAt) : sub.nextBillingAt,
    };

    await this.subscriptionRepo.update(sub.id ?? sub._id, updated);
    return updated;
  }

  /**
   * cancelSubscription - marks cancelled locally and optionally calls provider
   */
  async cancelSubscription(subscriptionId, { cancelAtPeriodEnd = true } = {}) {
    if (!subscriptionId) throw new Error("cancelSubscription requires subscriptionId");
    const sub = await this.subscriptionRepo.getById(subscriptionId);
    if (!sub) throw new Error("subscription not found");

    if (this.razorpayClient && sub.razorpaySubscriptionId) {
      try {
        await this.razorpayClient.cancelSubscription
          ? await this.razorpayClient.cancelSubscription(sub.razorpaySubscriptionId, { cancelAtPeriodEnd })
          : null;
      } catch (err) {
        console.error("SubscriptionService.cancelSubscription: provider cancel failed", err);
      }
    }

    const updated = { ...sub, status: "cancelled" };
    await this.subscriptionRepo.update(sub.id ?? sub._id, updated);
    return updated;
  }

  async getActiveSubscriptionForUser(userId) {
    if (!userId) throw new Error("getActiveSubscriptionForUser requires userId");
    return await this.subscriptionRepo.getByUserIdActive(String(userId));
  }
}
