const Hotel = require("../models/Hotel");
const { recordAction } = require("../services/auditService");

// @desc    Create a hotel
// @route   POST /api/hotels
// @access  Private (Admin)
const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create({
      ...req.body,
      createdBy: req.user._id,
    });
    
    recordAction(req, "HOTEL_CREATED", "Hotel", hotel._id, { name: hotel.name });
    res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a hotel
// @route   PUT /api/hotels/:id
// @access  Private (Admin)
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!hotel) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    recordAction(req, "HOTEL_UPDATED", "Hotel", hotel._id);
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res, next) => {
  try {
    const query = { status: "active" };
    if (req.query.location) {
      query.location = req.query.location;
    }

    const hotels = await Hotel.find(query).sort("-createdAt").lean();
    res.json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).lean();
    
    if (!hotel || (hotel.status !== "active" && req.user?.role !== "admin")) {
      res.status(404);
      throw new Error("Hotel not found");
    }

    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHotel,
  updateHotel,
  getHotels,
  getHotelById,
};
