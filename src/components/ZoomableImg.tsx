import { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export function ZoomableImg({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <img
        src={url}
        alt={alt}
        className={`cursor-zoom-in ${className ?? ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        loading="lazy"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none rounded-none overflow-hidden [&>button]:hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div
            className="relative flex items-center justify-center w-full h-full"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="absolute top-3 right-3 z-20 rounded-full bg-black/60 text-white p-2 hover:bg-black/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={url}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
