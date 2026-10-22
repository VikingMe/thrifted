"use client";

import { useState } from "react";

export function VtsForm({ 
  itemId, 
  initialReady, 
  initialPreset 
}: { 
  itemId: string; 
  initialReady: boolean; 
  initialPreset: string 
}) {
  const [ready, setReady] = useState(initialReady ? "true" : "false");
  const [preset, setPreset] = useState(initialPreset);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function autoSave(newReady: string, newPreset: string) {
    setStatus("saving");
    try {
      const res = await fetch("/api/seller/item/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          isStudioReady: newReady === "true",
          drapePreset: newPreset,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="edit-vts-form">
      <select 
        value={ready} 
        onChange={(e) => {
          const newVal = e.target.value;
          setReady(newVal);
          autoSave(newVal, preset);
        }}
        className="vts-select"
      >
        <option value="true">VTS: Yes</option>
        <option value="false">VTS: No</option>
      </select>
      
      <select 
        value={preset} 
        onChange={(e) => {
          const newVal = e.target.value;
          setPreset(newVal);
          autoSave(ready, newVal);
        }}
        className="vts-select" 
        style={{ marginTop: 6 }}
      >
        <option value="tee">Basic Top</option>
        <option value="longSleeve">Long Sleeve</option>
        <option value="blouse">Blouse</option>
        <option value="cropTop">Crop Top</option>
        <option value="midiDress">Midi Dress</option>
        <option value="miniDress">Mini Dress</option>
        <option value="maxiDress">Maxi Dress</option>
        <option value="coat">Coat</option>
        <option value="trousers">Trousers</option>
        <option value="shorts">Shorts</option>
        <option value="pencilSkirt">Pencil Skirt</option>
        <option value="midiSkirt">Midi Skirt</option>
        <option value="maxiSkirt">Maxi Skirt</option>
      </select>

      <div style={{ height: 14, marginTop: 4, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
        {status === "saving" && <span style={{ color: "var(--color-muted)" }}>Saving...</span>}
        {status === "saved" && <span style={{ color: "green" }}>Saved ✓</span>}
        {status === "error" && <span style={{ color: "red" }}>Error</span>}
      </div>
    </div>
  );
}
