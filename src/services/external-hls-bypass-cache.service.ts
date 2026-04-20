type ExternalHlsBypassCacheEntry = {
  channelId: string;
  sourceUrl: string;
  resolvedSourceUrl: string;
  createdAt: number;
  expiresAt: number;
};

const cache = new Map<string, ExternalHlsBypassCacheEntry>();

const DEFAULT_TTL_MS = 30_000;

export function getExternalHlsBypass(channelId: string) {
  const entry = cache.get(channelId);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  if (now >= entry.expiresAt) {
    cache.delete(channelId);
    return null;
  }

  return entry;
}

export function setExternalHlsBypass(params: {
  channelId: string;
  sourceUrl: string;
  resolvedSourceUrl: string;
  ttlMs?: number;
}) {
  const now = Date.now();
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;

  const entry: ExternalHlsBypassCacheEntry = {
    channelId: params.channelId,
    sourceUrl: params.sourceUrl,
    resolvedSourceUrl: params.resolvedSourceUrl,
    createdAt: now,
    expiresAt: now + ttlMs,
  };

  cache.set(params.channelId, entry);

  return entry;
}

export function clearExternalHlsBypass(channelId: string) {
  cache.delete(channelId);
}

export function clearAllExternalHlsBypass() {
  cache.clear();
}

export function getExternalHlsBypassSnapshot() {
  const now = Date.now();

  return Array.from(cache.values()).map((entry) => ({
    channelId: entry.channelId,
    sourceUrl: entry.sourceUrl,
    resolvedSourceUrl: entry.resolvedSourceUrl,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    remainingMs: Math.max(0, entry.expiresAt - now),
  }));
}