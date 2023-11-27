const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Chat = require('./../models/chatModel');
const AppError = require('./../utils/AppError');

exports.getAllChats = factory.getAll(Chat);

//TODO: Setup delete Chat and clear messages of each chat from Redis and MongoDB
exports.deleteChat = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Chat.findById(id);
    await document.deleteOne();
    if (!document) {
      return next(new AppError('No document Found With That ID', 404));
    }
    // // Delete all messages from Mongodb
    // const { deletedCount } = await Message.deleteMany({ chat: this._id });

    // console.log(deletedCount);
    // //Connnect to Redis Store
    // await redisClient.connect();
    // // Delete Chat ID Key from Redis Store
    // await redisClient.del(String(this.id));
    res.status(200).json({
      status: 'Success',
      message: 'Document deleted',
      data: null,
    });
  } catch (error) {
    next(new AppError(error, 500));
  }
});

exports.deleteAllChats = catchAsync(async (req, res, next) => {
  try {
    //find all chats owned by user and delete
    const { deletedCount } = await Chat.deleteMany({
      user: req.user.id,
    }).exec();

    if (deletedCount === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No chat found related to user',
        data: null,
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Chats deleted permanently',
      data: null,
    });
  } catch (error) {
    next(new AppError(error, 500));
  } finally {
  }
});
