// application/adapters/RazorpayClient.js
import Razorpay from "razorpay";
import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

if (!KEY_ID || !KEY_SECRET) {
  // Log clearly but do not crash so dev server can run without keys.
  console.warn(
    "[RazorpayClient] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. Payment features will not work without these env vars."
  );
}

const _client = (KEY_ID && KEY_SECRET) ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET }) : null;

/**
 * RazorpayClient - wrapper around razorpay SDK that centralizes calls and verification.
 *
 * NOTE: This file executes server-side only. Do NOT expose KEY_SECRET to the browser.
 */
export default class RazorpayClient {
  constructor({ client = _client, webhookSecret = WEBHOOK_SECRET } = {}) {
    this.client = client;
    this.webhookSecret = webhookSecret;
  }

  _ensureClient() {
    if (!this.client) throw new Error("Razorpay client not configured (missing keys).");
  }

  // createOrder: one-time purchase (amount in paise)
  async createOrder({ amount, currency = "INR", receipt = undefined, notes = {} } = {}) {
    if (!amount || typeof amount !== "number" || amount <= 0) {
      throw new Error("createOrder requires a positive numeric amount (in paise).");
    }
    this._ensureClient();
    const payload = { amount, currency, receipt, payment_capture: 1, notes };
    return await this.client.orders.create(payload);
  }

  async createCustomer(data = {}) {
    this._ensureClient();
    return await this.client.customers.create(data);
  }

  async createPlan(data = {}) {
    this._ensureClient();
    return await this.client.plans.create(data);
  }

  async createSubscription({ plan_id, customer_id, total_count = 12, customer_notify = 1, start_at } = {}) {
    if (!plan_id) throw new Error("createSubscription requires plan_id.");
    this._ensureClient();

    const payload = { plan_id, total_count, customer_notify };
    if (customer_id) payload.customer_id = customer_id;
    if (start_at) payload.start_at = start_at;

    return await this.client.subscriptions.create(payload);
  }

  async fetchOrder(orderId) {
    if (!orderId) throw new Error("orderId required");
    this._ensureClient();
    return await this.client.orders.fetch(orderId);
  }

  async fetchPayment(paymentId) {
    if (!paymentId) throw new Error("paymentId required");
    this._ensureClient();
    return await this.client.payments.fetch(paymentId);
  }

  async fetchSubscription(subscriptionId) {
    if (!subscriptionId) throw new Error("subscriptionId required");
    this._ensureClient();
    return await this.client.subscriptions.fetch(subscriptionId);
  }

  async refundPayment(paymentId, { amount, notes } = {}) {
    if (!paymentId) throw new Error("paymentId required");
    this._ensureClient();

    const payload = {};
    if (typeof amount === "number") payload.amount = amount;
    if (notes) payload.notes = notes;
    return await this.client.payments.refund(paymentId, payload);
  }

  /**
   * verifyWebhookSignature
   * @param {string|Buffer} payloadRaw - raw request body as string or Buffer
   * @param {string} signature - value of 'x-razorpay-signature' header
   * @returns {boolean}
   */
  verifyWebhookSignature(payloadRaw, signature) {
    if (!this.webhookSecret) {
      console.warn("[RazorpayClient] webhook secret not configured; skipping verification (unsafe).");
      return false;
    }
    // ensure we use string
    const body = typeof payloadRaw === "string" ? payloadRaw : payloadRaw.toString("utf8");
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(body).digest("hex");
    return expected === signature;
  }

  /**
   * verifyPaymentSignature
   * Verifies checkout payment signature (order_id|payment_id) using key secret.
   * Note: requires server-side KEY_SECRET.
   */
  verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!KEY_SECRET) {
      console.warn("[RazorpayClient] KEY_SECRET not present - cannot verify payment signature securely.");
      return false;
    }
    const hmac = crypto.createHmac("sha256", KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const computed = hmac.digest("hex");
    return computed === razorpay_signature;
  }

  /**
   * buildCheckoutOptions - return options that can be sent to the frontend
   * (do NOT include KEY_SECRET).
   */
  buildCheckoutOptions({ amount, currency = "INR", orderId, subscriptionId, name, description, image, prefill = {}, notes = {} } = {}) {
    if (!KEY_ID) {
      console.warn("[RazorpayClient] KEY_ID not configured; frontend checkout will fail.");
    }
    const opts = {
      key: KEY_ID,
      amount,
      currency,
      name,
      description,
      image,
      prefill,
      notes,
    };
    if (orderId) opts.order_id = orderId;
    if (subscriptionId) opts.subscription_id = subscriptionId;
    return opts;
  }
}
