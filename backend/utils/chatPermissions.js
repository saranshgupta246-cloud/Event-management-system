import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

const { ObjectId } = mongoose.Types;

export async function isChatModerator(user, eventId) {
  if (!user || !ObjectId.isValid(eventId)) return false;

  if (user.role === "admin") return true;

  const event = await Event.findById(eventId).select("createdBy clubId").lean();
  if (!event) return false;

  if (event.createdBy && event.createdBy.toString() === user._id.toString()) {
    return true;
  }

  if (
    ["club_leader", "faculty"].includes(user.role) &&
    user.clubId &&
    event.clubId &&
    user.clubId.toString() === event.clubId.toString()
  ) {
    return true;
  }

  return false;
}

export async function canReadEventChat(user, eventId) {
  if (!user || !ObjectId.isValid(eventId)) return false;

  if (user.role === "admin") return true;

  if (user.role === "student") {
    const exists = await Registration.exists({
      user: user._id,
      event: eventId,
      status: "confirmed",
    });
    return !!exists;
  }

  // Leaders / faculty can read if they moderate this event
  return isChatModerator(user, eventId);
}

export async function canSendEventChat(user, eventId) {
  if (!user || !ObjectId.isValid(eventId)) return false;

  // Moderators (admin / organizers / same-club leaders & faculty) can always send
  if (await isChatModerator(user, eventId)) return true;

  // For students, sending depends on chatMode + confirmed registration
  if (user.role === "student") {
    const event = await Event.findById(eventId).select("chatMode").lean();
    if (!event || event.chatMode !== "everyone") return false;

    const exists = await Registration.exists({
      user: user._id,
      event: eventId,
      status: "confirmed",
    });
    return !!exists;
  }

  // Any other roles that are not moderators are not allowed to send
  return false;
}

