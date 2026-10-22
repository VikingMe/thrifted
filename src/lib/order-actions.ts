"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";

export async function placeOrder(formData: FormData) {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login?next=/checkout");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!name || !phone || !address || !city) {
    redirect("/checkout?error=missing");
  }

  const cart = await db.cartItem.findMany({
    where: { userId: buyer.id },
    include: { item: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
  });

  if (cart.length === 0) {
    redirect("/bag");
  }

  const total = cart.reduce((sum, ci) => sum + ci.item.priceKsh * ci.quantity, 0);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: buyer.id,
        totalKsh: total,
        status: "PENDING",
        deliveryName: name,
        deliveryPhone: phone,
        deliveryAddress: address,
        deliveryCity: city,
        items: {
          create: cart.map((ci) => ({
            quantity: ci.quantity,
            itemTitle: ci.item.title,
            itemPriceKsh: ci.item.priceKsh,
            itemImageUrl: ci.item.images[0]?.url ?? null,
            itemId: ci.item.id,
          })),
        },
      },
    });

    // Decrement stock
    for (const ci of cart) {
      const next = Math.max(0, ci.item.stock - ci.quantity);
      await tx.item.update({
        where: { id: ci.item.id },
        data: {
          stock: next,
          status: next <= 0 ? "SOLD_OUT" : "AVAILABLE",
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: buyer.id } });

    return created;
  });

  revalidatePath("/");
  revalidatePath("/bag");
  revalidatePath("/account");
  redirect(`/orders/${order.id}`);
}
