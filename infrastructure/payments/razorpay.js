// infrastructure/payments/razorpay.js
import Razorpay from "razorpay";
import crypto from "crypto";

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET = "",
} = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️ Razorpay keys missing (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET). Payment operations will fail."
  );
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay subscription
 */
export async function createSubscription({
  plan_id,
  customer_notify = 1,
  total_count = 12,
  customer_id,
  start_at,
} = {}) {
  if (!plan_id) throw new Error("createSubscription: plan_id required");
  const payload = {
    plan_id,
    customer_notify,
    total_count,
    ...(customer_id && { customer_id }),
    ...(start_at && { start_at }),
  };
  return razorpay.subscriptions.create(payload);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
  if (!subscriptionId) throw new Error("cancelSubscription: subscriptionId required");
  return razorpay.subscriptions.cancel(subscriptionId, {
    cancel_at_cycle_end: cancelAtCycleEnd,
  });
}

/**
 * Create a one-time order
 */
export async function createOrder({ amount, currency = "INR", receipt, notes = {} } = {}) {
  if (!amount || amount <= 0) throw new Error("createOrder: amount (in paise) required");
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1,
    notes,
  });
}

/**
 * Fetch helpers
 */
export const fetchOrder = (orderId) => {
  if (!orderId) throw new Error("fetchOrder: orderId required");
  return razorpay.orders.fetch(orderId);
};

export const fetchPayment = (paymentId) => {
  if (!paymentId) throw new Error("fetchPayment: paymentId required");
  return razorpay.payments.fetch(paymentId);
};

export const fetchSubscription = (subscriptionId) => {
  if (!subscriptionId) throw new Error("fetchSubscription: subscriptionId required");
  return razorpay.subscriptions.fetch(subscriptionId);
};

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET not configured; webhook verification will fail.");
    return false;
  }
  if (!rawBody || !signature) return false;
  const payload = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const digest = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  return digest === signature;
}

/**
 * Verify payment signature
 */
export function verifyPaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
} = {}) {
  if (!RAZORPAY_KEY_SECRET) {
    console.warn("⚠️ RAZORPAY_KEY_SECRET missing; verifyPaymentSignature cannot run.");
    return false;
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  const hmac = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  return hmac.digest("hex") === razorpay_signature;
}

export default razorpay;
