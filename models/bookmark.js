import mongoose, { Schema } from "mongoose";

const BookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: Schema.Types.ObjectId, ref: "Prompt", required: true, index: true },
    collection: { type: Schema.Types.ObjectId, ref: "Collection", default: null }, // null = Unsorted
  },
  { timestamps: true }
);

BookmarkSchema.index({ user: 1, prompt: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);
