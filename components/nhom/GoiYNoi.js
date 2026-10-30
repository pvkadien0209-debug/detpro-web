"use client";
// #325 Gợi ý bài nói tự do — dựng từ DỮ LIỆU CÓ SẴN của bài (không soạn thêm):
// tên tiếng Anh của bài + mỗi đoạn lấy câu đáp án đúng (tiếng Anh, đúng trình độ bài) của câu hỏi đầu tiên thuộc đoạn đó.
// Dàn ý 1–2 phút: mở đầu → 3–4 ý chính (câu hỏi gợi nhớ tiếng Việt + câu tiếng Anh) → phần của bạn → kết. Tải về bằng ảnh.
import React, { useEffect, useState } from "react";
import { loadUnit } from "@/components/hkt/unitData";
import { AnhNhacNut, boGoc, ngatDong, taiAnh } from "./AnhNhac";
import { docCheDo } from "@/components/hkt/hoTro"; // #354 bản dễ cho người mới

const W = 1080;
const PAD = 72;
const PINE = "#0f6e5a";
const INK = "#172033";
const MUTED = "#5b6475";

/** Dữ liệu gợi ý từ bài: { chuDe, chuDeVi, y: [{ hoi, cau }], mo, toi, ket, mau } */
export function taoGoiY(unit) {
  const body = unit?.article?.body || [];
  const qs = unit?.questions || [];
  const n = body.length;
  const chon = n <= 4 ? body.map((_, k) => k) : [0, 1, 2, 3].map((k) => Math.round((k * (n - 1)) / 3)); // rải đều tối đa 4 đoạn
  const y = [...new Set(chon)]
    .map((k) => {
      const ids = new Set((body[k].paragraphs || []).map((p) => p.id));
      const q = qs.find((x) => ids.has(x.para));
      return q ? { hoi: q.vi || body[k].heading, cau: q.options[0] } : null;
    })
    .filter(Boolean);
  const chuDe = unit?.meta?.titleEn || unit?.meta?.title || "";
  return {
    chuDe,
    chuDeVi: unit?.meta?.title || "",
    mo: `Today I want to talk about this topic: ${chuDe.replace(/[.?!]*$/, "")}.`,
    y,
    toi: "For me, the most useful idea is … because …",
    ket: "Next week, I will try … I think it will help me …",
    mau: ["I learned that …", "In my experience, …", "For example, …", "That is why …"],
  };
}

/** Vẽ ảnh gợi ý (PNG) — 2 lượt: đo chiều cao rồi vẽ. */
export async function veAnhGoiY(d) {
  await document.fonts?.ready;
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const F = (px, w = 600) => `${w} ${px}px ${font}`;
  const [logo, det] = await Promise.all([taiAnh("/detpro-icon.svg"), taiAnh("/brand/det-think.png")]);
  const g = d.g;
  const ve = (H) => {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = "#f4f7f6";
    c.fillRect(0, 0, W, H);
    const gr = c.createLinearGradient(0, 0, W, 200);
    gr.addColorStop(0, PINE);
    gr.addColorStop(1, "#0b5747");
    c.fillStyle = gr;
    c.fillRect(0, 0, W, 200);
    if (logo) c.drawImage(logo, PAD, 46, 108, 108);
    c.fillStyle = "#fff";
    c.font = F(54, 800);
    c.fillText("DetPro", PAD + 132, 104);
    c.font = F(30, 500);
    c.fillStyle = "rgba(255,255,255,.88)";
    c.fillText(ngatDong(c, `${d.bai}${d.nhom ? ` · ${d.nhom}` : ""}`, W - PAD * 2 - 132, 1)[0], PAD + 132, 150);

    let y = 246;
    c.font = F(28, 800);
    const nhan = "GỢI Ý BÀI NÓI TỰ DO · 1–2 PHÚT";
    const nw = c.measureText(nhan).width + 48;
    c.fillStyle = "#fff1d6";
    boGoc(c, PAD, y, nw, 52, 26);
    c.fill();
    c.fillStyle = "#9a5b00";
    c.fillText(nhan, PAD + 24, y + 36);
    y += 52 + 66;

    c.fillStyle = INK;
    c.font = F(48, 800);
    const tl = ngatDong(c, g.chuDe, W - PAD * 2, 3);
    tl.forEach((l, k) => c.fillText(l, PAD, y + k * 60));
    y += (tl.length - 1) * 60 + 46;
    c.fillStyle = MUTED;
    c.font = F(28, 500);
    const vl = ngatDong(c, g.chuDeVi, W - PAD * 2, 2);
    vl.forEach((l, k) => c.fillText(l, PAD, y + k * 38));
    y += (vl.length - 1) * 38 + 30;

    // các bước
    const buoc = [
      { so: "1", ten: "Mở đầu", en: g.mo },
      ...g.y.map((x, k) => ({ so: String(k + 2), ten: x.hoi, en: x.cau })),
      { so: String(g.y.length + 2), ten: "Phần của bạn", en: g.toi },
      { so: String(g.y.length + 3), ten: "Kết", en: g.ket },
    ];
    for (const b of buoc) {
      y += 26;
      c.font = F(26, 600);
      const hl = ngatDong(c, b.ten, W - PAD * 2 - 120, 2);
      c.font = F(34, 700);
      const el = ngatDong(c, b.en, W - PAD * 2 - 120, 4);
      const h = 34 + hl.length * 34 + el.length * 44 + 14;
      c.fillStyle = "#fff";
      boGoc(c, PAD, y, W - PAD * 2, h, 20);
      c.fill();
      c.fillStyle = PINE;
      c.beginPath();
      c.arc(PAD + 50, y + 46, 26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.font = F(28, 800);
      c.fillText(b.so, PAD + 50 - c.measureText(b.so).width / 2, y + 56);
      c.fillStyle = MUTED;
      c.font = F(26, 600);
      hl.forEach((l, k) => c.fillText(l, PAD + 100, y + 44 + k * 34));
      c.fillStyle = INK;
      c.font = F(34, 700);
      el.forEach((l, k) => c.fillText(l, PAD + 100, y + 44 + hl.length * 34 + 8 + k * 44));
      y += h;
    }

    // câu mẫu
    y += 46;
    c.fillStyle = MUTED;
    c.font = F(26, 800);
    c.fillText("CÂU MẪU DÙNG NỐI Ý", PAD, y);
    y += 22;
    c.font = F(30, 700);
    let x = PAD;
    for (const m of g.mau) {
      const w = c.measureText(m).width + 40;
      if (x + w > W - PAD) {
        x = PAD;
        y += 66;
      }
      c.fillStyle = "#e2f1ec";
      boGoc(c, x, y, w, 54, 27);
      c.fill();
      c.fillStyle = PINE;
      c.fillText(m, x + 20, y + 37);
      x += w + 12;
    }
    y += 54;

    // chân
    const fy = y + 50;
    c.fillStyle = "#fff";
    boGoc(c, PAD, fy, W - PAD * 2, 120, 24);
    c.fill();
    c.strokeStyle = "#cfe3dc";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = INK;
    c.font = F(30, 700);
    c.fillText("Nói chậm, không cần hoàn hảo — ghi âm", PAD + 32, fy + 50);
    c.fillText("rồi gửi trưởng nhóm qua Zalo.", PAD + 32, fy + 92);
    if (det) {
      const dh = 104;
      const dw = dh * (det.width / det.height || 1);
      c.drawImage(det, W - PAD - 20 - dw, fy + 8, dw, dh);
    }
    c.fillStyle = "#94a3b8";
    c.font = F(24, 500);
    c.fillText("DetPro · gợi ý dựng từ chính bài học", PAD, fy + 120 + 50);
    return { cv, cao: fy + 120 + 90 };
  };
  const { cao } = ve(6000);
  const { cv } = ve(cao);
  return new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
}

/** Khung gợi ý trong cửa sổ bài nói: xem ngay + tải ảnh. */
export default function GoiYNoi({ u, bai, nhom }) {
  const [unit, setUnit] = useState(null);
  const [loi, setLoi] = useState(false);
  useEffect(() => {
    let live = true;
    loadUnit(u.audience, u.slug)
      .then((x) => live && setUnit(x))
      .catch(() => live && setLoi(true));
    return () => {
      live = false;
    };
  }, [u.audience, u.slug]);
  const [de, setDe] = useState(false);
  useEffect(() => setDe(docCheDo() === "moi"), []);
  if (loi) return <p className="kt-muted">Chưa tải được gợi ý — thử lại sau.</p>;
  if (!unit) return <p className="kt-muted">Đang soạn gợi ý…</p>;
  const g = taoGoiY(unit);
  return (
    <section className="nh-goiy">
      <header>
        <b>💡 Gợi ý bài nói (1–2 phút)</b>
        <AnhNhacNut ten={`goi-y-noi-${u.slug}`} label="Tải ảnh gợi ý" className="kt-btn" tieuDe="Ảnh gợi ý bài nói" meo="Lưu ảnh vào điện thoại để nhìn khi ghi âm." title="Tải gợi ý về bằng ảnh" ve={veAnhGoiY} make={() => ({ g, bai, nhom })} />
      </header>
      <div className="nh-goiy-tab" role="group" aria-label="Kiểu gợi ý">
        <button type="button" className={de ? "is-on" : ""} aria-pressed={de} onClick={() => setDe(true)}>🌱 Bản dễ (3 câu)</button>
        <button type="button" className={!de ? "is-on" : ""} aria-pressed={!de} onClick={() => setDe(false)}>Bản đầy đủ (1–2 phút)</button>
      </div>
      {de ? (
        <div className="nh-goiy-de">
          <p className="kt-muted">Mới bắt đầu: nói đúng 3 câu này (thay phần … bằng ý của bạn) — 30 giây cũng được, quan trọng là bắt đầu.</p>
          <ol>
            <li lang="en"><b>Today I learned about {g.chuDe.replace(/[.?!]*$/, "").replace(/^./, (x) => x.toLowerCase())}.</b></li>
            <li lang="en"><b>One important idea is: {g.y[0]?.cau || "…"}.</b></li>
            <li lang="en"><b>I will try … because …</b></li>
          </ol>
        </div>
      ) : (
      <>
      <p className="nh-goiy-chude" lang="en">{g.chuDe}</p>
      <ol>
        <li>
          <span>Mở đầu</span>
          <b lang="en">{g.mo}</b>
        </li>
        {g.y.map((x, k) => (
          <li key={k}>
            <span>{x.hoi}</span>
            <b lang="en">{x.cau}</b>
          </li>
        ))}
        <li>
          <span>Phần của bạn — nói thêm ví dụ của chính bạn</span>
          <b lang="en">{g.toi}</b>
        </li>
        <li>
          <span>Kết</span>
          <b lang="en">{g.ket}</b>
        </li>
      </ol>
      <p className="nh-goiy-mau">
        Câu nối ý:{" "}
        {g.mau.map((m) => (
          <code key={m} lang="en">{m}</code>
        ))}
      </p>
      </>
      )}
    </section>
  );
}
