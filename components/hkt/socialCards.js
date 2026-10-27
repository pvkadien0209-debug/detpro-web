// #177 (IG-Q1, nghiên cứu #176) — Vẽ bộ ảnh 1080×1350 ngay trên trình duyệt cho Facebook / Zalo:
//   A2 "Bài học trong 5 thẻ": bìa → 3 câu chốt (→ Rút ra) → thẻ cuối mời luyện 40 câu
//   A3 "3 hiểu lầm": bìa → 3 thẻ "Tưởng / Thật ra" (đáp án sai / đúng + giải thích) → thẻ cuối
// Dữ liệu từ socialPosts.js (lấy nguyên từ bài, #088). Đầu ảnh, màu, phông dùng chung với ảnh "Câu hỏi hôm nay" (quizCard.js).
import { C, FONT, CARD, lines, rrect, fontsReady, loadBrand, drawHeader } from "./quizCard";

const L = 72;
const W = CARD.w - 2 * L;
const RED = "#c8553d";

/** Đặt chữ nhiều dòng; trả về y sau khối. */
function para(ctx, text, { x = L, y, w = W, size, weight = 600, color = C.ink, lh = 1.3, max = 99 }) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  let ls = lines(ctx, text, w);
  if (ls.length > max) {
    ls = ls.slice(0, max);
    ls[max - 1] = `${ls[max - 1].replace(/\s+\S*$/, "")}…`;
  }
  ls.forEach((l, i) => ctx.fillText(l, x, y + size * 0.92 + i * size * lh));
  return y + ls.length * size * lh;
}
/** Cỡ chữ lớn nhất (trong các cỡ cho trước) để khối vừa số dòng tối đa. */
function fit(ctx, text, sizes, weight, w, maxLines) {
  for (const s of sizes) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (lines(ctx, text, w).length <= maxLines) return s;
  }
  return sizes[sizes.length - 1];
}
function footer(ctx, page, total) {
  ctx.font = `600 26px ${FONT}`;
  ctx.fillStyle = C.muted;
  ctx.fillText("DetPro · Mỗi ngày biết thêm một điều hay", L, CARD.h - 60);
  if (total) {
    const t = `${page}/${total}`;
    ctx.font = `700 26px ${FONT}`;
    const w = ctx.measureText(t).width + 28;
    ctx.fillStyle = C.ink;
    rrect(ctx, L, CARD.h - 132, w, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(t, L + 14, CARD.h - 101);
  }
}
async function det(ctx, name, w = 300) {
  const im = await loadBrand(name);
  if (im) ctx.drawImage(im, CARD.w - 24 - w, CARD.h - 16 - w * 0.783, w, w * 0.783);
}
function base(tag) {
  const cv = document.createElement("canvas");
  cv.width = CARD.w;
  cv.height = CARD.h;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CARD.w, CARD.h);
  ctx.textBaseline = "alphabetic";
  drawHeader(ctx, tag);
  return { cv, ctx };
}
const kicker = (ctx, text, y) => para(ctx, String(text || "").toUpperCase(), { y, size: 30, weight: 700, color: C.pine, lh: 1.25, max: 2 });

/** Vẽ phần thân lên lớp riêng (bắt đầu y = 0) rồi đặt giữa vùng trống giữa đầu ảnh và chân ảnh. */
const TOP = 160;
const BOTTOM = CARD.h - 150;
function centered(ctx, body) {
  const layer = document.createElement("canvas");
  layer.width = CARD.w;
  layer.height = CARD.h;
  const c = layer.getContext("2d");
  c.textBaseline = "alphabetic";
  const h = body(c);
  const y0 = Math.max(TOP, TOP + (BOTTOM - TOP - h) / 2 - 20);
  ctx.drawImage(layer, 0, y0);
}

// ---------- từng loại thẻ ----------
async function cover({ tag, series, title, sub, list, detName }, page, total) {
  const { cv, ctx } = base(tag);
  centered(ctx, (c) => {
    let y = kicker(c, series, 0) + 28;
    const ts = fit(c, title, [84, 76, 68, 60], 700, W, 5);
    y = para(c, title, { y, size: ts, weight: 700, lh: 1.15, max: 5 }) + 20;
    if (sub) y = para(c, sub, { y, size: 34, color: C.muted, lh: 1.35, max: 2 }) + 36;
    (list || []).forEach((it, i) => {
      c.fillStyle = C.marker;
      rrect(c, L, y + 2, 50, 50, 10);
      c.fill();
      c.fillStyle = C.ink;
      c.font = `700 28px ${FONT}`;
      c.textAlign = "center";
      c.fillText(String(i + 1), L + 25, y + 37);
      c.textAlign = "left";
      y = para(c, it, { x: L + 72, y: y + 4, w: W - 72 - 230, size: 34, lh: 1.3, max: 2 }) + 20;
    });
    return y;
  });
  await det(ctx, detName);
  footer(ctx, page, total);
  return cv;
}
async function take({ heading, take: tk, expl }, page, total) {
  const { cv, ctx } = base("BÀI HỌC TRONG 5 THẺ");
  centered(ctx, (c) => {
    let y = para(c, heading, { y: 0, size: 36, color: C.muted, lh: 1.3, max: 3 }) + 36;
    const ts = fit(c, tk, [88, 80, 72, 64, 56], 700, W - 40, 5);
    c.font = `700 ${ts}px ${FONT}`;
    const n = Math.min(5, lines(c, tk, W - 40).length);
    c.fillStyle = C.marker;
    rrect(c, L, y + 4, 14, n * ts * 1.15, 7);
    c.fill();
    y = para(c, tk, { x: L + 40, y, w: W - 40, size: ts, weight: 700, lh: 1.15, max: 5 }) + 44;
    if (expl) y = para(c, expl, { y, size: 40, weight: 400, color: "#2b3650", lh: 1.45, max: 6 });
    return y;
  });
  await det(ctx, "det-point", 260);
  footer(ctx, page, total);
  return cv;
}
async function myth({ q, wrong, right, explain }, page, total) {
  const { cv, ctx } = base("3 HIỂU LẦM");
  centered(ctx, (c) => {
    let y = para(c, q, { y: 0, size: 40, weight: 700, color: C.ink, lh: 1.3, max: 3 }) + 30;
    const box = (label, color, text, strike) => {
      const s = fit(c, text, [44, 40, 36, 32], 700, W - 60, 4);
      c.font = `700 ${s}px ${FONT}`;
      const ls = Math.min(4, lines(c, text, W - 60).length);
      const h = 74 + ls * s * 1.3 + 26;
      c.fillStyle = C.surface;
      rrect(c, L, y, W, h, 16);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = 4;
      c.stroke();
      c.font = `700 28px ${FONT}`;
      c.fillStyle = color;
      c.fillText(label, L + 30, y + 50);
      para(c, text, { x: L + 30, y: y + 68, w: W - 60, size: s, weight: 700, color: strike ? "#6b7280" : C.ink, lh: 1.3, max: 4 });
      if (strike) {
        c.strokeStyle = RED;
        c.lineWidth = 4;
        for (let i = 0; i < ls; i++) {
          const yy = y + 68 + s * 0.6 + i * s * 1.3;
          c.beginPath();
          c.moveTo(L + 26, yy);
          c.lineTo(L + W - 40, yy);
          c.stroke();
        }
      }
      y += h + 22;
    };
    box("TƯỞNG LÀ ĐÚNG", RED, wrong, true);
    box("THẬT RA", C.pine, right, false);
    if (explain) y = para(c, explain, { y: y + 10, size: 36, weight: 400, color: "#2b3650", lh: 1.45, max: 6, w: W });
    return y;
  });
  footer(ctx, page, total);
  return cv;
}
async function end({ title, note, line1, line2 }, page, total) {
  const { cv, ctx } = base("DETPRO");
  centered(ctx, (c) => {
    let y = para(c, line1, { y: 0, size: 76, weight: 700, lh: 1.15, max: 4 }) + 28;
    y = para(c, line2, { y, size: 40, color: C.muted, lh: 1.4, max: 3 }) + 44;
    c.font = `700 44px ${FONT}`;
    const link = "detpro.vercel.app";
    const lw = c.measureText(link).width + 70;
    c.fillStyle = C.pine;
    rrect(c, L, y, lw, 92, 46);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(link, L + 35, y + 61);
    y += 92 + 44;
    y = para(c, `Bài: ${title}`, { y, size: 34, color: C.ink, lh: 1.35, max: 3, w: W - 280 }) + 20;
    if (note) y = para(c, note, { y, size: 26, weight: 400, color: C.muted, lh: 1.4, max: 4, w: W - 300 });
    return y;
  });
  await det(ctx, "det-wave");
  footer(ctx, page, total);
  return cv;
}

/** Vẽ cả bộ (mảng thẻ { kind, ... }) → mảng canvas. */
export async function drawDeck(slides) {
  await fontsReady();
  const out = [];
  for (const [i, s] of slides.entries()) {
    const f = { cover, take, myth, end }[s.kind];
    out.push(await f(s, i + 1, slides.length));
  }
  return out;
}
