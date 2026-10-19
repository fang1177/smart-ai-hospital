/**
 * migrate.js — Automated local-to-Atlas MongoDB Data Migrator
 *
 * Usage:
 *   node migrate.js <ATLAS_CONNECTION_STRING>
 *
 * Example:
 *   node migrate.js "mongodb+srv://admin:pass@cluster0.abcde.mongodb.net/smarthospital?retryWrites=true&w=majority"
 */

const mongoose = require('mongoose');
const { MongoClient } = mongoose.mongo;

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/smarthospital';
const TARGET_URI = process.argv[2] || process.env.MONGO_URI;

if (!TARGET_URI || TARGET_URI.includes('localhost') || TARGET_URI.includes('127.0.0.1')) {
  console.error('\n❌ Please provide a valid remote/Atlas MongoDB URI as an argument.');
  console.error('Usage: node migrate.js "<YOUR_ATLAS_URI>"\n');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting MongoDB Migration...');
  console.log(`Source (Local):  ${LOCAL_URI}`);
  console.log(`Target (Atlas):  ${TARGET_URI.replace(/:([^@]+)@/, ':****@')}`);

  const localClient = new MongoClient(LOCAL_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    await localClient.connect();
    console.log('✅ Connected to Local MongoDB');

    await targetClient.connect();
    console.log('✅ Connected to MongoDB Atlas Target');

    const sourceDb = localClient.db();
    const targetDb = targetClient.db();

    const collections = await sourceDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections to transfer:\n`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      console.log(`  → Migrating "${colName}" (${docs.length} documents)...`);

      if (docs.length > 0) {
        // Clear destination collection or upsert
        await targetCol.deleteMany({});
        await targetCol.insertMany(docs);
      }
      console.log(`    ✓ "${colName}" synced successfully.`);
    }

    console.log('\n🎉 All local data has been successfully copied to your MongoDB Atlas cluster!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await localClient.close();
    await targetClient.close();
    console.log('🔒 Connections closed.');
  }
}

runMigration();
