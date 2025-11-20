// application/usecases/ManageSubscription.js
import RazorpayClient from "@/application/adapters/RazorpayClient";
import { SubscriptionService } from "@/domain/services/SubscriptionService";
import { TokenService } from "@/domain/services/TokenService";
import { TransactionService } from "@/domain/services/TransactionService";

/**
 * ManageSubscription
 * Orchestrates creating subscription, verifying, handling webhooks and cancellations.
 */
export const ManageSubscription = {
  async createSubscription({ userId, planKey }) {
    if (!userId) throw new Error("userId required");
    if (!planKey) throw new Error("planKey required");

    const rpc = new RazorpayClient();

    // Map planKeys used in frontend to real razor plan ids & metadata
    const planMap = {
      basic199: { razorId: process.env.RAZORPAY_PLAN_199, price: 199, tokens: 600000, label: "Basic" },
      pro299: { razorId: process.env.RAZORPAY_PLAN_299, price: 299, tokens: 1000000, label: "Pro" },
    };

    const plan = planMap[planKey];
    if (!plan || !plan.razorId) {
      throw new Error("Invalid plan selected.");
    }

    const subscription = await rpc.createSubscription({
      plan_id: plan.razorId,
      total_count: 12,
      customer_notify: 1,
    });

    // persist pending subscription
    await SubscriptionService.createOrUpdate({
      userId,
      razorpayId: subscription.id,
      planKey,
      planLabel: plan.label,
      price: plan.price,
      tokensPerPeriod: plan.tokens,
      status: subscription.status || "created",
      raw: subscription,
      startedAt: new Date(),
      nextBillingAt: subscription.current_start ? new Date(subscription.current_start * 1000) : null,
    });

    return { subscription, plan };
  },

  async verifySubscription({ userId, razorpaySubscriptionId, payloadRaw, headerSig }) {
    if (!userId || !razorpaySubscriptionId || !payloadRaw || !headerSig) {
      throw new Error("Missing parameters for verification.");
    }

    const rpc = new RazorpayClient();
    const verified = rpc.verifyWebhookSignature(payloadRaw, headerSig);
    if (!verified) throw new Error("Invalid signature");

    const sub = await rpc.fetchSubscription(razorpaySubscriptionId);
    if (!sub) throw new Error("Subscription not found at provider.");

    // activate locally if provider reports active
    if (sub.status === "active") {
      // update local record
      await SubscriptionService.updateStatus(razorpaySubscriptionId, "active");

      // credit tokens according to mapped plan
      // plan mapping fallback: check sub.plan_id string
      const planTokens = sub.plan_id && sub.plan_id.includes("199") ? 600000 : 1000000;
      try {
        await TokenService.addTokens(userId, planTokens);
        await TransactionService.record({
          userId,
          type: "add",
          tokens: planTokens,
          reason: `Subscription activated (${sub.plan_id})`,
        });
      } catch (e) {
        console.error("Failed to credit tokens after activation:", e);
      }

      return { success: true, activated: true, tokensAdded: planTokens };
    }

    return { success: false, status: sub.status };
  },

  async handleWebhook(payload, signature) {
    const rpc = new RazorpayClient();

    if (!rpc.verifyWebhookSignature(payload, signature)) {
      throw new Error("Invalid webhook signature.");
    }

    const event = JSON.parse(payload);
    const eventName = event?.event;

    // subscription charged => credit user tokens and update next billing
    if (eventName === "subscription.charged" || eventName === "invoice.paid") {
      const subEntity = event?.payload?.subscription?.entity || event?.payload?.invoice?.entity;
      const subId = subEntity?.id;
      if (!subId) return { ok: false };

      const local = await SubscriptionService.findByRazorpayId(subId);
      if (!local) {
        console.warn("Webhook: subscription not found locally", subId);
        return { ok: false };
      }

      const tokensToCredit = local.tokensPerPeriod || (local.planKey?.includes("199") ? 600000 : 1000000);
      await TokenService.addTokens(local.userId, tokensToCredit);
      await TransactionService.record({
        userId: local.userId,
        type: "add",
        tokens: tokensToCredit,
        reason: "Subscription renewal",
      });

      // update next billing if provider provided it
      const nextEnd = subEntity?.current_end || subEntity?.current_end;
      if (nextEnd) {
        await SubscriptionService.updateNextBilling(subId, new Date(nextEnd * 1000));
      }

      return { ok: true };
    }

    if (eventName === "subscription.cancelled") {
      const subId = event?.payload?.subscription?.entity?.id;
      if (subId) await SubscriptionService.updateStatus(subId, "cancelled");
      return { ok: true };
    }

    // default: unhandled
    return { ok: true, unhandled: true, event: eventName };
  },

  async cancelSubscription({ userId, razorpaySubscriptionId }) {
    if (!userId || !razorpaySubscriptionId) throw new Error("Missing params");

    const rpc = new RazorpayClient();
    rpc._ensureClient(); // will throw if not configured

    await rpc.client.subscriptions.cancel(razorpaySubscriptionId, true);
    await SubscriptionService.updateStatus(razorpaySubscriptionId, "cancelled");
    await TransactionService.record({
      userId,
      type: "info",
      tokens: 0,
      reason: "Subscription cancelled by user",
    });

    return { success: true };
  },
};
