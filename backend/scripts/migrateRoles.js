// Migration script: Update club_leader to faculty_coordinator
// Run with: node backend/scripts/migrateRoles.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs";

async function migrate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  // 1. Update User role: club_leader -> faculty_coordinator
  console.log("\n1. Updating User roles from club_leader to faculty_coordinator...");
  const userResult = await db.collection("users").updateMany(
    { role: "club_leader" },
    { $set: { role: "faculty_coordinator" } }
  );
  console.log(`   Updated ${userResult.modifiedCount} users`);

  // 2. Convert clubId to clubIds array for users with clubId
  console.log("\n2. Converting clubId to clubIds array...");
  const usersWithClubId = await db.collection("users").find({ 
    clubId: { $exists: true, $ne: null } 
  }).toArray();
  
  let convertedCount = 0;
  for (const user of usersWithClubId) {
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { clubIds: [user.clubId] },
        $unset: { clubId: "" }
      }
    );
    convertedCount++;
  }
  console.log(`   Converted ${convertedCount} users from clubId to clubIds`);

  // 3. Update Club model: rename leader to coordinator
  console.log("\n3. Renaming Club.leader to Club.coordinator...");
  const clubsWithLeader = await db.collection("clubs").find({ 
    leader: { $exists: true, $ne: null } 
  }).toArray();
  
  let clubsUpdated = 0;
  for (const club of clubsWithLeader) {
    await db.collection("clubs").updateOne(
      { _id: club._id },
      { 
        $set: { coordinator: club.leader },
        $unset: { leader: "" }
      }
    );
    clubsUpdated++;
  }
  console.log(`   Updated ${clubsUpdated} clubs`);

  // 4. Update Membership clubRole: "Leader" -> "Faculty Coordinator"
  console.log("\n4. Updating Membership clubRole from Leader to Faculty Coordinator...");
  const membershipResult = await db.collection("memberships").updateMany(
    { clubRole: "Leader" },
    { $set: { clubRole: "Faculty Coordinator", roleRank: 0 } }
  );
  console.log(`   Updated ${membershipResult.modifiedCount} memberships`);

  // 5. Update Club category values to lowercase
  console.log("\n5. Normalizing Club category values to lowercase...");
  const categoryMapping = {
    "Technical": "technical",
    "Cultural": "cultural",
    "Sports": "sports",
    "Marketing": "other",
    "Literary": "literary",
  };
  
  let categoriesUpdated = 0;
  for (const [oldCategory, newCategory] of Object.entries(categoryMapping)) {
    const result = await db.collection("clubs").updateMany(
      { category: oldCategory },
      { $set: { category: newCategory } }
    );
    categoriesUpdated += result.modifiedCount;
  }
  console.log(`   Updated ${categoriesUpdated} club categories`);

  // 6. Add isOrphaned field to clubs without coordinator
  console.log("\n6. Marking orphaned clubs...");
  const orphanResult = await db.collection("clubs").updateMany(
    { coordinator: null },
    { $set: { isOrphaned: true } }
  );
  console.log(`   Marked ${orphanResult.modifiedCount} clubs as orphaned`);

  console.log("\n✅ Migration completed successfully!");
  console.log("\nSummary:");
  console.log(`   - Users updated: ${userResult.modifiedCount}`);
  console.log(`   - Users converted (clubId -> clubIds): ${convertedCount}`);
  console.log(`   - Clubs updated (leader -> coordinator): ${clubsUpdated}`);
  console.log(`   - Memberships updated: ${membershipResult.modifiedCount}`);
  console.log(`   - Categories normalized: ${categoriesUpdated}`);
  console.log(`   - Orphaned clubs: ${orphanResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
