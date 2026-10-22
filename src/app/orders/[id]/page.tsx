import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting Payment",
  PAID: "Paid",
  SHIPPED: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect(`/account/login?next=/orders/${id}`);

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.userId !== buyer.id) notFound();

  const shortId = order.id.slice(-6).toUpperCase();
  const orderDate = order.createdAt.toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
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

      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <span className="type-kicker">Order #{shortId}</span>
          <h1 className="type-h2">Thank you, <em>{buyer.name?.split(" ")[0] ?? "friend"}</em>.</h1>
          <p className="type-body" style={{ maxWidth: 480, margin: "24px auto 0" }}>
            Your order is confirmed. We&apos;ve sent a copy of this receipt to{" "}
            <span style={{ color: "var(--color-ink)" }}>{buyer.email}</span>.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0, maxWidth: 800, margin: "0 auto" }}>
        <Reveal y={20} className="receipt-panel">
          {/* Receipt Header */}
          <div className="receipt-header">
            <div>
              <h3 className="panel-title" style={{ marginBottom: 8 }}>Receipt</h3>
              <p className="receipt-meta">{orderDate}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="receipt-status" style={
                order.status === "CANCELLED" ? { color: "#a03a2a" } : undefined
              }>
                {STATUS_LABEL[order.status] ?? order.status}
              </p>
              <p className="receipt-meta">Pay on delivery</p>
            </div>
          </div>

          {/* Items */}
          <Stagger className="receipt-items" staggerDelay={0.05}>
            {order.items.map((oi) => (
              <StaggerChild key={oi.id}>
                <div className="receipt-item">
                  <div className="checkout-thumb" style={{ width: 56, aspectRatio: "3/4" }}>
                    {oi.itemImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={oi.itemImageUrl} alt={oi.itemTitle} />
                    ) : (
                      <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="receipt-item-title">{oi.itemTitle}</p>
                    <p className="receipt-meta">Qty {oi.quantity}</p>
                  </div>
                  <span className="receipt-price">
                    KSh {(oi.itemPriceKsh * oi.quantity).toLocaleString("en-KE")}
                  </span>
                </div>
              </StaggerChild>
            ))}
          </Stagger>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>KSh {order.totalKsh.toLocaleString("en-KE")}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{order.totalKsh >= 5000 ? "Free" : "KSh 300"}</span>
            </div>
            <div className="summary-total" style={{ borderTop: "0.5px solid var(--color-line)", paddingTop: 20, marginTop: 8 }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 18 }}>
                KSh {(order.totalKsh + (order.totalKsh >= 5000 ? 0 : 300)).toLocaleString("en-KE")}
              </span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="receipt-delivery">
            <p className="type-label" style={{ marginBottom: 12 }}>Delivering to</p>
            <p className="order-address">
              <span style={{ color: "var(--color-ink)", fontWeight: 500 }}>{order.deliveryName}</span><br />
              {order.deliveryAddress}<br />
              {order.deliveryCity}<br />
              {order.deliveryPhone}
            </p>
          </div>
        </Reveal>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 48 }}>
          <Link href="/" className="btn btn-primary">Continue shopping</Link>
          <Link href="/account" className="btn btn-ghost">View account</Link>
        </div>
      </section>
    </>
  );
}
