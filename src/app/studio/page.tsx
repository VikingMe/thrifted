import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { StudioCanvas } from "@/components/StudioCanvas";
import { GARMENT_PRESETS } from "@/lib/studio/silhouette";

export default async function StudioPage() {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login?next=/studio");

  const measurements = await db.measurement.findUnique({
    where: { userId: buyer.id },
  });

  if (!measurements) {
    return (
      <>
        <header className="nav-shell">
          <div className="nav-inner">
            <Link href="/" className="logo">THRI<span>FTED</span></Link>
            <nav className="nav-links">
              <Link href="/">Boutique</Link>
              <Link href="/account" className="hide-sm">Account</Link>
            </nav>
          </div>
        </header>
        <section className="section" style={{ textAlign: "center", paddingTop: 140 }}>
          <span className="type-kicker">Studio</span>
          <h1 className="type-h2" style={{ margin: "20px 0 16px" }}>Measurements required.</h1>
          <p className="type-body" style={{ maxWidth: 400, margin: "0 auto 36px" }}>
            Before you can try on clothes, we need to know your body shape.
            It takes two minutes.
          </p>
          <Link href="/studio/measurements" className="btn btn-primary">Enter measurements</Link>
        </section>
      </>
    );
  }

  // Fetch catalog items for the picker
  const items = await db.item.findMany({
    where: { status: "AVAILABLE", isStudioReady: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 12, // just show a selection
  });

  // Prepare initial props safely
  const initialMeasurements = {
    heightCm: measurements.heightCm ?? 165,
    bustCm: measurements.bustCm ?? 88,
    waistCm: measurements.waistCm ?? 70,
    hipsCm: measurements.hipsCm ?? 96,
    inseamCm: measurements.inseamCm ?? 78,
    armLengthCm: measurements.armLengthCm ?? 58,
    armCircCm: measurements.armCircCm ?? 28,
  };
  
  const profile = measurements.profile ?? "neutral";

  // Map items to shape presets expected by the engine
  const catalog = items.map((i) => {
    const presetKey = i.drapePreset as keyof typeof GARMENT_PRESETS | undefined;
    const shape = presetKey && GARMENT_PRESETS[presetKey] 
      ? GARMENT_PRESETS[presetKey] 
      : GARMENT_PRESETS.tee;

    return {
      id: i.id,
      title: i.title,
      imageUrl: i.images[0]?.url ?? null,
      shape: shape,
    };
  });

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/account" className="hide-sm">Account</Link>
            <Link href="/studio/measurements" className="cart-pill">Edit measurements</Link>
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <span className="type-kicker" style={{ margin: 0 }}>Studio</span>
            <span style={{ background: "var(--color-gold)", color: "white", fontSize: 8, letterSpacing: "0.2em", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>Beta</span>
          </div>
          <h1 className="type-h2">See it on <em>you</em>.</h1>
          <p className="type-body" style={{ maxWidth: 540, margin: "20px auto 0" }}>
            Select a piece from the boutique to see how it drapes on your
            exact measurements.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-muted)", marginTop: 16, fontStyle: "italic" }}>
            Note: The Virtual Try-On Studio is in beta. Visualizations are approximations and may not perfectly reflect real-world fit.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <StudioCanvas
          initialMeasurements={initialMeasurements}
          initialProfile={profile}
          catalog={catalog}
        />
      </section>
    </>
  );
}
