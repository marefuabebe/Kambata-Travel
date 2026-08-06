const express = require("express");
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

router.get("/drop-indexes", async (req, res) => {
  try {
    const Wishlist = require("../models/Wishlist");
    await Wishlist.collection.dropIndexes();
    res.json({ success: true, message: "Dropped ALL indexes from Wishlist LIVE database!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.use(protect);
router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:id", removeFromWishlist);

module.exports = router;
