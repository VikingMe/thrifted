import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { addToBag } from "@/lib/cart-actions";
import { WishlistButton } from "@/components/WishlistButton";
import { Reveal } from "@/components/Reveal";

const CATEGORY_LABEL: Record<string, string> = {
  TOPS: "Tops", DRESSES: "Dresses", BOTTOMS: "Bottoms",
  KNITWEAR: "Knitwear", OUTERWEAR: "Outerwear", ACCESSORIES: "Accessories",
};

const ERA_LABEL: Record<string, string> = {
  FIFTIES: "50s", SIXTIES: "60s", SEVENTIES: "70s", EIGHTIES: "80s",
  NINETIES: "90s", Y2K: "Y2K", MODERN: "Modern",
};

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await db.item.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, seller: true },
  });

  if (!item) notFound();

  const buyer = await getCurrentBuyer();
  const isWishlisted = buyer ? !!(await db.wishlist.findUnique({ where: { userId_itemId: { userId: buyer.id, itemId: item.id } } })) : false;
  const soldOut = item.stock <= 0 || item.status === "SOLD_OUT";

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            {buyer ? (
              <Link href="/account" className="cart-pill">Account</Link>
            ) : (
              <Link href="/account/login" className="cart-pill">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <Reveal y={10}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.34em",
              textTransform: "uppercase", color: "var(--color-muted)",
              borderBottom: "0.5px solid var(--color-line)", paddingBottom: 3,
            }}
          >
            ← Back to the collection
          </Link>
        </Reveal>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="item-detail">
          <Reveal y={24} className="item-images">
            {item.images.length > 0 ? (
              item.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt ?? item.title}
                  className="item-image"
                  style={{ marginTop: i === 0 ? 0 : 16 }}
                />
              ))
            ) : (
              <div className="item-image" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="type-label">No image</span>
              </div>
            )}
          </Reveal>

          <Reveal y={20} delay={0.15} className="item-meta">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="type-kicker">
                {CATEGORY_LABEL[item.category] ?? item.category} · {ERA_LABEL[item.era] ?? item.era}
              </span>
              <Link href={`/sellers/${item.sellerId}`} style={{
                fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "var(--color-gold-deep)",
                borderBottom: "1px solid transparent", transition: "border-color 0.2s"
              }}>
                By {item.seller.name ?? "Seller"}
              </Link>
            </div>
            <h1 className="type-h2" style={{ margin: "18px 0 20px" }}>{item.title}</h1>
            <p
              style={{
                fontFamily: "var(--font-sans)", fontSize: 20, letterSpacing: "0.02em",
                color: "var(--color-gold-deep)", marginBottom: 28,
              }}
            >
              KSh {item.priceKsh.toLocaleString("en-KE")}
            </p>

            {item.description && (
              <p className="type-body" style={{ marginBottom: 36 }}>{item.description}</p>
            )}

            <dl className="item-specs">
              <div>
                <dt>Condition</dt>
                <dd>{item.condition.charAt(0) + item.condition.slice(1).toLowerCase()}</dd>
              </div>
              {item.sizeLabel && (
                <div>
                  <dt>Size</dt>
                  <dd>{item.sizeLabel}</dd>
                </div>
              )}
              <div>
                <dt>Availability</dt>
                <dd>{soldOut ? "Sold out" : item.stock <= 2 ? `Only ${item.stock} left` : "In stock"}</dd>
              </div>
            </dl>

            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
              <form action={addToBag}>
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  disabled={soldOut}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    opacity: soldOut ? 0.35 : 1,
                    cursor: soldOut ? "not-allowed" : "pointer",
                  }}
                >
                  {soldOut ? "Sold out" : buyer ? "Add to bag" : "Sign in to add"}
                </button>
              </form>
              <WishlistButton itemId={item.id} initialWishlisted={isWishlisted} style="full" />
            </div>

            <p
              style={{
                marginTop: 24, fontFamily: "var(--font-sans)", fontSize: 11,
                lineHeight: 1.8, letterSpacing: "0.02em", color: "var(--color-muted)",
              }}
            >
              Free delivery in Nairobi over KSh 5,000 · 7-day returns · Every piece verified
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
