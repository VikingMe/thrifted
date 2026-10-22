import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const BUYER_COOKIE = "thrifted_buyer";

export async function setBuyerSession(userId: string) {
  (await cookies()).set(BUYER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearBuyerSession() {
  (await cookies()).delete(BUYER_COOKIE);
}

export async function getCurrentBuyer() {
  const store = await cookies();
  const id = store.get(BUYER_COOKIE)?.value;
  if (!id) return null;

  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.role !== "BUYER") return null;
  return user;
}
