// infrastructure/persistence/subscriptionRepo.js
import SubscriptionModel from "@/models/subscription";

/**
 * subscriptionRepo - adapter for subscription persistence using Mongoose
 *
 * All methods return plain JS objects (lean() or toObject()) or null.
 */
export const subscriptionRepo = {
  async create(sub) {
    if (!sub || !sub.userId || !sub.planId) throw new Error("subscriptionRepo.create: userId and planId required");
    const doc = new SubscriptionModel({
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName || "",
      tokensPerPeriod: sub.tokensPerPeriod || 0,
      price: sub.price || 0,
      currency: sub.currency || "INR",
      status: sub.status || "active",
      startedAt: sub.startedAt || new Date(),
      nextBillingAt: sub.nextBillingAt || null,
      razorpaySubscriptionId: sub.razorpaySubscriptionId || null,
      metadata: sub.metadata || {},
      updatedAt: new Date(),
    });
    const saved = await doc.save();
    return saved.toObject();
  },

  async getById(id) {
    if (!id) return null;
    const rec = await SubscriptionModel.findById(String(id)).lean();
    return rec || null;
  },

  async getByUserIdActive(userId) {
    if (!userId) return null;
    const rec = await SubscriptionModel.findOne({
      userId: String(userId),
      status: { $in: ["active", "trialing"] },
    })
      .sort({ startedAt: -1 })
      .lean();
    return rec || null;
  },

  async getByRazorpayId(razorpaySubscriptionId) {
    if (!razorpaySubscriptionId) return null;
    const rec = await SubscriptionModel.findOne({ razorpaySubscriptionId: String(razorpaySubscriptionId) }).lean();
    return rec || null;
  },

  async update(id, data = {}) {
    if (!id) throw new Error("subscriptionRepo.update: id required");
    const upd = { ...data, updatedAt: new Date() };
    const rec = await SubscriptionModel.findByIdAndUpdate(String(id), { $set: upd }, { new: true }).lean();
    return rec || null;
  },

  async updateStatus(razorpaySubscriptionId, status) {
    if (!razorpaySubscriptionId) throw new Error("subscriptionRepo.updateStatus: razorpaySubscriptionId required");
    const rec = await SubscriptionModel.findOneAndUpdate(
      { razorpaySubscriptionId: String(razorpaySubscriptionId) },
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return rec || null;
  },

  async listExpiringSoon(days = 3) {
    const cutoff = new Date(Date.now() + Math.max(0, Number(days) || 3) * 24 * 60 * 60 * 1000);
    const recs = await SubscriptionModel.find({
      nextBillingAt: { $lte: cutoff },
      status: "active",
    })
      .lean()
      .exec();
    return recs || [];
  },
};

export default subscriptionRepo;
