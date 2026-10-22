import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { getCartCount } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

const CATEGORIES = [
  { key: undefined, label: "All" },
  { key: "DRESSES", label: "Dresses" },
  { key: "OUTERWEAR", label: "Outerwear" },
  { key: "TOPS", label: "Tops" },
  { key: "BOTTOMS", label: "Bottoms" },
  { key: "KNITWEAR", label: "Knitwear" },
  { key: "ACCESSORIES", label: "Accessories" },
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  TOPS: "Tops", DRESSES: "Dresses", BOTTOMS: "Bottoms",
  KNITWEAR: "Knitwear", OUTERWEAR: "Outerwear", ACCESSORIES: "Accessories",
};

const ERA_LABEL: Record<string, string> = {
  FIFTIES: "50s", SIXTIES: "60s", SEVENTIES: "70s", EIGHTIES: "80s",
  NINETIES: "90s", Y2K: "Y2K", MODERN: "Modern",
};

const SILHOUETTES: Record<string, string> = {
  DRESSES: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><path d="M100 30 C86 30 78 40 78 52 C78 62 84 70 92 73 L84 92 C74 98 66 110 62 124 L48 220 L62 226 L58 340 C58 360 68 380 100 380 C132 380 142 360 142 340 L138 226 L152 220 L138 124 C134 110 126 98 116 92 L108 73 C116 70 122 62 122 52 C122 40 114 30 100 30 Z" fill="#a98a3f" opacity="0.45"/></svg>`,
  TOPS: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><path d="M100 40 C86 40 78 50 78 62 C78 72 84 80 92 83 L72 100 C60 108 52 122 52 138 L52 180 L68 180 L68 175 L72 220 L128 220 L132 175 L132 180 L148 180 L148 138 C148 122 140 108 128 100 L108 83 C116 80 122 72 122 62 C122 50 114 40 100 40 Z" fill="#a98a3f" opacity="0.45"/></svg>`,
  OUTERWEAR: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><path d="M100 30 C86 30 78 40 78 52 C78 62 84 70 92 73 L68 92 C56 100 46 116 46 134 L46 320 L80 320 L80 200 L88 200 L88 320 L112 320 L112 200 L120 200 L120 320 L154 320 L154 134 C154 116 144 100 132 92 L108 73 C116 70 122 62 122 52 C122 40 114 30 100 30 Z" fill="#a98a3f" opacity="0.45"/></svg>`,
  BOTTOMS: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><path d="M62 40 L138 40 L146 160 L134 380 L108 380 L100 200 L92 380 L66 380 L54 160 Z" fill="#a98a3f" opacity="0.45"/></svg>`,
  KNITWEAR: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><path d="M100 40 C86 40 78 50 78 62 C78 72 84 80 92 83 L72 100 C60 108 52 122 52 138 L52 180 L68 180 L68 175 L72 220 L128 220 L132 175 L132 180 L148 180 L148 138 C148 122 140 108 128 100 L108 83 C116 80 122 72 122 62 C122 50 114 40 100 40 Z" fill="#a98a3f" opacity="0.45"/></svg>`,
  ACCESSORIES: `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="200" r="80" fill="none" stroke="#a98a3f" stroke-width="4" opacity="0.45"/><path d="M60 120 Q100 100 140 120" stroke="#a98a3f" stroke-width="3" fill="none" opacity="0.45"/></svg>`,
};

async function Grid({ category, query }: { category?: string; query?: string }) {
  const buyer = await getCurrentBuyer();
  const wishlistedIds = new Set(
    buyer ? (await db.wishlist.findMany({ where: { userId: buyer.id }, select: { itemId: true } })).map(w => w.itemId) : []
  );

  const where: Record<string, unknown> = { status: { not: "ARCHIVED" } };
  if (category) where.category = category;
  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await db.item.findMany({
    where,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  if (items.length === 0) {
    return (
      <Reveal className="text-center" y={20}>
        <p className="type-h2" style={{ marginBottom: 14 }}>The atelier is quiet.</p>
        <p className="type-label">Nothing here yet — check another category</p>
      </Reveal>
    );
  }

  return (
    <Stagger className="grid" staggerDelay={0.06}>
      {items.map((item) => {
        const soldOut = item.stock <= 0 || item.status === "SOLD_OUT";
        const low = !soldOut && item.stock <= 2;
        const img = item.images[0];
        const silhouette = SILHOUETTES[item.category] ?? SILHOUETTES.DRESSES;
        return (
          <StaggerChild key={item.id}>
            <Link href={`/item/${item.id}`} className="card">
              <div className="card-img">
                <div className="card-badge era">{ERA_LABEL[item.era] ?? item.era}</div>
                {soldOut && <div className="card-badge sold" style={{ top: 18, left: "auto", right: 18 }}>Sold</div>}
                {low && <div className="card-badge" style={{ top: 18, left: "auto", right: 18, background: "var(--color-gold)", color: "#fff" }}>Only {item.stock}</div>}
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt={img.alt ?? item.title} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: silhouette }} />
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
                  <span className="card-cta">Try On →</span>
                </div>
              </div>
            </Link>
          </StaggerChild>
        );
      })}
    </Stagger>
  );
}

function Skeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-img skeleton" />
          <div className="card-body">
            <div className="skeleton" style={{ height: 10, width: "40%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 18, width: "80%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: "50%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const buyer = await getCurrentBuyer();
  const bagCount = await getCartCount();

  return (
    <>
      <div className="bg-textured border-b border-line pb-12">
      <header className="nav-shell" style={{ background: "transparent", backdropFilter: "none", borderBottom: "none" }}>
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="#catalog">Boutique</Link>
            <Link href="#tryon" className="hide-sm">Try-On Studio</Link>
            <Link href="/seller" className="hide-sm">Sell</Link>
            {buyer ? (
              <>
                <Link href="/wishlist" className="hide-sm">Wishlist</Link>
                <Link href="/account" className="hide-sm">Account</Link>
                <Link href="/bag" className="cart-pill">Bag ({bagCount})</Link>
              </>
            ) : (
              <Link href="/account/login" className="cart-pill">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <div className="search-bar">
        <form action="/" method="get" className="search-form">
          {category && <input type="hidden" name="category" value={category} />}
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search the collection — silk, wool, gold, 90s…"
            className="search-input"
          />
          {q && (
            <Link href={category ? `/?category=${category}` : "/"} className="search-clear">
              Clear
            </Link>
          )}
        </form>
      </div>

      <section className="hero">
        <div className="hero-content">
          <Reveal y={16} delay={0.1}>
            <span className="type-kicker">Curated vintage &amp; pre-loved · Nairobi</span>
          </Reveal>
          <Reveal y={20} delay={0.2}>
            <h1 className="type-display">
              Second-hand,<br />
              <em>first-rate</em> style.
            </h1>
          </Reveal>
          <Reveal y={16} delay={0.35}>
            <p className="type-body hero-sub">
              Curated vintage and pre-loved fashion. Try every piece on your
              silhouette before it reaches your door.
            </p>
          </Reveal>
          <Reveal y={16} delay={0.5}>
            <div className="hero-actions">
              <Link href="#catalog" className="btn btn-primary">Shop the Drop</Link>
              <Link href="#tryon" className="btn btn-ghost">Try-On Studio</Link>
            </div>
          </Reveal>
        </div>
        <Reveal y={30} delay={0.3} className="hero-visual hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
            alt="Editorial fashion"
          />
        </Reveal>
      </section>
      </div>

      <div className="marquee">
        <div className="marquee-track">
          <span>Free delivery over KSh 5,000</span><span>·</span>
          <span>Every item verified</span><span>·</span>
          <span>Virtual try-on for every piece</span><span>·</span>
          <span>New drops every Friday</span><span>·</span>
          <span>Free delivery over KSh 5,000</span><span>·</span>
          <span>Every item verified</span><span>·</span>
          <span>Virtual try-on for every piece</span><span>·</span>
          <span>New drops every Friday</span><span>·</span>
        </div>
      </div>

      <section className="section" id="catalog">
        <Reveal className="section-head" y={20}>
          <span className="type-kicker">Hand-picked · One of one · Try before you buy</span>
          <h2 className="type-h2">The Collection</h2>
        </Reveal>

        <Reveal className="filters sticky-filters" y={12} delay={0.1}>
          {CATEGORIES.map((c) => {
            const href = c.key ? `/?category=${c.key}#catalog` : "/#catalog";
            const active = (category ?? undefined) === c.key;
            return (
              <Link key={c.label} href={href} className={active ? "active" : ""}>
                {c.label}
              </Link>
            );
          })}
        </Reveal>

        <Suspense key={`${category ?? "all"}|${q ?? ""}`} fallback={<Skeleton />}>
          <Grid category={category} query={q} />
        </Suspense>
      </section>

      <section className="tryon-banner" id="tryon">
        <div className="tryon-inner">
          <Reveal y={24}>
            <h2 className="type-h2">See it on <em>you</em>.</h2>
            <p className="type-body">
              Every item in the collection is try-on ready. Preview the fit,
              the drape, the length — before you commit.
            </p>
            <Link href="/studio" className="btn">Open Try-On Studio</Link>
          </Reveal>
          <Reveal y={30} delay={0.2} className="tryon-visual">
            <svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a961" />
                  <stop offset="100%" stopColor="#f4efe6" />
                </linearGradient>
              </defs>
              <path d="M100 20 C80 20 68 34 68 52 C68 66 76 76 86 80 L74 110 C60 118 50 132 50 150 L50 200 L64 200 L64 320 C64 350 74 380 100 380 C126 380 136 350 136 320 L136 200 L150 200 L150 150 C150 132 140 118 126 110 L114 80 C124 76 132 66 132 52 C132 34 120 20 100 20 Z" fill="url(#tg)" />
            </svg>
          </Reveal>
        </div>
      </section>

      <footer className="footer" id="sell">
        <Reveal y={16}>
          <div className="footer-logo">THRI<span>FTED</span></div>
          <p className="footer-tag">Second-hand · First-rate</p>
          <div className="footer-links">
            <Link href="/">Shop</Link>
            <Link href="/seller">Sell With Us</Link>
            <span>About</span>
            <span>Shipping</span>
            <span>Contact</span>
          </div>
        </Reveal>
      </footer>
    </>
  );
}
