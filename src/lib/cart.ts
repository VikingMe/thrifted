import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";

export async function getCartItems() {
  const buyer = await getCurrentBuyer();
  if (!buyer) return { buyer: null, items: [], subtotal: 0, count: 0 };

  const items = await db.cartItem.findMany({
    where: { userId: buyer.id },
    include: {
      item: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const subtotal = items.reduce(
    (sum, ci) => sum + ci.item.priceKsh * ci.quantity,
    0
  );
  const count = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return { buyer, items, subtotal, count };
}

export async function getCartCount() {
  const buyer = await getCurrentBuyer();
  if (!buyer) return 0;

  const rows = await db.cartItem.findMany({
    where: { userId: buyer.id },
    select: { quantity: true },
  });
  return rows.reduce((sum, r) => sum + r.quantity, 0);
}
