// @ts-nocheck

const mongoose = require('mongoose');
const { initializeApp, cert } = require('firebase-admin/app');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');
const serviceAccount = require('./onestop-a631d-firebase-adminsdk-k4m8w-0c3fca699d.json');

const boot = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Database connected');

  await app.listen(process.env.PORT);
  console.log(`Server is listening on port ${process.env.PORT}`);

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'gs://onestop-a631d.appspot.com',
  });
};

try {
  boot();
} catch (err) {
  console.log('Error occured : ', err);
}
