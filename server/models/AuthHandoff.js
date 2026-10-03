"use strict";

const mongoose = require("mongoose");

const authHandoffSchema = new mongoose.Schema({
  handoffId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  telegramId: {
    type: String,
    sparse: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "claimed"],
    default: "pending",
  },
  user: {
    type: Object,
    default: null,
  },
  accessToken: {
    type: String,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // MongoDB TTL index: automatically deletes document after 10 minutes (600s)
  },
});

module.exports = mongoose.model("AuthHandoff", authHandoffSchema);
