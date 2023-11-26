const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Chat = require('./../models/chatModel');
exports.getAllChats = factory.getAll(Chat);

//TODO: Setup delete Chat and clear messages of each chat from Redis and MongoDB
