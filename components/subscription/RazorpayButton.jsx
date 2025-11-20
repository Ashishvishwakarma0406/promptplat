// components/subscription/RazorpayButton.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Robust RazorpayButton
 *
 * Props:
 *  - type: "subscription" | "order"
 *  - planKey: string (for subscription flow)
 *  - orderData: object (for order flow)
 *  - onSuccess(response)
 *  - onError(error)
 *  - label
 */
export default function RazorpayButton({
  type = "subscription",
  planKey,
  orderData,
  onSuccess,
  onError,
  label = "Subscribe Now",
}) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const sdkLoadPromise = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If already loading/loaded, reuse
    if (sdkLoadPromise.current) {
      sdkLoadPromise.current.then(() => setSdkLoaded(true)).catch(() => setSdkLoaded(false));
      return;
    }

    sdkLoadPromise.current = new Promise((resolve, reject) => {
      if (window.Razorpay) {
        setSdkLoaded(true);
        return resolve();
      }
      const existing = document.getElementById("razorpay-js");
      if (existing) {
        // existing tag but maybe not loaded yet
        existing.addEventListener("load", () => {
          setSdkLoaded(Boolean(window.Razorpay));
          return window.Razorpay ? resolve() : reject(new Error("Razorpay loaded but window.Razorpay missing"));
        });
        existing.addEventListener("error", () => {
          setSdkLoaded(false);
          reject(new Error("Failed to load Razorpay script (existing tag)"));
        });
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        setSdkLoaded(Boolean(window.Razorpay));
        return window.Razorpay ? resolve() : reject(new Error("Razorpay script loaded but window.Razorpay missing"));
      };
      script.onerror = () => {
        setSdkLoaded(false);
        reject(new Error("Failed to load Razorpay script"));
      };
      document.body.appendChild(script);
    });

    sdkLoadPromise.current
      .then(() => setSdkLoaded(true))
      .catch((e) => {
        console.error("Razorpay SDK load error:", e);
        setSdkLoaded(false);
      });
  }, []);

  // Helper to parse non-JSON responses gracefully
  const parseResponseBody = async (res) => {
    const text = await res.text().catch(() => "");
    if (!text) return { ok: res.ok, status: res.status, bodyText: "" };
    try {
      return { ok: res.ok, status: res.status, body: JSON.parse(text), bodyText: text };
    } catch {
      return { ok: res.ok, status: res.status, bodyText: text };
    }
  };

  const handleClick = async () => {
    // basic validations
    if (type === "subscription" && !planKey) {
      const err = new Error("Missing planKey for subscription");
      onError?.(err);
      alert(err.message);
      return;
    }
    if (type === "order" && !orderData) {
      const err = new Error("Missing orderData for order purchase");
      onError?.(err);
      alert(err.message);
      return;
    }

    setLoading(true);

    try {
      // Ensure SDK loaded before proceeding (so errors are clearer)
      if (!sdkLoaded) {
        // Wait max 6s for the SDK to load
        await Promise.race([
          sdkLoadPromise.current ?? Promise.reject(new Error("Razorpay SDK not initialized")),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Razorpay SDK timeout")), 6000)),
        ]);
      }

      // Create subscription/order on server
      const endpoint =
        type === "subscription" ? "/api/subscription/create-subscription" : "/api/subscription/create-order";
      const payload = type === "subscription" ? { planKey } : orderData || {};

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const parsed = await parseResponseBody(res);
      console.debug("Razorpay init response:", parsed);

      if (!res.ok) {
        // prefer JSON error message if available
        const errMsg =
          (parsed.body && (parsed.body.error || parsed.body.message)) ||
          parsed.bodyText ||
          `HTTP ${parsed.status}`;
        throw new Error(`Server error: ${errMsg}`);
      }

      // normalized data object (some servers return nested shapes)
      const data = parsed.body || {};

      // Validate required fields depending on flow:
      if (type === "subscription") {
        const subscriptionId =
          data.subscriptionId || data.subscription_id || data.subscription?.id || data.subscription?.subscription_id;
        const keyId = data.razorpayKeyId || data.key || data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY;
        if (!subscriptionId) {
          throw new Error(
            "Server did not return subscriptionId. Check /api/subscription/create-subscription response (should return { subscriptionId, razorpayKeyId })."
          );
        }
        if (!keyId) {
          console.warn("No Razorpay key returned by server; trying NEXT_PUBLIC_RAZORPAY_KEY fallback");
        }

        const options = {
          key: keyId,
          subscription_id: subscriptionId,
          name: data.planName || "Promteplat",
          description: data.planName || "Subscription",
          theme: { color: "#8B5CF6" },
          handler: function (response) {
            // success on checkout (client only receives payment_id for initial invoice)
            onSuccess?.(response);
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (err) {
          console.error("Razorpay payment.failed event:", err);
          const msg =
            err?.error?.description ||
            err?.error?.reason ||
            (err?.error && JSON.stringify(err.error)) ||
            "Payment failed";
          onError?.(new Error(msg));
          alert("Payment failed: " + msg);
        });
        rzp.open();
      } else {
        // order flow
        const orderId = data.orderId || data.order_id || data.order?.id || data.order?.order_id;
        const amount = data.amount || data.order?.amount;
        const currency = data.currency || data.order?.currency || "INR";
        const keyId = data.razorpayKeyId || data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY;

        if (!orderId || !amount) {
          throw new Error(
            "Server did not return valid order details (orderId/amount). Check /api/subscription/create-order response."
          );
        }

        const options = {
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: data.name || "Promteplat",
          description: data.description || "Token purchase",
          handler: function (response) {
            onSuccess?.(response);
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (err) {
          console.error("Razorpay payment.failed event:", err);
          const msg =
            err?.error?.description ||
            err?.error?.reason ||
            (err?.error && JSON.stringify(err.error)) ||
            "Payment failed";
          onError?.(new Error(msg));
          alert("Payment failed: " + msg);
        });
        rzp.open();
      }
    } catch (err) {
      console.error("RazorpayButton error:", err);
      onError?.(err);
      // show a user-friendly alert with a slightly detailed message
      const msg = err?.message || "Payment initialization failed";
      try {
        alert("Oops! Something went wrong.\n\n" + msg);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full px-5 py-2.5 rounded-lg font-semibold transition text-white ${
        loading ? "bg-gray-600 cursor-not-allowed opacity-60" : "bg-[#8B5CF6] hover:bg-[#7D49E0]"
      }`}
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
