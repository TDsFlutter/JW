import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ella_jewelry';

// Cache the client across hot-reloads in development and across
// serverless invocations in production.
let cached = global._mongo;
if (!cached) {
  cached = global._mongo = { client: null, promise: null };
}

export async function getClient() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local');
  }
  if (cached.client) return cached.client;
  if (!cached.promise) {
    cached.promise = new MongoClient(uri).connect();
  }
  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb() {
  const client = await getClient();
  return client.db(dbName);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}
