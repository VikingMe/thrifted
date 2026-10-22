import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isSellerAuthed } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isSellerAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isStudioReady, drapePreset } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await db.item.update({
      where: { id },
      data: {
        isStudioReady,
        drapePreset,
      },
    });

    // ⚡ THE FIX: Clear the Next.js cache for these pages
    revalidatePath("/seller");
    revalidatePath("/studio");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API Update Error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
