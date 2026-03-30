import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const KEY = "ems_view_mode";

function safeGetSavedMode() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSetSavedMode(mode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    // ignore
  }
}

export function useViewMode() {
  const { user } = useAuth();

  // A user can access club view if they have clubIds OR are faculty_coordinator/admin
  const hasClubAccess = useMemo(() => {
    return (
      (user?.clubIds?.length ?? 0) > 0 ||
      user?.role === "faculty_coordinator" ||
      user?.role === "admin"
    );
  }, [user?.clubIds, user?.role]);

  const defaultMode = useMemo(() => {
    if (user?.role === "admin") return "admin";
    if (user?.role === "faculty_coordinator") return "club";
    if (hasClubAccess) return safeGetSavedMode() ?? "student";
    return "student";
  }, [user?.role, hasClubAccess]);

  const [viewMode, setViewModeState] = useState(() => {
    const saved = safeGetSavedMode();
    if (!saved) return defaultMode;
    // If saved club mode but user lost club access, fall back to student
    if (saved === "club" && !hasClubAccess) return "student";
    return saved;
  });

  const setViewMode = (mode) => {
    safeSetSavedMode(mode);
    setViewModeState(mode);
  };

  return { viewMode, setViewMode, hasClubAccess };
}

