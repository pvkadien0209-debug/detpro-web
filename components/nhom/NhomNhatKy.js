"use client";
// #260 Nhật ký học của từng người (lưu trên Mongo: nhat_ky_hoc). Học viên xem của mình; trưởng nhóm xem của mọi người (uid = ID người lập, ai = người cần xem).
import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "./nhomClient";
import { errText } from "./NhomShared";

const fmt = (d) => new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

export default function NhatKyList({ ma, uid, k, ai, title = "Nhật ký học của tôi" }) {
  const [ds, setDs] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [all, setAll] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api(`${ma}/nhat-ky`, { id: uid, k, query: { ai } });
      setDs(r.ds);
    } catch (e) {
      setErr(errText(e));
    }
    setBusy(false);
  }, [ma, uid, k, ai]);
  useEffect(() => {
    load();
  }, [load]);
  const shown = ds ? (all ? ds : ds.slice(0, 30)) : [];
  return (
    <section className="nh-card nh-nk">
      <h2>
        {title}
        <button type="button" className="nh-mini" onClick={load} disabled={busy} title="Lấy nhật ký mới nhất">
          <RefreshCw size={14} className={busy ? "nh-spin" : ""} aria-hidden="true" /> Cập nhật
        </button>
      </h2>
      {err && <p className="nh-err">{err}</p>}
      {ds && !ds.length && <p className="kt-muted">Chưa có hoạt động nào.</p>}
      {!!shown.length && (
        <ol className="nh-nk-list">
          {shown.map((x, i) => (
            <li key={i} className={x.chung ? "is-chung" : x.dang ? "is-dang" : /Đã xong|Xong cả/.test(x.viec) ? "is-xong" : ""}>
              <time>{fmt(x.luc)}</time>
              <span>
                {x.chung ? "👥 " : ""}
                {x.viec}
                {x.chiTiet && <small> · {x.chiTiet}</small>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {ds && ds.length > 30 && (
        <button type="button" className="kt-linkbtn" onClick={() => setAll((v) => !v)}>
          {all ? "Thu gọn" : `Xem cả ${ds.length} dòng`}
        </button>
      )}
    </section>
  );
}
