import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";

export async function POST(request: Request) {
  const buyer = await getCurrentBuyer();
  if (!buyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const existing = await db.wishlist.findUnique({
      where: { userId_itemId: { userId: buyer.id, itemId } },
    });

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    } else {
      await db.wishlist.create({ data: { userId: buyer.id, itemId } });
      return NextResponse.json({ wishlisted: true });
    }
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
