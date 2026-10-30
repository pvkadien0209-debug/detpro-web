"use client";
// #321 Nhắc nhở dạng ẢNH (chuyên nghiệp) để gửi Zalo — bên cạnh nút chép lời giữ nguyên.
// Vẽ bằng canvas ngay trên máy (không thư viện, không gửi đi đâu): dải màu DetPro, tên nhóm, bài, hạn,
// danh sách người chưa xong + ô tiến độ (3 bài tập + bài nói), dải 🎯 mục tiêu bài nói (#347), link vào học. Xem trước → Chép ảnh / Gửi ảnh (điện thoại) / Tải ảnh.
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X, Copy, Check, Share2, Download } from "lucide-react";

const W = 1080;
const PAD = 72;
const PINE = "#0f6e5a";
const PINE2 = "#0b5747";
const INK = "#172033";
const MUTED = "#5b6475";

export const taiAnh = (src) =>
  new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = src;
  });

export function boGoc(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
/** Cắt chữ thành nhiều dòng vừa bề rộng. */
export function ngatDong(ctx, text, max, toiDa = 3) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= max || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > toiDa) {
    const cut = lines.slice(0, toiDa);
    cut[toiDa - 1] = `${cut[toiDa - 1].replace(/\s*\S*$/, "")}…`;
    return cut;
  }
  return lines;
}

/**
 * d = { loai: "nhac" | "mo" | "giuc", nhom, bai, tieuDe, han, link, tu, ds: [{ ten, d, g: [5 bool] }], loi }
 * → Promise<Blob PNG>
 */
export async function veAnhNhac(d) {
  await document.fonts?.ready;
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const F = (px, w = 600) => `${w} ${px}px ${font}`;
  const [logo, det] = await Promise.all([taiAnh("/detpro-icon.svg"), taiAnh("/brand/det-think.png")]);

  const ve = (H) => {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d");
  c.textBaseline = "alphabetic";
  c.font = F(56, 800);
  const tLines = ngatDong(c, `${d.bai}: ${d.tieuDe}`, W - PAD * 2, 3);
  const ds = (d.ds || []).slice(0, 12);

  // nền
  c.fillStyle = "#f4f7f6";
  c.fillRect(0, 0, W, H);
  // dải đầu
  const gr = c.createLinearGradient(0, 0, W, 220);
  gr.addColorStop(0, PINE);
  gr.addColorStop(1, PINE2);
  c.fillStyle = gr;
  c.fillRect(0, 0, W, 220);
  if (logo) c.drawImage(logo, PAD, 52, 116, 116);
  c.fillStyle = "#fff";
  c.font = F(58, 800);
  c.fillText("DetPro", PAD + (logo ? 140 : 0), 112);
  c.font = F(32, 500);
  c.fillStyle = "rgba(255,255,255,.88)";
  c.fillText(ngatDong(c, `Nhóm học · ${d.nhom}`, W - PAD * 2 - 140, 1)[0], PAD + (logo ? 140 : 0), 160);

  let y = 270;
  // nhãn loại
  const nhan = d.loai === "mo" ? "BÀI MỚI ĐÃ MỞ" : d.loai === "giuc" ? `GỬI ${String(d.ten || "").toUpperCase()}` : "NHẮC HỌC";
  c.font = F(28, 800);
  const nw = c.measureText(nhan).width + 48;
  c.fillStyle = d.loai === "mo" ? "#dcfce7" : "#fff1d6";
  boGoc(c, PAD, y, nw, 52, 26);
  c.fill();
  c.fillStyle = d.loai === "mo" ? "#146c43" : "#9a5b00";
  c.fillText(nhan, PAD + 24, y + 36);
  y += 52 + 70;

  // tiêu đề bài
  c.fillStyle = INK;
  c.font = F(56, 800);
  tLines.forEach((l, k) => c.fillText(l, PAD, y + k * 68));
  y += (tLines.length - 1) * 68;

  // hạn
  if (d.han) {
    y += 44;
    c.font = F(32, 700);
    const t = `⏳  ${d.han}`;
    const hw = c.measureText(t).width + 48;
    const qua = /^Quá hạn/.test(d.han);
    c.fillStyle = qua ? "#fde2e2" : "#e2f1ec";
    boGoc(c, PAD, y, hw, 60, 30);
    c.fill();
    c.fillStyle = qua ? "#9b1c1c" : PINE;
    c.fillText(t, PAD + 24, y + 41);
    y += 60;
  }

  // lời riêng (giục / thông báo)
  if (d.loi) {
    y += 40;
    c.font = F(40, 700);
    c.fillStyle = INK;
    const ll = ngatDong(c, d.loi, W - PAD * 2, 3);
    ll.forEach((l, k) => c.fillText(l, PAD, y + 40 + k * 52));
    y += 40 + (ll.length - 1) * 52 + 14;
  }

  // #350 dải mục tiêu + 4 ý: Việc của bạn · Làm thế nào · Người hướng dẫn · Để tiến bộ
  {
    y += 44;
    const nv = d.nv || {};
    const muc = [
      ["🙋 Việc của bạn", nv.ban],
      ["🛠 Làm thế nào", nv.cach],
      ["🎧 Người hướng dẫn", nv.hd],
      ["📈 Để tiến bộ", nv.tienBo],
    ].filter((x) => x[1]);
    c.font = F(26, 600);
    const dong = muc.map(([nh, t]) => [nh, ngatDong(c, t, W - PAD * 2 - 68, 3)]);
    const bh = 76 + dong.reduce((n, [, l]) => n + 50 + l.length * 36, 0) + 4;
    c.fillStyle = "#fff8e1";
    boGoc(c, PAD, y, W - PAD * 2, bh, 22);
    c.fill();
    c.fillStyle = "#f59e0b";
    boGoc(c, PAD, y, 12, bh, 6);
    c.fill();
    c.fillStyle = "#7c4a00";
    c.font = F(32, 800);
    c.fillText("🎯 MỤC TIÊU: BÀI NÓI THẬT CUỐI BÀI", PAD + 34, y + 52);
    let yy = y + 76;
    for (const [nh, ls] of dong) {
      c.fillStyle = "#9a5b00";
      c.font = F(24, 800);
      c.fillText(nh.toUpperCase(), PAD + 34, yy + 26);
      c.fillStyle = "#3b2f05";
      c.font = F(26, 600);
      ls.forEach((l, k) => c.fillText(l, PAD + 34, yy + 62 + k * 36));
      yy += 50 + ls.length * 36;
    }
    y += bh;
  }

  // danh sách người (3 phần bài tập: Trắc nghiệm · Nghe nói · True or false + #347 ô NÓI)
  if (ds.length) {
    y += 56;
    c.font = F(28, 800);
    c.fillStyle = MUTED;
    c.fillText(d.loai === "giuc" ? "TIẾN ĐỘ BÀI TẬP" : `CHƯA XONG (${(d.ds || []).length})`, PAD, y);
    const nhanO = ["TN", "NN", "TF", "NÓI"];
    c.font = F(22, 800);
    nhanO.forEach((t, k) => c.fillText(t, W - PAD - 24 - (4 - k) * 76 + (k === 3 ? 6 : 16), y));
    y += 18;
    for (const p of ds) {
      c.fillStyle = "#fff";
      boGoc(c, PAD, y, W - PAD * 2, 82, 20);
      c.fill();
      c.fillStyle = "#e2f1ec";
      c.beginPath();
      c.arc(PAD + 50, y + 41, 27, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = PINE;
      c.font = F(28, 800);
      const ch = (p.ten || "?").trim().charAt(0).toUpperCase();
      c.fillText(ch, PAD + 50 - c.measureText(ch).width / 2, y + 51);
      c.fillStyle = INK;
      c.font = F(32, 700);
      const ten = p.ten.length > 18 ? `${p.ten.slice(0, 17)}…` : p.ten;
      c.fillText(ten, PAD + 96, y + 38);
      c.fillStyle = MUTED;
      c.font = F(24, 500);
      c.fillText(String(p.d || "chưa bắt đầu").slice(0, 34), PAD + 96, y + 68);
      const g = (p.g || []).slice(2, 5);
      for (let k = 0; k < 4; k++) {
        c.fillStyle = k < 3 ? (g[k] ? "#22c55e" : "#e5e7eb") : p.noi === "xanh" ? "#22c55e" : p.noi === "vang" ? "#fbbf24" : "#fde2e2";
        boGoc(c, W - PAD - 24 - (4 - k) * 76, y + 25, 64, 32, 10);
        c.fill();
      }
      y += 96;
    }
    y -= 14;
  }

  // chân: link vào học (+ Đét gọn trong khung)
  const fy = y + 56;
  c.fillStyle = "#fff";
  boGoc(c, PAD, fy, W - PAD * 2, 130, 24);
  c.fill();
  c.strokeStyle = "#cfe3dc";
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = MUTED;
  c.font = F(26, 700);
  c.fillText("VÀO HỌC", PAD + 32, fy + 48);
  c.fillStyle = PINE;
  c.font = F(34, 800);
  c.fillText(String(d.link).replace(/^https?:\/\//, "").slice(0, 40), PAD + 32, fy + 98);
  if (det) {
    const dh = 112;
    const dw = dh * (det.width / det.height || 1);
    c.drawImage(det, W - PAD - 20 - dw, fy + 9, dw, dh);
  }
  c.fillStyle = "#94a3b8";
  c.font = F(24, 500);
  const luc = new Date();
  const ky = fy + 130 + 52;
  c.fillText(`${d.tu ? `Gửi từ ${d.tu} · ` : ""}DetPro · ${String(luc.getDate()).padStart(2, "0")}/${String(luc.getMonth() + 1).padStart(2, "0")} ${String(luc.getHours()).padStart(2, "0")}:${String(luc.getMinutes()).padStart(2, "0")}`, PAD, ky);
  return { cv, cao: ky + 40 };
  };
  const { cao } = ve(4000); // lượt 1: đo chiều cao thật
  const { cv } = ve(cao); // lượt 2: vẽ đúng cỡ
  return new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
}

/** Hạn dạng chữ cho ảnh tĩnh: "Còn 30 giờ 35 phút" / "Còn 3 ngày 4 giờ" / "Quá hạn 5 giờ". */
export function hanChu(ms) {
  if (ms < 0) {
    const h = Math.floor(-ms / 3600e3);
    return h >= 1 ? `Quá hạn ${h} giờ` : `Quá hạn ${Math.max(1, Math.floor(-ms / 60e3))} phút`;
  }
  const h = Math.floor(ms / 3600e3);
  const m = Math.floor((ms % 3600e3) / 60e3);
  if (h >= 48) return `Còn ${Math.floor(h / 24)} ngày ${h % 24} giờ`;
  if (h >= 1) return `Còn ${h} giờ ${m} phút`;
  return `Còn ${Math.max(1, m)} phút`;
}

/** Nút "🖼 Ảnh" → khung xem trước + Chép ảnh / Gửi ảnh / Tải ảnh. make() trả dữ liệu cho veAnhNhac. */
export function AnhNhacNut({ make, ten = "nhac-nho", label = "Ảnh", className = "kt-btn", title = "Tạo ảnh nhắc nhở để gửi Zalo", ve = veAnhNhac, tieuDe = "Ảnh nhắc nhở để gửi Zalo", meo = "Mẹo: gửi ảnh trước, rồi dán thêm lời nhắn (nút chép lời) để mọi người bấm được link." }) {
  const [mo, setMo] = useState(false);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState("");
  const [tb, setTb] = useState("");
  const [daChep, setDaChep] = useState(false);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const tao = async () => {
    setMo(true);
    setTb("");
    setBlob(null);
    try {
      const b = await ve(make());
      setBlob(b);
      setUrl(URL.createObjectURL(b));
    } catch {
      setTb("Không tạo được ảnh trên trình duyệt này — dùng nút chép lời nhé.");
    }
  };
  const file = () => new File([blob], `detpro-${ten}.png`, { type: "image/png" });
  const coChepAnh = typeof window !== "undefined" && !!window.ClipboardItem && !!navigator.clipboard?.write;
  const coGui = typeof navigator !== "undefined" && !!navigator.canShare && blob && navigator.canShare({ files: [file()] });
  const chep = async () => {
    try {
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      setDaChep(true);
      setTb("Đã chép ảnh — mở Zalo, bấm vào ô chat rồi dán (Ctrl+V).");
      setTimeout(() => setDaChep(false), 1800);
    } catch {
      setTb("Máy không cho chép ảnh — bấm “Tải ảnh” rồi gửi tệp ảnh vào Zalo.");
    }
  };
  const gui = async () => {
    try {
      await navigator.share({ files: [file()] });
    } catch {
      /* người dùng đóng bảng chia sẻ */
    }
  };
  const tai = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `detpro-${ten}.png`;
    a.click();
    setTb("Đã tải ảnh về máy — gửi tệp ảnh vào Zalo.");
  };
  return (
    <>
      <button type="button" className={className} onClick={tao} title={title}>
        <ImageIcon size={16} aria-hidden="true" /> {label}
      </button>
      {mo &&
        createPortal(
          <div className="nh-anh" role="dialog" aria-modal="true" aria-label="Ảnh nhắc nhở" onClick={(e) => e.target === e.currentTarget && setMo(false)}>
            <div className="nh-anh-box">
              <header>
                <b>{tieuDe}</b>
                <button type="button" onClick={() => setMo(false)} aria-label="Đóng">
                  <X size={20} />
                </button>
              </header>
              <div className="nh-anh-xem">{url ? <img src={url} alt="Xem trước ảnh nhắc nhở" /> : <p className="kt-muted">Đang vẽ ảnh…</p>}</div>
              <div className="nh-anh-nut">
                {coGui && (
                  <button type="button" className="kt-btn kt-btn--pri" onClick={gui} disabled={!blob}>
                    <Share2 size={16} aria-hidden="true" /> Gửi ảnh (Zalo…)
                  </button>
                )}
                {coChepAnh && (
                  <button type="button" className={`kt-btn ${coGui ? "" : "kt-btn--pri"}`} onClick={chep} disabled={!blob}>
                    {daChep ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {daChep ? "Đã chép" : "Chép ảnh"}
                  </button>
                )}
                <button type="button" className="kt-btn" onClick={tai} disabled={!blob}>
                  <Download size={16} aria-hidden="true" /> Tải ảnh
                </button>
              </div>
              {tb && <p className="nh-msgline">{tb}</p>}
              {meo && <p className="kt-muted nh-anh-meo">{meo}</p>}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
