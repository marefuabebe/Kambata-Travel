const mongoose = require('mongoose');

const GuideTimeOffSchema = new mongoose.Schema({
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    enum: ['vacation', 'sick', 'other_agency', 'personal'],
    default: 'personal'
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now, or require admin approval
  }
}, { timestamps: true });

module.exports = mongoose.model('GuideTimeOff', GuideTimeOffSchema);
