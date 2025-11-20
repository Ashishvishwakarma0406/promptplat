import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, expires: 600, default: Date.now }, // expires in 5 minutes
});

export default mongoose.models.OTP || mongoose.model("OTP", otpSchema);