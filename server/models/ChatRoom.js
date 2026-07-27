const mongoose = require("mongoose");

/**
 * ChatRoom Model
 * Manages conversation sessions between tourists and guides.
 * Contextualized by bookings or tours.
 */
const chatRoomSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    packageBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageBooking",
    },
    customRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourRequest",
    },
    title: {
      type: String, // e.g. "Sarobira Landscapes - July 20-21"
      required: true
    },
    contextType: {
      type: String,
      enum: ["booking", "package", "request", "direct_message"],
      required: true
    },
    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now }
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {} // Key: UserId, Value: UnreadCount
    }
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ booking: 1 });
chatRoomSchema.index({ packageBooking: 1 });
chatRoomSchema.index({ customRequest: 1 });
chatRoomSchema.index({ updatedAt: -1 });

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
