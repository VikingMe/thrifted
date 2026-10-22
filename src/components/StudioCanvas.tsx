"use client";

import { useState } from "react";
import { Silhouette, type SilhouetteProfile, type Garment } from "./Silhouette";
import type { RawMeasurements } from "@/lib/studio/silhouette";
import { clsx } from "clsx";
import { generateFitReport } from "@/lib/studio/fit-report";

type CatalogItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  shape: Garment["shape"];
};

export function StudioCanvas({
  initialMeasurements,
  initialProfile,
  catalog,
}: {
  initialMeasurements: RawMeasurements;
  initialProfile: SilhouetteProfile;
  catalog: CatalogItem[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    catalog.length > 0 ? catalog[0].id : null
  );

  const selectedItem = catalog.find((c) => c.id === selectedId);

  // We pass the garment to the SVG renderer, which uses the engine's drapeGeometry
  const activeGarments: Garment[] = selectedItem
    ? [{ imageUrl: selectedItem.imageUrl, shape: selectedItem.shape }]
    : [];

  return (
    <div className="studio-layout">
      {/* Left side: The try-on stage */}
      <div className="studio-stage">
        <div className="studio-figure">
          <Silhouette
            measurements={initialMeasurements}
            profile={initialProfile}
            garments={activeGarments}
          />
        </div>
        {selectedItem ? (
          <div className="studio-stage-footer">
            <p className="studio-stage-title">{selectedItem.title}</p>
            <p className="studio-stage-meta">Draped on your silhouette</p>
          </div>
        ) : (
          <div className="studio-stage-footer">
            <p className="studio-stage-meta">Select a piece to begin</p>
          </div>
        )}
      </div>

      {/* Fit Report Panel */}
      <div className="studio-report-panel">
        <h2 className="panel-title" style={{ marginBottom: 20 }}>Fit Report</h2>
        {selectedItem ? (
          <div className="studio-report-list">
            {generateFitReport(initialMeasurements, selectedItem.shape).map((note, i) => (
              <div key={i} className={clsx("fit-note", note.type)}>
                <div className="fit-note-dot" />
                <div>
                  <p className="fit-note-title">{note.title}</p>
                  <p className="fit-note-desc">{note.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--color-muted)" }}>
            Select a garment to see how it will fit your body.
          </p>
        )}
      </div>

      {/* Right side: The catalog picker */}
      <div className="studio-picker">
        <h2 className="panel-title" style={{ marginBottom: 24 }}>The collection</h2>
        <div className="studio-grid">
          {catalog.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={clsx("studio-pick-card", { active })}
              >
                <div className="studio-pick-img">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} />
                  ) : (
                    <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                  )}
                </div>
                <div className="studio-pick-info">
                  <p className="studio-pick-title">{item.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
