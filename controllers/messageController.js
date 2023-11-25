const catchAsync = require('./utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const sendResponse = require('../utils/sendResponse');
const redisClient = require('./../utils/redisClient');
const generateUserPrompt = require('../prompts/generateUserPrompt');
const client = require('./../utils/redisClient');
const { generateAIResponse } = require('./../openAI');
const sendMessage = catchAsync(async (req, res, next) => {
  try {
    const { content, chatId } = req.body;
    const { _id: userId, gender } = req.user;
    const user = await User.findById(userId);
    let chat;
    let message;
    let responseMessage;
    let messagePrompts;
    await redisClient.connect();
    if (!chatId) {
      // Create a new Chat if the message is in a fresh chat

      chat = new Chat({
        user: userId,
      });
      await chat.save();
      let newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
        role: 'user',
      });
      await newMessage.save();
      let userDetails = {
        age: await user.calculateAge(),
        gender: user.gender,
      };
      //Create new chat keypair in redis
      let chatPrompts = [
        {
          role: 'system',
          content:
            'You are a healthcare assistant, List all the possible conditions associated with the symptoms, symptoms assosiated with the different conditions, their overviews, causes and treatment options based on the gender, age and symptoms given by the user as a complaint.',
        },

        { role: 'system', content: generateUserPrompt(userDetails) },
        { role: 'user', content: newMessage.content },
      ];
      await redisClient.set(String(chat.id), JSON.stringify(chatPrompts));

      chat.firstMessage = newMessage.id;
      await chat.save();
      message = newMessage;
      messagePrompts = chatPrompts;
    } else {
      // Fetch last message
      chat = await Chat.findById(chatId);
      let newMessage = new Message({
        user: userId,
        chat: chat.id,
        content: content,
        role: 'user',
      });
      await newMessage.save();
      let chatLastMessage = await Message.findOne({
        _id: chat.firstMessage,
      }).sort({ timestamp: -1 });
      if (chatLastMessage) {
        chatLastMessage.nextMessage = newMessage.id;
        await chatLastMessage.save();
      }
      // Fetch messages from Redis to form prompt chain
      const chatPrompts = await redisClient.get(String(chat.id));
      //   Update Chat messages
      const newChatPrompts = [
        ...JSON.parse(chatPrompts),
        { role: 'user', content: newMessage.content },
      ];

      await redisClient.set(String(chat.id), JSON.stringify(newChatPrompts));
      message = newMessage;
      messagePrompts = newChatPrompts;
    }

    // Generate AI Response

    const aiResponse = await generateAIResponse(messagePrompts);

    // Create Message Document

    responseMessage = new Message({
      user: userId,
    });

    //Persist in cache

    // Return response
  } catch (error) {
    next(new AppError(error.message, '400'));
  } finally {
    await redisClient.disconnect();
  }
});
