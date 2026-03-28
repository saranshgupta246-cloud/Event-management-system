import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import { getClubMemberCount, getMemberTotalFromMembersResponse } from "../utils/clubStats";

const MEMBERS_ENRICH_CONCURRENCY = 8;

/** Match services/api.js origin so URLs are identical to axios. */
function apiOriginBase() {
  return (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
}

/**
 * GET with fetch + cache:no-store so we always get a JSON body (avoids 304 empty responses from HTTP cache).
 */
async function fetchMemberCountJson(path, searchParams) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("ems_token") : null;
  const url = `${apiOriginBase()}${path.startsWith("/") ? path : `/${path}`}?${searchParams.toString()}`;
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Stable club id string for API paths (handles Mongo extended JSON `$oid`, etc.). */
function unwrapClubId(raw) {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "object") {
    if (typeof raw.$oid === "string") return raw.$oid;
    if (typeof raw._id === "string") return raw._id;
  }
  const s = String(raw);
  return s === "[object Object]" ? "" : s;
}

function clubRowId(c) {
  if (c == null || typeof c !== "object") return "";
  return unwrapClubId(c._id ?? c.id);
}

/**
 * GET /members may default to status=active while DB rows use "approved".
 * Try several query variants; use first positive count, else best non-null (incl. 0).
 */
async function countClubMembersViaApi(id, tryFetchCount) {
  const variants = [{ status: "all" }, { status: "approved" }, {}, { status: "active" }];
  let best = null;
  for (const extra of variants) {
    try {
      const n = await tryFetchCount(`/api/clubs/${id}/members`, extra);
      if (n != null && n > 0) return n;
      if (n != null && (best == null || n > best)) best = n;
    } catch {
      /* try next */
    }
  }
  return best;
}

async function enrichMemberCountsFromMembersApi(rawList) {
  const base = rawList.map((c) => ({
    ...c,
    memberCount: getClubMemberCount(c),
  }));

  const withIds = base.filter((c) => clubRowId(c) !== "");
  if (withIds.length === 0) return base;

  const fetched = new Map();
  for (let i = 0; i < withIds.length; i += MEMBERS_ENRICH_CONCURRENCY) {
    const chunk = withIds.slice(i, i + MEMBERS_ENRICH_CONCURRENCY);
    await Promise.all(
      chunk.map(async (c) => {
        const id = clubRowId(c);
        const bust = `${Date.now()}-${id}-${Math.random().toString(36).slice(2, 11)}`;
        const noCacheCfg = {
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
          },
        };

        const tryFetchCount = async (path, extraParams = {}) => {
          const params = new URLSearchParams({ limit: "1000", ...extraParams });
          params.set("_t", bust);
          try {
            const json = await fetchMemberCountJson(path, params);
            const n = getMemberTotalFromMembersResponse({ data: json });
            if (n != null) return n;
          } catch (e) {
            const msg = String(e?.message || "");
            if (/HTTP (404|403)\b/.test(msg)) return null;
            /* fall through to axios */
          }
          try {
            const res = await api.get(`${path}?${params.toString()}`, noCacheCfg);
            return getMemberTotalFromMembersResponse(res);
          } catch {
            return null;
          }
        };

        const tryDetailCount = async () => {
          const params = new URLSearchParams({ _t: bust });
          try {
            const json = await fetchMemberCountJson(`/api/clubs/${id}`, params);
            const club = json?.data;
            if (club && typeof club === "object") {
              const fromClub = getClubMemberCount(club);
              if (fromClub > 0) return fromClub;
            }
            return getMemberTotalFromMembersResponse({ data: json });
          } catch {
            const res = await api.get(`/api/clubs/${id}?${params.toString()}`, noCacheCfg);
            const club = res.data?.data;
            if (club && typeof club === "object") {
              const fromClub = getClubMemberCount(club);
              if (fromClub > 0) return fromClub;
            }
            return getMemberTotalFromMembersResponse(res);
          }
        };

        try {
          let n = await countClubMembersViaApi(id, tryFetchCount);
          if (n == null || n === 0) {
            try {
              n = await tryDetailCount();
            } catch {
              /* detail may 403 */
            }
          }
          if (n != null) fetched.set(id, n);
        } catch {
          try {
            const n = await tryDetailCount().catch(() => null);
            if (n != null) fetched.set(id, n);
          } catch {
            /* keep list-derived count */
          }
        }
      })
    );
  }

  return base.map((c) => {
    const id = clubRowId(c);
    if (id && fetched.has(id)) return { ...c, memberCount: fetched.get(id) };
    return c;
  });
}

export default function useAdminClubs({ search = "", category = "", status = "" } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const removeClubLocally = useCallback((id) => {
    setItems((prev) => prev.filter((c) => String(c._id) !== String(id)));
  }, []);

  const fetchClubs = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      const qs = params.toString();
      const res = await api.get(`/api/clubs${qs ? `?${qs}` : ""}`);
      let rawList;
      if (res.data?.success) {
        rawList = res.data.data || [];
      } else {
        setError(res.data?.message || "Failed to load clubs");
        return;
      }
      const normalized = await enrichMemberCountsFromMembersApi(rawList);
      setItems(normalized);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clubs");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return { items, loading, error, refetch: fetchClubs, removeClubLocally };
}

export async function createAdminClub(payload) {
  try {
    const res = await api.post("/api/admin/clubs", payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to create club" };
  }
}

export async function updateAdminClub(id, payload) {
  try {
    const res = await api.put(`/api/admin/clubs/${id}`, payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update club" };
  }
}

export async function deleteAdminClub(id) {
  try {
    const res = await api.delete(`/api/admin/clubs/${id}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to delete club" };
  }
}

export async function assignClubLeader(clubId, userId) {
  try {
    const res = await api.put(`/api/admin/clubs/${clubId}/assign-coordinator`, { userId });
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to assign coordinator" };
  }
}

export async function assignClubCoordinator(clubId, { userId, email }) {
  try {
    const res = await api.put(`/api/admin/clubs/${clubId}/assign-coordinator`, { userId, email });
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to assign coordinator" };
  }
}

export async function checkNameAvailability(name) {
  try {
    const res = await api.get(`/api/clubs/check-name?name=${encodeURIComponent(name || "")}`);
    return res.data?.data?.available ?? false;
  } catch {
    return false;
  }
}

export async function searchAdminUsers(q) {
  try {
    const res = await api.get(`/api/admin/users?q=${encodeURIComponent(q || "")}`);
    return res.data?.data || [];
  } catch {
    return [];
  }
}

export async function updateClubStatus(clubId, status) {
  try {
    const res = await api.patch(`/api/clubs/${clubId}`, { status });
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update status" };
  }
}

export async function updateClubMain(clubId, payload) {
  try {
    const res = await api.patch(`/api/clubs/${clubId}`, payload);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to update club" };
  }
}

/** Full club details (includes populated coordinator when applicable). */
export async function fetchClubDetails(clubId) {
  try {
    const res = await api.get(`/api/clubs/${clubId}`);
    return res.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to load club" };
  }
}

export async function createClubWithPresident(payload) {
  try {
    const { name, description, category, logo, banner, highlightsDriveUrl, coordinatorId, coordinatorEmail } = payload;
    const createRes = await api.post("/api/admin/clubs", {
      name: name?.trim(),
      description: description || undefined,
      category,
      logo: logo || undefined,
      banner: banner || undefined,
      highlightsDriveUrl: highlightsDriveUrl || undefined,
      coordinatorId,
      coordinatorEmail,
    });
    if (!createRes.data?.success) {
      return { success: false, message: createRes.data?.message || "Failed to create club" };
    }
    return { success: true, data: createRes.data.data, message: "Club created successfully" };
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to create club";
    return { success: false, message: msg };
  }
}

export async function uploadClubLogo(file) {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const res = await api.post("/api/admin/clubs/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }

    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    const msg = err.response?.data?.message || "Upload failed.";
    return { error: msg };
  }
}

export async function uploadClubBanner(file) {
  try {
    const formData = new FormData();
    formData.append("banner", file);

    const res = await api.post("/api/admin/clubs/banner", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success && res.data?.url) {
      return { url: res.data.url };
    }

    return { error: res.data?.message || "Upload failed." };
  } catch (err) {
    const msg = err.response?.data?.message || "Upload failed.";
    return { error: msg };
  }
}

export async function bulkImportClubs(file) {
  try {
    const formData = new FormData();
    formData.append("csv", file);

    const res = await api.post("/api/admin/clubs/bulk-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || "Bulk import failed.";
    return { success: false, message: msg };
  }
}

