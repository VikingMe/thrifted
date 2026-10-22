import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { getCartCount } from "@/lib/cart";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

const CATEGORY_LABEL: Record<string, string> = {
  TOPS: "Tops", DRESSES: "Dresses", BOTTOMS: "Bottoms",
  KNITWEAR: "Knitwear", OUTERWEAR: "Outerwear", ACCESSORIES: "Accessories",
};

const ERA_LABEL: Record<string, string> = {
  FIFTIES: "50s", SIXTIES: "60s", SEVENTIES: "70s", EIGHTIES: "80s",
  NINETIES: "90s", Y2K: "Y2K", MODERN: "Modern",
};

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getCurrentBuyer();
  const bagCount = await getCartCount();

  const seller = await db.user.findUnique({
    where: { id, role: "SELLER" },
    include: {
      itemsListed: {
        where: { status: "AVAILABLE" },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!seller) notFound();

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            {buyer ? (
              <>
                <Link href="/account" className="hide-sm">Account</Link>
                <Link href="/bag" className="cart-pill">Bag ({bagCount})</Link>
              </>
            ) : (
              <Link href="/account/login" className="cart-pill">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="seller-profile-head">
          <Reveal y={20}>
            <span className="type-kicker">Independent Seller</span>
            <h1 className="type-h2" style={{ marginTop: 16, marginBottom: 24 }}>
              {seller.name ?? "Unknown Atelier"}.
            </h1>
            <p className="type-body" style={{ maxWidth: 480 }}>
              Curated pieces from {seller.name ?? "this seller"}. Sourced and verified 
              in Nairobi. Every purchase supports independent fashion.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ borderTop: "0.5px solid var(--color-line)", paddingTop: 40 }}>
          <h2 className="type-label" style={{ marginBottom: 32 }}>The Collection ({seller.itemsListed.length})</h2>
          
          {seller.itemsListed.length === 0 ? (
            <p className="type-body">This seller currently has no items available.</p>
          ) : (
            <Stagger className="grid" staggerDelay={0.06}>
              {seller.itemsListed.map((item) => (
                <StaggerChild key={item.id}>
                  <Link href={`/item/${item.id}`} className="card">
                    <div className="card-img">
                      <div className="card-badge era">{ERA_LABEL[item.era] ?? item.era}</div>
                      {item.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.images[0].url} alt={item.title} />
                      ) : (
                        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                      )}
                    </div>
                    <div className="card-body">
                      <div className="card-cat">{CATEGORY_LABEL[item.category] ?? item.category}</div>
                      <h3 className="card-name">{item.title}</h3>
                      <div className="card-meta">
                        {item.condition.charAt(0) + item.condition.slice(1).toLowerCase()}
                        {item.sizeLabel ? ` · Size ${item.sizeLabel}` : ""}
                      </div>
                      <div className="card-price-row">
                        <span className="card-price">KSh {item.priceKsh.toLocaleString("en-KE")}</span>
                        <span className="card-cta">View</span>
                      </div>
                    </div>
                  </Link>
                </StaggerChild>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </>
  );
}
