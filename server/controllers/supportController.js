const SupportTicket = require("../models/SupportTicket");
const { sendNotification } = require("../services/notificationService");

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private (Traveler/User)
const createTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400);
      throw new Error("Please provide a subject and message");
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's support tickets
// @route   GET /api/support/my-tickets
// @access  Private (Traveler/User)
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort("-createdAt");

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all support tickets (Admin)
// @route   GET /api/support
// @access  Private (Admin)
const getAllTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "name email profileImage")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to a ticket (Admin)
// @route   PATCH /api/support/:id/respond
// @access  Private (Admin)
const respondToTicket = async (req, res, next) => {
  try {
    const { adminResponse, status } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    let isNewResponse = false;
    if (adminResponse && adminResponse !== ticket.adminResponse) {
      ticket.adminResponse = adminResponse;
      isNewResponse = true;
    }
    
    if (status) ticket.status = status;

    await ticket.save();

    // Send real-time notification to the user
    if (isNewResponse) {
      await sendNotification(ticket.user, {
        type: "system",
        priority: "HIGH",
        message: `An Admin has responded to your Support Ticket regarding: ${ticket.subject}.`,
        referenceId: ticket._id,
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  respondToTicket,
};
