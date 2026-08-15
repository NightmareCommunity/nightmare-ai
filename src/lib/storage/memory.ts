// NIGHTMARE AI — in-memory image store (fallback for image routes)
// Since we always return dataUrl in the generate response, this store
// only holds recently-served images so the /api/images/[id] endpoint
// can serve them for downloads/inline viewing.

interface StoredImage {
  bytes: Buffer;
  mime: string;
  meta: {
    prompt: string;
    model: string;
    createdAt: string;
  };
}

const store = new Map<string, StoredImage>();

// Auto-expire entries after 1 hour to avoid unbounded growth
const TTL_MS = 60 * 60 * 1000;

export function putImage(
  id: string,
  bytes: Buffer,
  mime: string,
  meta: StoredImage["meta"]
): void {
  store.set(id, { bytes, mime, meta });
  const expiry = setTimeout(() => store.delete(id), TTL_MS);
  expiry.unref?.();
}

export function getImage(id: string): StoredImage | undefined {
  return store.get(id);
}

export function deleteImage(id: string): boolean {
  return store.delete(id);
}

export function listImageIds(): string[] {
  return Array.from(store.keys());
}
