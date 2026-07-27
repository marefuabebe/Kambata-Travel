const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const logger = require("../utils/logger");

/**
 * @desc    Get visual availability for a specific tour
 * @route   GET /api/calendar/tour/:id
 * @access  Public
 */
const getTourAvailability = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const availability = tour.schedules.map(slot => {
      let status = "available";
      if (slot.remainingSlots <= 0) {
        status = "waitlist"; // Logic: Standard behavior is to allow waitlist even if full
      }
      
      return {
        date: slot.startDate,
        endDate: slot.endDate,
        remainingSlots: slot.remainingSlots,
        status,
        scheduleId: slot._id
      };
    });

    res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated workload for a guide (Heatmap data)
 * @route   GET /api/calendar/guide/workload
 * @access  Private (Guide)
 */
const getGuideWorkload = async (req, res, next) => {
  try {
    const guideId = req.user._id;

    // 1. Find all tours created by this guide
    const tours = await Tour.find({ createdBy: guideId }).select("_id title schedules");
    
    // 2. Aggregate confirmed bookings across these tours
    const tourIds = tours.map(t => t._id);
    const bookings = await Booking.find({ 
      tour: { $in: tourIds }, 
      status: { $in: ["confirmed", "completed"] } 
    }).populate("tour", "title");

    // 3. Map to dates for the heatmap
    const dailyWorkload = {};

    bookings.forEach(booking => {
      const tour = tours.find(t => t._id.toString() === booking.tour._id.toString());
      if (!tour) return;

      const schedule = tour.schedules.id(booking.scheduleId);
      if (!schedule) return;

      const dateStr = new Date(schedule.startDate).toISOString().split('T')[0];
      
      if (!dailyWorkload[dateStr]) {
        dailyWorkload[dateStr] = { 
          totalPeople: 0, 
          tourDetails: [] 
        };
      }

      dailyWorkload[dateStr].totalPeople += booking.numPeople;
      dailyWorkload[dateStr].tourDetails.push({
        title: tour.title,
        people: booking.numPeople,
        status: booking.status
      });
    });

    res.json({ success: true, workload: dailyWorkload });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTourAvailability,
  getGuideWorkload,
};
