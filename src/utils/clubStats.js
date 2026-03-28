/**
 * Backend list/detail payloads may expose member totals under different keys.
 * Normalize so admin tables and stats show the real count when the API omits `memberCount`.
 */
const NUMERIC_MEMBER_KEYS = [
  "memberCount",
  "membersCount",
  "totalMembers",
  "member_count",
  "members_count",
  "activeMembers",
  "activeMemberCount",
  "active_member_count",
];

function finiteNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function firstNumericFromObject(obj) {
  if (!obj || typeof obj !== "object") return null;
  for (const key of NUMERIC_MEMBER_KEYS) {
    const n = finiteNumber(obj[key]);
    if (n != null) return n;
  }
  return null;
}

/** Image path from list/detail payloads (field name varies by route/serializer). */
export function getClubLogoPath(club) {
  if (!club || typeof club !== "object") return "";
  const path = club.logoUrl || club.logo;
  return typeof path === "string" && path.trim() ? path.trim() : "";
}

export function getClubBannerPath(club) {
  if (!club || typeof club !== "object") return "";
  const path = club.bannerUrl || club.banner;
  return typeof path === "string" && path.trim() ? path.trim() : "";
}

export function getClubMemberCount(club) {
  if (!club || typeof club !== "object") return 0;

  const fromRoot = firstNumericFromObject(club);
  if (fromRoot != null) return fromRoot;

  const fromCount = finiteNumber(club._count?.members);
  if (fromCount != null) return fromCount;

  const fromStats = firstNumericFromObject(club.stats);
  if (fromStats != null) return fromStats;

  if (Array.isArray(club.members)) return club.members.length;
  if (Array.isArray(club.memberships)) return club.memberships.length;
  if (Array.isArray(club.clubMembers)) return club.clubMembers.length;
  if (Array.isArray(club.roster)) return club.roster.length;

  return 0;
}

function arrayLooksLikeMemberList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const n = Math.min(arr.length, 6);
  let hits = 0;
  for (let i = 0; i < n; i++) {
    const x = arr[i];
    if (!x || typeof x !== "object" || Array.isArray(x)) continue;
    if (
      x.userId != null ||
      x.user_id != null ||
      x.user != null ||
      x.clubRole != null ||
      x.club_role != null ||
      x.role != null ||
      x.membershipId != null ||
      (typeof x.email === "string" && x.email.includes("@")) ||
      (x.studentId != null && x.role != null)
    ) {
      hits += 1;
    }
  }
  return hits >= Math.max(1, Math.ceil(n / 3));
}

/**
 * Walk API JSON and find the largest array that looks like club membership rows.
 */
export function deepMemberListLengthFromPayload(root, maxDepth = 10) {
  let best = 0;

  function walk(node, depth) {
    if (node == null || depth > maxDepth) return;
    if (Array.isArray(node)) {
      if (arrayLooksLikeMemberList(node) && node.length > best) {
        best = node.length;
      }
      for (const el of node) walk(el, depth + 1);
      return;
    }
    if (typeof node === "object") {
      for (const v of Object.values(node)) walk(v, depth + 1);
    }
  }

  walk(root, 0);
  return best > 0 ? best : null;
}

function normalizeAxiosDataBody(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

/** Totals often sent beside an empty list (admin vs leader visibility, pagination metadata). */
const DECLARED_TOTAL_KEYS = [
  "total",
  "totalCount",
  "totalDocs",
  "totalMembers",
  "memberCount",
  "membersCount",
  "count",
  "recordCount",
  "recordsTotal",
  "size",
  "nbHits",
  "hits",
  "n",
];

function declaredTotalFromContainer(obj) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return null;
  for (const k of DECLARED_TOTAL_KEYS) {
    const n = finiteNumber(obj[k]);
    if (n != null && n >= 0) return n;
  }
  const nested = [
    obj.pagination,
    obj.meta,
    obj.pageInfo,
    obj.page_info,
    obj.page,
  ];
  for (const sub of nested) {
    if (sub && typeof sub === "object" && !Array.isArray(sub)) {
      for (const k of DECLARED_TOTAL_KEYS) {
        const n = finiteNumber(sub[k]);
        if (n != null && n >= 0) return n;
      }
    }
  }
  const fromMembers = firstNumericFromObject(obj);
  if (fromMembers != null && fromMembers >= 0) return fromMembers;
  return null;
}

function arrayLenIfNonEmpty(arr) {
  if (!Array.isArray(arr)) return null;
  return arr.length > 0 ? arr.length : null;
}

/**
 * Derive how many club members the API returned (array, paginated meta, or leader-style split).
 * Matches shapes used in ClubTeamPage for GET /api/clubs/:id/members (and similar).
 */
export function getMemberTotalFromMembersResponse(res) {
  let body = normalizeAxiosDataBody(res?.data);
  if (body == null) return null;
  if (body.success === false) return null;

  /** Top-level array (some APIs return the roster directly). */
  if (Array.isArray(body)) {
    const n = body.length;
    if (n > 0) return n;
  }

  const topDeclared = declaredTotalFromContainer(body);

  const topMembersLen = arrayLenIfNonEmpty(body.members) ?? arrayLenIfNonEmpty(body.items);
  if (topMembersLen != null) return topMembersLen;

  const d = body.data ?? body.result ?? body.payload;

  if (Array.isArray(d)) {
    if (d.length > 0) return d.length;
    if (topDeclared != null) return topDeclared;
    return null;
  }

  if (d && typeof d === "object") {
    if (typeof d.total === "number" && Number.isFinite(d.total)) return d.total;
    if (typeof d.totalCount === "number" && Number.isFinite(d.totalCount)) return d.totalCount;
    if (typeof d.count === "number" && Number.isFinite(d.count)) return d.count;

    const core = d.coreTeam || d.core_team;
    const rest = d.others || d.rest || d.volunteers || d.volunteersAndMembers;
    if (Array.isArray(core) || Array.isArray(rest)) {
      const sum = (Array.isArray(core) ? core.length : 0) + (Array.isArray(rest) ? rest.length : 0);
      if (sum > 0) return sum;
    }

    const listKeys = ["members", "items", "data", "results", "rows", "list", "records", "docs", "memberships", "clubMembers"];
    for (const key of listKeys) {
      const L = arrayLenIfNonEmpty(d[key]);
      if (L != null) return L;
    }

    const nestedDeclared = declaredTotalFromContainer(d) ?? declaredTotalFromContainer(body);
    if (nestedDeclared != null) return nestedDeclared;
  }

  if (topDeclared != null) return topDeclared;

  const deep = deepMemberListLengthFromPayload(body);
  if (deep != null) return deep;

  const last = declaredTotalFromContainer(body);
  return last != null ? last : null;
}
