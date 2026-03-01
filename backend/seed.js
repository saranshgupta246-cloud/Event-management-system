import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Club from "./models/Club.js";
import ClubMember from "./models/ClubMember.js";
import RecruitmentDrive from "./models/RecruitmentDrive.js";
import Application from "./models/Application.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const hashed = await bcrypt.hash("password123", 10);

  // 1 admin
  const admin = await User.findOneAndUpdate(
    { email: "admin@mits.ac.in" },
    {
      name: "Admin User",
      email: "admin@mits.ac.in",
      password: hashed,
      role: "admin",
      isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log("Admin:", admin.email);

  // 3 students
  const students = await Promise.all(
    [
      { name: "Student One", email: "student1@mits.ac.in" },
      { name: "Student Two", email: "student2@mits.ac.in" },
      { name: "Student Three", email: "student3@mits.ac.in" },
    ].map(async (s) => {
      const user = await User.findOneAndUpdate(
        { email: s.email },
        {
          name: s.name,
          email: s.email,
          password: hashed,
          role: "student",
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log("Student:", user.email);
      return user;
    })
  );

  // 3 clubs (Technical, Cultural, Sports)
  const clubs = await Promise.all(
    [
      { name: "MITS Coding Club", category: "Technical", description: "Technical club for coding and development." },
      { name: "MITS Cultural Society", category: "Cultural", description: "Cultural events and performances." },
      { name: "MITS Sports Club", category: "Sports", description: "Sports and fitness activities." },
    ].map(async (c) => {
      const club = await Club.findOneAndUpdate(
        { name: c.name },
        { ...c, status: "active" },
        { upsert: true, new: true }
      );
      console.log("Club:", club.name);
      return club;
    })
  );

  // Add admin as member of first club (optional); add first student as President of each club
  for (let i = 0; i < clubs.length; i++) {
    await ClubMember.findOneAndUpdate(
      { clubId: clubs[i]._id, userId: students[0]._id },
      { clubId: clubs[i]._id, userId: students[0]._id, role: "President", status: "active" },
      { upsert: true, new: true }
    );
    await ClubMember.findOneAndUpdate(
      { clubId: clubs[i]._id, userId: students[1]._id },
      { clubId: clubs[i]._id, userId: students[1]._id, role: "Member", status: "active" },
      { upsert: true, new: true }
    );
  }
  console.log("Members added.");

  // 2 drives: one open, one closed (for first club)
  const openDrive = await RecruitmentDrive.findOneAndUpdate(
    { clubId: clubs[0]._id, title: "Core Team 2024" },
    {
      clubId: clubs[0]._id,
      title: "Core Team 2024",
      roleTitle: "Core Member",
      description: "Join the coding club core team.",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "open",
    },
    { upsert: true, new: true }
  );
  const closedDrive = await RecruitmentDrive.findOneAndUpdate(
    { clubId: clubs[0]._id, title: "Previous Drive (Closed)" },
    {
      clubId: clubs[0]._id,
      title: "Previous Drive (Closed)",
      roleTitle: "Volunteer",
      description: "This drive is closed.",
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "closed",
    },
    { upsert: true, new: true }
  );
  console.log("Drives:", openDrive.title, closedDrive.title);

  // Sample applications: student2 and student3 apply to open drive
  await Application.findOneAndUpdate(
    { driveId: openDrive._id, applicantId: students[1]._id },
    {
      driveId: openDrive._id,
      clubId: clubs[0]._id,
      applicantId: students[1]._id,
      status: "pending",
    },
    { upsert: true, new: true }
  );
  await Application.findOneAndUpdate(
    { driveId: openDrive._id, applicantId: students[2]._id },
    {
      driveId: openDrive._id,
      clubId: clubs[0]._id,
      applicantId: students[2]._id,
      status: "shortlisted",
    },
    { upsert: true, new: true }
  );
  console.log("Applications added.");

  console.log("Seed completed.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
