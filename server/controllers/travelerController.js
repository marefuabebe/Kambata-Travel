const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const PackageSchedule = require("../models/PackageSchedule");
const Notification = require("../models/Notification");
const Tour = require("../models/Tour");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const { generateInvoicePdf } = require("../services/invoicePdfService");
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const upcomingTours = await Booking.countDocuments({
      user: userId,
      status: { $in: ["confirmed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    });

    const activePackages = await PackageBooking.countDocuments({
      user: userId,
      bookingStatus: { $in: ["confirmed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    });

    const [completedTours, completedPackages] = await Promise.all([
      Booking.countDocuments({
        user: userId,
        status: "completed",
      }),
      PackageBooking.countDocuments({
        user: userId,
        bookingStatus: "completed",
      }),
    ]);
    const completedTrips = completedTours + completedPackages;

    const ChatRoom = require("../models/ChatRoom");
    const Message = require("../models/Message");
    const rooms = await ChatRoom.find({ participants: userId }).select("_id");
    const roomIds = rooms.map((r) => r._id);
    const unreadMessages = await Message.countDocuments({
      room: { $in: roomIds },
      seenBy: { $ne: userId },
      sender: { $ne: userId },
    });

    const recentNotifications = await Notification.find({ user: userId })
      .sort("-createdAt")
      .limit(8)
      .lean();

    let nextTour = await Booking.findOne({
      user: userId,
      status: { $in: ["confirmed", "pending"] },
    })
      .populate("tour", "title images destination schedules")
      .populate("guide", "name")
      .sort("createdAt")
      .lean();

    if (nextTour && nextTour.tour) {
      const sch = nextTour.tour.schedules?.find(s => s?._id && nextTour.scheduleId && s._id.toString() === nextTour.scheduleId.toString());
      nextTour.isLocked = (() => {
        if (!sch) return false;
        if (sch.status === "completed" || sch.status === "cancelled") return false;
        if (sch.attendanceLocked) return true;
        const endDateObj = new Date(sch.endDate || sch.startDate || sch.date || new Date());
        if (sch.endTime && sch.endTime !== "—") {
          const [h, m] = sch.endTime.split(":");
          endDateObj.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }
        return endDateObj < new Date();
      })();
    }

    const nextPackageBooking = await PackageBooking.findOne({
      user: userId,
      bookingStatus: { $in: ["confirmed", "pending"] },
    })
      .populate({
        path: "packageId",
        populate: [{ path: "tour", select: "images" }]
      })
      .populate({
        path: "packageScheduleId",
        populate: { path: "assignedGuide", select: "name" }
      })
      .sort("createdAt")
      .lean();

    if (nextPackageBooking && (!nextTour || new Date(nextPackageBooking.createdAt) < new Date(nextTour.createdAt))) {
      const pkgSchedule = nextPackageBooking.packageScheduleId;
      nextTour = {
        _id: nextPackageBooking._id,
        status: nextPackageBooking.bookingStatus,
        scheduleId: pkgSchedule?._id,
        isLocked: (() => {
          if (!pkgSchedule) return false;
          if (pkgSchedule.status === "completed" || pkgSchedule.status === "cancelled") return false;
          if (pkgSchedule.attendanceLocked) return true;
          const endDateObj = new Date(pkgSchedule.endDate || pkgSchedule.startDate || pkgSchedule.date || new Date());
          if (pkgSchedule.endTime && pkgSchedule.endTime !== "—") {
            const [h, m] = pkgSchedule.endTime.split(":");
            endDateObj.setHours(parseInt(h), parseInt(m), 0, 0);
          } else {
            endDateObj.setHours(23, 59, 59, 999);
          }
          return endDateObj < new Date();
        })(),
        tour: {
          title: nextPackageBooking.packageId?.name || "Travel Package",
          images: nextPackageBooking.packageId?.tour?.images || [],
          schedules: pkgSchedule ? [{
            _id: pkgSchedule._id,
            startDate: pkgSchedule.startDate || pkgSchedule.date,
            endDate: pkgSchedule.endDate || pkgSchedule.date,
          }] : []
        },
        guide: pkgSchedule?.assignedGuide
      };
    }

    res.json({
      success: true,
      data: {
        widgets: {
          upcomingTours,
          upcomingPackages: activePackages,
          activePackages,
          hotelReservations: 0,
          completedTrips,
          unreadMessages,
        },
        nextTour,
        recentActivity: recentNotifications.map((n) => ({
          id: n._id,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          isRead: n.isRead,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [toursRaw, packages] = await Promise.all([
      Booking.find({ 
        user: userId,
        $or: [
          { bookingSource: { $ne: "request" } },
          { status: { $ne: "pending" } }
        ]
      })
        .populate("tour", "title images destination duration schedules")
        .populate("guide", "name email phone profilePicture")
        .sort("-createdAt")
        .lean(),
        PackageBooking.find({ user: userId })
        .populate({
          path: "packageId",
          select: "name basePrice duration roomTypeId",
          populate: [
            { path: "tour", select: "images" },
            { path: "hotel", select: "name location roomTypes" }
          ]
        })
        .populate({
          path: "packageScheduleId",
          select: "date endDate startTime assignedGuide",
          populate: { path: "assignedGuide", select: "name email phone profilePicture rating reviews bio" }
        })
        .sort("-createdAt")
        .lean(),
    ]);

    const tours = toursRaw.map((b) => {
      const schedule = b.tour?.schedules?.find(
        (s) => s._id?.toString() === b.scheduleId?.toString()
      );
      return {
        ...b,
        scheduleStartDate: schedule?.startDate,
        scheduleEndDate: schedule?.endDate,
        scheduleStatus: schedule?.status,
        attendanceLocked: schedule?.attendanceLocked,
      };
    });

    const packagesWithGuide = packages.map((b) => {
      let roomType = null;
      if (b.packageId?.hotel?.roomTypes && b.packageId?.roomTypeId) {
        const found = b.packageId.hotel.roomTypes.find(
          (rt) => rt._id?.toString() === b.packageId.roomTypeId?.toString()
        );
        if (found) {
          roomType = { name: found.name, capacity: found.capacity };
        }
      }
      return {
        ...b,
        guide: b.packageScheduleId?.assignedGuide || null,
        roomType
      };
    });

    res.json({
      success: true,
      data: { tours, hotels: [], packages: packagesWithGuide },
    });
  } catch (error) {
    next(error);
  }
};

const getBookingInvoice = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    let record;

    if (type === "tour") {
      record = await Booking.findOne({ _id: id, user: req.user._id })
        .populate("tour", "title")
        .populate("user", "name email")
        .populate("guide", "name email phone");
    } else if (type === "package") {
      record = await PackageBooking.findOne({ _id: id, user: req.user._id })
        .populate("user", "name email")
        .populate({ path: "packageId", populate: ["tour", "hotel"] });
    }

    if (!record) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const invoicePayload = {
      invoiceNumber: record.referenceNumber || record._id,
      issuedAt: record.createdAt,
      customer: record.user,
      type,
      record,
      platform: "Kambata Travel",
    };

    if (req.query.format === "pdf") {
      const pdfBuffer = await generateInvoicePdf(invoicePayload);
      const filename = `kambata-invoice-${invoicePayload.invoiceNumber}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    }

    res.json({
      success: true,
      data: invoicePayload,
    });
  } catch (error) {
    next(error);
  }
};

const getDigitalPass = async (req, res, next) => {
  try {
    const { id, type } = req.params; // type = 'tour' or 'package'
    let record;
    
    let travelerName = "Guest";
    let guideName = null;
    let tourName = null;

    if (type === 'package') {
      record = await PackageBooking.findOne({ _id: id, user: req.user._id })
        .populate("user", "name")
        .populate("packageId", "name")
        .populate({ path: "packageScheduleId", populate: { path: "assignedGuide", select: "name" }});

      if (record) {
         travelerName = record.user?.name;
         tourName = record.packageId?.name?.en || record.packageId?.name?.am || record.packageId?.name;
         guideName = record.packageScheduleId?.assignedGuide?.name;
         console.log("DEBUG getDigitalPass PACKAGE:", { travelerName, tourName, guideName, schedule: record.packageScheduleId });
      }
    } else {
      record = await Booking.findOne({ _id: id, user: req.user._id })
        .populate("user", "name")
        .populate("tour", "title")
        .populate("guide", "name");

      if (record) {
         travelerName = record.user?.name;
         tourName = record.tour?.title?.en || record.tour?.title?.am || record.tour?.title;
         guideName = record.guide?.name;
         console.log("DEBUG getDigitalPass TOUR:", { travelerName, tourName, guideName });
      }
    }

    if (!record) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Only allow confirmed bookings
    if ((record.status !== "confirmed" && record.status !== "completed") && (record.bookingStatus !== "confirmed" && record.bookingStatus !== "completed")) {
      res.status(400);
      throw new Error("Digital Pass is only available for confirmed bookings");
    }

    const scheduleIdStr = type === 'package' ? (record.packageScheduleId?._id || record.packageScheduleId) : (record.scheduleId?._id || record.scheduleId);

    // Create secure payload
    const payload = {
      bookingId: record._id,
      scheduleId: scheduleIdStr,
      travelerId: req.user._id,
      type: type,
      timestamp: Date.now()
    };

    const secureToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const qrData = JSON.stringify({
      bookingId: record._id,
      scheduleId: scheduleIdStr,
      travelerId: req.user._id,
      type: type,
      token: secureToken
    });

    // Generate Base64 Image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      data: {
        qrCodeImage,
        referenceNumber: record.referenceNumber,
        status: record.status || record.bookingStatus,
        checkedInAt: record.checkedInAt,
        travelerName,
        guideName,
        tourName
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getAllBookings, getBookingInvoice, getDigitalPass };
