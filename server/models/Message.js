import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    default: ""
  },
  media: {
    type: String // URL of image/file
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text"
  },
  seen: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
  }

}, { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1 });
export default mongoose.model("Message", messageSchema);
