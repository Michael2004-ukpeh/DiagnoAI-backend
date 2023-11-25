const openAI = require('./../utils/openai');
exports.generateAIResponse = async (messagePrompts) => {
  const completion = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo-16k',
    messages: messagePrompts,
    temperature: 1,
  });
  return completion.choices[0].message.content;
};
