import React from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";

/**
 * Visual QA probe. Rendered only when the composition gets the input prop `{ qa: true }`
 * (see scripts/visual-qa.mjs). After the frame is laid out it inspects every visible piece of
 * text on screen and logs one line "QA_RESULT {json}" with the problems it finds:
 *
 *  - "edge":     text runs outside the video frame (cut off)
 *  - "clipped":  text does not fit in its box and is cut off
 *  - "overlap":  two pieces of text sit on top of each other
 *  - "contrast": text colour too close to the colour behind it (hard to read / invisible)
 *  - "image-missing": a logo or picture failed to load
 *  - "logo-hidden": a logo or picture is almost the same colour as what is behind it
 *
 * It never changes what is drawn; it only measures.
 */

type Rgba = [number, number, number, number];

function parseColor(value: string | null | undefined): Rgba | null {
  if (!value) return null;
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  const h = value.match(/#([0-9a-f]{6})/i);
  if (h) {
    const n = parseInt(h[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  return null;
}

function luminance([r, g, b]: Rgba) {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(a: Rgba, b: Rgba) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function blend(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
}

function effectiveOpacity(el: Element | null) {
  let o = 1;
  for (let e = el; e && e instanceof Element; e = e.parentElement) {
    const s = getComputedStyle(e);
    o *= Number(s.opacity || 1);
    if (s.visibility === "hidden" || s.display === "none") return 0;
  }
  return o;
}

const SHAPES = new Set(["circle", "rect", "path", "ellipse", "polygon", "polyline"]);

/** Colour painted behind point (x, y), below `self`. */
function backgroundAt(x: number, y: number, self: Element): Rgba {
  const stack = document.elementsFromPoint(x, y);
  const layers: Rgba[] = [];
  for (const e of stack) {
    if (e !== self && self.contains(e)) continue; // the text's own box background counts
    if (e.closest("[data-qa-probe]")) continue;
    const s = getComputedStyle(e);
    if (Number(s.opacity) < 0.05) continue;
    let c: Rgba | null = null;
    if (SHAPES.has(e.tagName.toLowerCase())) {
      const fill = parseColor(s.fill);
      if (fill && s.fill !== "none") c = [fill[0], fill[1], fill[2], fill[3] * Number(s.fillOpacity || 1) * effectiveOpacity(e)];
    } else {
      const bg = parseColor(s.backgroundColor);
      if (bg && bg[3] > 0.02) c = [bg[0], bg[1], bg[2], bg[3] * effectiveOpacity(e)];
      else if (s.backgroundImage && s.backgroundImage !== "none") {
        const first = parseColor(s.backgroundImage);
        if (first) c = [first[0], first[1], first[2], first[3] * effectiveOpacity(e)];
      }
    }
    if (c && c[3] > 0.02) {
      layers.push(c);
      if (c[3] > 0.95) break;
    }
  }
  let colour: Rgba = [255, 255, 255, 1];
  for (let i = layers.length - 1; i >= 0; i--) colour = blend(layers[i], colour);
  return colour;
}

type Piece = { el: Element; text: string; rect: DOMRect; size: number };

function collectText(): Piece[] {
  const pieces: Piece[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.textContent || "").trim();
    const el = node.parentElement;
    if (!text || !el || el.closest("[data-qa-probe]") || el.closest("style,script")) continue;
    if (effectiveOpacity(el) < 0.35) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    pieces.push({ el, text, rect, size: parseFloat(getComputedStyle(el).fontSize) || 16 });
  }
  return pieces;
}

function analyse(frame: number) {
  const W = 1920;
  const H = 1080;
  const issues: Record<string, unknown>[] = [];
  const pieces = collectText();
  const short = (t: string) => (t.length > 60 ? t.slice(0, 57) + "..." : t);

  for (const p of pieces) {
    const r = p.rect;
    if (r.left < -4 || r.top < -4 || r.right > W + 4 || r.bottom > H + 4) {
      issues.push({ type: "edge", text: short(p.text) });
    }
    for (let e: Element | null = p.el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if ((s.overflow === "hidden" || s.overflowX === "hidden" || s.overflowY === "hidden") && e instanceof HTMLElement) {
        const box = e.getBoundingClientRect();
        if (r.right > box.right + 3 || r.bottom > box.bottom + 3 || r.left < box.left - 3 || r.top < box.top - 3) {
          issues.push({ type: "clipped", text: short(p.text) });
        }
        break;
      }
    }
    const isSvg = p.el instanceof SVGElement;
    const s = getComputedStyle(p.el);
    const fg = parseColor(isSvg ? s.fill : s.color);
    // Decorative numbers and marks (01, 02, check marks) are faint on purpose.
    const decorative = /^[\d\s.✓✔✕×→•·-]{1,3}$/.test(p.text);
    if (fg && !decorative) {
      const bg = backgroundAt(r.left + r.width / 2, r.top + r.height / 2, p.el);
      const text = blend([fg[0], fg[1], fg[2], fg[3] * effectiveOpacity(p.el)], bg);
      const ratio = contrast(text, bg);
      const limit = p.size >= 28 ? 2.6 : 3.2;
      if (ratio < limit) issues.push({ type: "contrast", text: short(p.text), ratio: Math.round(ratio * 100) / 100 });
    }
  }

  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i];
      const b = pieces[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const x = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
      const y = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
      const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
      if (smaller > 0 && (x * y) / smaller > 0.2) issues.push({ type: "overlap", text: short(a.text), with: short(b.text) });
    }
  }

  // Logos and pictures: loaded, and visible against what is behind them.
  for (const img of Array.from(document.querySelectorAll("img"))) {
    const box = img.getBoundingClientRect();
    if (box.width < 16 || box.height < 16 || effectiveOpacity(img) < 0.3) continue;
    const name = (img.getAttribute("src") || "").split("/").pop() || "image";
    if (!img.complete || img.naturalWidth === 0) {
      issues.push({ type: "image-missing", text: name });
      continue;
    }
    try {
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      const behind = backgroundAt(box.left + box.width / 2, box.top + box.height / 2, img);
      // Share of the logo's visible pixels that stand out clearly from what is behind them.
      let opaque = 0;
      let clear = 0;
      for (let k = 0; k < data.length; k += 4) {
        if (data[k + 3] > 128) {
          opaque++;
          if (contrast([data[k], data[k + 1], data[k + 2], 1], behind) >= 2.0) clear++;
        }
      }
      if (opaque < 8) continue;
      const share = clear / opaque;
      if (share < 0.75) issues.push({ type: "logo-hidden", text: name, share: Math.round(share * 100) });
    } catch {
      // A picture from another site cannot be measured; skip it.
    }
  }

  // Text running into a logo or picture.
  const images = Array.from(document.querySelectorAll("img")).filter((img) => effectiveOpacity(img) > 0.3);
  for (const img of images) {
    const box = img.getBoundingClientRect();
    for (const p of pieces) {
      const x = Math.max(0, Math.min(p.rect.right, box.right) - Math.max(p.rect.left, box.left));
      const y = Math.max(0, Math.min(p.rect.bottom, box.bottom) - Math.max(p.rect.top, box.top));
      if (x * y > 0.05 * p.rect.width * p.rect.height && !img.contains(p.el)) {
        issues.push({ type: "image", text: short(p.text), image: (img.getAttribute("src") || "").split("/").pop() });
      }
    }
  }

  const seen = new Set<string>();
  const unique = issues.filter((i) => {
    const k = JSON.stringify(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // eslint-disable-next-line no-console
  console.debug("QA_RESULT " + JSON.stringify({ frame, issues: unique }));
}

export function QaProbe() {
  const frame = useCurrentFrame();
  const [handle] = React.useState(() => delayRender("visual QA"));
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "* { pointer-events: auto !important; } [data-qa-probe] { pointer-events: none !important; }";
    document.head.appendChild(style);
    const run = () => {
      try {
        analyse(frame);
      } finally {
        style.remove();
        continueRender(handle);
      }
    };
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    // Wait for fonts and for every picture to finish loading before measuring.
    const pictures = Array.from(document.querySelectorAll("img")).map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined),
    );
    Promise.all([fonts ? fonts.ready : Promise.resolve(), ...pictures]).then(() => requestAnimationFrame(() => requestAnimationFrame(run)));
  }, [frame, handle]);
  return <div data-qa-probe style={{ position: "absolute", width: 0, height: 0 }} />;
}
