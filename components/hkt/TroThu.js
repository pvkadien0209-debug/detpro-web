"use client";
// #269 Đét trợ thủ — nút nổi "Tôi cần làm gì?" ở mọi trang: Đét gợi ý việc nên làm NGAY (theo bài / phần / nhóm đang mở)
// và hỏi từng bước ("Bạn đã đọc bài chưa?" → chưa thì đọc, rồi thì làm bài tập…). Kịch bản: troThuKichBan.js.
// Ẩn được (nhớ trên máy); bật lại bằng nút trong khung Hướng dẫn (PartGuide) hoặc trang "Của tôi".
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTroThuCtx } from "./troThuCtx";
import { KICH_BAN, goiY } from "./troThuKichBan";

const AN = "dp.trothu.an";
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

export default function TroThu() {
  const pathname = usePathname() || "";
  const ctx0 = useTroThuCtx();
  const [an, setAn] = useState(true);
  const [mo, setMo] = useState(false);
  const [vet, setVet] = useState(["goc"]); // đường đi trong kịch bản
  const [hoiAn, setHoiAn] = useState(false);
  useEffect(() => {
    const doc = () => setAn(!!lsGet(AN) || window.parent !== window); // không hiện trong cửa sổ làm bài (iframe)
    doc();
    window.addEventListener("dp-trothu", doc);
    return () => window.removeEventListener("dp-trothu", doc);
  }, []);
  useEffect(() => setVet(["goc"]), [pathname]);
  if (an || pathname.startsWith("/quanlinhomhoc")) return null;
  const ctx = ctx0 || (pathname.startsWith("/nhom/tao") ? { loai: "tao" } : /^\/nhom\/[A-Za-z0-9]{6}\/?$/.test(pathname) ? { loai: "cua" } : null);
  const id = vet[vet.length - 1];
  const node = KICH_BAN[id] || KICH_BAN.goc;
  const det = typeof node.det === "function" ? node.det(ctx) : node.det;
  const chon = typeof node.chon === "function" ? node.chon(ctx) : node.chon || [];
  const g = goiY(ctx);
  const bam = (x) => {
    if (x.lam) {
      x.lam(ctx);
      setMo(false);
      setVet(["goc"]);
    } else if (x.toi) setVet((v) => (x.toi === "goc" ? ["goc"] : [...v, x.toi]));
  };
  return (
    <div className={`tt ${mo ? "is-open" : ""}`}>
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
      <button type="button" className={`tt-btn ${g.nut ? "has-goiy" : ""}`} onClick={() => { setMo((v) => !v); setVet(["goc"]); setHoiAn(false); }} aria-expanded={mo}>
        <img src="/brand/det-think.png" alt="" />
        <span>Tôi cần làm gì?</span>
      </button>
    </div>
  );
}
