require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  try {
    const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";
    await mongoose.connect(dbUri);
    console.log("Connected to MongoDB:", dbUri);
    
    // Test if transactions are supported
    const session = await mongoose.startSession();
    session.startTransaction();
    await session.abortTransaction();
    session.endSession();
    
    console.log("REPLICA SET TRANSACTIONS SUPPORTED!");
  } catch (error) {
    console.error("TRANSACTIONS NOT SUPPORTED:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

check();
