import mongoose from "mongoose";

const tokenBalanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  tokens: { type: Number, default: 1000 },
  plan: { type: String, default: "trial" },
});

export default mongoose.models.TokenBalance ||
  mongoose.model("TokenBalance", tokenBalanceSchema);
