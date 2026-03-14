import UserNotification from "../models/UserNotification.js";

/**
 * Create an in-app notification for a user.
 * @param {{ userId: import("mongoose").Types.ObjectId, type: string, title: string, message?: string, link?: string }}
 */
export async function createUserNotification({ userId, type, title, message = "", link = "" }) {
  if (!userId || !type || !title) return null;
  try {
    const doc = await UserNotification.create({
      userId,
      type,
      title,
      message,
      link,
    });
    return doc;
  } catch (err) {
    console.error("[notifications] error:", err);
    return null;
  }
}

/**
 * Create notifications for multiple users.
 */
export async function createUserNotifications(users, { type, title, message = "", link = "" }) {
  if (!users?.length || !type || !title) return;
  try {
    await UserNotification.insertMany(
      users.map((userId) => ({
        userId,
        type,
        title,
        message,
        link,
      }))
    );
  } catch (err) {
    console.error("[notifications] error:", err);
  }
}
