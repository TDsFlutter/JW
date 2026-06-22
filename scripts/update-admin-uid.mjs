/**
 * One-time script to update the admin user's _id and uid in MongoDB.
 * Old UID: 7InVfzqvPcZZ3T1U2e1Ky6S1Sv32
 * New UID: zsTvN4fN6FbGuYVSoVHlji2bvLA3
 *
 * Run with:  node scripts/update-admin-uid.mjs
 */

import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://datastoreinfotech:TrunalJW@cluster0.p0btjo7.mongodb.net/?appName=Cluster0";
const DB_NAME = "ella_jewelry";

const OLD_UID = "7InVfzqvPcZZ3T1U2e1Ky6S1Sv32";
const NEW_UID = "zsTvN4fN6FbGuYVSoVHlji2bvLA3";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);
    const users = db.collection("users");

    // 1. Find the old document
    const oldDoc = await users.findOne({ _id: OLD_UID });
    if (!oldDoc) {
      console.log(`⚠️  No document found with _id = "${OLD_UID}".`);

      // Check if it already has the new UID
      const existing = await users.findOne({ _id: NEW_UID });
      if (existing) {
        console.log(`✅ Document with _id = "${NEW_UID}" already exists — nothing to do.`);
        console.log("   Current document:", JSON.stringify(existing, null, 2));
      } else {
        console.log("❌ No document found with either old or new UID.");
      }
      return;
    }

    console.log("📄 Found old document:", JSON.stringify(oldDoc, null, 2));

    // 2. Create new document with updated _id and uid
    const newDoc = { ...oldDoc, _id: NEW_UID, uid: NEW_UID };

    // 3. Insert the new document
    await users.insertOne(newDoc);
    console.log(`✅ Inserted new document with _id = "${NEW_UID}"`);

    // 4. Delete the old document
    await users.deleteOne({ _id: OLD_UID });
    console.log(`✅ Deleted old document with _id = "${OLD_UID}"`);

    // 5. Also update any orders or other collections that reference the old UID
    const orders = db.collection("orders");
    const orderResult = await orders.updateMany(
      { user_id: OLD_UID },
      { $set: { user_id: NEW_UID } }
    );
    console.log(`✅ Updated ${orderResult.modifiedCount} order(s) with new user_id`);

    // 6. Verify
    const verify = await users.findOne({ _id: NEW_UID });
    console.log("\n🎉 Migration complete! Updated document:");
    console.log(JSON.stringify(verify, null, 2));
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

main();
