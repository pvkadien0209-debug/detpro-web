"use client";
// #269 Đét trợ thủ — nút nổi "Tôi cần làm gì?" ở mọi trang: Đét gợi ý việc nên làm NGAY (theo bài / phần / nhóm đang mở)
// và hỏi từng bước ("Bạn đã đọc bài chưa?" → chưa thì đọc, rồi thì làm bài tập…). Kịch bản: troThuKichBan.js.
// Ẩn được (nhớ trên máy); bật lại bằng nút trong khung Hướng dẫn (PartGuide) hoặc trang "Của tôi".
// #285 (LB-Q4): kéo thả đổi chỗ (nhớ trên máy); đang làm bài tập thì thu thành nút tròn nhỏ có ✕ để tắt nhanh.
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/lib/router";
import { readLastUnit, unitPath } from "./unitData"; // #318
import { X } from "lucide-react";
import { useTroThuCtx } from "./troThuCtx";
import { KICH_BAN, goiY } from "./troThuKichBan";

const AN = "dp.trothu.an";
const VT = "dp.trothu.vitri";
const lsGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    v ? localStorage.setItem(k, v) : localStorage.removeItem(k);
  } catch {
    /* bỏ qua */
  }
};
export const hienTroThu = () => {
  lsSet(AN, "");
  window.dispatchEvent(new Event("dp-trothu"));
};
export const daAnTroThu = () => !!lsGet(AN);

// #318 trang bên ngoài nào
function trangNgoai(p) {
  if (p === "/" || p === "") return "chu";
  if (p.startsWith("/me")) return "toi";
  if (p.startsWith("/videos")) return "video";
  if (p.startsWith("/huong-dan")) return "hd";
  if (/^\/for\/[^/]+\/?$/.test(p)) return "doi-tuong";
  if (/^\/(knowledge|learn|articles|for)\//.test(p)) return "chu-de";
  return "khac";
}

export default function TroThu() {
  const pathname = usePathname() || "";
  const ctx0 = useTroThuCtx();
  const navigate = useNavigate();
  const [an, setAn] = useState(true);
  const [mo, setMo] = useState(false);
  const [vet, setVet] = useState(["goc"]); // đường đi trong kịch bản
  const [hoiAn, setHoiAn] = useState(false);
  const [vt, setVt] = useState(null); // { x, y } px tính từ trái / dưới
  const keo = useRef(null);
  useEffect(() => {
    try {
      const v = JSON.parse(lsGet(VT) || "null");
      if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) setVt(v);
    } catch {
      /* bỏ qua */
    }
  }, []);
  useEffect(() => {
    const doc = () => setAn(!!lsGet(AN) || window.parent !== window); // không hiện trong cửa sổ làm bài (iframe)
    doc();
    window.addEventListener("dp-trothu", doc);
    return () => window.removeEventListener("dp-trothu", doc);
  }, []);
  useEffect(() => setVet(["goc"]), [pathname]);
  if (an || pathname.startsWith("/quanlinhomhoc")) return null;
  // #318 Đét phân biệt: trang ngoài (theo từng trang) · học riêng · học trong nhóm · cây nhóm · cửa nhóm · mở nhóm
  const base = ctx0 || (pathname.startsWith("/nhom/tao") ? { loai: "tao" } : /^\/nhom\/[A-Za-z0-9]{6}\/?$/.test(pathname) ? { loai: "cua" } : null);
  const nav = (h) => h && navigate(h);
  let ctx;
  if (base) ctx = { ...base, nav };
  else {
    const last = readLastUnit();
    ctx = { loai: "ngoai", trang: trangNgoai(pathname), last, lastHref: last ? unitPath(last.audience, last.slug, last.part || "") : null, nav };
  }
  const id = vet[vet.length - 1];
  const node = KICH_BAN[id] || KICH_BAN.goc;
  const det = typeof node.det === "function" ? node.det(ctx) : node.det;
  const chon = typeof node.chon === "function" ? node.chon(ctx) : node.chon || [];
  const g = goiY(ctx);
  const nho = ctx?.loai === "bai" && ["quiz", "listen-speak", "true-or-false"].includes(ctx.part) && !mo; // đang làm bài tập
  const kep = (x, y) => ({ x: Math.max(4, Math.min(window.innerWidth - 60, x)), y: Math.max(4, Math.min(window.innerHeight - 60, y)) });
  const onDown = (e) => {
    const r = e.currentTarget.closest(".tt").getBoundingClientRect();
    keo.current = { sx: e.clientX, sy: e.clientY, x0: r.left, y0: window.innerHeight - r.bottom, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const k = keo.current;
    if (!k) return;
    const dx = e.clientX - k.sx;
    const dy = e.clientY - k.sy;
    if (!k.moved && Math.hypot(dx, dy) < 6) return;
    k.moved = true;
    setVt(kep(k.x0 + dx, k.y0 - dy));
  };
  const onUp = () => {
    const k = keo.current;
    keo.current = null;
    if (k?.moved) {
      lsSet(VT, JSON.stringify(vt));
      return;
    }
    setMo((v) => !v);
    setVet(["goc"]);
    setHoiAn(false);
  };
  const bam = (x) => {
    if (x.lam) {
      x.lam(ctx);
      setMo(false);
      setVet(["goc"]);
    } else if (x.toi) setVet((v) => (x.toi === "goc" ? ["goc"] : [...v, x.toi]));
  };
  return (
    <div className={`tt ${mo ? "is-open" : ""} ${nho ? "is-nho" : ""}`} style={vt ? { left: vt.x, bottom: vt.y } : undefined}>
      {mo && (
        <section className="tt-panel" role="dialog" aria-label="Đét trợ thủ">
          <header>
            <img src="/brand/det-think.png" alt="" />
            <b>Đét trợ thủ</b>
            <button type="button" className="tt-an" onClick={() => setHoiAn(true)} title="Ẩn Đét trợ thủ">
              Ẩn
            </button>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng">
              <X size={18} />
            </button>
          </header>
          {hoiAn ? (
            <div className="tt-body">
              <p className="tt-say">Ẩn mình đi nhé? Muốn gọi lại: bấm nút “?” Hướng dẫn ở bất kỳ trang nào → “Bật lại Đét trợ thủ”.</p>
              <div className="tt-chon">
                <button type="button" className="is-pri" onClick={() => { lsSet(AN, "1"); setAn(true); setHoiAn(false); setMo(false); }}>
                  Ẩn Đét
                </button>
                <button type="button" onClick={() => setHoiAn(false)}>
                  Thôi, giữ lại
                </button>
              </div>
            </div>
          ) : (
            <div className="tt-body">
              <p className="tt-say">{det}</p>
              <div className="tt-chon">
                {chon.map((x, i) => (
                  <button key={i} type="button" className={x.chinh ? "is-pri" : ""} onClick={() => bam(x)}>
                    {x.t}
                  </button>
                ))}
              </div>
              {vet.length > 1 && (
                <button type="button" className="tt-lui" onClick={() => setVet((v) => v.slice(0, -1))}>
                  ‹ Quay lại
                </button>
              )}
            </div>
          )}
        </section>
      )}
      <button
        type="button"
        className={`tt-btn ${g.nut ? "has-goiy" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setMo((v) => !v))}
        aria-expanded={mo}
        aria-label="Tôi cần làm gì? (kéo để đổi chỗ)"
        title="Tôi cần làm gì? — kéo để đổi chỗ"
      >
        <img src="/brand/det-think.png" alt="" draggable={false} />
        {!nho && <span>Tôi cần làm gì?</span>}
      </button>
      {nho && (
        <button type="button" className="tt-x" onClick={() => { lsSet(AN, "1"); setAn(true); }} aria-label="Tắt Đét trợ thủ" title="Tắt Đét (bật lại ở nút ? Hướng dẫn)">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
