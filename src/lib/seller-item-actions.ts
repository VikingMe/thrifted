"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isSellerAuthed } from "@/lib/auth";

export async function updateItemSettings(formData: FormData) {
  console.log("🔥 SERVER ACTION FIRED");
  
  const isAuth = await isSellerAuthed();
  console.log("🔒 Auth status:", isAuth);
  
  if (!isAuth) redirect("/seller/login");

  const id = String(formData.get("id") ?? "");
  const drapePreset = String(formData.get("drapePreset") ?? "tee");
  const isStudioReady = formData.get("isStudioReady") === "true";

  console.log("📦 Payload received:", { id, drapePreset, isStudioReady });

  if (!id) {
    console.log("❌ Missing ID");
    redirect("/seller?error=missing_id");
  }

  try {
    const updated = await db.item.update({
      where: { id },
      data: { drapePreset, isStudioReady },
    });
    console.log("✅ DB Updated successfully:", updated.id, updated.isStudioReady);
  } catch (error) {
    console.error("❌ PRISMA ERROR:", error);
    redirect("/seller?error=db_failed");
  }

  // Force a hard redirect to bypass ALL Next.js client-side caching
  redirect("/seller?success=true");
}
