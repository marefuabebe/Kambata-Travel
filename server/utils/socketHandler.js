const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const logger = require("./logger");

/**
 * Professional Socket Handler
 * Implements Real-Time Coordination with Room-based context.
 */
const socketHandler = (io) => {
  // 1. Authentication Middleware (JWT Secured)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Authentication error: User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`[WS] Contextual Messaging Active: ${socket.user.name}`);

    // Automatically join personal channel for direct notifications
    socket.join(socket.user._id.toString());
    
    // Join specialized room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      logger.info(`User ${socket.user._id} joined room ${roomId}`);
    });

    // Handle instant messaging
    socket.on("send_message", async (data) => {
      try {
        const { roomId, text, attachment, replyTo, isForwarded } = data;
        const messageText = text || (attachment ? "[Attachment]" : "");

        // 1. Create message record
        const message = await Message.create({
          room: roomId,
          sender: socket.user._id,
          text: messageText,
          attachment,
          replyTo,
          isForwarded: !!isForwarded,
          seenBy: [socket.user._id]
        });

        // 2. Multilingual Bridge (Mock Auto-Translation)
        // In a production environment, this would hit Chapa/Google Translate
        message.translatedText = {
           en: messageText, // Fallback
           am: `[ትርጉም]: ${messageText}` // Professional placeholder for Amharic
        };
        await message.save();

        // 3. Populate replyTo if it exists
        if (replyTo) {
          await message.populate({
            path: 'replyTo',
            select: 'text sender attachment',
            populate: { path: 'sender', select: 'name role' }
          });
        }

        // 4. Update ChatRoom metadata for the inbox
        const room = await ChatRoom.findByIdAndUpdate(roomId, {
          lastMessage: {
            text: messageText,
            sender: socket.user._id,
            timestamp: new Date()
          }
        }, { new: true });

        // 5. Broadcast to the room (Real-time delivery)
        const populatedMessage = {
          _id: message._id,
          roomId,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            profilePicture: socket.user.profilePicture,
            role: socket.user.role
          },
          text: message.text,
          attachment: message.attachment,
          replyTo: message.replyTo,
          isForwarded: message.isForwarded,
          translatedText: message.translatedText,
          createdAt: message.createdAt
        };

        io.to(roomId).emit("receive_message", populatedMessage);

        // 6. Fallback: Create System Notifications for offline/away participants
        const Notification = require("../models/Notification");
        if (room) {
          const otherParticipants = room.participants.filter(p => p.toString() !== socket.user._id.toString());
          for (const pId of otherParticipants) {
            await Notification.create({
              user: pId,
              type: "message",
              priority: "NORMAL",
              title: "New Message",
              message: `You have a new message from ${socket.user.name} in "${room.title}"`,
              actionUrl: `/messages?room=${roomId}`
            });
            // Try to push notification to their personal socket channel
            io.to(pId.toString()).emit("new_notification", {
              title: "New Message",
              message: `You have a new message from ${socket.user.name} in "${room.title}"`
            });
          }
        }

        logger.info(`Message delivered in room ${roomId} from ${socket.user._id}`);
      } catch (err) {
        logger.error(`Message failed: ${err.message}`);
        socket.emit("message_error", { message: "Failed to deliver message securely" });
      }
    });

    socket.on("edit_message", async (data) => {
      try {
        const { messageId, text, roomId } = data;
        const message = await Message.findById(messageId);
        
        if (!message) throw new Error("Message not found");
        if (message.sender.toString() !== socket.user._id.toString()) {
          throw new Error("Unauthorized: Can only edit your own messages");
        }

        message.text = text;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(roomId).emit("message_updated", {
          messageId,
          text,
          isEdited: true,
          editedAt: message.editedAt
        });
        
        logger.info(`Message ${messageId} edited by ${socket.user._id}`);
      } catch (err) {
        logger.error(`Edit message failed: ${err.message}`);
        socket.emit("message_error", { message: "Failed to edit message" });
      }
    });

    socket.on("delete_message", async (data) => {
      try {
        const { messageId, roomId } = data;
        const message = await Message.findById(messageId);
        
        if (!message) throw new Error("Message not found");
        if (message.sender.toString() !== socket.user._id.toString()) {
          throw new Error("Unauthorized: Can only delete your own messages");
        }

        message.isDeleted = true;
        message.text = "";
        message.attachment = null;
        await message.save();

        io.to(roomId).emit("message_deleted", {
          messageId
        });
        
        logger.info(`Message ${messageId} deleted by ${socket.user._id}`);
      } catch (err) {
        logger.error(`Delete message failed: ${err.message}`);
        socket.emit("message_error", { message: "Failed to delete message" });
      }
    });

    socket.on("typing", (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit("is_typing", {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping
      });
    });

    socket.on("mark_seen", async (data) => {
      try {
        const { roomId } = data;
        await Message.updateMany(
          { room: roomId, seenBy: { $ne: socket.user._id } },
          { $push: { seenBy: socket.user._id } }
        );
      } catch (err) {
        logger.error(`Mark seen failed: ${err.message}`);
      }
    });

    // Handle real-time document upload notifications from Guides
    socket.on("guide_uploaded_document", (data) => {
      // Broadcast to ALL connected admins (in a real app, we'd use a specific 'admin' room)
      io.emit("document_uploaded", {
        guideName: socket.user.name,
        documentType: data.documentType || "Verification Document"
      });
      logger.info(`Broadcasted document upload from ${socket.user.name}`);
    });

    socket.on("disconnect", () => {
      logger.info(`[WS] Connection closed: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
