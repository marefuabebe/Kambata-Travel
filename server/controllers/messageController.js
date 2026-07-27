const Message = require("../models/Message");

// @desc    Get message history between two users
// @route   GET /api/messages/:otherUserId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.otherUserId },
        { sender: req.params.otherUserId, receiver: req.user._id },
      ],
    })
      .sort("createdAt")
      .populate("sender", "name profileImage")
      .populate("receiver", "name profileImage");

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    // Advanced aggregation to find unique people the user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$content" },
          lastTime: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTime: 1,
          userName: "$userDetails.name",
          userImage: "$userDetails.profileImage",
        },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  getConversations,
};
