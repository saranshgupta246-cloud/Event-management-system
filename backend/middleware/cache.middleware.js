import NodeCache from "node-cache";

// Shared cache instance for the whole app
export const appCache = new NodeCache();

/** Cache keys match `req.originalUrl` (e.g. `/api/clubs`, `/api/clubs?search=x`). */
const CLUB_LIST_CACHE_PREFIX = "/api/clubs";

/** Invalidate all cached GET /api/clubs responses (any query string). Call after club mutations. */
export function invalidateClubListCache() {
  try {
    const keys = appCache.keys();
    for (const key of keys) {
      if (typeof key === "string" && key.startsWith(CLUB_LIST_CACHE_PREFIX)) {
        appCache.del(key);
      }
    }
  } catch {
    // ignore
  }
}

export function cacheMiddleware(ttlSeconds, options = {}) {
  const { keyGenerator } = options;

  return (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.originalUrl;
      if (!key) return next();

      const cached = appCache.get(key);
      if (cached) {
        return res.status(cached.status).json(cached.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          const status = res.statusCode || 200;
          if (status >= 200 && status < 300) {
            appCache.set(key, { status, body }, ttlSeconds);
          }
        } catch {
          // ignore cache errors
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
}

