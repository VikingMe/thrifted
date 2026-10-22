import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

export default async function WishlistPage() {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login?next=/wishlist");

  const wishlist = await db.wishlist.findMany({
    where: { userId: buyer.id },
    include: { item: { include: { images: { take: 1, orderBy: { position: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  });

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

      <section className="section">
        <div className="section-head" style={{ textAlign: "left", marginBottom: 40 }}>
          <span className="type-kicker">Saved for later</span>
          <h1 className="type-h2" style={{ textAlign: "left" }}>Your Wishlist.</h1>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="type-body" style={{ marginBottom: 24 }}>Nothing saved yet.</p>
            <Link href="/" className="btn btn-primary">Browse the collection</Link>
          </div>
        ) : (
          <Stagger className="grid" staggerDelay={0.06}>
            {wishlist.map((w) => (
              <StaggerChild key={w.id}>
                <Link href={`/item/${w.item.id}`} className="card">
                  <div className="card-img">
                    {w.item.images[0] ? (
                      <img src={w.item.images[0].url} alt={w.item.title} />
                    ) : (
                      <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                    )}
                  </div>
                  <div className="card-body">
                    <h3 className="card-name">{w.item.title}</h3>
                    <div className="card-price-row">
                      <span className="card-price">KSh {w.item.priceKsh.toLocaleString("en-KE")}</span>
                    </div>
                  </div>
                </Link>
              </StaggerChild>
            ))}
          </Stagger>
        )}
      </section>
    </>
  );
}
