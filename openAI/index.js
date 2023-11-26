const openAI = require('./../utils/openai');
exports.generateAIResponse = async (messagePrompts) => {
  const completion = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo-16k',
    messages: messagePrompts,
    temperature: 1,
  });
  return completion.choices[0].message.content;
};
exports.generateAITitle = async (response) => {
  const completion = await openAI.chat.completions.create({
    model: 'gpt-3.5-turbo-16k',
    messages: [
      {
        role: 'system',
        content:
          'You are a tool to get the best title of a piece of text , get me a title',
      },
      {
        role: 'assistant',
        content: `
            This is text below:
            ${response}
            `,
      },
    ],
  });
  return completion.choices[0].message.content;
};
