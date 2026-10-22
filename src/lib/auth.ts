import { cookies } from "next/headers";

export const SELLER_COOKIE = "thrifted_seller";

export async function isSellerAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SELLER_COOKIE)?.value === "1";
}
