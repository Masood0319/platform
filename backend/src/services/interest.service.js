import Interest from "../models/interest.model.js";

export async function findExistingInterest({ senderId, receiverId, senderRole, receiverRole, startupId, investorId }) {
  return Interest.findOne({
    senderId,
    receiverId,
    senderRole,
    receiverRole,
    startupId: startupId || null,
    investorId: investorId || null,
    status: { $in: ["pending", "accepted"] },
  });
}

export async function createInterestRecord({ senderId, receiverId, senderRole, receiverRole, startupId, investorId }) {
  return Interest.create({
    senderId,
    receiverId,
    senderRole,
    receiverRole,
    startupId: startupId || undefined,
    investorId: investorId || undefined,
    status: "pending",
  });
}

export async function getInterestsByReceiver(receiverId) {
  return Interest.find({ receiverId })
    .populate("senderId", "name email role avatar location profile")
    .populate("startupId", "name tagline stage logoUrl")
    .populate("investorId", "name email role avatar location profile")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getInterestsBySender(senderId) {
  return Interest.find({ senderId })
    .populate("receiverId", "name email role avatar location profile")
    .populate("startupId", "name tagline stage logoUrl")
    .populate("investorId", "name email role avatar location profile")
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateInterestStatus(id, status) {
  return Interest.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
}

export async function deleteInterestById(id) {
  return Interest.deleteOne({ _id: id });
}
