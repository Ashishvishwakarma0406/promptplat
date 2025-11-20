import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: String,
  razorpayId: String,
  status: { type: String, default: "active" },
  startedAt: Date,
  nextBillingAt: Date,
});

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
