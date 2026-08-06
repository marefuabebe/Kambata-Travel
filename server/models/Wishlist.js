const mongoose = require("mongoose");

const wishlistSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["tour", "hotel", "package"],
      required: true,
    },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, tour: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ user: 1, hotel: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ user: 1, package: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
