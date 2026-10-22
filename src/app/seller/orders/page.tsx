import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { isSellerAuthed } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/seller-order-actions";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", PAID: "Paid", SHIPPED: "Shipped",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

async function logout() {
  "use server";
  const { cookies } = await import("next/headers");
  (await cookies()).delete("thrifted_seller");
  redirect("/");
}

export default async function SellerOrdersPage() {
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: true },
  });

  const pending = orders.filter((o) => o.status === "PENDING").length;

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/seller" className="hide-sm">Atelier</Link>
            <span style={{ color: "var(--color-gold-deep)" }}>Orders</span>
            <form action={logout}>
              <button>Log out</button>
            </form>
          </nav>
        </div>
      </header>

      <section className="section">
        <Reveal y={14} className="section-head">
          <span className="type-kicker">Atelier · Orders</span>
          <h1 className="type-h2">
            {pending > 0 ? (
              <>{pending} to <em>fulfil</em>.</>
            ) : (
              <>All <em>quiet</em>.</>
            )}
          </h1>
        </Reveal>

        {orders.length === 0 ? (
          <Reveal y={20} className="text-center">
            <p className="type-body">No orders yet.</p>
          </Reveal>
        ) : (
          <Stagger className="seller-orders" staggerDelay={0.06}>
            {orders.map((order) => (
              <StaggerChild key={order.id}>
                <article className="seller-order">
                  <div className="seller-order-head">
                    <div>
                      <p className="order-row-id">Order #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="order-row-meta">
                        {order.createdAt.toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {" · "}
                        {order.user.name ?? "Buyer"} · {order.user.email ?? "—"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="order-row-price">
                        KSh {order.totalKsh.toLocaleString("en-KE")}
                      </p>
                      <p
                        className="order-row-status"
                        style={
                          order.status === "CANCELLED"
                            ? { color: "#a03a2a" }
                            : order.status === "DELIVERED"
                            ? { color: "var(--color-muted)" }
                            : undefined
                        }
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </p>
                    </div>
                  </div>

                  <div className="seller-order-body">
                    <ul className="seller-order-items">
                      {order.items.map((oi) => (
                        <li key={oi.id}>
                          <div className="checkout-thumb" style={{ width: 44, aspectRatio: "3/4" }}>
                            {oi.itemImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={oi.itemImageUrl} alt={oi.itemTitle} />
                            ) : (
                              <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                            )}
                          </div>
                          <span className="soi-title">{oi.itemTitle}</span>
                          <span className="soi-qty">×{oi.quantity}</span>
                          <span className="soi-price">
                            KSh {(oi.itemPriceKsh * oi.quantity).toLocaleString("en-KE")}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="seller-order-delivery">
                      <p className="type-label" style={{ marginBottom: 8 }}>Deliver to</p>
                      <p className="order-address">
                        {order.deliveryName}<br />
                        {order.deliveryAddress}<br />
                        {order.deliveryCity}<br />
                        {order.deliveryPhone}
                      </p>
                    </div>
                  </div>

                  <div className="seller-order-actions">
                    {(["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const)
                      .filter((s) => s !== order.status)
                      .map((s) => (
                        <form key={s} action={updateOrderStatus}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="status" value={s} />
                          <button type="submit" className="order-action-btn">
                            Mark {STATUS_LABEL[s].toLowerCase()}
                          </button>
                        </form>
                      ))}
                  </div>
                </article>
              </StaggerChild>
            ))}
          </Stagger>
        )}
      </section>
    </>
  );
}
