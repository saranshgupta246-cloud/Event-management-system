import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { normalizeAuthUser, useAuth } from "../context/AuthContext";
import api from "../services/api";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const callbackExecuted = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (callbackExecuted.current) {
      return;
    }
    callbackExecuted.current = true;
    
    const handleAuthCallback = async () => {
      const error = searchParams.get("error");
      const token = searchParams.get("token");

      // Drop token/error query params from the address bar without causing a router
      // navigation (which can briefly flash intermediate UI during OAuth redirects).
      if (error || token) {
        try {
          window.history.replaceState({}, document.title, "/auth/callback");
        } catch {
          // If replaceState fails for any reason, fall back to router replace.
          navigate("/auth/callback", { replace: true });
        }
      }

      if (error) {
        if (import.meta.env.DEV) {
          console.log("AuthCallback - Error from OAuth:", error);
        }
        const friendly =
          error === "domain_not_allowed"
            ? "Your email domain is not allowed. Please use your college email."
            : "Authentication failed. Please try again.";
        setErrorMessage(friendly);
        setLoading(false);
        toast.error(friendly);
        return;
      }

      if (!token) {
        if (import.meta.env.DEV) {
          console.log("AuthCallback - No token in URL");
        }
        const message = "No authentication token received.";
        setErrorMessage(message);
        setLoading(false);
        toast.error(message);
        navigate("/login", { replace: true });
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.log(
            "AuthCallback - Token received:",
            token.substring(0, 20) + "..."
          );
        }

        // Save token to localStorage
        localStorage.setItem("ems_token", token);
        if (import.meta.env.DEV) {
          console.log("AuthCallback - Token saved to localStorage");
        }

        // Verify token and get user info
        if (import.meta.env.DEV) {
          console.log("AuthCallback - Calling /api/auth/me...");
        }
        const response = await api.get("/api/auth/me");
        if (import.meta.env.DEV) {
          console.log("AuthCallback - Response received:", response.data);
        }

        if (!response.data?.success || !response.data?.data) {
          throw new Error("Failed to get user info");
        }

        const user = response.data.data;
        if (import.meta.env.DEV) {
          console.log("AuthCallback - User data from API:", user);
        }

        const normalizedUser = normalizeAuthUser(user);
        if (import.meta.env.DEV && !user.role) {
          console.warn(
            "AuthCallback - User has no role, defaulting to student"
          );
        }
        if (import.meta.env.DEV) {
          console.log(
            "AuthCallback - Normalized user role:",
            normalizedUser.role
          );
        }

        setUser(normalizedUser);

        // Redirect based on normalized role (use route roots that exist)
        const savedMode = localStorage.getItem("ems_view_mode");
        const hasClubAccess = (normalizedUser.clubIds?.length ?? 0) > 0;
        if (savedMode === "club" && !hasClubAccess) {
          localStorage.setItem("ems_view_mode", "student");
        }
        if (normalizedUser.role === "admin") {
          if (import.meta.env.DEV) {
            console.log("AuthCallback - Redirecting to /admin");
          }
          navigate("/admin", { replace: true });
        } else if (normalizedUser.role === "faculty_coordinator") {
          if (import.meta.env.DEV) {
            console.log("AuthCallback - Redirecting to /leader");
          }
          navigate("/leader", { replace: true });
        } else if (savedMode === "club" && hasClubAccess) {
          if (import.meta.env.DEV) {
            console.log("AuthCallback - Redirecting to /leader (saved club view)");
          }
          navigate("/leader", { replace: true });
        } else {
          if (import.meta.env.DEV) {
            console.log("AuthCallback - Redirecting to /student");
          }
          navigate("/student", { replace: true });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Auth callback error:", error);
        }
        const message =
          error.message ||
          "Authentication failed while verifying your account. Please try again.";
        setErrorMessage(message);
        toast.error(message);
        localStorage.removeItem("ems_token");
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="text-sm text-slate-200">
            Completing sign-in with Google. Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-slate-900/80 border border-slate-700/70 p-6 text-center">
        <h1 className="text-lg font-semibold text-white mb-2">
          Authentication status
        </h1>
        <p className="text-sm text-slate-300">
          {errorMessage ||
            "Redirecting you to the appropriate dashboard. If nothing happens, please go back to the login page and try again."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Back to login
        </button>
      </div>
    </div>
  );
};

export default AuthCallback;