import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const poll = await db.collection('polls').findOne(); // just get the most recent poll or any
  console.log("Voted Users:", poll.votedUsers);
  console.log("Options:", JSON.stringify(poll.options, null, 2));
  process.exit(0);
});
