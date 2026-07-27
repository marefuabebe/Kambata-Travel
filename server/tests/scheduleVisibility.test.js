const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Tour = require("../models/Tour");
const User = require("../models/User");
const Destination = require("../models/Destination");
const { createSchedule, getTourById } = require("../controllers/tourController");

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

describe("Schedule Visibility Integration Test", async () => {
  let tourId;
  let guideId;
  let destId;

  before(async () => {
    await mongoose.connect(process.env.DATABASE_URI);
    
    // Create a mock guide
    const guide = new User({
      name: "Test Guide",
      email: "testguide_" + Date.now() + "@example.com",
      password: "Password123!",
      role: "guide",
      guideStatus: "approved",
      schedulingDisabled: false,
      isBlocked: false
    });
    await guide.save();
    guideId = guide._id;

    // Create a mock destination
    const dest = new Destination({ 
      name: { en: "Test Dest", am: "Test" }, 
      location: { region: "Test", zone: "Test", woreda: "Test" },
      description: { en: "test", am: "test" },
      coordinates: { latitude: 0, longitude: 0 },
      bestTimeToVisit: { en: "test", am: "test" }
    });
    await dest.save();
    destId = dest._id;

    // Create a mock tour
    const tour = new Tour({
      title: { en: "Test Tour", am: "Test Tour" },
      description: { en: "Test Desc", am: "Test Desc" },
      category: "Adventure",
      destination: destId,
      createdBy: guideId, // random user
      price: 100,
      duration: { value: 2, unit: "days" },
      difficulty: "easy",
      maxCapacity: 10,
      isPublished: true,
      bookingType: "both"
    });
    await tour.save();
    tourId = tour._id;
  });

  after(async () => {
    // Cleanup
    if (tourId) await Tour.findByIdAndDelete(tourId);
    if (guideId) await User.findByIdAndDelete(guideId);
    if (destId) await Destination.findByIdAndDelete(destId);
    await mongoose.disconnect();
  });

  it("newly created public schedule is immediately discoverable by traveler", async () => {
    // 1. Admin creates a schedule
    const reqCreate = {
      params: { id: tourId },
      body: {
        guideId: guideId.toString(),
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 172800000).toISOString(),
        startTime: "09:00",
        endTime: "17:00",
        meetingPoint: "Test Point",
        capacity: 10
      }
    };
    const resCreate = mockRes();
    const nextCreate = (err) => { throw err; };

    await createSchedule(reqCreate, resCreate, nextCreate);

    assert.equal(resCreate.statusCode, 201, "createSchedule should return 201");
    assert.equal(resCreate.data.data.status, "published", "New schedule must default to 'published'");

    // 2. Traveler fetches the tour details
    const reqGet = {
      params: { id: tourId },
      user: null // unauthenticated traveler
    };
    const resGet = mockRes();
    const nextGet = (err) => { throw err; };

    await getTourById(reqGet, resGet, nextGet);

    // 3. Verify visibility
    const responseData = resGet.data.data;
    assert.ok(responseData, "Tour data should be returned");
    assert.equal(responseData.hasLiveSchedule, true, "hasLiveSchedule MUST be true for the Book Now button to appear");
    assert.equal(responseData.canInstantBook, true, "canInstantBook MUST be true for the Book Now button to appear");
    assert.ok(responseData.schedules.length > 0, "Schedules array should contain the bookable schedule");
    assert.equal(responseData.schedules[0].status, "published", "Schedule must be published to be visible");
  });
});
