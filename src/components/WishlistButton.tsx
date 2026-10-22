"use client";

import { useState } from "react";

export function WishlistButton({ 
  itemId, 
  initialWishlisted = false,
  style = "icon" 
}: { 
  itemId: string; 
  initialWishlisted?: boolean;
  style?: "icon" | "full";
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, setIsPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigating if inside a Link
    if (isPending) return;
    setIsPending(true);
    
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

  const heartIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? "var(--color-ink)" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );

  if (style === "full") {
    return (
      <button onClick={toggle} className="btn btn-ghost" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        {heartIcon} {wishlisted ? "Saved" : "Save for later"}
      </button>
    );
  }

  return (
    <button 
      onClick={toggle} 
      style={{
        position: "absolute", top: 16, right: 16, zIndex: 4,
        background: "var(--color-ivory)", borderRadius: "50%", padding: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "transform 0.2s",
        transform: isPending ? "scale(0.9)" : "scale(1)"
      }}
      aria-label="Wishlist"
    >
      {heartIcon}
    </button>
  );
}
