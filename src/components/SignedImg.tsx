import { useEffect, useState } from "react";
import { getSignedUrl, type ImageTransform } from "@/lib/storage";

export function SignedImg({
  path,
  alt,
  className,
  transform,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  /** Optional server-side downscale — use for thumbnails/grids. */
  transform?: ImageTransform;
}) {
  const [url, setUrl] = useState<string>("");
  const transformKey = transform
    ? `${transform.width ?? ""}x${transform.height ?? ""}q${transform.quality ?? ""}`
    : "";
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl("");
      return;
    }
    getSignedUrl(path, transform)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl("");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, transformKey]);

  if (!path) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground text-xs ${className ?? ""}`}
      >
        No photo
      </div>
    );
  }
  if (!url) {
    return <div className={`bg-muted animate-pulse ${className ?? ""}`} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      width={transform?.width}
      height={transform?.height ?? transform?.width}
    />
  );
}

