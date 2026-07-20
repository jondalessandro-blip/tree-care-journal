import { Check } from "lucide-react";
import {
  soilLibrary,
  WINTER_LOCATIONS,
  phGradientCss,
  type SoilMix,
} from "@/lib/soil";
import { Label } from "@/components/ui/label";

type Props = {
  soilMixId: string | null;
  ph: number | null;
  winterLocation: string | null;
  tags: string[];
  onSoilChange: (id: string) => void;
  onPhChange: (ph: number) => void;
  onWinterChange: (loc: string) => void;
};

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SoilCard({
  soil,
  selected,
  onSelect,
}: {
  soil: SoilMix;
  selected: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "relative text-left rounded-lg p-4 border-2 transition-all flex flex-col gap-2 " +
        (selected
          ? "border-[#16a34a] shadow-sm"
          : "border-border hover:border-primary/40")
      }
      style={{
        backgroundColor: selected ? hexToRgba(soil.color, 0.5) : "transparent",
      }}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#16a34a] text-white flex items-center justify-center">
          <Check className="w-4 h-4" />
        </span>
      )}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
          style={{ backgroundColor: soil.color }}
        />
        <span className="font-display text-lg leading-tight pr-6">
          {soil.name}
        </span>
      </div>
      <div className="font-mono text-xs text-foreground/80 leading-snug">
        {soil.mix}
      </div>
      <div className="text-xs text-muted-foreground">{soil.characteristics}</div>
      <div className="text-xs">
        <span className="text-muted-foreground">Best for: </span>
        {soil.bestFor}
      </div>
      <div className="text-xs">
        <span className="text-muted-foreground">pH: </span>
        {soil.ph}
      </div>
    </button>
  );
}

export function SoilSection({
  soilMixId,
  ph,
  winterLocation,
  tags,
  onSoilChange,
  onPhChange,
  onWinterChange,
}: Props) {
  const acidLover = tags.includes("acid_lover");
  const alkalineLover = tags.includes("alkaline_lover");

  const banner = acidLover
    ? "Note for Acid Lover: Use kanuma variant — 70% Kanuma + 30% Pumice, rainwater only, no tap water, pH 4.5–5.5. Do not add lime."
    : alkalineLover
      ? "Note for Alkaline Lover: Add 1 tbsp limestone chip per 4-inch pot, lean soil, drought tolerant."
      : "Auto-selected based on Foliage and Climate — you can override.";

  const phValue = ph ?? 6.5;

  return (
    <div className="space-y-4">
      <div>
        <Label>Soil mix</Label>
        <div
          className={
            "mt-1 text-xs rounded-md px-3 py-2 border " +
            (acidLover
              ? "bg-[#D9D2E9]/60 border-[#D9D2E9]"
              : alkalineLover
                ? "bg-[#FCE5CD]/60 border-[#FCE5CD]"
                : "bg-muted/40 border-border text-muted-foreground")
          }
        >
          {banner}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {soilLibrary.map((s) => (
            <SoilCard
              key={s.id}
              soil={s}
              selected={soilMixId === s.id}
              onSelect={() => onSoilChange(s.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label>Soil pH</Label>
          <span className="font-mono text-sm">{phValue.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={4.5}
          max={8.0}
          step={0.1}
          value={phValue}
          onChange={(e) => onPhChange(parseFloat(e.target.value))}
          className="w-full mt-2 h-2 rounded-full appearance-none cursor-pointer accent-foreground"
          style={{ background: phGradientCss() }}
        />
        <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
          <span>4.5 acidic</span>
          <span>6.5 neutral</span>
          <span>8.0 alkaline</span>
        </div>
      </div>

      <div>
        <Label>Winter location</Label>
        <div className="mt-2 inline-flex rounded-md border border-border bg-background p-0.5 w-full">
          {WINTER_LOCATIONS.map((w) => {
            const active = winterLocation === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => onWinterChange(w.value)}
                className={
                  "flex-1 text-xs px-3 py-2 rounded transition-colors " +
                  (active
                    ? "bg-foreground text-background"
                    : "hover:bg-muted")
                }
              >
                <div className="font-medium">{w.label}</div>
                <div
                  className={
                    "text-[10px] " +
                    (active ? "opacity-80" : "text-muted-foreground")
                  }
                >
                  {w.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
