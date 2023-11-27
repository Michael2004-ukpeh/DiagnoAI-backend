const mongoose = require('mongoose');
const Message = require('./messageModel');
const redisClient = require('./../utils/redisClient');
const AppError = require('../utils/AppError');
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

chatSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      // Delete all messages from Mongodb

      const { deletedCount } = await Message.deleteMany({
        chat: this.id,
      }).exec();

      //Connnect to Redis Store
      await redisClient.connect();
      // Delete Chat ID Key from Redis Store
      await redisClient.del(String(this.id));
    } catch (err) {
      next(new AppError(err, 500));
    } finally {
      // Disconnect from Redis Store
      await redisClient.disconnect();
    }
  }
);

chatSchema.pre(
  'deleteMany',

  async function (next) {
    try {
      //Get Chats to be deleted
      const chatsBeingDeleted = await this.model.find(this.getQuery());
      await redisClient.connect();

      // Delete related messages for each chat being deleted
      for (const chat of chatsBeingDeleted) {
        // Delete all messages from Mongodb
        const { deletedCount } = await Message.deleteMany({
          chat: chat.id,
        }).exec();

        // Delete Chat ID Key from Redis Store
        await redisClient.del(String(chat.id));
      }
    } catch (err) {
      next(new AppError(err, 500));
    } finally {
      // Disconnect from Redis Store
      await redisClient.disconnect();
    }
  }
);
const Chat = mongoose.model('Chat', chatSchema, 'chats');

module.exports = Chat;
