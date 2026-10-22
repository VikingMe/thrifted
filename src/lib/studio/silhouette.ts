// Parametric human silhouette — front view, relaxed standing pose.
//
// Coordinate space: viewBox 0 0 200 400. The figure stands on y = 388 and is
// drawn at a fixed scale (px per cm), so a taller person is visibly taller than
// a shorter one. Only people over 200 cm are scaled down to fit.
//
// The body is ONE continuous closed outline (head, neck, shoulders, arms, torso,
// legs, feet) so it fills cleanly with gradients and never double-paints overlaps.
// All curves are chord-length Hermite splines: smooth, no overshoot, with
// deliberate sharp corners at the armpits and crotch.

export type Measurements = {
  heightCm: number;
  bustCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  armLengthCm?: number;
  armCircCm?: number;
};

export type RawMeasurements = {
  [K in keyof Measurements]?: number | string | null;
};

export const REFERENCE_MEASUREMENTS: Measurements = {
  heightCm: 165,
  bustCm: 88,
  waistCm: 70,
  hipsCm: 96,
  inseamCm: 78,
  armLengthCm: 58,
  armCircCm: 28,
};

export const MEASUREMENT_RANGES: Record<keyof Measurements, readonly [number, number]> = {
  heightCm: [130, 210],
  bustCm: [65, 150],
  waistCm: [50, 140],
  hipsCm: [70, 160],
  inseamCm: [55, 100],
  armLengthCm: [45, 80],
  armCircCm: [20, 50],
};

const LABELS: Record<keyof Measurements, string> = {
  heightCm: "Height",
  bustCm: "Bust",
  waistCm: "Waist",
  hipsCm: "Hips",
  inseamCm: "Inseam",
  armLengthCm: "Sleeve Length",
  armCircCm: "Arm Circumference",
};

type Pt = [number, number];

// ───────────────────────── helpers ─────────────────────────

const clamp = (n: number, min: number, max: number): number =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : (min + max) / 2;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const r2 = (n: number): number => Math.round(n * 100) / 100;
const DEG = Math.PI / 180;

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Monotone cubic interpolation through (x, y) stops — no overshoot, no kinks. */
function smoothInterp(stops: ReadonlyArray<readonly [number, number]>): (x: number) => number {
  const n = stops.length;
  const xs = stops.map((s) => s[0]);
  const ys = stops.map((s) => s[1]);
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1] - xs[i]);
    d.push((ys[i + 1] - ys[i]) / h[i]);
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1] * d[i] > 0 ? (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]) : 0;
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

/**
 * Cubic Bezier segments through `pts` (assumes the pen is already at pts[0]).
 * Handle length is proportional to each segment's chord, tangents come from the
 * neighbouring points — organic curves without Catmull-Rom's overshoot.
 */
function curve(pts: Pt[], opts: { startT?: Pt; endT?: Pt; tension?: number } = {}): string {
  const n = pts.length;
  if (n < 2) return "";
  const k = opts.tension ?? 0.34;
  const unit = (dx: number, dy: number): Pt => {
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  };
  const T: Pt[] = pts.map((p, i) => {
    if (i === 0) return opts.startT ?? unit(pts[1][0] - p[0], pts[1][1] - p[1]);
    if (i === n - 1) return opts.endT ?? unit(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    return unit(pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]);
  });
  let d = "";
  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const hLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * k;
    d += ` C ${r2(p1[0] + T[i][0] * hLen)} ${r2(p1[1] + T[i][1] * hLen)}, ${r2(
      p2[0] - T[i + 1][0] * hLen,
    )} ${r2(p2[1] - T[i + 1][1] * hLen)}, ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}

const mirrorPts = (pts: Pt[], cx: number): Pt[] => pts.map(([x, y]) => [2 * cx - x, y] as Pt);
const mirrorRev = (pts: Pt[], cx: number): Pt[] => mirrorPts(pts, cx).reverse();
const pt = (p: Pt): string => `${r2(p[0])} ${r2(p[1])}`;

// ───────────────────── input handling ─────────────────────

/** Turn anything a form can produce (strings, blanks, NaN, out-of-range) into a safe, drawable set. */
export function normalizeMeasurements(raw: RawMeasurements): Measurements {
  const out = { ...REFERENCE_MEASUREMENTS };
  (Object.keys(out) as (keyof Measurements)[]).forEach((key) => {
    const n = toNum(raw[key]);
    const [lo, hi] = MEASUREMENT_RANGES[key];
    out[key] = n === null || n <= 0 ? REFERENCE_MEASUREMENTS[key] : clamp(n, lo, hi);
  });
  out.inseamCm = clamp(out.inseamCm, out.heightCm * 0.4, out.heightCm * 0.54);
  return out;
}

/** Human-readable problems for your form. Empty object = all good. */
export function validateMeasurements(raw: RawMeasurements): Partial<Record<keyof Measurements, string>> {
  const issues: Partial<Record<keyof Measurements, string>> = {};
  (Object.keys(REFERENCE_MEASUREMENTS) as (keyof Measurements)[]).forEach((key) => {
    const v = raw[key];
    if (v === null || v === undefined || v === "") return; // blank = still typing
    const n = toNum(v);
    const [lo, hi] = MEASUREMENT_RANGES[key];
    if (n === null) issues[key] = `${LABELS[key]} must be a number`;
    else if (n < lo || n > hi) issues[key] = `${LABELS[key]} should be between ${lo} and ${hi} cm`;
  });
  const h = toNum(raw.heightCm);
  const i = toNum(raw.inseamCm);
  if (h && i && !issues.heightCm && !issues.inseamCm && (i < h * 0.4 || i > h * 0.54)) {
    issues.inseamCm = `Inseam looks unusual for a height of ${h} cm`;
  }
  return issues;
}

// ───────────────────── anchors ─────────────────────

export type LegStation = { y: number; outer: number; inner: number }; // offsets from cx (px)

export type ArmModel = {
  p0: Pt; // shoulder joint centre
  angle: number; // radians away from vertical
  length: number; // px, joint to fingertip
  unit: number; // px per arm "cm"
  stations: [number, number][]; // [t, halfWidth px]
  tArmpit: number;
};

export type SilhouetteAnchors = {
  cx: number;
  scale: number; // px per cm
  limb: number; // px per reference-cm for small features (scales with height)
  topY: number;
  floorY: number;
  headTop: number;
  headBottom: number;
  headHalf: number;
  neckHalf: number;
  neckBaseY: number;
  shoulderCap: Pt; // top of the deltoid
  shoulderY: number;
  armpitY: number;
  armpitHalf: number;
  bustY: number;
  bustHalf: number;
  underbustY: number;
  underbustHalf: number;
  waistY: number;
  waistHalf: number;
  hipY: number;
  hipHalf: number;
  crotchY: number;
  kneeY: number;
  calfY: number;
  ankleY: number;
  footY: number;
  legs: LegStation[]; // crotch → ankle
  arm: ArmModel;
  measurements: Measurements;
};

const ARM_STATIONS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 3.7],
  [0.15, 3.5],
  [0.3, 3.1],
  [0.43, 2.6],
  [0.56, 2.7],
  [0.7, 2.0],
  [0.76, 1.75],
  [0.82, 2.3],
  [0.9, 2.3],
  [0.96, 1.7],
  [1.0, 0.8],
];

const armWidthCache = new WeakMap<ArmModel, (t: number) => number>();
function armWidth(arm: ArmModel, t: number): number {
  let f = armWidthCache.get(arm);
  if (!f) {
    f = smoothInterp(arm.stations);
    armWidthCache.set(arm, f);
  }
  return f(t);
}

/** Point on the (right) arm's outer or inner edge at t ∈ [0,1] along its length. */
export function armEdge(a: SilhouetteAnchors, t: number, side: "outer" | "inner", extra = 0): Pt {
  const { p0, angle, length } = a.arm;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const w = armWidth(a.arm, t) + extra;
  const sgn = side === "outer" ? 1 : -1;
  return [p0[0] + t * length * sin + sgn * w * cos, p0[1] + t * length * cos - sgn * w * sin];
}

/** Offset from cx of the right arm's inner edge at height y, or null above the armpit / below the fingertips. */
function armInnerHalfAt(a: SilhouetteAnchors, y: number): number | null {
  let prev = armEdge(a, a.arm.tArmpit, "inner");
  if (y < prev[1]) return null;
  for (let j = 1; j <= 60; j++) {
    const q = armEdge(a, a.arm.tArmpit + ((1 - a.arm.tArmpit) * j) / 60, "inner");
    if (q[1] >= y) {
      const u = (y - prev[1]) / (q[1] - prev[1] || 1);
      return prev[0] + (q[0] - prev[0]) * u - a.cx;
    }
    prev = q;
  }
  return null;
}

function armCentre(a: SilhouetteAnchors, t: number): Pt {
  const { p0, angle, length } = a.arm;
  return [p0[0] + t * length * Math.sin(angle), p0[1] + t * length * Math.cos(angle)];
}

export function deriveAnchors(input: RawMeasurements): SilhouetteAnchors {
  const m = normalizeMeasurements(input);
  const H = m.heightCm;
  const s = 376 / Math.max(H, 200);
  const floorY = 388;
  const topY = floorY - H * s;
  const cx = 100;
  const Y = (cm: number) => topY + cm * s;

  const k = H / 165;
  const br = m.bustCm / 88;
  const hr = m.hipsCm / 96;
  const af = k * Math.pow((br + hr) / 2, 0.6); // arm thickness factor

  // ── vertical landmarks (cm from the top of the head)
  const headH = 0.128 * H;
  const neckBaseCm = 0.172 * H;
  const shoulderLineCm = 0.19 * H;
  const crotchCm = H - m.inseamCm;
  const span = crotchCm - shoulderLineCm;
  const armpitCm = shoulderLineCm + 0.17 * span;
  const bustCm = shoulderLineCm + 0.26 * span;
  const underCm = shoulderLineCm + 0.37 * span;
  const waistCm = shoulderLineCm + 0.58 * span;
  const hipCm = shoulderLineCm + 0.88 * span;

  // ── half-widths (cm). Front-view width ≈ 1/3 of circumference.
  const bustHalfCm = 0.165 * m.bustCm;
  const waistHalfCm = 0.1725 * m.waistCm;
  const hipHalfCm = 0.175 * m.hipsCm;
  const underHalfCm = lerp(bustHalfCm, waistHalfCm, 0.5);
  const headHalfCm = 0.046 * H;
  const neckHalfCm = 0.52 * headHalfCm * Math.pow(br, 0.12);

  // ── legs
  const lf = k * Math.pow(hr, 0.5);
  const kC = 0.33 * hipHalfCm;
  const legDefs: { f: number; outer: number; inner: number }[] = [
    { f: 0.0, outer: 0.94 * hipHalfCm, inner: 0.35 },
    { f: 0.14, outer: 0.89 * hipHalfCm, inner: 0.6 },
    { f: 0.3, outer: 0.77 * hipHalfCm, inner: 0.75 },
    { f: 0.46, outer: kC + 4.7 * lf, inner: Math.max(0.7, kC - 4.7 * lf) },
    { f: 0.64, outer: kC + 0.2 + 4.8 * lf, inner: Math.max(0.9, kC + 0.2 - 4.8 * lf) },
    { f: 0.94, outer: 0.3 * hipHalfCm + 3.0 * lf, inner: Math.max(1.7, 0.3 * hipHalfCm - 3.0 * lf) },
  ];
  const crotchY = Y(crotchCm);
  const legs: LegStation[] = legDefs.map((l) => ({
    y: crotchY + l.f * m.inseamCm * s,
    outer: l.outer * s,
    inner: l.inner * s,
  }));

  const bustY = Y(bustCm);
  const underY = Y(underCm);
  const waistY = Y(waistCm);
  const hipY = Y(hipCm);
  const armpitY = Y(armpitCm);
  const bustHalf = bustHalfCm * s;
  const underHalf = underHalfCm * s;
  const waistHalf = waistHalfCm * s;
  const hipHalf = hipHalfCm * s;

  // torso profile without the armpit stop (used to give the arm clearance)
  const bodyNoArm = smoothInterp([
    [bustY, bustHalf],
    [underY, underHalf],
    [waistY, waistHalf],
    [hipY, hipHalf],
    ...legs.map((l) => [l.y, l.outer] as [number, number]),
  ]);

  // ── arm: hangs from the shoulder joint, swings out only as far as the body needs
  const typedArmCirc = m.armCircCm ?? (28 * Math.pow(br, 0.6));
  const typedArmLen = m.armLengthCm ?? (H * 0.36);
  
  const armUnit = (typedArmCirc / 6.5) * s;
  const stations: [number, number][] = ARM_STATIONS.map(([t, w]) => [t, w * armUnit]);
  const wAt = smoothInterp(stations);
  const L = typedArmLen * s;
  const shoulderHalfPx =
    Math.max(0.117 * H * Math.pow(br, 0.15), bustHalfCm + 4.4 * af) * s;
  const capY = Y(0.192 * H);
  const p0y = capY + 3.3 * armUnit;
  const p0x = cx + shoulderHalfPx - wAt(0);
  const gap = 0.3 * k * s;
  const checkYs = [waistY, hipY, Y(0.56 * H), Y(0.6 * H)];

  const solve = (th: number) => {
    const sin = Math.sin(th);
    const cos = Math.cos(th);
    let t = (armpitY - p0y) / (L * cos);
    for (let i = 0; i < 4; i++) t = (armpitY - p0y - wAt(t) * sin) / (L * cos);
    const inner = (tt: number): Pt => [
      p0x + tt * L * sin - wAt(tt) * cos,
      p0y + tt * L * cos + wAt(tt) * sin,
    ];
    const xAtY = (y: number): number => {
      let prev = inner(t);
      if (y <= prev[1]) return prev[0];
      for (let j = 1; j <= 60; j++) {
        const q = inner(t + ((1 - t) * j) / 60);
        if (q[1] >= y) {
          const u = (y - prev[1]) / (q[1] - prev[1] || 1);
          return prev[0] + (q[0] - prev[0]) * u;
        }
        prev = q;
      }
      return prev[0];
    };
    return { t, xAtY, apX: inner(t)[0] - cx, yEnd: inner(1)[1] };
  };

  let sol = solve(11 * DEG);
  let angle = 11 * DEG;
  for (let deg = 11; deg <= 34; deg += 0.5) {
    const cand = solve(deg * DEG);
    sol = cand;
    angle = deg * DEG;
    const ok = checkYs.every(
      (y) => y > cand.yEnd - 4 * s || cand.xAtY(y) - cx >= bodyNoArm(y) + gap,
    );
    if (ok) break;
  }

  const arm: ArmModel = {
    p0: [p0x, p0y],
    angle,
    length: L,
    unit: armUnit,
    stations,
    tArmpit: sol.t,
  };

  const w0 = wAt(0);
  const shoulderCap: Pt = [p0x + 0.25 * w0, p0y - 1.0 * w0];

  return {
    cx,
    scale: s,
    limb: k * s,
    topY,
    floorY,
    headTop: topY,
    headBottom: topY + headH * s,
    headHalf: headHalfCm * s,
    neckHalf: neckHalfCm * s,
    neckBaseY: Y(neckBaseCm),
    shoulderCap,
    shoulderY: shoulderCap[1],
    armpitY,
    armpitHalf: sol.apX,
    bustY,
    bustHalf,
    underbustY: underY,
    underbustHalf: underHalf,
    waistY,
    waistHalf,
    hipY,
    hipHalf,
    crotchY,
    kneeY: legs[3].y,
    calfY: legs[4].y,
    ankleY: legs[5].y,
    footY: floorY,
    legs,
    arm,
    measurements: m,
  };
}

// ───────────────────── body outline ─────────────────────

export function silhouettePath(a: SilhouetteAnchors): string {
  const { cx } = a;
  const s = a.scale;
  const lb = a.limb;
  const R = (dx: number, y: number): Pt => [cx + dx, y];

  // head (egg) — widths are fractions of headHalf, rows are fractions of head height
  const hh = a.headBottom - a.headTop;
  const headRows: [number, number][] = [
    [0.07, 0.5],
    [0.2, 0.88],
    [0.36, 1.0],
    [0.52, 0.96],
    [0.68, 0.84],
    [0.8, 0.72],
    [0.93, 0.5],
  ];
  const neckLen = a.neckBaseY - a.headBottom;

  const A: Pt[] = [
    [cx, a.headTop],
    ...headRows.map(([u, f]) => R(a.headHalf * f, a.headTop + hh * u)),
    R(a.neckHalf, a.headBottom + neckLen * 0.4),
    R(lerp(a.neckHalf, a.shoulderCap[0] - cx, 0.55), lerp(a.neckBaseY, a.shoulderCap[1], 0.5)),
    a.shoulderCap,
    ...ARM_STATIONS.map(([t]) => armEdge(a, t, "outer")),
    // Flat hand end: instead of a bulb, angle the cut inward
    armEdge(a, 1, "outer", 1.5 * s),
    armEdge(a, 1, "inner", -1.0 * s),
    ...[...ARM_STATIONS]
      .reverse()
      .filter(([t]) => t > a.arm.tArmpit + 0.04 && t < 1)
      .map(([t]) => armEdge(a, t, "inner")),
  ];
  const armpit = armEdge(a, a.arm.tArmpit, "inner");
  A.push(armpit);

  const ankle = a.legs[a.legs.length - 1];
  const foot: Pt[] = [
    R(ankle.outer + 0.5 * lb, ankle.y + 0.55 * (a.floorY - ankle.y)),
    R(ankle.outer + 1.2 * lb, a.floorY - 0.7 * lb),
    R(ankle.outer + 0.7 * lb, a.floorY),
    R(ankle.inner - 0.4 * lb, a.floorY),
    R(ankle.inner - 0.3 * lb, a.floorY - 0.8 * lb),
  ];

  // the torso edge must stay inside the arm's inner edge, otherwise the outline crosses itself
  const side = (half: number, y: number): Pt => {
    const lim = armInnerHalfAt(a, y);
    return R(lim === null ? half : Math.min(half, lim - 0.3 * s), y);
  };
  const midHipY = lerp(a.waistY, a.hipY, 0.55);
  const B: Pt[] = [
    armpit,
    side(a.bustHalf, a.bustY),
    side(a.underbustHalf, a.underbustY),
    side(a.waistHalf, a.waistY),
    side(lerp(a.waistHalf, a.hipHalf, 0.6), midHipY),
    side(a.hipHalf, a.hipY),
    ...[0, 2, 4, 5].map((i) => a.legs[i]).map((l) => R(l.outer, l.y)),
    ...foot,
    ...[5, 4, 2, 1].map((i) => a.legs[i]).map((l) => R(l.inner, l.y)),
    [cx, a.crotchY],
  ];

  const top: Pt = [1, 0];
  return (
    `M ${r2(cx)} ${r2(a.headTop)}` +
    curve(A, { startT: top }) +
    curve(B) +
    curve(mirrorRev(B, cx)) +
    curve(mirrorRev(A, cx), { endT: top }) +
    " Z"
  );
}

// ───────────────────── garments ─────────────────────

export type HemLevel =
  | "shoulder" | "bust" | "waist" | "hip"
  | "thigh" | "knee" | "calf" | "ankle";
export type TopLevel = "shoulder" | "bust" | "waist" | "hip";
export type SleeveLength = "none" | "short" | "elbow" | "three-quarter" | "long";
export type Neckline = "crew" | "scoop" | "v" | "high";

export type GarmentShape = {
  /** Where the garment starts. "shoulder" = a top/dress/coat; "waist" = a skirt or trousers. Default "shoulder". */
  top?: TopLevel;
  /** Where it ends. */
  hem: HemLevel;
  /** 1 = regular fit, <1 tighter, >1 looser / more flare. 0.6 – 2.2. */
  volume?: number;
  /** Only used when top = "shoulder". Default "none" (sleeveless). */
  sleeve?: SleeveLength;
  /** Only used when top = "shoulder". Default "crew". */
  neckline?: Neckline;
  /** Separate trouser legs instead of a single skirt tube. Needs a hem below the crotch. */
  split?: boolean;
};

/** Handy starting points for marketplace categories. */
export const GARMENT_PRESETS = {
  tank: { top: "shoulder", hem: "hip", volume: 1, neckline: "scoop" },
  tee: { top: "shoulder", hem: "hip", volume: 1.1, sleeve: "short", neckline: "crew" },
  longSleeve: { top: "shoulder", hem: "hip", volume: 1.1, sleeve: "long", neckline: "crew" },
  cropTop: { top: "shoulder", hem: "bust", volume: 1, sleeve: "short", neckline: "crew" },
  blouse: { top: "shoulder", hem: "hip", volume: 1.35, sleeve: "three-quarter", neckline: "v" },
  coat: { top: "shoulder", hem: "knee", volume: 1.4, sleeve: "long", neckline: "v" },
  miniDress: { top: "shoulder", hem: "thigh", volume: 1.2, sleeve: "none", neckline: "scoop" },
  midiDress: { top: "shoulder", hem: "calf", volume: 1.5, sleeve: "short", neckline: "v" },
  maxiDress: { top: "shoulder", hem: "ankle", volume: 1.7, sleeve: "none", neckline: "scoop" },
  miniSkirt: { top: "waist", hem: "thigh", volume: 1.2 },
  pencilSkirt: { top: "waist", hem: "knee", volume: 0.7 },
  midiSkirt: { top: "waist", hem: "calf", volume: 1.7 },
  maxiSkirt: { top: "waist", hem: "ankle", volume: 1.8 },
  shorts: { top: "waist", hem: "thigh", volume: 1, split: true },
  trousers: { top: "waist", hem: "ankle", volume: 1, split: true },
  wideLegTrousers: { top: "waist", hem: "ankle", volume: 1.8, split: true },
  jumpsuit: { top: "shoulder", hem: "ankle", volume: 1.1, neckline: "v", split: true },
} satisfies Record<string, GarmentShape>;

export type Bounds = { x: number; y: number; w: number; h: number };
export type DrapeGeometry = {
  /** Clip/outline shapes. First is the main body of the garment, the rest are sleeves. */
  paths: string[];
  bounds: Bounds;
};

const bodyFnCache = new WeakMap<SilhouetteAnchors, (y: number) => number>();
/** Half-width of the body (torso, then outer leg) at a given y, in px. */
export function bodyHalfWidthAt(a: SilhouetteAnchors, y: number): number {
  let f = bodyFnCache.get(a);
  if (!f) {
    f = smoothInterp([
      [a.armpitY, a.armpitHalf],
      [a.bustY, a.bustHalf],
      [a.underbustY, a.underbustHalf],
      [a.waistY, a.waistHalf],
      [a.hipY, a.hipHalf],
      ...a.legs.map((l) => [l.y, l.outer] as [number, number]),
    ]);
    bodyFnCache.set(a, f);
  }
  return f(y);
}

export function hemToY(a: SilhouetteAnchors, hem: HemLevel): number {
  const s = a.scale;
  const ins = a.floorY - a.crotchY;
  switch (hem) {
    case "shoulder": return a.armpitY + 2 * s;
    case "bust": return a.bustY + 3 * s;
    case "waist": return a.waistY + 2 * s;
    case "hip": return a.hipY + 5 * s;
    case "thigh": return a.crotchY + 0.3 * ins;
    case "knee": return a.kneeY;
    case "calf": return a.calfY;
    case "ankle": return a.ankleY;
  }
}

function topToY(a: SilhouetteAnchors, top: Exclude<TopLevel, "shoulder">): number {
  const s = a.scale;
  switch (top) {
    case "bust": return a.armpitY + 2.5 * s;
    case "waist": return a.waistY - 1.5 * s;
    case "hip": return a.hipY - 3 * s;
  }
}

const SLEEVE_T: Record<SleeveLength, number> = {
  none: 0,
  short: 0.3,
  elbow: 0.46,
  "three-quarter": 0.62,
  long: 0.78,
};

export function drapeGeometry(a: SilhouetteAnchors, spec: GarmentShape): DrapeGeometry {
  const { cx } = a;
  const s = a.scale;
  const v = clamp(spec.volume ?? 1, 0.6, 2.2);
  const top = spec.top ?? "shoulder";
  const sleeveT = top === "shoulder" ? SLEEVE_T[spec.sleeve ?? "none"] : 0;
  const ins = a.floorY - a.crotchY;

  // everything we place on the right half is tracked for bounds (the garment is symmetric)
  const tracked: Pt[] = [];
  const P = (dx: number, y: number): Pt => {
    const p: Pt = [cx + dx, y];
    tracked.push(p);
    return p;
  };

  // ── vertical extent
  const yTop = top === "shoulder" ? a.armpitY : topToY(a, top);
  let hemY = hemToY(a, spec.hem);
  hemY = Math.max(hemY, yTop + 8 * s);
  const split = !!spec.split && hemY > a.crotchY + 0.15 * ins;

  // ── fit
  const margin = Math.max(0.05, 0.5 + (v - 1) * 0.9) * s;
  const flareStart = yTop < a.waistY ? a.waistY : yTop;
  const flareMax =
    v > 1
      ? (v - 1) * (hemY >= a.hipY ? a.hipHalf * (split ? 0.9 : 1.3) : bodyHalfWidthAt(a, hemY) * 0.6)
      : 0;
  const flare = (y: number) => {
    if (y <= flareStart) return 0;
    const t = clamp((y - flareStart) / (hemY - flareStart || 1), 0, 1);
    return Math.pow(t, 1.25);
  };
  const outerAt = (y: number) => bodyHalfWidthAt(a, y) + margin + flare(y) * flareMax;

  const sample = (y0: number, y1: number, f: (y: number) => number): Pt[] => {
    const n = Math.max(2, Math.ceil((y1 - y0) / (5 * s)));
    const out: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / n;
      out.push(P(f(y), y));
    }
    return out;
  };

  // ── top edge and the side of the garment from the top down to the hem
  let startLeft: Pt;
  let topEdge: string;
  let rightPts: Pt[];
  let sp: Pt | null = null;

  const capDx = a.shoulderCap[0] - cx;
  const capY = a.shoulderCap[1];
  const trapY = (dx: number) =>
    lerp(a.neckBaseY, capY + 0.8 * s, clamp((dx - a.neckHalf) / (capDx - a.neckHalf), 0, 1));

  if (top === "shoulder") {
    const spDx = lerp(a.neckHalf, capDx, sleeveT > 0 ? 0.96 : 0.8);
    sp = P(spDx, trapY(spDx));
    const spL: Pt = [2 * cx - sp[0], sp[1]];
    startLeft = spL;

    const neckline = spec.neckline ?? "crew";
    const nwBase = a.neckHalf;
    let cmds: string;
    if (neckline === "high") {
      const nw = nwBase * 1.08;
      const yHigh = a.headBottom + 0.45 * (a.neckBaseY - a.headBottom);
      P(nw, yHigh);
      cmds =
        ` L ${r2(cx - nw * 1.02)} ${r2(trapY(nw))} L ${r2(cx - nw)} ${r2(yHigh)}` +
        ` L ${r2(cx + nw)} ${r2(yHigh)} L ${r2(cx + nw * 1.02)} ${r2(trapY(nw))}`;
    } else if (neckline === "v") {
      const nw = nwBase * 1.25;
      const yN = trapY(nw);
      const dep = 11 * a.limb;
      P(nw, yN + dep);
      cmds =
        ` L ${r2(cx - nw)} ${r2(yN)} L ${r2(cx)} ${r2(yN + dep)} L ${r2(cx + nw)} ${r2(yN)}`;
    } else {
      const nw = nwBase * (neckline === "scoop" ? 1.5 : 1.1);
      const dep = (neckline === "scoop" ? 6.5 : 2.2) * a.limb;
      const yN = trapY(nw);
      P(nw, yN + dep);
      cmds =
        ` L ${r2(cx - nw)} ${r2(yN)} C ${r2(cx - nw * 0.75)} ${r2(yN + dep * 1.35)}, ` +
        `${r2(cx + nw * 0.75)} ${r2(yN + dep * 1.35)}, ${r2(cx + nw)} ${r2(yN)}`;
    }
    topEdge = cmds + ` L ${pt(sp)}`;

    const body = sample(a.armpitY, hemY, outerAt);
    const mid: Pt = P(lerp(outerAt(a.armpitY), spDx, 0.4), lerp(sp[1], a.armpitY, 0.55));
    rightPts = [sp, mid, ...body];
  } else {
    const w = outerAt(yTop);
    startLeft = [cx - w, yTop];
    const dip = 0.6 * s;
    topEdge = ` Q ${r2(cx)} ${r2(yTop + dip)} ${r2(cx + w)} ${r2(yTop)}`;
    rightPts = sample(yTop, hemY, outerAt);
  }

  let main: string;
  if (!split) {
    const hemW = outerAt(hemY);
    main =
      `M ${pt(startLeft)}` +
      topEdge +
      curve(rightPts) +
      ` Q ${r2(cx)} ${r2(hemY + 1.4 * s)} ${r2(cx - hemW)} ${r2(hemY)}` +
      curve(mirrorRev(rightPts, cx)) +
      " Z";
  } else {
    // trousers: torso part down to the crotch, then two separate leg tubes
    const crotchLevel = a.crotchY;
    const torso = rightPts.filter((p) => p[1] < crotchLevel - 1);
    const legTopY = crotchLevel;
    const legOuter = sample(legTopY, hemY, outerAt);
    const outerPts = [...torso, ...legOuter];

    const legInnerAt = (y: number) => {
      const l = a.legs;
      const f = smoothInterp([
        [l[0].y, l[0].inner],
        ...l.slice(1).map((st) => [st.y, st.inner] as [number, number]),
      ]);
      return Math.max(0.25 * s, f(y) - margin * 0.4 - flare(y) * flareMax * 0.6);
    };
    const innerDown = (() => {
      const n = Math.max(2, Math.ceil((hemY - legTopY) / (6 * s)));
      const out: Pt[] = [];
      for (let i = 0; i <= n; i++) {
        const y = legTopY + 1.2 * s + ((hemY - legTopY - 1.2 * s) * i) / n;
        out.push([cx + legInnerAt(y), y]);
      }
      return out;
    })();
    const innerUp = [...innerDown].reverse();
    const apex: Pt = [cx, a.crotchY + 1.2 * s];
    const leftInnerDown: Pt[] = mirrorPts(innerDown, cx);
    const hemOuter = outerPts[outerPts.length - 1];
    const hemInner = innerUp[0];

    main =
      `M ${pt(startLeft)}` +
      topEdge +
      curve(outerPts) +
      ` L ${pt(hemInner)}` +
      curve([...innerUp, apex]) +
      curve([apex, ...leftInnerDown]) +
      ` L ${r2(2 * cx - hemOuter[0])} ${r2(hemOuter[1])}` +
      curve(mirrorRev(outerPts, cx)) +
      " Z";
  }

  const paths = [main];

  // ── sleeves
  if (sleeveT > 0 && sp) {
    const extra = (t: number) =>
      Math.max(0.05, 0.45 + (v - 1) * 0.9) * a.arm.unit +
      (v > 1 ? (v - 1) * 1.6 * a.arm.unit * (t / sleeveT) : 0);
    const n = 6;
    const outer: Pt[] = [];
    for (let j = 0; j <= n; j++) {
      const t = (sleeveT * j) / n;
      const p = armEdge(a, t, "outer", extra(t));
      tracked.push(p);
      outer.push(p);
    }
    const inner: Pt[] = [];
    for (let j = n; j >= 0; j--) {
      const t = lerp(a.arm.tArmpit, sleeveT, j / n);
      const p = armEdge(a, t, "inner", extra(t));
      tracked.push(p);
      inner.push(p);
    }
    const cap: Pt = [a.shoulderCap[0], a.shoulderCap[1] - 0.3 * s];
    const build = (flip: boolean) => {
      const f = (p: Pt): Pt => (flip ? [2 * cx - p[0], p[1]] : p);
      const start = f(sp as Pt);
      return (
        `M ${pt(start)}` +
        curve([start, f(cap), ...outer.map(f)]) +
        ` L ${pt(f(inner[0]))}` +
        curve(inner.map(f)) +
        " Z"
      );
    };
    paths.push(build(false), build(true));
  }

  // ── bounds (symmetric about cx)
  let maxX = cx;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of tracked) {
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  minY = Math.min(minY, top === "shoulder" ? capY : yTop);
  maxY = Math.max(maxY, hemY + 1.4 * s);
  const half = maxX - cx;
  return { paths, bounds: { x: cx - half, y: minY, w: half * 2, h: maxY - minY } };
}

/** @deprecated kept for older callers; returns just the main garment shape. */
export function drapeRegion(a: SilhouetteAnchors, hem: HemLevel, volume: number): string {
  return drapeGeometry(a, { top: "shoulder", hem, volume }).paths[0];
}

