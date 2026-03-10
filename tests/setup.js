require('dotenv').config();
const mongoose = require('mongoose');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
}, 15000);

afterAll(async () => {
  await mongoose.connection.close();
});
