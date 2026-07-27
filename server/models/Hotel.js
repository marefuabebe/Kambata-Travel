const mongoose = require("mongoose");

const roomTypeSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Room type name is required (e.g., Standard, Deluxe)"],
  },
  description: {
    type: String,
  },
  pricePerNight: {
    type: Number,
    required: [true, "Price per night is required"],
  },
  capacity: {
    type: Number, // Guests per room
    required: [true, "Room capacity is required"],
  },
  totalInventory: {
    type: Number, // Total physical rooms of this type
    required: [true, "Total inventory is required"],
  },
  images: [{ type: String }],
});

const hotelSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      index: true,
    },
    location: {
      type: String,
      enum: ["Durame", "Shinshcho", "Other"], // Based on user requirements
      required: [true, "Location is required"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    contactNumber: {
      type: String,
    },
    images: [{ type: String }],
    amenities: [{ type: String }],
    rating: {
      average: { type: Number, default: 0 },
      numReviews: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    roomTypes: [roomTypeSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who created it
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
hotelSchema.index({ status: 1, location: 1 });

const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;
