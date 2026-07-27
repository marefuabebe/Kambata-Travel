const Wishlist = require("../models/Wishlist");

const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate("tour", "title images price duration rating destination")
      .populate("hotel", "name images location amenities rating roomTypes")
      .sort("-createdAt");
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { itemType, tourId, hotelId } = req.body;
    if (itemType === "tour" && !tourId) throw new Error("tourId required");
    if (itemType === "hotel" && !hotelId) throw new Error("hotelId required");

    const payload = { user: req.user._id, itemType };
    if (itemType === "tour") payload.tour = tourId;
    if (itemType === "hotel") payload.hotel = hotelId;

    const existing = await Wishlist.findOne({
      user: req.user._id,
      ...(tourId ? { tour: tourId } : { hotel: hotelId }),
    });
    if (existing) {
      return res.json({ success: true, data: existing, message: "Already in wishlist" });
    }

    const item = await Wishlist.create(payload);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
