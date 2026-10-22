"use client";

import { useState } from "react";

export function StockForm({ itemId, initialStock }: { itemId: string; initialStock: number }) {
  const [stock, setStock] = useState(initialStock);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function autoSave(newStock: number) {
    setStatus("saving");
    try {
      const res = await fetch("/api/seller/item/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, stock: newStock }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input
        type="number"
        value={stock}
        onChange={(e) => {
          const val = Number(e.target.value);
          setStock(val);
          autoSave(val);
        }}
        className="stock-input"
      />
      <div style={{ height: 12, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
        {status === "saving" && <span style={{ color: "var(--color-muted)" }}>Saving...</span>}
        {status === "saved" && <span style={{ color: "green" }}>Saved ✓</span>}
        {status === "error" && <span style={{ color: "red" }}>Error</span>}
      </div>
    </div>
  );
}
