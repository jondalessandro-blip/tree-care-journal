import { TAGS, tagMeta, type TagValue } from "@/lib/taxonomy";

export function TagChip({ value }: { value: string }) {
  const meta = tagMeta(value);
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  );
}

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: TagValue) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((t) => {
        const active = value.includes(t.value);
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => toggle(t.value)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all"
            style={{
              backgroundColor: active ? t.bg : "transparent",
              color: active ? t.fg : undefined,
              borderColor: active ? t.bg : "hsl(var(--border))",
              opacity: active ? 1 : 0.75,
            }}
            aria-pressed={active}
          >
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: t.bg }}
            />
            {t.label}
            {"hint" in t && t.hint ? (
              <span className="opacity-60 font-normal">· {t.hint}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
