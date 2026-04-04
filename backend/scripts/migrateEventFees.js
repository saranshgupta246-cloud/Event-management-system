/**
 * Migrates legacy Event.registrationFee to multi-type fields and ensures
 * Registration documents have team fields + seatsConsumed.
 * Rebuilds UTR index (per-event uniqueness). Backup the database first.
 */
import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const coll = Event.collection;
  const cursor = coll.find({
    $or: [{ registrationTypes: { $exists: false } }, { registrationTypes: { $size: 0 } }],
  });

  let eventsUpdated = 0;
  for await (const e of cursor) {
    const legacyFee = typeof e.registrationFee === "number" ? e.registrationFee : 0;
    const isFreeSolo = legacyFee <= 0;
    await coll.updateOne(
      { _id: e._id },
      {
        $set: {
          registrationTypes: ["solo"],
          fees: { solo: legacyFee, duo: 0, squad: 0 },
          isFree: { solo: isFreeSolo, duo: true, squad: true },
          teamSize: { min: 2, max: 5 },
        },
        $unset: { registrationFee: "" },
      }
    );
    eventsUpdated += 1;
    console.log(`  Event "${e.title}": fee → solo ${legacyFee}`);
  }

  const regColl = Registration.collection;
  const regs = await Registration.find({}).lean();
  let regsUpdated = 0;
  for (const r of regs) {
    const seatsConsumed =
      typeof r.seatsConsumed === "number" && r.seatsConsumed > 0
        ? r.seatsConsumed
        : 1 + (r.teammates?.length || 0);
    await regColl.updateOne(
      { _id: r._id },
      {
        $set: {
          registrationType: r.registrationType || "solo",
          teamName: r.teamName || "",
          isTeamLeader: r.isTeamLeader !== false,
          teammates: Array.isArray(r.teammates) ? r.teammates : [],
          seatsConsumed,
          amountPaid: typeof r.amountPaid === "number" ? r.amountPaid : 0,
        },
      }
    );
    regsUpdated += 1;
  }

  console.log(`Events migrated: ${eventsUpdated}, registrations updated: ${regsUpdated}`);

  await Registration.syncIndexes();
  console.log("Registration indexes synced.");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
