import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "bonsai";

export async function uploadPhoto(file: File, treeId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${treeId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

// Fetch a signed URL for a stored path. Uses in-memory cache for the session.
const urlCache = new Map<string, { url: string; expires: number }>();

export type ImageTransform = {
  width?: number;
  height?: number;
  quality?: number;
};

export async function getSignedUrl(
  path: string,
  transform?: ImageTransform,
): Promise<string> {
  if (!path) return "";
  const key = transform
    ? `${path}|${transform.width ?? ""}x${transform.height ?? ""}q${transform.quality ?? ""}`
    : path;
  const cached = urlCache.get(key);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;

  const sign = async (t?: ImageTransform) =>
    supabase.storage.from(BUCKET).createSignedUrl(
      path,
      60 * 60,
      t
        ? {
            transform: {
              width: t.width,
              height: t.height,
              quality: t.quality ?? 70,
              resize: "cover",
            },
          }
        : undefined,
    );

  let { data, error } = await sign(transform);
  // Some environments don't support image transformation — fall back to original.
  if ((error || !data) && transform) {
    ({ data, error } = await sign(undefined));
  }
  if (error || !data) throw error ?? new Error("signed url failed");
  urlCache.set(key, { url: data.signedUrl, expires: Date.now() + 60 * 60 * 1000 });
  return data.signedUrl;
}

