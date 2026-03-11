const app = require('../app');
const connectDB = require('../config/db');

let connecting = connectDB();

module.exports = async (req, res) => {
  await connecting;
  app(req, res);
};
