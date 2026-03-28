import "dotenv/config";
import mongoose from "mongoose";
import Club from "../models/Club.js";
import { generateSlug, ensureUniqueClubSlug } from "../utils/generateSlug.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const missing = await Club.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
  }).select("_id name");

  console.log(`Clubs missing slug: ${missing.length}`);

  for (const c of missing) {
    const base = generateSlug(c.name) || "club";
    const slug = await ensureUniqueClubSlug(Club, base, { _id: { $ne: c._id } });
    await Club.updateOne({ _id: c._id }, { $set: { slug } });
    console.log(`  ${c.name} -> ${slug}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
