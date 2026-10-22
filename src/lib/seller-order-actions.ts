"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isSellerAuthed } from "@/lib/auth";

const ALLOWED = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof ALLOWED)[number];

export async function updateOrderStatus(formData: FormData) {
  if (!(await isSellerAuthed())) redirect("/seller/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as Status;

  if (!id || !ALLOWED.includes(status)) return;

  await db.order.update({ where: { id }, data: { status } });

  revalidatePath("/seller/orders");
  revalidatePath("/account");
  revalidatePath(`/orders/${id}`);
}
