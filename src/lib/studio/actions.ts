"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBuyer } from "@/lib/buyer-session";
import type { Measurements } from "./silhouette";

export async function saveMeasurements(m: Measurements, profile?: string) {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/account/login?next=/studio/measurements");

  const data = {
    profile: profile ?? "neutral",
    heightCm: m.heightCm,
    bustCm: m.bustCm,
    waistCm: m.waistCm,
    hipsCm: m.hipsCm,
    inseamCm: m.inseamCm,
    armLengthCm: m.armLengthCm,
    armCircCm: m.armCircCm,
  };

  await db.measurement.upsert({
    where: { userId: buyer.id },
    update: data,
    create: { userId: buyer.id, ...data },
  });

  revalidatePath("/studio");
  revalidatePath("/studio/measurements");
}
