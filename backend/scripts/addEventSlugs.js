import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import { generateSlug, ensureUniqueEventSlug } from "../utils/generateSlug.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const missing = await Event.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
  }).select("_id title");

  console.log(`Events missing slug: ${missing.length}`);

  for (const e of missing) {
    const base = generateSlug(e.title) || "event";
    const slug = await ensureUniqueEventSlug(Event, base, { _id: { $ne: e._id } });
    await Event.updateOne({ _id: e._id }, { $set: { slug } });
    console.log(`  ${e.title} -> ${slug}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
