const mongoose = require('mongoose');

const filterHistorySchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

const FilterHistory = mongoose.model('FilterHistory', filterHistorySchema);

module.exports = FilterHistory;
