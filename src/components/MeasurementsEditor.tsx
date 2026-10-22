"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Silhouette,
  SilhouetteProfilePicker,
  type SilhouetteProfile,
} from "./Silhouette";
import {
  normalizeMeasurements,
  validateMeasurements,
  MEASUREMENT_RANGES,
  type Measurements,
  type RawMeasurements,
} from "@/lib/studio/silhouette";
import { saveMeasurements } from "@/lib/studio/actions";

const FIELDS: { key: keyof Measurements; label: string }[] = [
  { key: "heightCm", label: "Height" },
  { key: "bustCm", label: "Bust" },
  { key: "waistCm", label: "Waist" },
  { key: "hipsCm", label: "Hips" },
  { key: "inseamCm", label: "Inseam" },
  { key: "armLengthCm", label: "Sleeve Length" },
  { key: "armCircCm", label: "Arm Circumference" },
];

export function MeasurementsEditor({
  initial,
  initialProfile = "neutral",
  hasExisting,
}: {
  initial: RawMeasurements;
  initialProfile?: SilhouetteProfile;
  hasExisting: boolean;
}) {
  const [m, setM] = useState<RawMeasurements>(initial);
  const [profile, setProfile] = useState<SilhouetteProfile>(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(hasExisting);
  const router = useRouter();

  const normalized = normalizeMeasurements(m);
  const issues = validateMeasurements(m);
  const hasErrors = Object.keys(issues).length > 0;

  function update(key: keyof Measurements, value: string) {
    setM((prev) => ({ ...prev, [key]: value === "" ? "" : Number(value) }));
    setSaved(false);
  }

  function handleSave() {
    if (hasErrors) return;
    startTransition(async () => {
      await saveMeasurements(normalized, profile);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="measure-layout">
      <div className="measure-figure">
        <Silhouette measurements={m} profile={profile} />
        <p className="measure-figure-caption">
          {hasErrors ? "Check the measurements" : saved ? "Saved" : "Unsaved changes"}
        </p>
      </div>

      <div className="measure-controls">
        <h2 className="panel-title">Fit profile</h2>
        <p
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--color-muted)", lineHeight: 1.8, marginBottom: 20,
          }}
        >
          Choose a body-shape starting point. The numbers below fine-tune it.
        </p>

        <SilhouetteProfilePicker value={profile} onChange={setProfile} />

        <h2 className="panel-title" style={{ marginTop: 40 }}>Measurements</h2>
        <p
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: "var(--color-muted)", lineHeight: 1.8, marginBottom: 32,
          }}
        >
          Type your measurements in centimetres. Measure over light clothing, without shoes.
        </p>

        <div className="measure-fields">
          {FIELDS.map((f) => {
            const [min, max] = MEASUREMENT_RANGES[f.key];
            const val = m[f.key] === undefined || m[f.key] === null ? "" : m[f.key];
            const err = issues[f.key];
            return (
              <div key={f.key} className="measure-field">
                <div className="measure-field-label">
                  <span>{f.label}</span>
                  <span style={{ fontSize: 10, color: "var(--color-muted)", letterSpacing: "0.1em" }}>
                    ({min}–{max} cm)
                  </span>
                </div>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={val}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={`e.g. ${normalized[f.key]}`}
                  className="measure-input"
                  style={{
                    borderColor: err ? "#a03a2a" : undefined,
                  }}
                />
                {err && (
                  <p
                    style={{
                      fontFamily: "var(--font-sans)", fontSize: 11,
                      color: "#a03a2a", marginTop: 6,
                    }}
                  >
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || hasErrors}
          className="btn btn-primary"
          style={{
            width: "100%", marginTop: 36,
            opacity: isPending || hasErrors ? 0.55 : 1,
            cursor: hasErrors ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Saving…" : saved ? "Saved" : "Save measurements"}
        </button>

        {saved && !hasErrors && (
          <Link
            href="/studio"
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 12, textAlign: "center" }}
          >
            Open the studio →
          </Link>
        )}
      </div>
    </div>
  );
}
