const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User is required to create a chat'],
    },
    title: {
      type: String,
    },
    firstMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
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

const Chat = mongoose.model('Chat', chatSchema, 'chats');
module.exports = Chat;
