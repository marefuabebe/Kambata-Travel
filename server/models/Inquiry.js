const mongoose = require("mongoose");

const inquirySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email"
      ]
    },
    subject: {
      type: String,
      required: [true, "Please provide a subject"],
      trim: true
    },
    message: {
      type: String,
      required: [true, "Please provide your message"],
      trim: true
    },
    interest: {
      type: String,
      enum: ["General", "Tours", "Heritage", "Partnership"],
      default: "General"
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread"
    }
  },
  {
    timestamps: true
  }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);

module.exports = Inquiry;
