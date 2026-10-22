import Link from "next/link";
import { getCartItems } from "@/lib/cart";
import { updateQuantity, removeFromBag } from "@/lib/cart-actions";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

export default async function BagPage() {
  const { buyer, items, subtotal } = await getCartItems();

  if (!buyer) {
    return (
      <>
        <header className="nav-shell">
          <div className="nav-inner">
            <Link href="/" className="logo">THRI<span>FTED</span></Link>
            <nav className="nav-links">
              <Link href="/">Boutique</Link>
              <Link href="/account/login" className="cart-pill">Sign in</Link>
            </nav>
          </div>
        </header>
        <section className="section" style={{ textAlign: "center", paddingTop: 140 }}>
          <Reveal y={20}>
            <span className="type-kicker">Your bag</span>
            <h1 className="type-h2" style={{ margin: "20px 0 16px" }}>Nothing to carry.</h1>
            <p className="type-body" style={{ maxWidth: 400, margin: "0 auto 36px" }}>
              Sign in to save pieces, or browse the collection first.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="btn btn-primary">Browse the collection</Link>
              <Link href="/account/login" className="btn btn-ghost">Sign in</Link>
            </div>
          </Reveal>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/account" className="hide-sm">Account</Link>
            <Link href="/bag" className="cart-pill">{items.length} in bag</Link>
          </nav>
        </div>
      </header>

      <section className="section">
        <Reveal y={16} className="section-head" >
          <span className="type-kicker">Your bag</span>
          <h1 className="type-h2">Pieces you&rsquo;ve chosen.</h1>
        </Reveal>

        {items.length === 0 ? (
          <Reveal className="text-center" y={20}>
            <p className="type-body" style={{ marginBottom: 32 }}>
              Your bag is empty. The collection is waiting.
            </p>
            <Link href="/" className="btn btn-primary">Browse the collection</Link>
          </Reveal>
        ) : (
          <div className="bag-layout">
            <Stagger className="bag-list" staggerDelay={0.06}>
              {items.map((ci) => {
                const img = ci.item.images[0];
                return (
                  <StaggerChild key={ci.id}>
                    <div className="bag-item">
                      <Link href={`/item/${ci.item.id}`} className="bag-thumb">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.url} alt={img.alt ?? ci.item.title} />
                        ) : (
                          <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                        )}
                      </Link>
                      <div className="bag-item-info">
                        <Link href={`/item/${ci.item.id}`} className="bag-item-title">
                          {ci.item.title}
                        </Link>
                        <p className="bag-item-meta">
                          {ci.item.condition.charAt(0) + ci.item.condition.slice(1).toLowerCase()}
                          {ci.item.sizeLabel ? ` · Size ${ci.item.sizeLabel}` : ""}
                        </p>
                        <div className="bag-item-controls">
                          <form action={updateQuantity} className="qty-form">
                            <input type="hidden" name="id" value={ci.id} />
                            <input
                              type="number"
                              name="quantity"
                              defaultValue={ci.quantity}
                              min={1}
                              max={ci.item.stock}
                              className="qty-input"
                            />
                            <button type="submit" className="stock-save">Update</button>
                          </form>
                          <form action={removeFromBag}>
                            <input type="hidden" name="id" value={ci.id} />
                            <button type="submit" className="delete-btn">Remove</button>
                          </form>
                        </div>
                      </div>
                      <div className="bag-item-price">
                        KSh {(ci.item.priceKsh * ci.quantity).toLocaleString("en-KE")}
                      </div>
                    </div>
                  </StaggerChild>
                );
              })}
            </Stagger>

            <aside className="bag-summary">
              <h2 className="type-label" style={{ marginBottom: 20 }}>Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>KSh {subtotal.toLocaleString("en-KE")}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>{subtotal >= 5000 ? "Free" : "Calculated at checkout"}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>KSh {subtotal.toLocaleString("en-KE")}</span>
              </div>
              <Link
                href="/checkout"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 24, textAlign: "center" }}
              >
                Proceed to checkout
              </Link>
              <Link
                href="/"
                style={{
                  display: "block", textAlign: "center", marginTop: 20,
                  fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
                  textTransform: "uppercase", color: "var(--color-muted)",
                }}
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
