"use client";
// #298 (TD-Q3, cách A) Chuyển tiến độ học riêng sang máy khác bằng MÃ (không cần máy chủ).
// Máy cũ: "Chép mã" / "Tải tệp" → dán (Zalo "Cloud của tôi", email…) → máy mới: dán mã / mở tệp → "Nhập".
// Gộp theo từng câu (gopTienDo) — nhập nhiều lần hay nhập ngược chiều đều không mất câu.
import React, { useState } from "react";
import { gopTienDo } from "./nhomRules";

const PRE = "hkt.unit."; // tiến độ từng bài
const KHAC = ["hkt.progress.", "hkt.last", "dp.video.history"]; // kiến thức / bài học gần nhất / video đã xem: chỉ thêm khi máy mới chưa có

function gom() {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith(PRE) || KHAC.some((p) => k.startsWith(p)))) o[k] = localStorage.getItem(k);
  }
  return o;
}

const b64 = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function maHoa(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "function") {
    const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
    return `DETPRO1:${b64(z)}`;
  }
  return `DETPRO0:${b64(raw)}`;
}
async function giaiMa(ma) {
  const m = String(ma).trim().match(/DETPRO([01]):([A-Za-z0-9+/=\s]+)/);
  if (!m) throw new Error("Không phải mã tiến độ DetPro");
  let u8 = unb64(m[2].replace(/\s+/g, ""));
  if (m[1] === "1") {
    if (typeof DecompressionStream !== "function") throw new Error("Trình duyệt này quá cũ để mở mã — cập nhật trình duyệt rồi thử lại");
    u8 = new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  }
  const o = JSON.parse(new TextDecoder().decode(u8));
  if (!o || typeof o !== "object") throw new Error("Mã hỏng");
  return o;
}

function nhap(o) {
  let bai = 0;
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "string") continue;
    if (k.startsWith(PRE)) {
      let cu = null;
      let moi = null;
      try {
        cu = JSON.parse(localStorage.getItem(k) || "null");
        moi = JSON.parse(v);
      } catch {
        continue;
      }
      localStorage.setItem(k, JSON.stringify({ ...gopTienDo(cu, moi), updatedAt: Date.now() }));
      bai++;
    } else if (KHAC.some((p) => k.startsWith(p)) && localStorage.getItem(k) == null) localStorage.setItem(k, v);
  }
  return bai;
}

export default function ChuyenTienDo() {
  const [ma, setMa] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const taoMa = async () => {
    const o = gom();
    const n = Object.keys(o).filter((k) => k.startsWith(PRE)).length;
    if (!n) return setMsg("Máy này chưa có tiến độ bài nào để chuyển."), "";
    const s = await maHoa(o);
    return { s, n };
  };
  const chep = async () => {
    setBusy(true);
    try {
      const r = await taoMa();
      if (!r) return;
      try {
        await navigator.clipboard.writeText(r.s);
        setMsg(`Đã chép mã ${r.n} bài (${Math.ceil(r.s.length / 1024)} KB). Dán vào Zalo “Cloud của tôi” hoặc email, rồi mở ở máy kia và dán vào ô bên dưới.`);
      } catch {
        setMa(r.s);
        setMsg("Máy không cho chép tự động — mã đã hiện trong ô bên dưới, bấm giữ để chép.");
      }
    } finally {
      setBusy(false);
    }
  };
  const taiTep = async () => {
    setBusy(true);
    try {
      const r = await taoMa();
      if (!r) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([r.s], { type: "text/plain" }));
      a.download = `detpro-tien-do-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setMsg(`Đã tải tệp mã ${r.n} bài. Gửi tệp sang máy kia rồi bấm “Mở tệp mã”.`);
    } finally {
      setBusy(false);
    }
  };
  const nhapMa = async (s) => {
    setBusy(true);
    try {
      const n = nhap(await giaiMa(s));
      setMa("");
      setMsg(`✅ Đã nhập ${n} bài — câu đã làm ở hai máy được gộp lại, không mất câu nào. Tải lại trang để thấy.`);
    } catch (e) {
      setMsg(`Chưa nhập được: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="kt-card nh-chuyen">
      <summary>
        <b>🔁 Chuyển tiến độ sang máy khác</b> <span className="kt-muted">— tiến độ học riêng chỉ lưu trên máy này</span>
      </summary>
      <p className="kt-muted">Máy cũ: chép mã (hoặc tải tệp). Máy mới: dán mã vào ô rồi bấm Nhập. Làm hai chiều cũng được — câu ở hai máy được cộng dồn.</p>
      <div className="nh-chuyen-row">
        <button type="button" className="kt-btn kt-btn--pri" onClick={chep} disabled={busy}>
          Chép mã tiến độ
        </button>
        <button type="button" className="kt-btn" onClick={taiTep} disabled={busy}>
          Tải tệp mã
        </button>
        <label className="kt-btn">
          Mở tệp mã
          <input type="file" accept=".txt,text/plain" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) nhapMa(await f.text()); }} />
        </label>
      </div>
      <textarea className="nh-chuyen-ma" rows={3} value={ma} onChange={(e) => setMa(e.target.value)} placeholder="Dán mã DETPRO… vào đây" />
      <button type="button" className="kt-btn kt-btn--pri" onClick={() => nhapMa(ma)} disabled={busy || !ma.trim()}>
        Nhập vào máy này
      </button>
      {msg && <p className="nh-msgline">{msg}</p>}
    </details>
  );
}
