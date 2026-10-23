"use client";

import { useId, useMemo } from "react";
import {
  deriveAnchors,
  silhouettePath,
  drapeGeometry,
  type RawMeasurements,
  type SilhouetteAnchors,
  type GarmentShape,
} from "@/lib/studio/silhouette";

export type SilhouetteProfile = "feminine" | "masculine" | "neutral";

export type Garment = {
  imageUrl: string | null;
  shape: GarmentShape;
  label?: string;
};

type SilhouetteProps = {
  measurements: RawMeasurements;
  garments?: Garment[];
  profile?: SilhouetteProfile;
  showFigure?: boolean;
  className?: string;
};

type ProfileRule = {
  apply: (a: SilhouetteAnchors, mul: number) => void;
};

const PROFILE_RULES: Record<Exclude<SilhouetteProfile, "neutral">, ProfileRule[]> = {
  feminine: [
    { apply: (a, m) => { a.bustHalf *= m; a.underbustHalf = (a.bustHalf + a.waistHalf) / 2; } },
    { apply: (a, m) => { a.waistHalf *= m; } },
    { apply: (a, m) => { a.hipHalf *= m; } },
    { apply: (a, m) => { a.arm.unit *= m; } },
  ].map((r, i: number) => ({
    apply: (a: SilhouetteAnchors, _m: number) => r.apply(a, [1.03, 0.94, 1.04, 0.98][i]),
  })),
  masculine: [
    { apply: (a, m) => { a.bustHalf *= m; a.underbustHalf = (a.bustHalf + a.waistHalf) / 2; } },
    { apply: (a, m) => { a.waistHalf *= m; } },
    { apply: (a, m) => { a.hipHalf *= m; } },
    { apply: (a, m) => { a.arm.unit *= m; } },
  ].map((r, i: number) => ({
    apply: (a: SilhouetteAnchors, _m: number) => r.apply(a, [1.03, 1.02, 0.97, 1.04][i]),
  })),
};

function applyProfile(a: SilhouetteAnchors, profile: SilhouetteProfile): SilhouetteAnchors {
  if (profile === "neutral") return a;
  const out: SilhouetteAnchors = {
    ...a,
    arm: { ...a.arm, stations: a.arm.stations.map(([t, w]) => [t, w] as [number, number]) },
    legs: a.legs.map((l) => ({ ...l })),
  };
  for (const rule of PROFILE_RULES[profile]) rule.apply(out, 1);
  return out;
}

const PROFILE_OPTIONS: { value: SilhouetteProfile; label: string; description: string }[] = [
  { value: "feminine", label: "Feminine", description: "Curvier waist-to-hip starting profile" },
  { value: "masculine", label: "Masculine", description: "Broader upper-body starting profile" },
  { value: "neutral", label: "Neutral", description: "Use the unmodified measurement-derived shape" },
];

export function SilhouetteProfilePicker({
  value, onChange, className,
}: { value: SilhouetteProfile; onChange: (p: SilhouetteProfile) => void; className?: string }) {
  return (
    <div role="group" aria-label="Choose a body-shape profile" className={className}
      style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {PROFILE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button key={option.value} type="button" aria-pressed={selected} title={option.description}
            onClick={() => onChange(option.value)}
            style={{
              appearance: "none",
              border: selected ? "1px solid var(--color-gold-deep, #a98a3f)" : "1px solid var(--color-line, #e6dfd0)",
              background: selected ? "rgba(169,138,63,0.12)" : "transparent",
              color: "var(--color-ink, #1a1814)",
              borderRadius: 999, padding: "9px 15px",
              fontSize: 13, fontWeight: selected ? 600 : 400, lineHeight: 1.4,
              cursor: "pointer",
              transition: "background 160ms ease, border-color 160ms ease",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Silhouette({
  measurements, garments = [], profile = "neutral", showFigure = true, className,
}: SilhouetteProps) {
  const reactId = useId();
  const safe = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const fillId = `fit-${safe}-fill`;
  const edgeId = `fit-${safe}-edge`;
  const titleId = `fit-${safe}-title`;
  const clipId = (gi: number, pi: number) => `fit-${safe}-d-${gi}-${pi}`;

  const anchors = useMemo(() => {
    const base = deriveAnchors(measurements);
    return applyProfile(base, profile);
  }, [measurements, profile]);

  const body = useMemo(() => silhouettePath(anchors), [anchors]);

  const drapes = useMemo(
    () => garments.map((g) => drapeGeometry(anchors, g.shape)),
    [anchors, garments]
  );

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" className={className}
      role="img" aria-labelledby={titleId} preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block", overflow: "hidden" }}>
      <title id={titleId}>{`Personalised ${profile} silhouette with virtual garments`}</title>

      <defs>
        {drapes.map((d, gi) =>
          d.paths.map((p, pi) => (
            <clipPath key={clipId(gi, pi)} id={clipId(gi, pi)} clipPathUnits="userSpaceOnUse">
              <path d={p} />
            </clipPath>
          ))
        )}
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dfcc" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#cfc09e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a98a3f" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={edgeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a98a3f" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#a98a3f" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {showFigure && (
        <path d={body} fill={`url(#${fillId})`} stroke={`url(#${edgeId})`}
          strokeWidth="0.85" strokeLinejoin="round" strokeLinecap="round"
          vectorEffect="non-scaling-stroke" />
      )}

      {drapes.map((d, gi) => (
        <g key={`g-${gi}`}>
          {d.paths.map((path, pi) => {
            const cid = clipId(gi, pi);
            const img = garments[gi].imageUrl;
            return (
              <g key={`p-${pi}`}>
                {img ? (
                  <g clipPath={`url(#${cid})`}>
                    {/* The image itself */}
                    <image
                      href={img}
                      x={d.bounds.x}
                      y={d.bounds.y}
                      width={d.bounds.w}
                      height={d.bounds.h}
                      preserveAspectRatio="xMidYMid slice"
                      style={{ mixBlendMode: "multiply", opacity: 0.9 }}
                    />
                    {/* A subtle color wash over the image to blend it into the silhouette */}
                    <path d={path} fill="rgba(169,138,63,0.15)" style={{ mixBlendMode: "overlay" }} />
                  </g>
                ) : (
                  <path d={path} fill={`url(#${fillId})`}
                    stroke="var(--color-gold-deep, #a98a3f)" strokeWidth="0.65"
                    strokeDasharray="2.5 2" strokeLinejoin="round" opacity="0.8" />
                )}
                <path d={path} fill="none" stroke="var(--color-gold-deep, #a98a3f)"
                  strokeWidth="0.55" strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke" opacity="0.95" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export default Silhouette;
