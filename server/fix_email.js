const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://marefu:marefu%40%403854@cluster0.oi3s1wj.mongodb.net/kambata-travel?appName=Cluster0')
  .then(async () => {
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { email: 'abebetegegn63@gmail.com' },
      { $set: { isEmailVerified: true } }
    );
    console.log('Modified:', result.modifiedCount);
    process.exit(0);
  });
