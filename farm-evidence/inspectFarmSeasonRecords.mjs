import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/farmEvidence', { dbName: 'farmEvidence' });
  const db = mongoose.connection.db;
  const records = await db.collection('farm_season_records').find({}).limit(20).toArray();
  console.log('count', records.length);
  records.forEach((r, i) => {
    console.log('--- record', i, 'id=', r._id?.toString(), 'remoteId=', r.remoteId, 'farm_name=', r.farm_name || r.farmName, 'season=', r.season, 'year=', r.year);
  });
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
