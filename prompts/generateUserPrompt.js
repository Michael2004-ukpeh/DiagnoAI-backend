const generateUserPrompt = ({ age, gender }) => {
  return `Here are the user's details\n
  Age: ${age}, \n
  Gender:${gender}
  `;
};

module.exports = generateUserPrompt;
