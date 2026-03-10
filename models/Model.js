const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Model', modelSchema);
