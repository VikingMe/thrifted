import { deriveAnchors, type RawMeasurements, type GarmentShape } from "./silhouette";

export type FitNote = {
  type: "warning" | "info" | "good";
  title: string;
  description: string;
};

export function generateFitReport(
  measurements: RawMeasurements,
  shape: GarmentShape
): FitNote[] {
  const a = deriveAnchors(measurements);
  const notes: FitNote[] = [];

  // Body heights in cm from the floor for reference
  const height = a.measurements.heightCm;
  const inseam = a.measurements.inseamCm;

  // 1. Vertical Length Analysis (Tops & Dresses)
  if (shape.top === "shoulder") {
    const isDress = shape.hem === "knee" || shape.hem === "calf" || shape.hem === "ankle";
    const isCrop = shape.hem === "bust" || shape.hem === "waist";
    
    // Shoulder to hem length
    const shoulderDropCm = (a.armpitY - a.shoulderY) / a.scale;
    const hemDropCm = (getYForHem(a, shape.hem) - a.armpitY) / a.scale;
    const totalLength = shoulderDropCm + hemDropCm;

    if (isDress) {
      if (height > 175 && totalLength < 90) {
        notes.push({
          type: "warning",
          title: "Dress may be short",
          description: `On your ${height}cm frame, this piece will fall above the knee — closer to a mini dress.`,
        });
      } else if (height < 160 && totalLength > 100) {
        notes.push({
          type: "info",
          title: "Generous length",
          description: `This will read as a longer dress on your ${height}cm frame.`,
        });
      }
    }

    if (isCrop && totalLength > 45) {
      notes.push({
        type: "warning",
        title: "Not a true crop",
        description: "On your torso length, this will sit closer to a standard tee length.",
      });
    }
  }

  // 2. Horizontal Fit Analysis (Waist & Hips)
  if (shape.top === "waist" || shape.split) {
    const waist = a.measurements.waistCm;
    const hips = a.measurements.hipsCm;

    // Check for hip-heavy proportions
    if (hips - waist > 28) {
      notes.push({
        type: "info",
        title: "Curvy hip fit",
        description: "Due to your waist-to-hip ratio, rigid fabrics may pull at the hips. Look for stretch or A-line cuts.",
      });
    }
    
    // Check for straight proportions on fitted skirts
    if (shape.volume && shape.volume < 0.9 && hips - waist < 15) {
      notes.push({
        type: "info",
        title: "Straight cut",
        description: "This fitted style will hang straight without much waist definition on your frame.",
      });
    }
  }

  // 3. Sleeves
  if (shape.sleeve && shape.sleeve !== "none") {
    const armLen = measurements.armLengthCm ?? 58;
    if (shape.sleeve === "long" && armLen > 62) {
      notes.push({
        type: "warning",
        title: "Sleeves run short",
        description: `Your arm length (${armLen}cm) may cause the cuff to sit above the wrist bone.`,
      });
    } else if (shape.sleeve === "short" && armLen > 60) {
      notes.push({
        type: "info",
        title: "Higher bicep cut",
        description: "The short sleeve will sit higher up the arm due to your sleeve length.",
      });
    }
  }

  // 4. Fabric Volume
  if (shape.volume && shape.volume > 1.4) {
    notes.push({
      type: "info",
      title: "Oversized fit",
      description: "This piece has a deliberately loose, relaxed silhouette.",
    });
  }

  // If we found nothing specific, generate a breakdown of where it lands
  if (notes.length === 0) {
    const y = getYForHem(a, shape.hem);
    let region = "hip";
    if (y >= a.ankleY - 5) region = "ankle";
    else if (y >= a.calfY) region = "calf";
    else if (y >= a.kneeY) region = "knee";
    else if (y >= a.crotchY) region = "thigh";
    else if (y >= a.hipY) region = "hip";
    else if (y >= a.waistY) region = "waist";
    else if (y >= a.bustY) region = "bust";

    notes.push({
      type: "good",
      title: "True to fit",
      description: `Drapes precisely to the ${region} on your frame. Your proportions match the design.`,
    });
  }

  return notes;
}

function getYForHem(a: ReturnType<typeof deriveAnchors>, hem: string): number {
  switch (hem) {
    case "ankle": return a.ankleY;
    case "calf": return a.calfY;
    case "knee": return a.kneeY;
    case "thigh": return a.crotchY + 0.3 * (a.floorY - a.crotchY);
    case "hip": return a.hipY;
    case "waist": return a.waistY;
    case "bust": return a.bustY;
    default: return a.armpitY;
  }
}
