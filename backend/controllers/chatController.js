import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { canReadEventChat, canSendEventChat, isChatModerator } from "../utils/chatPermissions.js";

const { ObjectId } = mongoose.Types;

export async function listEventMessages(req, res) {
  try {
    const { eventId } = req.params;
    const { before, limit = 40 } = req.query;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const allowed = await canReadEventChat(req.user, eventId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied to this chat" });
    }

    const event = await Event.findById(eventId).select("chatMode").lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const query = { event: eventId };
    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const pageSize = Math.min(Number(limit) || 40, 100);

    const items = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .populate("sender", "name avatar role")
      .lean();

    const ordered = [...items].reverse();
    const nextCursor =
      items.length === pageSize ? items[items.length - 1].createdAt.toISOString() : null;

    const [canSend, moderator] = await Promise.all([
      canSendEventChat(req.user, eventId),
      isChatModerator(req.user, eventId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: ordered,
        nextCursor,
        chatMode: event.chatMode || "leaders_only",
        canSend,
        canModerate: moderator,
      },
      message: "Chat messages fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function sendEventMessage(req, res) {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const allowed = await canSendEventChat(req.user, eventId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied to this chat" });
    }

    const doc = await ChatMessage.create({
      event: eventId,
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
    });

    const populated = await doc.populate("sender", "name avatar role");

    // Websocket broadcasting will be hooked here later by the websocket layer.

    return res.status(201).json({
      success: true,
      data: populated,
      message: "Message sent",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteEventMessage(req, res) {
  try {
    const { eventId, messageId } = req.params;

    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid ids" });
    }

    // Only allow users who can post to this chat (admins / organizers / permitted roles)
    const allowed = await canSendEventChat(req.user, eventId);
    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed to moderate this chat" });
    }

    const deleted = await ChatMessage.findOneAndDelete({
      _id: messageId,
      event: eventId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found for this event" });
    }

    return res.status(200).json({
      success: true,
      data: { _id: deleted._id },
      message: "Message deleted",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEventParticipants(req, res) {
  try {
    const { eventId } = req.params;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const allowed = await canReadEventChat(req.user, eventId);
    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this chat participants" });
    }

    const regs = await Registration.find({
      event: eventId,
      status: "confirmed",
    })
      .populate("user", "name avatar role")
      .lean();

    const organizers = [];
    const attendees = [];

    for (const reg of regs) {
      if (!reg.user) continue;
      const base = {
        id: reg.user._id,
        name: reg.user.name,
        role: reg.user.role,
        avatar: reg.user.avatar || "",
      };
      if (["admin", "club_leader", "faculty"].includes(reg.user.role)) {
        organizers.push(base);
      } else {
        attendees.push(base);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        organizers,
        attendees,
      },
      message: "Participants fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateChatSettings(req, res) {
  try {
    const { eventId } = req.params;
    const { mode } = req.body;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    if (!["leaders_only", "everyone"].includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid chat mode" });
    }

    const canModerate = await isChatModerator(req.user, eventId);
    if (!canModerate) {
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed to change chat settings" });
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { chatMode: mode },
      { new: true, select: "chatMode" }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const [canSend, moderator] = await Promise.all([
      canSendEventChat(req.user, eventId),
      isChatModerator(req.user, eventId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        chatMode: updated.chatMode,
        canSend,
        canModerate: moderator,
      },
      message: "Chat settings updated",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

