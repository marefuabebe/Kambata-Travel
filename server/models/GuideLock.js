const mongoose = require("mongoose");

const GuideLockSchema = new mongoose.Schema({
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 15 // TTL index: document will be automatically deleted after 15 seconds
  }
});

module.exports = mongoose.model("GuideLock", GuideLockSchema);
