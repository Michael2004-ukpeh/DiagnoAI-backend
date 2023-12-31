const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User must be foud to send a message'],
    },
    chat: {
      type: mongoose.Schema.ObjectId,
      ref: 'Chat',
    },
    nextMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
    },
    content: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
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

const Message = mongoose.model('message', messageSchema, 'messages');
module.exports = Message;
