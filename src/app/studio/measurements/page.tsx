import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { MeasurementsEditor } from "@/components/MeasurementsEditor";
import { REFERENCE_MEASUREMENTS, type RawMeasurements } from "@/lib/studio/silhouette";

export default async function MeasurementsPage() {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login?next=/studio/measurements");

  const existing = await db.measurement.findUnique({ where: { userId: buyer.id } });

  const initial: RawMeasurements = existing
    ? {
        heightCm: existing.heightCm ?? REFERENCE_MEASUREMENTS.heightCm,
        bustCm: existing.bustCm ?? REFERENCE_MEASUREMENTS.bustCm,
        waistCm: existing.waistCm ?? REFERENCE_MEASUREMENTS.waistCm,
        hipsCm: existing.hipsCm ?? REFERENCE_MEASUREMENTS.hipsCm,
        inseamCm: existing.inseamCm ?? REFERENCE_MEASUREMENTS.inseamCm,
        armLengthCm: existing.armLengthCm ?? REFERENCE_MEASUREMENTS.armLengthCm,
        armCircCm: existing.armCircCm ?? REFERENCE_MEASUREMENTS.armCircCm,
      }
    : { ...REFERENCE_MEASUREMENTS };

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/studio" className="hide-sm">Studio</Link>
            <Link href="/account" className="hide-sm">Account</Link>
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <span className="type-kicker">Studio · Fit profile</span>
          <h1 className="type-h2">Your <em>silhouette</em>.</h1>
          <p className="type-body" style={{ maxWidth: 540, margin: "20px auto 0" }}>
            Enter your measurements once. Every piece in the studio will then
            drape on your figure — not a mannequin&apos;s.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <MeasurementsEditor
          initial={initial}
          initialProfile={(existing?.profile as "feminine" | "masculine" | "neutral") ?? "neutral"}
          hasExisting={Boolean(existing)}
        />
      </section>
    </>
  );
}
