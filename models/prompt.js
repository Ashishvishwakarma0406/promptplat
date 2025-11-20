// models/prompt.js
import mongoose from 'mongoose';

const PromptSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'private' },
  promptContent: { type: String, required: true },
  media: { type: [String], default: [] },

  // IMPORTANT: global like counter everyone sees
  likes: { type: Number, default: 0, min: 0 },

  // optional soft-delete flags if you use them elsewhere
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
PromptSchema.index({ owner: 1, createdAt: -1 }); // For user's prompts queries
PromptSchema.index({ visibility: 1, createdAt: -1 }); // For public prompts listing
PromptSchema.index({ visibility: 1, likes: -1, createdAt: -1 }); // For sorting by likes
PromptSchema.index({ visibility: 1, category: 1 }); // For category filtering
PromptSchema.index({ isDeleted: 1 }); // For soft-delete queries
PromptSchema.index({ title: 'text' }); // Text search index (if needed)

export default mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);