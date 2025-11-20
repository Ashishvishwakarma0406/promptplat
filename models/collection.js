import mongoose, { Schema } from "mongoose";

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

CollectionSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.models.Collection || mongoose.model("Collection", CollectionSchema);
