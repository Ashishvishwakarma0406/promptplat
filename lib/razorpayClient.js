// lib/razorpayClient.js
import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.warn("Razorpay credentials not set (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
}

export function createRazorpayInstance() {
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id, key_secret });
}
