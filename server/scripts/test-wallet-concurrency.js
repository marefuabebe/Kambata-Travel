require("dotenv").config();
const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Tour = require("../models/Tour");
const PayoutRequest = require("../models/PayoutRequest");
const { releaseGuideEarnings } = require("../services/walletService");

async function runTests() {
  try {
    const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";
    await mongoose.connect(dbUri);
    console.log("Connected to MongoDB for concurrency tests");

    // Clear test data
    await Wallet.deleteMany({ currency: "TEST" });
    await Booking.deleteMany({ paymentMethod: "test-concurrency" });
    await PayoutRequest.deleteMany({ amount: 99999 });

    // Setup Test Guide
    let testGuide = await User.findOne({ email: "concurrency_test_guide@test.com" });
    if (!testGuide) {
      testGuide = await User.create({
        name: "Concurrency Guide",
        email: "concurrency_test_guide@test.com",
        password: "password123",
        role: "guide",
        guideStatus: "approved"
      });
    }

    // Find an existing tour to use
    const testTour = await Tour.findOne({});
    if (!testTour) throw new Error("No tours found in database");
    
    // Add a schedule if it doesn't have one
    if (testTour.schedules.length === 0) {
      testTour.schedules.push({
        startDate: new Date(),
        endDate: new Date(),
        startTime: "10:00",
        endTime: "12:00",
        guide: testGuide._id,
        capacity: 10,
        remainingSlots: 10
      });
      await testTour.save();
    }

    // ----------------------------------------------------
    // TEST 1: Dual Earnings Release (Idempotency Race)
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Dual Earnings Release ---");
    const booking = await Booking.create({
      user: new mongoose.Types.ObjectId(),
      tour: testTour._id,
      scheduleId: testTour.schedules[0]._id,
      guide: testGuide._id,
      numPeople: 2,
      totalPrice: 2000, // 90% = 1800
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: "test-concurrency",
      earningsReleased: false
    });

    console.log("Triggering 3 simultaneous earnings releases for the same booking...");
    
    // Fire 3 simultaneous requests
    const results = await Promise.allSettled([
      releaseGuideEarnings(booking._id),
      releaseGuideEarnings(booking._id),
      releaseGuideEarnings(booking._id)
    ]);

    let successCount = 0;
    let skipCount = 0;
    results.forEach(r => {
      if (r.status === "fulfilled" && !r.value.alreadyReleased) successCount++;
      if (r.status === "fulfilled" && r.value.alreadyReleased) skipCount++;
    });

    const walletAfterT1 = await Wallet.findOne({ guide: testGuide._id });
    
    console.log(`Success Count: ${successCount}`);
    console.log(`Skip/Idempotent Count: ${skipCount}`);
    console.log(`Wallet Balance: ${walletAfterT1.balance} ETB (Expected: 1800)`);
    
    if (successCount === 1 && walletAfterT1.balance === 1800) {
      console.log("[PASS] TEST 1: Earnings released exactly once.");
    } else {
      console.log("[FAIL] TEST 1: Race condition detected.");
    }


    // ----------------------------------------------------
    // TEST 2: Dual Payout Requests (TOCTOU Race)
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Dual Payout Requests ---");
    // Directly fund wallet to 10000
    walletAfterT1.balance = 10000;
    walletAfterT1.currency = "TEST";
    walletAfterT1.pendingPayout = 0;
    await walletAfterT1.save();

    console.log("Wallet artificially funded to 10,000 ETB.");
    console.log("Firing 5 simultaneous requests for 3,000 ETB (Total requested: 15,000 ETB)...");

    const makeRequest = async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const w = await Wallet.findOneAndUpdate(
          { guide: testGuide._id, balance: { $gte: 3000 } },
          { $inc: { balance: -3000, pendingPayout: 3000 } },
          { new: true, session }
        );
        if (!w) {
          await session.abortTransaction();
          session.endSession();
          return false;
        }
        await PayoutRequest.create([{
          guide: testGuide._id,
          amount: 3000,
          bankInfo: { bankName: "Test", accountNumber: "123", accountHolder: "Test" }
        }], { session });
        await session.commitTransaction();
        session.endSession();
        return true;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return false;
      }
    };

    const t2Results = await Promise.all([
      makeRequest(), makeRequest(), makeRequest(), makeRequest(), makeRequest()
    ]);

    const successfulRequests = t2Results.filter(Boolean).length;
    const walletAfterT2 = await Wallet.findOne({ guide: testGuide._id });

    console.log(`Successful Requests: ${successfulRequests} (Expected: 3)`);
    console.log(`Wallet Balance: ${walletAfterT2.balance} (Expected: 1000)`);
    console.log(`Pending Payout: ${walletAfterT2.pendingPayout} (Expected: 9000)`);

    if (successfulRequests === 3 && walletAfterT2.balance === 1000) {
      console.log("[PASS] TEST 2: Negative balance prevented.");
    } else {
      console.log("[FAIL] TEST 2: Race condition detected.");
    }

    // ----------------------------------------------------
    // TEST 3: Admin Processing Races
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Admin Processing Races ---");
    
    // Create one pending request
    const adminPayout = await PayoutRequest.create({
      guide: testGuide._id,
      amount: 1000,
      bankInfo: { bankName: "Test", accountNumber: "123", accountHolder: "Test" }
    });
    walletAfterT2.pendingPayout += 1000;
    walletAfterT2.balance -= 1000; // balance is now 0
    await walletAfterT2.save();

    console.log("Created single payout request. Balance: 0, Pending: 10,000.");
    console.log("Admin 1 tries to Approve. Admin 2 tries to Reject simultaneously...");

    const processRequest = async (status) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const pr = await PayoutRequest.findOneAndUpdate(
          { _id: adminPayout._id, status: "pending" },
          { status, processedAt: new Date() },
          { new: true, session }
        );
        if (!pr) {
          await session.abortTransaction();
          session.endSession();
          return false; // Did not win the race
        }
        
        if (status === "completed") {
          await Wallet.findOneAndUpdate({ guide: testGuide._id }, { $inc: { pendingPayout: -1000 } }, { session });
        } else {
          await Wallet.findOneAndUpdate({ guide: testGuide._id }, { $inc: { pendingPayout: -1000, balance: 1000 } }, { session });
        }
        
        await session.commitTransaction();
        session.endSession();
        return status;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return false;
      }
    };

    const t3Results = await Promise.all([
      processRequest("completed"),
      processRequest("rejected")
    ]);

    const winner = t3Results.find(Boolean);
    const walletAfterT3 = await Wallet.findOne({ guide: testGuide._id });
    const prCheck = await PayoutRequest.findById(adminPayout._id);

    console.log(`Winning Action: ${winner}`);
    console.log(`Final PR Status: ${prCheck.status}`);
    console.log(`Final Wallet Balance: ${walletAfterT3.balance} (Expected: ${winner === 'rejected' ? 1000 : 0})`);
    
    const doubleProcessed = t3Results.filter(Boolean).length > 1;
    if (!doubleProcessed) {
      console.log("[PASS] TEST 3: Duplicate processing prevented.");
    } else {
      console.log("[FAIL] TEST 3: Double processing occurred.");
    }

    console.log("\nAll concurrency tests complete!");
    process.exit(0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTests();
