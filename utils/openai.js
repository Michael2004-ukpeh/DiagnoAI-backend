const { OpenAI } = require('openai');
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openAI;
