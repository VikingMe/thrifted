import { redirect } from "next/navigation";
import Link from "next/link";
import { getCartItems } from "@/lib/cart";
import { placeOrder } from "@/lib/order-actions";
import { Reveal } from "@/components/Reveal";

const ERRORS: Record<string, string> = {
  missing: "All delivery fields are required.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { buyer, items, subtotal } = await getCartItems();
  if (!buyer) redirect("/account/login?next=/checkout");
  if (items.length === 0) redirect("/bag");

  const { error } = await searchParams;
  const freeDelivery = subtotal >= 5000;

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/bag" className="hide-sm">Bag</Link>
            <span className="cart-pill" style={{ background: "var(--color-ink)", color: "var(--color-ivory)" }}>
              Checkout
            </span>
          </nav>
        </div>
      </header>

      <section className="section">
        <Reveal y={14} className="section-head">
          <span className="type-kicker">Almost yours</span>
          <h1 className="type-h2">Checkout.</h1>
        </Reveal>

        <div className="checkout-layout">
          <Reveal y={20} className="checkout-form-wrap">
            <h2 className="panel-title">Delivery details</h2>
            <form action={placeOrder} className="checkout-form">
              <div className="form-field form-full">
                <label>Full name</label>
                <input name="name" defaultValue={buyer.name ?? ""} required autoComplete="name" />
              </div>
              <div className="form-field form-full">
                <label>Phone</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+254 7xx xxx xxx"
                  required
                  autoComplete="tel"
                />
              </div>
              <div className="form-field form-full">
                <label>Delivery address</label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Building, street, apartment"
                  required
                  autoComplete="street-address"
                />
              </div>
              <div className="form-field form-full">
                <label>City</label>
                <input
                  name="city"
                  defaultValue="Nairobi"
                  required
                  autoComplete="address-level2"
                />
              </div>

              <div className="form-full" style={{ marginTop: 8 }}>
                <p
                  style={{
                    fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1.8,
                    color: "var(--color-muted)", letterSpacing: "0.02em",
                    padding: "14px 16px", background: "var(--color-paper)",
                    borderLeft: "2px solid var(--color-gold)",
                  }}
                >
                  Pay on delivery. Every piece is inspected before dispatch.
                </p>
              </div>

              {error && ERRORS[error] && <div className="login-error form-full">{ERRORS[error]}</div>}

              <div className="form-full" style={{ marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Place order · KSh {subtotal.toLocaleString("en-KE")}
                </button>
              </div>
            </form>
          </Reveal>

          <aside className="bag-summary">
            <h2 className="type-label" style={{ marginBottom: 20 }}>Order summary</h2>

            <ul className="checkout-items">
              {items.map((ci) => (
                <li key={ci.id}>
                  <div className="checkout-thumb">
                    {ci.item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ci.item.images[0].url} alt={ci.item.title} />
                    ) : (
                      <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="co-title">{ci.item.title}</p>
                    <p className="co-meta">Qty {ci.quantity}</p>
                  </div>
                  <span className="co-price">
                    KSh {(ci.item.priceKsh * ci.quantity).toLocaleString("en-KE")}
                  </span>
                </li>
              ))}
            </ul>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>KSh {subtotal.toLocaleString("en-KE")}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{freeDelivery ? "Free" : "KSh 300"}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>KSh {(subtotal + (freeDelivery ? 0 : 300)).toLocaleString("en-KE")}</span>
            </div>

            <Link
              href="/bag"
              style={{
                display: "block", textAlign: "center", marginTop: 20,
                fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
                textTransform: "uppercase", color: "var(--color-muted)",
              }}
            >
              ← Back to bag
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
