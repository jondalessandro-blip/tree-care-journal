import { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/storage";

export function SignedImg({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl("");
      return;
    }
    getSignedUrl(path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

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
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
