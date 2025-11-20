// models/like.js
import mongoose, { Schema } from "mongoose";

const LikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
  },
  { timestamps: true }
);

// prevent double-like by same user
LikeSchema.index({ user: 1, prompt: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model("Like", LikeSchema);