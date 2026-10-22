import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const ready = searchParams.get("ready") === "true";

  if (!id) return NextResponse.json({ error: "No ID" });

  try {
    const updated = await db.item.update({
      where: { id },
      data: { isStudioReady: ready },
    });
    return NextResponse.json({ success: true, item: updated.id, isStudioReady: updated.isStudioReady });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
