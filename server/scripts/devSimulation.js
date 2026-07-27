const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Booking = require("../models/Booking");
const PayoutRequest = require("../models/PayoutRequest");
const Wallet = require("../models/Wallet");
const Review = require("../models/Review");
const User = require("../models/User");
const Tour = require("../models/Tour");
const { releaseGuideEarnings } = require("../services/walletService");

dotenv.config({ path: require("path").join(__dirname, "../.env") });

const simulateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel");
    console.log("MongoDB Connected. Starting simulation...");

    let templateBooking = await Booking.findOne({ status: "confirmed" });
    if (!templateBooking) {
      // Fallback if no confirmed booking, just find any booking
      templateBooking = await Booking.findOne();
    }

    if (!templateBooking) {
      console.error("No bookings exist at all. Please create at least one booking manually to use as a template.");
      process.exit(1);
    }

    // Generate 40 past bookings to make analytics look realistic over the last 90 days
    const pastBookings = [];
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();

    console.log("Generating realistic past booking data...");
    for (let i = 1; i <= 40; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 85) + 1; // 1 to 85 days ago
      const pastDate = new Date(now - (randomDaysAgo * oneDay));

      const newBooking = new Booking({
        tour: templateBooking.tour,
        user: templateBooking.user,
        scheduleId: templateBooking.scheduleId,
        guide: templateBooking.guide,
        numPeople: Math.floor(Math.random() * 5) + 1,
        totalPrice: templateBooking.totalPrice * (Math.floor(Math.random() * 3) + 1),
        status: "confirmed",
        paymentStatus: "paid",
        isReviewed: false,
        attendanceStatus: "pending",
        tx_ref: `KB-TX-SIM-${Date.now()}-${i}`,
        slotsReserved: true,
        earningsReleased: false,
        createdAt: pastDate,
        updatedAt: pastDate,
        referenceNumber: `TOUR-SIM-${Math.floor(Math.random() * 1000000)}`
      });
      pastBookings.push(newBooking);
    }
    
    await Booking.insertMany(pastBookings);

    // 1. Process all un-released confirmed bookings
    const allBookings = await Booking.find({ status: "confirmed", earningsReleased: false }).populate("guide");
    let processed = 0;
    let released = 0;
    let reviewsCreated = 0;

    console.log(`Processing ${allBookings.length} confirmed bookings to 'completed' status...`);

    for (const booking of allBookings) {
      // 2 & 3. Mark attendanceStatus = "present" and tourStatus = "completed"
      // Simulate an occasional no-show or late for realistic analytics
      const r = Math.random();
      if (r > 0.95) booking.attendanceStatus = "absent";
      else if (r > 0.85) booking.attendanceStatus = "late";
      else booking.attendanceStatus = "present";

      booking.tourStatus = "completed";
      booking.status = "completed";
      await booking.save();
      processed++;

      // 4. Execute releaseGuideEarnings() exactly as production would
      // This also satisfies 5 & 6 (creates wallets and deposits earnings)
      try {
        const result = await releaseGuideEarnings(booking._id);
        if (result.success && !result.alreadyReleased) {
          released++;
        }
      } catch (err) {
        console.error(`Failed to release earnings for booking ${booking._id}:`, err.message);
      }

      // Generate realistic analytics data: Ratings/Reviews
      if (Math.random() > 0.4) {
        try {
          await Review.create({
            tour: booking.tour,
            guide: booking.guide._id || booking.guide,
            user: booking.user,
            booking: booking._id,
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            reviewType: "guide",
            comment: "Great experience, highly recommended!",
            createdAt: new Date(booking.createdAt.getTime() + 2 * oneDay)
          });
          reviewsCreated++;
        } catch (reviewErr) {
          if (reviewErr.code !== 11000) {
            console.error("Failed to create review:", reviewErr.message);
          }
        }
      }
    }

    // 7 & 8. Generate pending and completed payout requests
    const wallets = await Wallet.find().populate("guide");
    let pendingPayouts = 0;
    let completedPayouts = 0;

    for (const wallet of wallets) {
      // Create some completed payout requests
      if (wallet.totalEarned > 2000) {
        await PayoutRequest.create({
          guide: wallet.guide._id,
          amount: 1000,
          bankInfo: {
            bankName: "Commercial Bank of Ethiopia",
            accountNumber: "1000" + Math.floor(Math.random() * 10000000),
            accountHolder: wallet.guide.name || "Guide"
          },
          status: "completed",
          processedAt: new Date(now - 15 * oneDay),
          adminNote: "Processed manually via bank transfer",
          createdAt: new Date(now - 16 * oneDay)
        });
        wallet.balance -= 1000;
        completedPayouts++;
      }

      // Create 3-5 pending payout requests for the admin portal
      if (wallet.balance > 500) {
        const numPending = Math.floor(Math.random() * 3) + 3; // 3 to 5
        for (let i = 0; i < numPending; i++) {
          const reqAmount = 100 + (i * 50); // E.g. 100, 150, 200...
          if (wallet.balance >= reqAmount) {
            await PayoutRequest.create({
              guide: wallet.guide._id,
              amount: reqAmount,
              bankInfo: {
                bankName: i % 2 === 0 ? "Dashen Bank" : "Awash Bank",
                accountNumber: "2000" + Math.floor(Math.random() * 10000000),
                accountHolder: wallet.guide.name || "Guide"
              },
              status: "pending",
              createdAt: new Date(now - (i * oneDay))
            });
            pendingPayouts++;
          }
        }
      }
      
      // Save any balance deductions
      await wallet.save();
    }

    console.log("\n==================================");
    console.log("Verification Output:");
    console.log("==================================");
    console.log(`Bookings Processed: ${processed}`);
    console.log(`Wallets Created/Updated: ${wallets.length}`);
    console.log(`Earnings Released: ${released}`);
    console.log(`Pending Payouts Created: ${pendingPayouts}`);
    console.log(`Completed Payouts Created: ${completedPayouts}`);
    console.log(`Analytics Records Generated: Yes (${pastBookings.length} bookings, ${reviewsCreated} reviews)`);
    console.log("==================================");

    process.exit(0);
  } catch (error) {
    console.error("Simulation Failed:", error);
    process.exit(1);
  }
};

simulateData();
