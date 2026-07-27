const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AILog', aiLogSchema);
