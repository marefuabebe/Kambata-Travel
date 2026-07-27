const ChatRoom = require("../models/ChatRoom");
const Tour = require("../models/Tour");

/**
 * Ensure a chat room exists for a booking (traveler + guide).
 */
const ensureChatRoomForBooking = async ({ bookingId, tourId, travelerId, guideId }) => {
  if (!travelerId) return null;

  let room = await ChatRoom.findOne({ booking: bookingId, contextType: "booking" });
  if (room) {
    if (guideId && !room.participants.includes(guideId)) {
      room.participants.push(guideId);
      await room.save();
    }
    return room;
  }

  const tour = await Tour.findById(tourId);
  const title = tour ? (tour.title?.en || "Tour Booking") : "Tour Booking";

  const participants = [travelerId];
  if (guideId) participants.push(guideId);

  return ChatRoom.create({
    participants,
    title,
    contextType: "booking",
    booking: bookingId,
  });
};

/**
 * Chat room for custom-date negotiation (before a booking exists).
 */
const ensureChatRoomForRequest = async ({ travelerId, guideId, requestId }) => {
  let room = await ChatRoom.findOne({ customRequest: requestId, contextType: "request" });

  if (room) {
     if (guideId && !room.participants.includes(guideId)) {
       room.participants.push(guideId);
       await room.save();
     }
     return room;
  }

  const participants = [travelerId];
  if (guideId) participants.push(guideId);

  return ChatRoom.create({
    participants,
    title: "Custom Request",
    contextType: "request",
    customRequest: requestId
  });
};

module.exports = {
  ensureChatRoomForBooking,
  ensureChatRoomForRequest,
};
