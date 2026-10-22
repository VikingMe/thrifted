"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";

export async function addToBag(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const buyer = await getCurrentBuyer();
  if (!buyer) redirect(`/account/login?next=/item/${itemId}`);

  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item || item.stock <= 0) redirect(`/item/${itemId}`);

  const existing = await db.cartItem.findUnique({
    where: { userId_itemId: { userId: buyer.id, itemId } },
  });

  if (existing) {
    const next = Math.min(existing.quantity + 1, item.stock);
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: next },
    });
  } else {
    await db.cartItem.create({
      data: { userId: buyer.id, itemId, quantity: 1 },
    });
  }

  revalidatePath("/");
  revalidatePath("/bag");
  revalidatePath(`/item/${itemId}`);
  redirect("/bag");
}

export async function updateQuantity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!id) return;

  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login");

  const row = await db.cartItem.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!row || row.userId !== buyer.id) return;

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id } });
  } else {
    await db.cartItem.update({
      where: { id },
      data: { quantity: Math.min(quantity, row.item.stock) },
    });
  }

  revalidatePath("/bag");
  revalidatePath("/");
}

export async function removeFromBag(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login");

  const row = await db.cartItem.findUnique({ where: { id } });
  if (!row || row.userId !== buyer.id) return;

  await db.cartItem.delete({ where: { id } });
  revalidatePath("/bag");
  revalidatePath("/");
}
