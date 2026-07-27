const mongoose = require("mongoose");
require("dotenv").config();
const ChatRoom = require("./models/ChatRoom");
const Message = require("./models/Message");

async function clean() {
  await mongoose.connect(process.env.DATABASE_URI);
  console.log("Connected to DB");

  // Find chat rooms created in May or earlier (before June 1, 2026)
  const oldDate = new Date("2026-06-01T00:00:00Z");
  const oldRooms = await ChatRoom.find({ createdAt: { $lt: oldDate } });
  
  console.log(`Found ${oldRooms.length} old chat rooms.`);
  
  for (let room of oldRooms) {
    console.log(`Deleting room: ${room._id} (Title: ${room.title}, Date: ${room.createdAt})`);
    await Message.deleteMany({ room: room._id });
    await ChatRoom.findByIdAndDelete(room._id);
  }
  
  console.log("Done clearing old test chats.");
  process.exit(0);
}

clean().catch(console.error);
