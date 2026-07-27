const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const Destination = require("../models/Destination");
require("dotenv").config();

/**
 * Migration script to transform existing flat strings to {en, am} objects.
 * Following requirement: Copy English to other fields as placeholder initially.
 */
const migrateToI18n = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for i18n migration...");

    // 1. Migrate Tours
    const tours = await Tour.find({});
    for (const tour of tours) {
      const needsMigration = typeof tour.title === 'string';
      
      if (needsMigration) {
        const oldTitle = tour.title;
        const oldDesc = tour.description;
        
        tour.title = { en: oldTitle, am: oldTitle };
        tour.description = { en: oldDesc, am: oldDesc };
        
        await tour.save();
        console.log(`Migrated Tour: ${oldTitle}`);
      }
    }

    // 2. Migrate Destinations
    const destinations = await Destination.find({});
    for (const dest of destinations) {
      const needsMigration = typeof dest.name === 'string';
      
      if (needsMigration) {
        const oldName = dest.name;
        const oldDesc = dest.description;
        
        dest.name = { en: oldName, am: oldName };
        dest.description = { en: oldDesc, am: oldDesc };
        
        await dest.save();
        console.log(`Migrated Destination: ${oldName}`);
      }
    }

    console.log("i18n Migration Completed Successfully!");
    process.exit();
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

migrateToI18n();
