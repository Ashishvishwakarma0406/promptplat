/**
 * domain/entities/Subscription.js
 *
 * Subscription entity value-object.
 *
 * Fields:
 *  - id (string | null)
 *  - userId (string)
 *  - planId (string)
 *  - planName (string)
 *  - tokensPerPeriod (number)
 *  - price (number)
 *  - currency (string)
 *  - status (string) // 'active'|'past_due'|'cancelled'|'trialing'
 *  - startedAt (Date)
 *  - nextBillingAt (Date|null)
 *  - razorpaySubscriptionId (string|null)
 *  - metadata (object)
 */
function normalizeId(v) {
  if (!v && v !== 0) return null;
  return String(v);
}

export default class Subscription {
  constructor({
    id = null,
    userId,
    planId,
    planName = "",
    tokensPerPeriod = 0,
    price = 0,
    currency = "INR",
    status = "trialing",
    startedAt = null,
    nextBillingAt = null,
    razorpaySubscriptionId = null,
    metadata = {},
  } = {}) {
    if (!userId) throw new Error("Subscription: missing userId");
    if (!planId) throw new Error("Subscription: missing planId");

    this.id = normalizeId(id);
    this.userId = String(userId);
    this.planId = String(planId);
    this.planName = String(planName || "");
    this.tokensPerPeriod = Number.isFinite(tokensPerPeriod) ? Math.max(0, Math.floor(tokensPerPeriod)) : 0;
    this.price = Number.isFinite(price) ? Number(price) : Number(price) || 0;
    this.currency = String(currency || "INR");
    this.status = String(status || "trialing");
    this.startedAt = startedAt ? new Date(startedAt) : new Date();
    this.nextBillingAt = nextBillingAt ? new Date(nextBillingAt) : null;
    this.razorpaySubscriptionId = razorpaySubscriptionId ? String(razorpaySubscriptionId) : null;
    this.metadata = metadata && typeof metadata === "object" ? metadata : {};
  }

  isActive() {
    return this.status === "active" || this.status === "trialing";
  }

  isCancelled() {
    return this.status === "cancelled";
  }

  markActive() {
    return new Subscription({ ...this.toJSON(), status: "active", startedAt: this.startedAt || new Date() });
  }

  markCancelled() {
    return new Subscription({ ...this.toJSON(), status: "cancelled" });
  }

  withNextBilling(date) {
    return new Subscription({ ...this.toJSON(), nextBillingAt: date ? new Date(date) : null });
  }

  /**
   * toJSON - safe plain object for transport/storage
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      planId: this.planId,
      planName: this.planName,
      tokensPerPeriod: this.tokensPerPeriod,
      price: this.price,
      currency: this.currency,
      status: this.status,
      startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      nextBillingAt: this.nextBillingAt ? this.nextBillingAt.toISOString() : null,
      razorpaySubscriptionId: this.razorpaySubscriptionId,
      metadata: this.metadata,
    };
  }

  /**
   * fromRecord: create a Subscription from a DB record (supports _id)
   */
  static fromRecord(record = {}) {
    if (!record) throw new Error("Subscription.fromRecord: record required");
    return new Subscription({
      id: record.id ?? record._id ?? null,
      userId: record.userId ?? record.user ?? record.owner,
      planId: record.planId ?? record.planId,
      planName: record.planName ?? record.planName,
      tokensPerPeriod: record.tokensPerPeriod ?? record.tokens ?? 0,
      price: record.price ?? 0,
      currency: record.currency ?? "INR",
      status: record.status ?? "trialing",
      startedAt: record.startedAt ?? record.createdAt ?? null,
      nextBillingAt: record.nextBillingAt ?? record.nextBillingAt ?? null,
      razorpaySubscriptionId: record.razorpaySubscriptionId ?? record.razorpayId ?? null,
      metadata: record.metadata ?? {},
    });
  }
}
