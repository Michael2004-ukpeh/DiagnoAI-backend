const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [ture, 'User is required to create a chat'],
    },
    title: {
      type: String,
    },
  },
  {
    strict: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },

    timestamps: true,
  }
);
