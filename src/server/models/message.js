const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Social",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Social",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    // Optional attachment field for future features
    attachment: {
      type: String,
      default: null
    },
    // Fields for message approval system
    approved: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    isFirstMessage: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for efficient querying of conversations between users
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
