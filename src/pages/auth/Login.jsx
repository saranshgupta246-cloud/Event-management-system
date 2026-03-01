import React, { useState } from "react";
import GoogleButton from "../../components/GoogleButton";
import "../../assets/styles/login.css";
import { auth, googleProvider } from "../../config/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const ALLOWED_DOMAIN = "mitsgwl.ac.in";
const IS_PRODUCTION = import.meta.env.MODE === "production";
const SUPER_ADMIN_EMAIL = "saranshgupta246@gmail.com";

const ROLE_REDIRECTS = {
  admin: "/admin",
  club_leader: "/leader",
  faculty: "/student",
  student: "/student",
};

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email || "";
      const lowerEmail = email.toLowerCase();

      // In production, restrict logins to the official institute domain,
      // but always allow the configured super admin email.
      if (
        IS_PRODUCTION &&
        !lowerEmail.endsWith(`@${ALLOWED_DOMAIN}`) &&
        lowerEmail !== SUPER_ADMIN_EMAIL
      ) {
        await signOut(auth);
        setError(`Please use your official @${ALLOWED_DOMAIN} Google account.`);
        return;
      }

      const idToken = await result.user.getIdToken();

      try {
        const backendRes = await api.post("/api/auth/firebase", { idToken });
        if (backendRes.data?.success) {
          const { token, user } = backendRes.data.data;
          login(user, token);

          let dest = ROLE_REDIRECTS[user.role] || "/student";

          // Always open the admin panel for the super admin email.
          if (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
            dest = "/admin";
          }

          navigate(dest, { replace: true });
          return;
        }

        // If backend rejects but this is the super admin email,
        // still allow a local admin session so you can access the panel.
        if (lowerEmail === SUPER_ADMIN_EMAIL) {
          login(
            {
              id: "super-admin-local",
              email: SUPER_ADMIN_EMAIL,
              role: "admin",
              name: result.user?.displayName || "Super Admin",
            },
            idToken
          );
          navigate("/admin", { replace: true });
          return;
        }

        setError(backendRes.data?.message || "Authentication failed. Try again.");
      } catch (apiErr) {
        const msg = apiErr.response?.data?.message || "Backend unreachable. Using demo mode.";
        console.warn("Backend auth failed:", msg);

        // If backend is unreachable but this is the super admin email,
        // create a local admin session and go to the admin panel.
        if (lowerEmail === SUPER_ADMIN_EMAIL) {
          login(
            {
              id: "super-admin-local",
              email: SUPER_ADMIN_EMAIL,
              role: "admin",
              name: result.user?.displayName || "Super Admin",
            },
            idToken
          );
          navigate("/admin", { replace: true });
          return;
        }

        setError("Could not reach the server. Please check your connection and try again.");
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Unable to sign in with Google right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ems-login-page">
      <div className="ems-login-overlay" />
      <div className="ems-login-card">
        <div className="ems-login-header">
          <div className="ems-login-logo-wrapper">
            <img
              src="/images/mits-logo-main.png"
              alt="MITS Gwalior Logo"
              className="ems-login-logo"
            />
          </div>
          <div className="ems-login-product">
            <span className="ems-login-product-prefix">MITS</span>
            <span className="ems-login-product-name">
              Event Management System
            </span>
          </div>
        </div>

        <div className="ems-login-copy">
          <h1 className="ems-login-title">Sign in to EMS</h1>
          <p className="ems-login-subtitle">
            Secure access using your official institute Google account.
            {IS_PRODUCTION ? (
              <>
                {" "}
                Only <strong>@{ALLOWED_DOMAIN}</strong> logins are allowed.
              </>
            ) : (
              " In development, any Google account can be used."
            )}
          </p>
        </div>

        <GoogleButton loading={loading} onClick={handleGoogleLogin} />

        {error && (
          <div className="ems-login-error" role="alert">
            {error}
          </div>
        )}

        <p className="ems-login-footer-note">
          By continuing, you agree to the Institute&apos;s data privacy and
          acceptable use policies.
        </p>
      </div>
    </div>
  );
}
