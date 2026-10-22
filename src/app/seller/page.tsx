import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { db } from "@/lib/db";
import { isSellerAuthed } from "@/lib/auth";
import { VtsForm } from "@/components/VtsForm";
import { StockForm } from "@/components/StockForm";
import { ImageUpload } from "@/components/ImageUpload";

const CATEGORY_LABEL: Record<string, string> = {
  TOPS: "Tops", DRESSES: "Dresses", BOTTOMS: "Bottoms",
  KNITWEAR: "Knitwear", OUTERWEAR: "Outerwear", ACCESSORIES: "Accessories",
};

const ERA_LABEL: Record<string, string> = {
  FIFTIES: "50s", SIXTIES: "60s", SEVENTIES: "70s", EIGHTIES: "80s",
  NINETIES: "90s", Y2K: "Y2K", MODERN: "Modern",
};

async function getSeller() {
  const seller = await db.user.findFirst({ where: { role: "SELLER" } });
  if (!seller) throw new Error("No seller in database.");
  return seller;
}

// --- ALL ACTIONS DEFINED DIRECTLY IN THE PAGE ---

async function addItem(formData: FormData) {
  "use server";
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const seller = await getSeller();
  const title = String(formData.get("title") ?? "").trim();
  const priceKsh = Number(formData.get("priceKsh") ?? 0);
  const category = String(formData.get("category") ?? "TOPS") as any;
  const era = String(formData.get("era") ?? "MODERN") as any;
  const condition = String(formData.get("condition") ?? "GOOD") as any;
  const sizeLabel = String(formData.get("sizeLabel") ?? "").trim() || null;
  const stock = Number(formData.get("stock") ?? 1);
  const description = String(formData.get("description") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const drapePreset = String(formData.get("drapePreset") ?? "tee");
  const isStudioReady = formData.get("isStudioReady") === "true";

  if (!title || !priceKsh) return;

  await db.item.create({
    data: {
      title, description, priceKsh, category, era, condition, sizeLabel, stock,
      drapePreset, isStudioReady,
      sellerId: seller.id,
      images: imageUrl ? { create: [{ url: imageUrl, alt: title, position: 0 }] } : undefined,
    },
  });

  revalidatePath("/");
  revalidatePath("/seller");
  redirect("/seller?success=true");
}

async function updateStock(formData: FormData) {
  "use server";
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const id = String(formData.get("id") ?? "");
  const stock = Number(formData.get("stock") ?? 0);
  if (!id) return;

  await db.item.update({
    where: { id },
    data: { stock, status: stock <= 0 ? "SOLD_OUT" : "AVAILABLE" },
  });

  revalidatePath("/");
  revalidatePath("/seller");
  redirect("/seller?success=true");
}

async function updateVts(formData: FormData) {
  "use server";
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const id = String(formData.get("id") ?? "");
  const drapePreset = String(formData.get("drapePreset") ?? "tee");
  const isStudioReady = formData.get("isStudioReady") === "true";
  
  console.log("🔥 UPDATE VTS FIRED FOR:", id, isStudioReady, drapePreset);

  if (!id) return;

  await db.item.update({
    where: { id },
    data: { drapePreset, isStudioReady },
  });

  revalidatePath("/");
  revalidatePath("/studio");
  revalidatePath("/seller");
  redirect("/seller?success=true");
}

async function deleteItem(formData: FormData) {
  "use server";
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.item.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/seller");
  redirect("/seller?success=true");
}

async function logout() {
  "use server";
  const { cookies } = await import("next/headers");
  (await cookies()).delete("thrifted_seller");
  redirect("/");
}

export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; q?: string }>;
}) {
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const { success, q } = await searchParams;

  const items = await db.item.findMany({
    where: q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    } : undefined,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const pendingOrders = await db.order.count({ where: { status: "PENDING" } });

  const totalValue = items.reduce((sum, i) => sum + i.priceKsh * i.stock, 0);
  const live = items.filter((i) => i.status !== "SOLD_OUT").length;

  return (
    <>
      <header className="nav-shell">
        <div className="nav-inner">
          <Link href="/" className="logo">THRI<span>FTED</span></Link>
          <nav className="nav-links">
            <Link href="/">Boutique</Link>
            <span className="hide-sm" style={{ color: "var(--color-gold-deep)" }}>Atelier</span>
            <Link href="/seller/orders">Orders</Link>
            <form action={logout}>
              <button>Log out</button>
            </form>
          </nav>
        </div>
      </header>

      {success && (
        <div style={{ background: "green", color: "white", padding: "16px", textAlign: "center", fontWeight: "bold" }}>
          Saved successfully!
        </div>
      )}

      <section className="section">
        <div className="section-head" style={{ textAlign: "left", marginBottom: 40 }}>
          <h2>The Atelier</h2>
          <p style={{ textAlign: "left" }}>Manage your collection</p>
        </div>

        <div className="seller-stats">
          <div className="stat">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Pieces listed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{live}</span>
            <span className="stat-label">Live</span>
          </div>
          <div className="stat">
            <span className="stat-value">KSh {totalValue.toLocaleString("en-KE")}</span>
            <span className="stat-label">Inventory value</span>
          </div>
          <div className="stat">
            <Link href="/seller/orders" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="stat-value">{pendingOrders}</span>
              <span className="stat-label">Orders to fulfil →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="seller-panel">
          <h3 className="panel-title">List a new piece</h3>
          <form action={addItem} className="seller-form">
            <div className="form-field form-full">
              <label>Title</label>
              <input name="title" required placeholder="'90s Silk Slip Dress" />
            </div>
            <div className="form-field">
              <label>Price (KSh)</label>
              <input name="priceKsh" type="number" required placeholder="3800" />
            </div>
            <div className="form-field">
              <label>Stock</label>
              <input name="stock" type="number" defaultValue={1} />
            </div>
            <div className="form-field">
              <label>Category</label>
              <select name="category" defaultValue="DRESSES">
                <option value="DRESSES">Dresses</option>
                <option value="OUTERWEAR">Outerwear</option>
                <option value="TOPS">Tops</option>
                <option value="BOTTOMS">Bottoms</option>
                <option value="KNITWEAR">Knitwear</option>
                <option value="ACCESSORIES">Accessories</option>
              </select>
            </div>
            <div className="form-field">
              <label>Era</label>
              <select name="era" defaultValue="NINETIES">
                <option value="FIFTIES">50s</option>
                <option value="SIXTIES">60s</option>
                <option value="SEVENTIES">70s</option>
                <option value="EIGHTIES">80s</option>
                <option value="NINETIES">90s</option>
                <option value="Y2K">Y2K</option>
                <option value="MODERN">Modern</option>
              </select>
            </div>
            <div className="form-field">
              <label>Condition</label>
              <select name="condition" defaultValue="EXCELLENT">
                <option value="MINT">Mint</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>
            <div className="form-field">
              <label>Size</label>
              <input name="sizeLabel" placeholder="M, 38, W28…" />
            </div>
            <ImageUpload />
            <div className="form-field form-full">
              <label>Studio Drape Shape</label>
              <select name="drapePreset" defaultValue="tee">
                <option value="tee">Basic Top</option>
                <option value="longSleeve">Long Sleeve</option>
                <option value="blouse">Blouse</option>
                <option value="cropTop">Crop Top</option>
                <option value="midiDress">Midi Dress</option>
                <option value="miniDress">Mini Dress</option>
                <option value="maxiDress">Maxi Dress</option>
                <option value="coat">Coat</option>
                <option value="trousers">Trousers</option>
                <option value="shorts">Shorts</option>
                <option value="pencilSkirt">Pencil Skirt</option>
                <option value="midiSkirt">Midi Skirt</option>
                <option value="maxiSkirt">Maxi Skirt</option>
              </select>
            </div>
            <div className="form-field form-full">
              <label>Virtual Try-On Studio</label>
              <select name="isStudioReady" defaultValue="true">
                <option value="true">Yes — compatible with the silhouette</option>
                <option value="false">No — hide from the studio</option>
              </select>
            </div>
            <div className="form-field form-full">
              <label>Description</label>
              <textarea name="description" rows={3} placeholder="Fabric, silhouette, provenance…" />
            </div>
            <div className="form-full">
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Add to collection</button>
            </div>
          </form>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Your collection</h3>
          
          <form method="get" action="/seller" style={{ display: "flex", gap: 8 }}>
            <input 
              type="search" 
              name="q" 
              defaultValue={q ?? ""} 
              placeholder="Search your stock..." 
              className="search-input"
              style={{ padding: "10px 14px", fontSize: 14, border: "0.5px solid var(--color-line)", background: "var(--color-ivory)", minWidth: 240 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 10 }}>Search</button>
            {q && <Link href="/seller" className="btn btn-ghost" style={{ padding: "10px 20px", fontSize: 10 }}>Clear</Link>}
          </form>
        </div>

        <div className="seller-table-wrap">
          <table className="seller-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Studio / Drape</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {item.images[0] ? (
                        <img src={item.images[0].url} alt="" className="thumb" />
                      ) : (
                        <div className="thumb" style={{ background: "var(--color-line)" }} />
                      )}
                      <div>
                        <p className="row-title">{item.title}</p>
                        <p className="row-sub">
                          {ERA_LABEL[item.era] ?? item.era}
                          {item.sizeLabel ? ` · Size ${item.sizeLabel}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{CATEGORY_LABEL[item.category] ?? item.category}</td>
                  <td className="price-cell">KSh {item.priceKsh.toLocaleString("en-KE")}</td>
                  <td>
                    <StockForm itemId={item.id} initialStock={item.stock} />
                  </td>
                  <td>
                    <VtsForm 
                      itemId={item.id} 
                      initialReady={item.isStudioReady} 
                      initialPreset={item.drapePreset ?? "tee"} 
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="delete-btn">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {items.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--color-ivory)" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--color-ink)" }}>
                No pieces found.
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)", marginTop: 8 }}>
                Try a different search term.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
