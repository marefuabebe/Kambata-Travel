const Tour = require("../models/Tour");
const Destination = require("../models/Destination");
const { recordAction } = require("../services/auditService");
const { notifyGuideOfAssignment } = require("../services/notificationService");
const logger = require("../utils/logger");

// @desc    Create a new tour template
// @route   POST /api/admin/tours
const createTourTemplate = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      destination,
      images,
      duration,
      difficulty,
      maxCapacity,
      category,
      isPublished,
      itinerary,
      facilities,
      bookingType,
    } = req.body;

    const tour = await Tour.create({
      title,
      description,
      price,
      destination,
      images: images || [],
      duration,
      difficulty,
      maxCapacity,
      category: category || "Culture",
      createdBy: req.user._id,
      isBlueprint: true,
      isPublished: isPublished ?? false,
      schedules: [],
      itinerary: itinerary || [],
      facilities: facilities || [],
      bookingType: bookingType || "instant",
    });

    recordAction(req, "TOUR_TEMPLATE_CREATED", "Tour", tour._id, { title: title?.en || title });
    res.status(201).json(tour);
  } catch (error) {
    next(error);
  }
};

// @desc    Update tour template
// @route   PUT /api/admin/tours/:id
const updateTourTemplate = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }
    recordAction(req, "TOUR_TEMPLATE_UPDATED", "Tour", tour._id);
    res.json(tour);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tour template
// @route   DELETE /api/admin/tours/:id
const deleteTourTemplate = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }
    await tour.deleteOne();
    recordAction(req, "TOUR_TEMPLATE_DELETED", "Tour", req.params.id);
    res.json({ message: "Tour template removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage Destinations
const createDestination = async (req, res, next) => {
  try {
    const destination = await Destination.create(req.body);
    recordAction(req, "DESTINATION_CREATED", "Destination", destination._id);
    res.status(201).json(destination);
  } catch (error) {
    next(error);
  }
};

const updateDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true });
    recordAction(req, "DESTINATION_UPDATED", "Destination", req.params.id);
    res.json(destination);
  } catch (error) {
    next(error);
  }
};

const deleteDestination = async (req, res, next) => {
  try {
    await Destination.findByIdAndDelete(req.params.id);
    recordAction(req, "DESTINATION_DELETED", "Destination", req.params.id);
    res.json({ message: "Destination removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin adds a schedule and assigns a guide
// @route   POST /api/admin/tours/:id/schedules
const adminAddTourSchedule = async (req, res, next) => {
  try {
    const { guideId, startDate, endDate, startTime, endTime, remainingSlots, price } = req.body;
    
    if (!startDate || !endDate || !guideId) {
      res.status(400);
      throw new Error("Start date, end date, and guide assignment are required");
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    // Conflict Check: Ensure the assigned guide is not already booked for these dates on ANY tour
    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlappingTour = await Tour.findOne({
      "schedules": {
        $elemMatch: {
          guide: guideId,
          status: { $in: ["published", "upcoming", "full", "in_progress"] },
          $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } }
          ]
        }
      }
    });

    if (overlappingTour) {
      res.status(400);
      throw new Error("Conflict: The assigned guide already has an overlapping schedule during this time.");
    }

    const newSchedule = {
      guide: guideId,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      remainingSlots: remainingSlots || tour.maxCapacity,
      ...(price != null && { price: Number(price) }),
    };

    tour.schedules.push(newSchedule);
    await tour.save();

    recordAction(req, "TOUR_SCHEDULE_ADDED_ADMIN", "Tour", tour._id, { guideId, startDate });

    // Notify the assigned guide
    const title = tour.title?.en || tour.title;
    await notifyGuideOfAssignment(guideId, title || "New Tour", start, startTime);

    res.status(201).json({
      success: true,
      data: tour.schedules[tour.schedules.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTourTemplate,
  updateTourTemplate,
  deleteTourTemplate,
  createDestination,
  updateDestination,
  deleteDestination,
  adminAddTourSchedule
};
