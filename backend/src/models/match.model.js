import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: "Startup", required: true },
    status: {
      type: String,
      enum: ["active", "closed", "declined"],
      default: "active",
      index: true,
    },
    matchScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

matchSchema.index({ founderId: 1, investorId: 1, startupId: 1 }, { unique: false });
matchSchema.index({ investorId: 1, status: 1 });
matchSchema.index({ founderId: 1, status: 1 });

const Match = mongoose.models.Match || mongoose.model("Match", matchSchema);

export default Match;

