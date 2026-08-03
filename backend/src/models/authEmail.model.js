import mongoose from "mongoose";

const AuthEmailSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  verification_code: { type: String, required: true },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ensures updated_at is auto updated
AuthEmailSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.AuthEmail ||
  mongoose.model("AuthEmail", AuthEmailSchema);
