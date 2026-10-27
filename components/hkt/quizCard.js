// #175 — Vẽ ảnh "Câu hỏi hôm nay" 1080×1350 ngay trên trình duyệt (canvas), cùng bố cục ảnh Remotion SocialQuiz (#172):
// logo DetPro, nhãn, tên chuỗi, câu hỏi tiếng Anh, câu tiếng Việt, 3 đáp án (không lộ đáp án đúng), lời mời, Đét đang nghĩ.
// Đét lấy từ ảnh /brand/det-think.png (cùng nguồn trang → canvas không bị khoá, chép ảnh được).
export const C = { pine: "#0f6e5a", ink: "#172033", muted: "#5d6878", line: "#e3e7ee", paper: "#f4f6f9", marker: "#ffd23f", surface: "#ffffff" };
export const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
export const CARD = { w: 1080, h: 1350 };

// #177: ảnh Đét các tư thế (think, wave, point, stop) trong public/brand — tải một lần
const brandImgs = {};
export const loadBrand = (name) =>
  (brandImgs[name] ||= new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = `/brand/${name}.png`;
  }));
const loadDet = () => loadBrand("det-think");

export const fontsReady = () =>
  Promise.all([400, 600, 700].map((w) => document.fonts?.load?.(`${w} 40px "Be Vietnam Pro"`, "Tiếng Việt")))
    .catch(() => {})
    .then(() => document.fonts?.ready);

/** Chia chữ thành dòng vừa bề rộng. */
export function lines(ctx, text, maxW) {
  const out = [];
  let cur = "";
  for (const w of String(text || "").split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      out.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}
export const rrect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
const qSize = (s) => (s.length <= 60 ? 58 : s.length <= 90 ? 52 : s.length <= 120 ? 46 : 40);
const optSize = (opts) => {
  const n = Math.max(...opts.map((o) => o.length));
  return n <= 50 ? 36 : n <= 80 ? 32 : n <= 110 ? 29 : 26;
};

/** #177: đầu ảnh dùng chung — logo DetPro (ô xanh + Vòng Đét + chữ) và nhãn vàng bên phải. */
export function drawHeader(ctx, tag) {
  const L = 72;
  // logo: ô xanh + Vòng Đét (tô 300°, khe ở hướng 1 giờ) + chữ DetPro
  ctx.fillStyle = C.pine;
  rrect(ctx, L, 64, 52, 52, 12);
  ctx.fill();
  ctx.strokeStyle = C.marker;
  ctx.lineWidth = 7.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  // canvas: góc 0 = 3 giờ; khe từ 12 giờ (-90°) tới 2 giờ (-30°) → vẽ từ -30° theo chiều kim đồng hồ 300°
  ctx.arc(L + 26, 90, 14, (-30 * Math.PI) / 180, (270 * Math.PI) / 180);
  ctx.stroke();
  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = C.ink;
  ctx.fillText("Det", L + 68, 104);
  const dw = ctx.measureText("Det").width;
  ctx.fillStyle = C.pine;
  ctx.fillText("Pro", L + 68 + dw, 104);
  // nhãn bên phải
  ctx.font = `700 28px ${FONT}`;
  const tw = ctx.measureText(tag).width + 36;
  ctx.fillStyle = C.marker;
  rrect(ctx, CARD.w - L - tw, 64, tw, 52, 10);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.fillText(tag, CARD.w - L - tw + 18, 100);
}

/** Vẽ ảnh vào canvas mới; trả về canvas. */
export async function drawQuizCard({ topic, q, vi, options }) {
  await fontsReady();
  const det = await loadDet();
  const cv = document.createElement("canvas");
  cv.width = CARD.w;
  cv.height = CARD.h;
  const ctx = cv.getContext("2d");
  const L = 72;
  const W = CARD.w - 2 * L;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CARD.w, CARD.h);
  ctx.textBaseline = "alphabetic";

  drawHeader(ctx, "CÂU HỎI HÔM NAY");

  let y = 200;
  if (topic) {
    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = C.pine;
    for (const l of lines(ctx, topic.toUpperCase(), W)) {
      ctx.fillText(l, L, y);
      y += 38;
    }
    y += 14;
  }
  const qs = qSize(q);
  ctx.font = `700 ${qs}px ${FONT}`;
  ctx.fillStyle = C.ink;
  y += qs * 0.85;
  for (const l of lines(ctx, q, W)) {
    ctx.fillText(l, L, y);
    y += qs * 1.18;
  }
  if (vi) {
    y += 6;
    ctx.font = `600 32px ${FONT}`;
    ctx.fillStyle = C.muted;
    for (const l of lines(ctx, vi, W)) {
      ctx.fillText(l, L, y);
      y += 43;
    }
  }
  y += 18;
  const os = optSize(options);
  for (const [k, o] of options.entries()) {
    ctx.font = `600 ${os}px ${FONT}`;
    const ls = lines(ctx, o, W - 24 - 54 - 20 - 24);
    const h = Math.max(54, ls.length * os * 1.3) + 40;
    ctx.fillStyle = C.surface;
    rrect(ctx, L, y, W, h, 16);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    rrect(ctx, L + 24, y + 20, 54, 54, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `700 30px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(String(k + 1), L + 24 + 27, y + 20 + 38);
    ctx.textAlign = "left";
    ctx.fillStyle = C.ink;
    ctx.font = `600 ${os}px ${FONT}`;
    const y0 = y + 20 + os * 0.95 + 6;
    ls.forEach((l, i) => ctx.fillText(l, L + 24 + 54 + 20, y0 + i * os * 1.3));
    y += h + 16;
  }

  // chân: lời mời + Đét
  ctx.fillStyle = C.ink;
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText("Bạn chọn 1, 2 hay 3?", L, CARD.h - 112);
  ctx.fillStyle = C.muted;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("Đáp án ở bình luận · detpro.vercel.app", L, CARD.h - 66);
  if (det) ctx.drawImage(det, CARD.w - 30 - 300, CARD.h - 20 - 235, 300, 235);
  return cv;
}

export const canvasBlob = (cv, type = "image/png") => new Promise((ok) => cv.toBlob(ok, type, 0.92));

/** Chép ảnh vào bộ nhớ tạm (Ctrl+V vào ô đăng Facebook / Zalo). */
export async function copyCanvas(cv) {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error("no-clipboard");
  // truyền lời hẹn (promise) để giữ "lượt bấm" của người dùng — Safari cần cách này
  await navigator.clipboard.write([new window.ClipboardItem({ "image/png": canvasBlob(cv, "image/png") })]);
}
