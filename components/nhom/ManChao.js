"use client";
// #354 Màn chào khi mới vào nhóm (NM-Q1: bỏ qua được — ngày 2 Đét nhắc riêng 1 lần; NM-Q2: 3 câu tự đánh giá → chế độ hỗ trợ).
// Dạng slideshow (ảnh lớn + chữ) · bản chữ · (video: phiên Remotion dựng từ manChaoData.js).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { NHAN_DOC } from "@/components/hkt/nhomRules";
import { MAN_CHAO, TU_DANH_GIA, CHE_DO, cheDoTuDiem } from "./manChaoData";
import { apCheDo } from "@/components/hkt/hoTro";
import { api } from "./nhomClient";

const kChao = (ma, id) => `dp.nhom.chao.${ma}/${id}`;
export function docChao(ma, id) {
  try {
    return JSON.parse(window.localStorage.getItem(kChao(ma, id)) || "null");
  } catch {
    return null;
  }
}
export function ghiChao(ma, id, v) {
  try {
    window.localStorage.setItem(kChao(ma, id), JSON.stringify({ ...(docChao(ma, id) || {}), ...v }));
  } catch {
    /* bỏ qua */
  }
}

const thay = (s, n) => s.replace(/\{nhom\}/g, n.ten).replace(/\{chuoi\}/g, n.chuoi?.title || "").replace(/\{soBai\}/g, String(n.chuoi?.bai?.length || ""));

export default function ManChao({ ma, id, nhom, onDong }) {
  const tong = MAN_CHAO.length + 2; // + tự đánh giá + xác nhận
  const [i, setI] = useState(0);
  const [banChu, setBanChu] = useState(false);
  const [tl, setTl] = useState({}); // id câu → 0..2
  const [hieu, setHieu] = useState([false, false, false]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.body.classList.add("nh-chao-mo");
    return () => document.body.classList.remove("nh-chao-mo");
  }, []);
  const diem = TU_DANH_GIA.reduce((n, q) => n + (tl[q.id] ?? 0), 0);
  const duTl = TU_DANH_GIA.every((q) => tl[q.id] !== undefined);
  const cd = cheDoTuDiem(diem);
  const boQua = () => {
    ghiChao(ma, id, { tt: "bo", luc: Date.now() });
    onDong();
  };
  const xong = async () => {
    setBusy(true);
    apCheDo(cd);
    ghiChao(ma, id, { tt: "xong", luc: Date.now(), cheDo: cd });
    try {
      await api(`${ma}/trinh-do`, { id, body: { ...tl, cheDo: cd } });
    } catch {
      /* lưu máy chủ không được vẫn dùng được trên máy */
    }
    setBusy(false);
    onDong(cd);
  };

  const trang = (() => {
    if (i < MAN_CHAO.length) {
      const s = MAN_CHAO[i];
      return (
        <div className="nh-chao-tr">
          <div className="nh-chao-anh" aria-hidden="true">{s.icon}</div>
          <h2>{thay(s.tieuDe, nhom)}</h2>
          <ul>
            {s.dong.map((d, k) => (
              <li key={k}>{thay(d, nhom)}</li>
            ))}
          </ul>
        </div>
      );
    }
    if (i === MAN_CHAO.length)
      return (
        <div className="nh-chao-tr">
          <div className="nh-chao-anh" aria-hidden="true">🧭</div>
          <h2>Tiếng Anh của bạn hiện thế nào?</h2>
          <p className="kt-muted">3 câu, để bật sẵn công cụ hợp với bạn. Không ai thấy câu trả lời trừ người hướng dẫn; đổi lại được bất cứ lúc nào.</p>
          {TU_DANH_GIA.map((q) => (
            <fieldset key={q.id} className="nh-chao-q">
              <legend>{q.hoi}</legend>
              {q.chon.map((c, k) => (
                <button key={k} type="button" className={tl[q.id] === k ? "is-on" : ""} aria-pressed={tl[q.id] === k} onClick={() => setTl((t) => ({ ...t, [q.id]: k }))}>
                  {c}
                </button>
              ))}
            </fieldset>
          ))}
          {duTl && (
            <p className="nh-chao-kq">
              <b>{CHE_DO[cd].ten}</b> — {CHE_DO[cd].mo}
            </p>
          )}
          {duTl && (tl.doc ?? 2) === 0 && <p className="nh-chao-kq is-doc">{NHAN_DOC.ghiChu} Nút nhắn có sẵn trên cây, ở thẻ “Việc của bạn bây giờ”.</p>}
        </div>
      );
    const cau = ["Tôi hiểu việc của tôi: làm bài tập để chuẩn bị, rồi nói và gửi bài nói.", "Tôi hiểu việc của người hướng dẫn: nghe và sửa riêng bài nói, trả lời thắc mắc của tôi.", "Tôi biết tuần đầu làm gì và có công cụ nào khi tiếng Anh còn yếu."];
    return (
      <div className="nh-chao-tr">
        <div className="nh-chao-anh" aria-hidden="true">✅</div>
        <h2>Sẵn sàng chưa?</h2>
        {cau.map((c, k) => (
          <label key={k} className="nh-chao-hieu">
            <input type="checkbox" checked={hieu[k]} onChange={(e) => setHieu((h) => h.map((x, j) => (j === k ? e.target.checked : x)))} /> {c}
          </label>
        ))}
        {!duTl && <p className="kt-muted">Bạn chưa trả lời 3 câu ở trang trước — vẫn bắt đầu được, sau này chọn chế độ ở “Xem lại giới thiệu”.</p>}
      </div>
    );
  })();

  return createPortal(
    <div className="nh-chao" role="dialog" aria-modal="true" aria-label="Giới thiệu nhóm học">
      <div className="nh-chao-box">
        <header>
          <span className="nh-chao-so">
            {i + 1}/{tong}
          </span>
          <button type="button" className="kt-linkbtn" onClick={() => setBanChu((v) => !v)}>
            {banChu ? "🖼 Xem dạng trang" : "📄 Bản chữ"}
          </button>
          <button type="button" className="nh-chao-x" onClick={boQua} title="Để sau — xem lại bất cứ lúc nào">
            Để sau <X size={16} aria-hidden="true" />
          </button>
        </header>
        {banChu ? (
          <div className="nh-chao-chu">
            {MAN_CHAO.map((s) => (
              <section key={s.id}>
                <h3>
                  {s.icon} {thay(s.tieuDe, nhom)}
                </h3>
                <ul>
                  {s.dong.map((d, k) => (
                    <li key={k}>{thay(d, nhom)}</li>
                  ))}
                </ul>
              </section>
            ))}
            <button type="button" className="kt-btn kt-btn--pri" onClick={() => { setBanChu(false); setI(MAN_CHAO.length); }}>
              Đọc xong → 3 câu về tiếng Anh của bạn
            </button>
          </div>
        ) : (
          <>
            {trang}
            <div className="nh-chao-cham" aria-hidden="true">
              {Array.from({ length: tong }, (_, k) => (
                <i key={k} className={k === i ? "is-on" : k < i ? "is-qua" : ""} />
              ))}
            </div>
            <footer>
              <button type="button" className="kt-btn" disabled={i === 0} onClick={() => setI(i - 1)}>
                ‹ Trước
              </button>
              {i < tong - 1 ? (
                <button type="button" className="kt-btn kt-btn--pri" onClick={() => setI(i + 1)}>
                  Tiếp ›
                </button>
              ) : (
                <button type="button" className="kt-btn kt-btn--pri" disabled={busy || !hieu.every(Boolean)} onClick={xong} title={hieu.every(Boolean) ? "" : "Tick 3 ô để bắt đầu"}>
                  Bắt đầu học 🚀
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
