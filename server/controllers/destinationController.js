const Destination = require("../models/Destination");
const logger = require("../utils/logger");

// @desc    Get all published destinations (GeoData for Maps)
// @route   GET /api/destinations
// @access  Public
const getDestinations = async (req, res, next) => {
  try {
    const { woreda, category, search } = req.query;
    
    let query = { isPublished: true };

    if (woreda) query["location.woreda"] = woreda;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const destinations = await Destination.find(query)
      .select("name description location category rating images highlights culturalSignificance facilities tags")
      .lean();

    res.json({
      success: true,
      count: destinations.length,
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single destination
// @route   GET /api/destinations/:id
// @access  Public
const getDestinationById = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id).lean();

    if (!destination) {
      res.status(404);
      throw new Error("Destination not found");
    }

    res.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinations,
  getDestinationById,
};
