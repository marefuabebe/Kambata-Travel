const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Tour = require("../models/Tour");
const Package = require("../models/Package");
const PackageSchedule = require("../models/PackageSchedule");
const GuideTimeOff = require("../models/GuideTimeOff");
const TourRequest = require("../models/TourRequest");
const User = require("../models/User");
const Destination = require("../models/Destination");
const { checkGuideAvailability } = require("../services/scheduleService");
const { createSchedule, reassignGuideAdmin } = require("../controllers/tourController");
const GuideLock = require("../models/GuideLock");

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

describe("Guide Availability Conflict Tests", async () => {
  let guideId;
  let tourId;
  let destId;
  let packageId;
  let tourObj;

  before(async () => {
    await mongoose.connect(process.env.DATABASE_URI);
    
    const guide = new User({
      name: "Test Guide", email: "testguide_" + Date.now() + "@example.com",
      password: "Password123!", role: "guide", guideStatus: "approved",
      schedulingDisabled: false, isBlocked: false
    });
    await guide.save();
    guideId = guide._id;

    const dest = new Destination({ 
      name: { en: "Test Dest", am: "Test" }, 
      location: { region: "Test", zone: "Test", woreda: "Test" },
      description: { en: "test", am: "test" },
      coordinates: { latitude: 0, longitude: 0 },
      bestTimeToVisit: { en: "test", am: "test" }
    });
    await dest.save();
    destId = dest._id;

    const tour = new Tour({
      title: { en: "Test Tour", am: "Test Tour" },
      description: { en: "Test Desc", am: "Test Desc" },
      category: "Adventure", destination: destId, createdBy: guideId, 
      price: 100, duration: { value: 1, unit: "days" },
      difficulty: "easy", maxCapacity: 10, isPublished: true, bookingType: "both"
    });
    await tour.save();
    tourId = tour._id;
    tourObj = tour;

    const Hotel = require("../models/Hotel");
    const hotel = new Hotel({
      name: "Test Hotel", location: "Durame", description: "Test hotel", rating: { average: 4, numReviews: 1 }
    });
    await hotel.save();

    const pkg = new Package({
      name: { en: "Test Package", am: "Test Package" },
      description: { en: "Test", am: "Test" },
      basePrice: 500, maxCapacity: 10, duration: { value: 3, unit: "days" },
      isPublished: true, isBlueprint: true, createdBy: guideId,
      tour: tourId, hotel: hotel._id
    });
    await pkg.save();
    packageId = pkg._id;
  });

  after(async () => {
    await Tour.findByIdAndDelete(tourId);
    await User.findByIdAndDelete(guideId);
    await Destination.findByIdAndDelete(destId);
    await Package.findByIdAndDelete(packageId);
    const Hotel = require("../models/Hotel");
    await Hotel.deleteOne({ name: "Test Hotel" });
    await GuideLock.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear all schedules and related conflict items before each test
    await Tour.updateOne({ _id: tourId }, { $set: { schedules: [] } });
    await PackageSchedule.deleteMany({ assignedGuide: guideId });
    await GuideTimeOff.deleteMany({ guide: guideId });
    await TourRequest.deleteMany({ assignedGuide: guideId });
    await GuideLock.deleteMany({});
  });

  const getBaseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  };

  const getNextDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 11);
    return d.toISOString().split("T")[0];
  };

  it("1. Tour vs Tour conflict", async () => {
    // Create first schedule
    await Tour.updateOne({ _id: tourId }, {
      $push: { schedules: {
        guide: guideId, startDate: getBaseDate(), endDate: getBaseDate(),
        startTime: "09:00 AM", endTime: "12:00 PM", meetingPoint: "Point", status: "published"
      }}
    });

    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "10:00 AM", "01:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Tour/);
    }
  });

  it("2. Tour vs Package conflict", async () => {
    await PackageSchedule.create({
      packageId: packageId, assignedGuide: guideId,
      startDate: getBaseDate(), endDate: getNextDate(),
      startTime: "09:00 AM", endTime: "05:00 PM", status: "published", 
      capacity: 10, availableSeats: 10, meetingPoint: "Test"
    });

    try {
      await checkGuideAvailability(guideId, getNextDate(), getNextDate(), "10:00 AM", "01:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Package/);
    }
  });

  it("3. Package vs Package conflict", async () => {
    await PackageSchedule.create({
      packageId: packageId, assignedGuide: guideId,
      startDate: getBaseDate(), endDate: getNextDate(),
      startTime: "09:00 AM", endTime: "05:00 PM", status: "published", 
      capacity: 10, availableSeats: 10, meetingPoint: "Test"
    });

    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "09:00 AM", "05:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Package/);
    }
  });

  it("4. Time Off conflict", async () => {
    await GuideTimeOff.create({
      guide: guideId, startDate: getBaseDate(), endDate: getNextDate(),
      status: "approved", reason: "vacation"
    });

    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "09:00 AM", "12:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /time off/);
    }
  });

  it("5. Custom Request conflict", async () => {
    await TourRequest.create({
      user: guideId, tourId: tourId, requestType: "custom_date",
      preferredDate: getBaseDate(), preferredTime: "09:00 AM",
      travelers: 2, status: "awaiting_payment", assignedGuide: guideId
    });

    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "10:00 AM", "02:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /Custom Tour Request/);
    }
  });

  it("6. Guide reassignment conflict", async () => {
    await Tour.updateOne({ _id: tourId }, {
      $push: { schedules: {
        guide: guideId, startDate: getBaseDate(), endDate: getBaseDate(),
        startTime: "09:00", endTime: "12:00", meetingPoint: "Point", status: "published"
      }}
    });

    const updatedTour = await Tour.findById(tourId);
    const scheduleId = updatedTour.schedules[0]._id;

    // A second guide creating another schedule to be reassigned to the first guide
    const guide2 = new User({
      name: "Guide 2", email: "g2_" + Date.now() + "@example.com",
      password: "pass", role: "guide"
    });
    await guide2.save();

    await Tour.updateOne({ _id: tourId }, {
      $push: { schedules: {
        guide: guide2._id, startDate: getBaseDate(), endDate: getBaseDate(),
        startTime: "10:00 AM", endTime: "01:00 PM", meetingPoint: "Point", status: "published"
      }}
    });

    const finalTour = await Tour.findById(tourId);
    const targetSchedule = finalTour.schedules[1];

    const req = {
      params: { tourId: tourId, scheduleId: targetSchedule._id },
      body: { guideId: guideId.toString() }
    };
    const res = mockRes();
    
    let caughtErr = null;
    try {
      await reassignGuideAdmin(req, res, (err) => { caughtErr = err; });
    } catch (err) {
      caughtErr = err;
    }

    await User.findByIdAndDelete(guide2._id);

    assert.ok(caughtErr, "reassignGuideAdmin should trigger conflict error");
    assert.equal(caughtErr.statusCode, 409);
  });

  it("7. Multi-day overlap conflict", async () => {
    await Tour.updateOne({ _id: tourId }, {
      $push: { schedules: {
        guide: guideId, startDate: getBaseDate(), endDate: getNextDate(),
        startTime: "09:00 AM", endTime: "05:00 PM", meetingPoint: "Point", status: "published"
      }}
    });

    try {
      await checkGuideAvailability(guideId, getNextDate(), getNextDate(), "09:00 AM", "12:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
    }
  });

  it("8. Same-day partial time overlap conflict", async () => {
    await Tour.updateOne({ _id: tourId }, {
      $push: { schedules: {
        guide: guideId, startDate: getBaseDate(), endDate: getBaseDate(),
        startTime: "09:00 AM", endTime: "01:00 PM", meetingPoint: "Point", status: "published"
      }}
    });

    // 12:00 - 15:00 overlaps with 09:00 - 13:00
    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "12:00 PM", "03:00 PM");
      assert.fail("Should have thrown conflict");
    } catch (err) {
      assert.equal(err.statusCode, 409);
    }
    
    // 13:00 - 15:00 does NOT overlap with 09:00 - 13:00
    try {
      await checkGuideAvailability(guideId, getBaseDate(), getBaseDate(), "01:00 PM", "03:00 PM");
      // Should pass
    } catch (err) {
      assert.fail("Should NOT have thrown conflict for adjacent times");
    }
  });

  it("9. Race-condition simulation", async () => {
    // If two concurrent requests try to book the exact same slot.
    // Since our DB doesn't have a unique constraint, we'll test if we introduced a locking mechanism
    // Or if the transaction blocks it. 
    // Currently, without a mutex or transaction, it might fail to prevent double booking.
    const req1 = {
      params: { id: tourId },
      body: { guideId: guideId.toString(), startDate: getBaseDate(), endDate: getBaseDate(), startTime: "09:00 AM", endTime: "12:00 PM", meetingPoint: "P", capacity: 10 }
    };
    const req2 = {
      params: { id: tourId },
      body: { guideId: guideId.toString(), startDate: getBaseDate(), endDate: getBaseDate(), startTime: "09:00 AM", endTime: "12:00 PM", meetingPoint: "P", capacity: 10 }
    };

    let err1 = null;
    let err2 = null;

    await Promise.all([
      createSchedule(req1, mockRes(), (err) => { err1 = err; }).catch(e => err1 = e),
      createSchedule(req2, mockRes(), (err) => { err2 = err; }).catch(e => err2 = e)
    ]);

    // At least one should fail with 409 Conflict if race conditions are properly handled.
    // NOTE: This might fail if the app lacks transaction or mutex locking.
    const oneFailed = (err1 && err1.statusCode === 409) || (err2 && err2.statusCode === 409);
    // Let's assert it anyway. If it fails, we know we need to fix the race condition!
    assert.ok(oneFailed, "At least one concurrent request should fail with 409 Conflict");
    
    // Verify only one schedule was created
    const updatedTour = await Tour.findById(tourId);
    assert.equal(updatedTour.schedules.length, 1, "Only one schedule should be created");
    
    // Verify lock is automatically released
    const lockExists = await GuideLock.exists({ guideId });
    assert.ok(!lockExists, "Guide lock should be released after process completes");
  });
});
