"use client";
// #1039 Legal contract learning — tài liệu học của anh, mở trong khung ngay trên web (không cần mật khẩu, anh chốt #1043).
// Khung chạy srcdoc + sandbox KHÔNG có allow-same-origin → mã trong tài liệu không đọc được dữ liệu của web.
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { Maximize2, ArrowLeft, X } from "lucide-react";
import KtShell from "./KtShell";
import { HOC_RIENG } from "@/lib/hocRieng";

async function taiBai(id) {
  const r = await fetch(`/api/hoc-rieng/${id}`);
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error || `Lỗi ${r.status}`);
  }
  return r.text();
}

export default function HocRieng() {
  const [chon, setChon] = useState(HOC_RIENG[0]?.id || "");
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [phu, setPhu] = useState(false); // toàn màn hình: khung phủ cả trang (điện thoại đọc rộng hơn, che thanh menu)

  useEffect(() => {
    if (!phu) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && setPhu(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", esc);
    };
  }, [phu]);
  useEffect(() => {
    if (!chon) return;
    let huy = false;
    setBusy(true);
    setErr("");
    setHtml("");
    taiBai(chon)
      .then((h) => !huy && setHtml(h))
      .catch((x) => !huy && setErr(x.message))
      .finally(() => !huy && setBusy(false));
    return () => {
      huy = true;
    };
  }, [chon]);

  const moRieng = () => {
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  const bai = HOC_RIENG.find((b) => b.id === chon);

  return (
    <KtShell active="me">
      <p className="kt-muted" style={{ margin: "0 0 6px" }}>
        <Link to="/me">
          <ArrowLeft size={14} aria-hidden="true" /> Của tôi
        </Link>
      </p>
      <h1 className="kt-h1">Legal contract learning</h1>
      {HOC_RIENG.length > 1 && (
        <div className="hr-ds">
          {HOC_RIENG.map((b) => (
            <button key={b.id} type="button" className={`kt-btn ${b.id === chon ? "kt-btn--pri" : ""}`} onClick={() => setChon(b.id)}>
              {b.ten}
            </button>
          ))}
        </div>
      )}
      {bai && (
        <div className="kt-row-head" style={{ marginTop: 8 }}>
          <h2>
            {bai.ten} <small className="kt-muted">· {bai.ngay}</small>
          </h2>
          <span style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button type="button" className="kt-btn kt-btn--pri" onClick={() => setPhu(true)} disabled={!html}>
              <Maximize2 size={14} aria-hidden="true" /> Toàn màn hình
            </button>
            <button type="button" className="kt-linkbtn" onClick={moRieng} disabled={!html}>
              Mở tab riêng
            </button>
          </span>
        </div>
      )}
      {busy && <p className="kt-muted">Đang tải…</p>}
      {err && <p className="hkt-u-err">{err}</p>}
      {html && (
        <div style={phu ? { position: "fixed", inset: 0, zIndex: 2147483000, background: "#fff" } : undefined}>
          <iframe
            title={bai?.ten || "Tài liệu"}
            srcDoc={html}
            sandbox="allow-scripts allow-popups allow-modals"
            style={
              phu
                ? { width: "100%", height: "100%", border: 0, display: "block", background: "#fff" }
                : { width: "100%", height: "calc(100dvh - 170px)", minHeight: 520, border: "1px solid #cfe9e1", borderRadius: 8, background: "#fff" }
            }
          />
          {phu && (
            <button
              type="button"
              onClick={() => setPhu(false)}
              aria-label="Thoát toàn màn hình"
              style={{ position: "fixed", right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))", zIndex: 2147483001, display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 999, border: 0, background: "#0b5747", color: "#fff", font: "600 14px system-ui", boxShadow: "0 2px 10px rgba(0,0,0,.25)" }}
            >
              <X size={16} aria-hidden="true" /> Thoát
            </button>
          )}
        </div>
      )}
    </KtShell>
  );
}
