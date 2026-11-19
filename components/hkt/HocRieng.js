"use client";
// #1039 Legal contract learning — tài liệu học riêng của anh, mở trong khung ngay trên web.
// Mật khẩu = mật khẩu quản lý (như /quanlinhomhoc), nhớ trong tab đến khi đóng tab (cùng khoá "dp.quanli").
// Khung chạy srcdoc + sandbox KHÔNG có allow-same-origin → mã trong tài liệu không đọc được mật khẩu / dữ liệu của web.
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router";
import { Lock, Maximize2, ArrowLeft } from "lucide-react";
import KtShell from "./KtShell";
import { HOC_RIENG } from "@/lib/hocRieng";

const SK = "dp.quanli";
const ssGet = () => {
  try {
    return sessionStorage.getItem(SK) || "";
  } catch {
    return "";
  }
};
const ssSet = (v) => {
  try {
    v ? sessionStorage.setItem(SK, v) : sessionStorage.removeItem(SK);
  } catch {
    /* bỏ qua */
  }
};
async function taiBai(mk, id) {
  const r = await fetch(`/api/hoc-rieng/${id}`, { headers: { "x-quanli": mk }, cache: "no-store" });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw Object.assign(new Error(d.error || `Lỗi ${r.status}`), { status: r.status });
  }
  return r.text();
}

export default function HocRieng() {
  const [mk, setMk] = useState("");
  const [nhap, setNhap] = useState("");
  const [chon, setChon] = useState(HOC_RIENG[0]?.id || "");
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMk(ssGet()), []);
  useEffect(() => {
    if (!mk || !chon) return;
    let huy = false;
    setBusy(true);
    setErr("");
    setHtml("");
    taiBai(mk, chon)
      .then((h) => !huy && setHtml(h))
      .catch((x) => {
        if (huy) return;
        setErr(x.message);
        if (x.status === 401) {
          ssSet("");
          setMk("");
        }
      })
      .finally(() => !huy && setBusy(false));
    return () => {
      huy = true;
    };
  }, [mk, chon]);

  const vao = (e) => {
    e.preventDefault();
    if (!nhap) return;
    ssSet(nhap);
    setMk(nhap);
    setNhap("");
  };
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
      {!mk ? (
        <form className="nh-card ql-login" onSubmit={vao}>
          <p>
            <Lock size={16} aria-hidden="true" /> Tài liệu học riêng — nhập mật khẩu quản lý.
          </p>
          <input type="password" autoComplete="current-password" value={nhap} onChange={(e) => setNhap(e.target.value)} placeholder="Mật khẩu quản lý" autoFocus />
          {err && <p className="hkt-u-err">{err}</p>}
          <button type="submit" className="kt-btn kt-btn--pri" disabled={!nhap}>
            Mở
          </button>
          <p className="kt-muted">Mật khẩu nhớ trong tab này đến khi đóng tab.</p>
        </form>
      ) : (
        <>
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
              <button type="button" className="kt-linkbtn" onClick={moRieng} disabled={!html}>
                <Maximize2 size={14} aria-hidden="true" /> Mở tab riêng
              </button>
            </div>
          )}
          {busy && <p className="kt-muted">Đang tải…</p>}
          {err && <p className="hkt-u-err">{err}</p>}
          {html && (
            <iframe
              title={bai?.ten || "Tài liệu"}
              srcDoc={html}
              sandbox="allow-scripts allow-popups allow-modals"
              style={{ width: "100%", height: "calc(100vh - 170px)", minHeight: 520, border: "1px solid #cfe9e1", borderRadius: 8, background: "#fff" }}
            />
          )}
        </>
      )}
    </KtShell>
  );
}
