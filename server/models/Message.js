const mongoose = require("mongoose");

/**
 * Message Model
 * Stores individual messages within a ChatRoom.
 * Supports localized translation markers and professional metadata.
 */
const messageSchema = mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    // For Module 3 logic
    translatedText: {
      en: String,
      am: String
    },
    attachment: {
      url: String,
      public_id: String,
      resource_type: String,
      fileType: String,
      fileName: String
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    isForwarded: {
      type: Boolean,
      default: false
    },
    seenBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
messageSchema.index({ room: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
