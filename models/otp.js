// models/otp.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const otpSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 600s = 10 minutes
});

export default mongoose.models.OTP || mongoose.model("OTP", otpSchema);
