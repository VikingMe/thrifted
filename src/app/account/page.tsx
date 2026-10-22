import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentBuyer, clearBuyerSession } from "@/lib/buyer-session";
import { Reveal, Stagger, StaggerChild } from "@/components/Reveal";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", PAID: "Paid", SHIPPED: "Shipped",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

async function logout() {
  "use server";
  await clearBuyerSession();
  redirect("/");
}

export default async function AccountPage() {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login");

  const orders = await db.order.findMany({
    where: { userId: buyer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <Link href="/bag" className="hide-sm">Bag</Link>
            <form action={logout}>
              <button>Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      <section className="section">
        <Reveal y={14} className="section-head" >
          <span className="type-kicker">Your account</span>
          <h1 className="type-h2">
            Hello, <em>{buyer.name?.split(" ")[0] ?? "friend"}</em>.
          </h1>
        </Reveal>

        <div className="account-layout">
          <Reveal y={20} className="account-details">
            <h2 className="panel-title">Details</h2>
            <div className="seller-form">
              <div className="form-field">
                <label>Name</label>
                <input defaultValue={buyer.name ?? ""} readOnly />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input defaultValue={buyer.email ?? ""} readOnly />
              </div>
              <div className="form-field form-full">
                <label>Member since</label>
                <input
                  defaultValue={buyer.createdAt.toLocaleDateString("en-KE", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                  readOnly
                />
              </div>
            </div>
          </Reveal>

          <div>
            <h2 className="panel-title" style={{ marginBottom: 24 }}>Orders</h2>

            {orders.length === 0 ? (
              <div className="account-empty">
                <p className="type-body" style={{ marginBottom: 20 }}>
                  No orders yet. The collection is waiting.
                </p>
                <Link href="/" className="btn btn-ghost">Browse the collection</Link>
              </div>
            ) : (
              <Stagger className="order-list" staggerDelay={0.05}>
                {orders.map((order) => (
                  <StaggerChild key={order.id}>
                    <Link href={`/orders/${order.id}`} className="order-row">
                      <div className="order-row-main">
                        <p className="order-row-id">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="order-row-meta">
                          {order.items.length} {order.items.length === 1 ? "piece" : "pieces"} ·{" "}
                          {order.createdAt.toLocaleDateString("en-KE", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p className="order-row-price">KSh {order.totalKsh.toLocaleString("en-KE")}</p>
                        <p className="order-row-status">{STATUS_LABEL[order.status] ?? order.status}</p>
                      </div>
                    </Link>
                  </StaggerChild>
                ))}
              </Stagger>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
