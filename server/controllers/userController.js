const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");
const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const Wishlist = require("../models/Wishlist");
const Review = require("../models/Review");
const logger = require("../utils/logger");

// ... (code omitted for brevity, keeping only the updated function)
// I will just replace the specific function and imports to avoid overwriting everything. Wait, I should provide the exact replacement for the lines I target.

// @desc    Apply to be a tour guide
// @route   POST /api/users/apply-guide
// @access  Private
const applyForGuideRole = async (req, res, next) => {
  try {
    const { bio, yearsOfExperience, specialties, certificationImage } = req.body;

    const user = await User.findById(req.user._id);

    if (user.role === "guide") {
      res.status(400);
      throw new Error("You are already a guide");
    }

    if (user.guideStatus === "pending") {
      res.status(400);
      throw new Error("Your application is already under review");
    }

    const Guide = require("../models/Guide");

    // Update profile and status
    user.role = "guide";
    user.guideStatus = "pending";
    
    let guide = await Guide.findOne({ user: user._id });
    if (!guide) {
      guide = await Guide.create({ 
        user: user._id, 
        bio: { en: bio || "", am: "" }, 
        experienceYears: yearsOfExperience || 0,
        specialties: specialties || [],
        certificationImage
      });
    }
    
    user.guideProfile = guide._id;

    await user.save();

    // Notify Admin (High Priority)
    // Find first admin to notify (or implement a more sophisticated admin alert system)
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await sendNotification(admin._id, {
        type: "system",
        priority: "HIGH",
        message: `New Guide Application from ${user.name}. Please review.`,
        referenceId: user._id,
      });
    }

    res.json({ message: "Application submitted successfully", status: "pending" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -resetPasswordOTP -resetPasswordExpires");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Phone Validation
    if (req.body.phone && !/^\+?[0-9\s\-()]{7,20}$/.test(req.body.phone)) {
      res.status(400);
      throw new Error("Please provide a valid phone number");
    }

    // Password Validation
    if (req.body.password) {
      if (req.body.password.length < 8) {
        res.status(400);
        throw new Error("Password must be at least 8 characters long");
      }
      user.password = req.body.password;
    }

    // Top Level Fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.location = req.body.location || user.location;
    user.profilePicture = req.body.profilePicture || user.profilePicture;

    // Nested Fields: Emergency Contact
    if (req.body.emergencyContact) {
      const existingContact = user.emergencyContact ? user.emergencyContact.toObject() : {};
      user.emergencyContact = {
        ...existingContact,
        ...req.body.emergencyContact,
      };
    }

    // Nested Fields: Settings
    if (req.body.settings) {
      user.settings = {
        notifications: { ...user.settings?.notifications, ...req.body.settings.notifications },
        privacy: { ...user.settings?.privacy, ...req.body.settings.privacy },
        ui: { ...user.settings?.ui, ...req.body.settings.ui },
      };
    }

    // Nested Fields: Preferences
    // IMPORTANT: Use .toObject() to convert the Mongoose subdocument to a plain
    // JS object before spreading, otherwise fields like `budget` that aren't
    // included in the request body get set to `undefined` and fail schema casting.
    if (req.body.preferences) {
      const existingPrefs = user.preferences ? user.preferences.toObject() : {};
      user.preferences = {
        ...existingPrefs,
        ...req.body.preferences,
      };
    }

    const updatedUser = await user.save();
    
    logger.info(`User profile updated: ${user._id}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        location: updatedUser.location,
        profilePicture: updatedUser.profilePicture,
        emergencyContact: updatedUser.emergencyContact,
        settings: updatedUser.settings,
        preferences: updatedUser.preferences,
      },
    });
  } catch (error) {
    logger.error(`Failed to update profile for ${req.user?._id}: ${error.message}`);
    next(error);
  }
};

// @desc    Upload user profile image
// @route   POST /api/users/profile-image
// @access  Private
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No image file provided");
    }

    const { uploadImage } = require("../utils/cloudinary");
    const fs = require("fs");
    
    // Upload to Cloudinary using disk path
    const cloudinaryResult = await uploadImage(req.file.path, "kambata-travel/profiles");
    
    // Cleanup local temp file
    await fs.promises.unlink(req.file.path).catch(err => 
      logger.error(`Failed to delete temp file ${req.file.path}: ${err.message}`)
    );
    
    // Save to user
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    
    user.profilePicture = cloudinaryResult.url;
    await user.save();
    
    logger.info(`Profile image updated for user: ${user._id}`);
    
    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    const fs = require("fs");
    if (req.file && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path).catch(err => 
        logger.error(`Failed to delete temp file ${req.file.path}: ${err.message}`)
      );
    }
    logger.error(`Failed to upload profile image for ${req.user?._id}: ${error.message}`);
    next(error);
  }
};

// @desc    Delete own account (traveler)
// @route   DELETE /api/users/account
// @access  Private
const deleteMyAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400);
      throw new Error("Password is required to delete your account");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      res.status(400);
      throw new Error("Admin accounts cannot be deleted from the traveler portal");
    }

    const valid = await user.matchPassword(password);
    if (!valid) {
      res.status(401);
      throw new Error("Incorrect password");
    }

    const activeTour = await Booking.findOne({
      user: user._id,
      status: { $in: ["confirmed", "pending"] },
      paymentStatus: "paid",
    });
    const activePackage = await PackageBooking.findOne({
      user: user._id,
      bookingStatus: { $in: ["confirmed", "pending"] },
    });

    if (activeTour || activePackage) {
      res.status(400);
      throw new Error(
        "Cannot delete account while you have active or upcoming bookings. Cancel them first."
      );
    }

    await Wishlist.deleteMany({ user: user._id });
    await Review.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    logger.info(`User self-deleted account: ${user._id}`);

    res.json({ success: true, message: "Your account has been permanently deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForGuideRole,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteMyAccount,
};
