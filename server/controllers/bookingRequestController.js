const BookingRequest = require("../models/BookingRequest");
const Tour = require("../models/Tour");
const { sendNotification } = require("../services/notificationService");
const { ensureChatRoomForRequest } = require("../services/chatService");
const {
  assertRequestBookingAllowed,
  validateGuideForRequest,
} = require("../services/tourBookingRules");

// @desc    Create a custom date request (no chat until guide accepts)
// @route   POST /api/bookings/requests
const createBookingRequest = async (req, res, next) => {
  try {
    const { tourId, guideId, requestedDate, partySize, message } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.isPublished) {
      res.status(404);
      throw new Error("Tour not found");
    }

    try {
      assertRequestBookingAllowed(tour);
    } catch (e) {
      res.status(400);
      throw e;
    }
    try {
      await validateGuideForRequest(guideId);
    } catch (e) {
      res.status(e.statusCode || 400);
      throw e;
    }

    const request = await BookingRequest.create({
      traveler: req.user._id,
      guide: guideId,
      tour: tourId,
      requestedDate,
      partySize: partySize || 1,
      message,
    });

    await sendNotification(guideId, {
      type: "booking",
      priority: "HIGH",
      message: `New custom date request for ${tour.title?.en || tour.title}. Review in your dashboard.`,
      referenceId: request._id,
    });

    res.status(201).json({
      success: true,
      message: "Date request submitted. The guide will accept or reject your request.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const getGuideRequests = async (req, res, next) => {
  try {
    const requests = await BookingRequest.find({ guide: req.user._id })
      .populate("traveler", "name profilePicture email")
      .populate("tour", "title price images")
      .sort("-createdAt");

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const getTravelerRequests = async (req, res, next) => {
  try {
    const requests = await BookingRequest.find({ traveler: req.user._id })
      .populate("guide", "name profilePicture email")
      .populate("tour", "title price images")
      .sort("-createdAt");

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await BookingRequest.findById(req.params.id).populate("tour");

    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    const isGuide = request.guide.toString() === req.user._id.toString();
    const isTraveler = request.traveler.toString() === req.user._id.toString();

    if (!["accepted", "rejected", "withdrawn"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    if (status === "withdrawn") {
      if (!isTraveler) {
        res.status(403);
        throw new Error("Only the traveler can withdraw this request");
      }
    } else if (!isGuide && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Only the assigned guide or Admin can accept or reject this request");
    }

    if ((status === "accepted" || status === "rejected") && req.user.role === "guide") {
      const { validateGuideForRequest } = require("../services/tourBookingRules");
      await validateGuideForRequest(req.user._id);
    }

    request.status = status;
    let acceptedScheduleId = null;

    if (status === "accepted") {
      const tour = await Tour.findById(request.tour._id || request.tour);
      if (tour && tour.bookingType !== "request") {
        res.status(400);
        throw new Error("Only request-type tours support custom date acceptance");
      }
      if (tour) {
        const endDate = new Date(request.requestedDate);
        endDate.setHours(23, 59, 59, 999);

        // If admin is assigning a different guide, use that
        const assignedGuide = (req.user.role === "admin" && req.body.assignedGuideId) 
                              ? req.body.assignedGuideId 
                              : request.guide;

        // Update the request with the assigned guide
        if (req.user.role === "admin" && req.body.assignedGuideId) {
            request.guide = req.body.assignedGuideId;
        }

        tour.schedules.push({
          guide: assignedGuide,
          startDate: request.requestedDate,
          endDate,
          remainingSlots: tour.maxCapacity,
        });
        await tour.save();
        acceptedScheduleId = tour.schedules[tour.schedules.length - 1]._id;
        request.acceptedScheduleId = acceptedScheduleId;
      }

      const room = await ensureChatRoomForRequest({
        tourId: request.tour._id || request.tour,
        travelerId: request.traveler,
        guideId: request.guide,
        requestId: request._id,
      });
      request.chatRoom = room._id;

      await sendNotification(request.traveler, {
        type: "booking",
        priority: "HIGH",
        message: `Your custom date was accepted! Complete payment to confirm your spot.`,
        referenceId: request._id,
      });
    }

    if (status === "rejected") {
      await sendNotification(request.traveler, {
        type: "booking",
        priority: "NORMAL",
        message: `Your custom date request was declined. You may try another date or tour.`,
        referenceId: request._id,
      });
    }

    await request.save();

    res.json({
      success: true,
      data: request,
      acceptedScheduleId,
      checkoutUrl:
        status === "accepted" && acceptedScheduleId
          ? `/checkout/${request.tour._id || request.tour}?scheduleId=${acceptedScheduleId}`
          : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBookingRequest,
  getGuideRequests,
  getTravelerRequests,
  updateRequestStatus,
};
