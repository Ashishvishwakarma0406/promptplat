// models/user.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 100 },
    username: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ensure email stored lowercase and username trimmed
UserSchema.pre("save", function preSave(next) {
  if (this.isModified("email") && this.email) this.email = this.email.toLowerCase().trim();
  if (this.isModified("username") && this.username) this.username = this.username.trim();
  next();
});

// instance method to compare password (works even if hash done elsewhere)
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// tidy returned JSON: replace _id with id, remove password
UserSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
