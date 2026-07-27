const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

// @desc    Get user's chat rooms
// @route   GET /api/messages/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const query = isAdmin ? {} : { participants: req.user._id };

    const rooms = await ChatRoom.find(query)
      .populate("participants", "name email profilePicture")
      .populate("booking", "status")
      .populate("packageBooking", "bookingStatus")
      .populate("customRequest", "status")
      .sort("-updatedAt");

    const roomsWithUnread = await Promise.all(rooms.map(async (room) => {
      const unreadCount = await Message.countDocuments({
        room: room._id,
        seenBy: { $ne: req.user._id }
      });
      return { ...room.toObject(), unreadCount };
    }));

    res.json({ success: true, data: roomsWithUnread });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a specific room
// @route   GET /api/messages/rooms/:roomId
// @access  Private
const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    
    // Verify participation or admin
    const isAdmin = req.user.role === "admin";
    const query = { _id: roomId };
    if (!isAdmin) {
      query.participants = req.user._id;
    }

    const room = await ChatRoom.findOne(query);
    
    if (!room) {
      res.status(401);
      throw new Error("Not authorized to view this conversation");
    }

    const messages = await Message.find({ room: roomId })
      .populate("sender", "name profilePicture role")
      .sort("createdAt");

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Utility to initiate a new chat room 
const createRoomForContext = async ({ participants, title, contextType, bookingId, packageBookingId, customRequestId }) => {
  try {
    // Check if room already exists for this exact context
    const query = { contextType };
    if (bookingId) query.booking = bookingId;
    if (packageBookingId) query.packageBooking = packageBookingId;
    if (customRequestId) query.customRequest = customRequestId;

    let room = await ChatRoom.findOne(query);

    if (!room) {
      room = await ChatRoom.create({
        participants,
        title,
        contextType,
        booking: bookingId,
        packageBooking: packageBookingId,
        customRequest: customRequestId
      });
    } else {
      // Ensure all requested participants are in the room
      const existingParticipants = room.participants.map(p => p.toString());
      let modified = false;
      for (const p of participants) {
        if (!existingParticipants.includes(p.toString())) {
          room.participants.push(p);
          modified = true;
        }
      }
      if (modified) await room.save();
    }

    return room;
  } catch (error) {
    console.error("Failed to create chat room:", error);
    throw error;
  }
};

// @desc    Initiate or get a direct message room with a specific user
// @route   POST /api/messages/direct
// @access  Private
const createDirectRoom = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400);
      throw new Error("userId is required to start a direct message");
    }

    const mongoose = require("mongoose");

    // Cast to ObjectId so the $all query matches correctly (userId comes in as a string)
    let userIdObj;
    try {
      userIdObj = new mongoose.Types.ObjectId(userId);
    } catch {
      res.status(400);
      throw new Error("Invalid userId format");
    }

    const User = require("../models/User");
    const targetUser = await User.findById(userIdObj).select("name");
    if (!targetUser) {
      res.status(404);
      throw new Error("Target user not found");
    }

    const guideId = req.user._id;

    // Find an existing direct_message room between exactly these two users
    let room = await ChatRoom.findOne({
      contextType: "direct_message",
      participants: { $all: [guideId, userIdObj], $size: 2 },
    }).populate("participants", "name email profilePicture");

    if (!room) {
      room = await ChatRoom.create({
        participants: [guideId, userIdObj],
        title: `Direct Message`,
        contextType: "direct_message",
      });
      room = await ChatRoom.findById(room._id).populate("participants", "name email profilePicture");
    }

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total unread message count for the user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const excludeContexts = req.query.excludeContexts ? req.query.excludeContexts.split(",") : [];

    const roomQuery = { participants: userId };
    if (excludeContexts.length > 0) {
      roomQuery.contextType = { $nin: excludeContexts };
    }

    // Find all rooms the user is in that match the query
    const rooms = await ChatRoom.find(roomQuery).select("_id");
    const roomIds = rooms.map((r) => r._id);

    // Count messages in those rooms where the user is NOT in seenBy
    const unreadCount = await Message.countDocuments({
      room: { $in: roomIds },
      seenBy: { $ne: userId },
    });

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a message
// @route   PATCH /api/messages/:messageId
// @access  Private (sender only)
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400);
      throw new Error("Message text cannot be empty");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only edit your own messages");
    }

    if (message.isDeleted) {
      res.status(400);
      throw new Error("Cannot edit a deleted message");
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft-delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private (sender only)
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You can only delete your own messages");
    }

    message.isDeleted = true;
    message.text = "This message was deleted";
    await message.save();

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getRoomMessages,
  createRoomForContext,
  createDirectRoom,
  getUnreadCount,
  editMessage,
  deleteMessage,
};
