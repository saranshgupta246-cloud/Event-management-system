import { initializeApp, getApps } from "firebase-admin/app";
import { cert } from "firebase-admin/app";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized || getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: rawKey.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    if (projectId) {
      initializeApp({ projectId });
      console.warn(
        "[Firebase Admin] No service account credentials (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). " +
          "Google login may fail until you set them in backend .env."
      );
    } else {
      console.warn(
        "[Firebase Admin] FIREBASE_PROJECT_ID not set. Google login will not work until you configure Firebase in backend .env."
      );
    }
  }

  initialized = true;
}
