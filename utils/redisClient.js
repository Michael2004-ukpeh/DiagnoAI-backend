const { createClient } = require('redis');

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// const connect = async () => {

// }

// client.on('error', (err) => console.log('Redis Client Error', err));

module.exports = client;
