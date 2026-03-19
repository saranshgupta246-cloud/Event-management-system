import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const ALLOWED_DOMAIN = "mitsgwl.ac.in";
const SUPER_ADMIN_EMAILS = ["saranshgupta246@gmail.com"].map((email) =>
  String(email).trim().toLowerCase()
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || "MITS Student";
        const profileImage = profile.photos?.[0]?.value || "";
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email received from Google"), null);
        }

        const normalizedEmail = email.toLowerCase();
        const isAllowedDomain = normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`);
        const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

        // Block non-college emails, except explicit super-admin allowlist.
        if (!isAllowedDomain && !isSuperAdmin) {
          return done(null, false, {
            message:
              "Only MITS Gwalior college email (@mitsgwl.ac.in) is allowed",
            code: "domain_not_allowed",
          });
        }

        // Find or auto-create user. Super-admins are always at least admin.
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          user = await User.create({
            name,
            email: normalizedEmail,
            role: isSuperAdmin ? "admin" : "student",
            googleId,
            avatar: profileImage,
            isActive: true,
          });
          console.log(
            isSuperAdmin
              ? "New super-admin auto-created:"
              : "New student auto-created:",
            normalizedEmail
          );
        } else {
          if (!user.googleId) user.googleId = googleId;
          if (!user.avatar && profileImage) user.avatar = profileImage;
          if (isSuperAdmin && user.role !== "admin") {
            user.role = "admin";
          }
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Passport error:", error);
        return done(error, null);
      }
    }
  )
);

export default passport;