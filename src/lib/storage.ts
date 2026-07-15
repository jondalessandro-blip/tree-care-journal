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

export async function getSignedUrl(path: string): Promise<string> {
  if (!path) return "";
  const cached = urlCache.get(path);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data) throw error ?? new Error("signed url failed");
  urlCache.set(path, { url: data.signedUrl, expires: Date.now() + 60 * 60 * 1000 });
  return data.signedUrl;
}
