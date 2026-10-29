"use client";
// #271 Trang ẩn /quanlinhomhoc — xem + sửa mọi nhóm học. KHÔNG xoá gì. PIN: chỉ đặt mới (thêm / thay), không bỏ được.
// PIN lưu dạng mã hoá một chiều → không ai xem được PIN cũ (kể cả quản lý); quên thì đặt PIN mới rồi báo người đó.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { RefreshCw, Lock, Search, ExternalLink } from "lucide-react";
import KtShell from "@/components/hkt/KtShell";
import { NGUONG_MAC_DINH } from "@/components/hkt/nhomRules";

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
const t = (d) => (d ? new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "2-digit" }) : "—");
async function ql(mk, q = "", body) {
  const r = await fetch(`/api/quanli${q}`, { method: body ? "POST" : "GET", headers: { "x-quanli": mk, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || `Lỗi ${r.status}`), { status: r.status });
  return d;
}

function Login({ onOk }) {
  const [mk, setMk] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await ql(mk);
      ssSet(mk);
      onOk(mk);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };
  return (
    <form className="nh-card ql-login" onSubmit={go}>
      <h1 className="kt-h1">
        <Lock size={22} aria-hidden="true" /> Quản lý nhóm học
      </h1>
      <input type="password" autoComplete="current-password" value={mk} onChange={(e) => setMk(e.target.value)} placeholder="Mật khẩu quản lý" autoFocus />
      {err && <p className="hkt-u-err">{err}</p>}
      <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || !mk}>
        Vào
      </button>
      <p className="kt-muted">Mật khẩu nhớ trong tab này đến khi đóng tab.</p>
    </form>
  );
}

function ChiTiet({ mk, ma, onBack }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [f, setF] = useState(null);
  const [pinFor, setPinFor] = useState("");
  const [pin, setPin] = useState("");
  const [nk, setNk] = useState(null); // { id, ds }
  const load = useCallback(async () => {
    try {
      const x = await ql(mk, `?ma=${ma}`);
      setD(x);
      const g = x.nhom;
      setF({ ten: g.ten, tenHuongDan: g.tenHuongDan, nguoiTaoId: g.nguoiTaoId || "", quiz: g.nguong?.quiz ?? NGUONG_MAC_DINH.quiz, say: g.nguong?.["listen-speak"] ?? NGUONG_MAC_DINH["listen-speak"], tf: g.nguong?.tf ?? "xong", hanChangGio: g.hanChangGio ?? 0, nhacGio: g.nhacGio ?? 0, kenhGuiBai: g.kenhGuiBai || "", toiDa: g.toiDa ?? 8, khoaNguoiMoi: !!g.khoaNguoiMoi, chatTat: !!g.chatTat });
    } catch (x) {
      setErr(x.message);
    }
  }, [mk, ma]);
  useEffect(() => {
    load();
  }, [load]);
  const sua = async (body, ok) => {
    setErr("");
    setMsg("");
    try {
      await ql(mk, "", { ma, ...body });
      setMsg(`${ok} — lưu lúc ${new Date().toLocaleTimeString("vi-VN")}`);
      await load();
    } catch (x) {
      setErr(x.message);
    }
  };
  if (!d || !f) return <p className="kt-muted">{err || "Đang tải…"}</p>;
  const g = d.nhom;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  return (
    <div className="ql-ct">
      <button type="button" className="kt-linkbtn" onClick={onBack}>
        ‹ Mọi nhóm
      </button>
      <h1 className="kt-h1">
        {g.ten} <small className="nh-code">{ma}</small>
      </h1>
      <p className="kt-muted">
        Chuỗi “{g.chuoi.title}” · {g.chuoi.bai.length} bài · đang mở Bài {g.changHienTai || 0} · tạo {t(g.taoLuc)} · hoạt động {t(g.hoatDongLuc)} · tự xoá {t(g.hetHanLuc)} · {d.soTin} tin Hỏi đáp ·{" "}
        <Link to={`/nhom/${ma}`} target="_blank">
          mở cửa nhóm <ExternalLink size={12} />
        </Link>
      </p>
      {msg && <p className="nh-msgline">{msg}</p>}
      {err && <p className="hkt-u-err">{err}</p>}

      <section className="nh-card">
        <h2>Cài đặt nhóm</h2>
        <div className="ql-grid">
          <label className="nh-field"><span className="nh-flabel">Tên nhóm</span><input value={f.ten} onChange={set("ten")} /></label>
          <label className="nh-field"><span className="nh-flabel">Tên trưởng nhóm (hiển thị)</span><input value={f.tenHuongDan} onChange={set("tenHuongDan")} /></label>
          <label className="nh-field">
            <span className="nh-flabel">Trưởng nhóm (ID)</span>
            <select value={f.nguoiTaoId} onChange={set("nguoiTaoId")}>
              {d.members.map((m) => (
                <option key={m.id} value={m.id}>{m.ten} ({m.id})</option>
              ))}
            </select>
          </label>
          <label className="nh-field"><span className="nh-flabel">Trắc nghiệm đúng /40</span><input type="number" min={1} max={40} value={f.quiz} onChange={set("quiz")} /></label>
          <label className="nh-field"><span className="nh-flabel">Nghe nói đúng /40</span><input type="number" min={1} max={40} value={f.say} onChange={set("say")} /></label>
          <label className="nh-field"><span className="nh-flabel">True or false (“xong” hoặc % đúng)</span><input value={f.tf} onChange={set("tf")} /></label>
          <label className="nh-field"><span className="nh-flabel">Thời hạn mỗi bài (giờ, 0 = tắt)</span><input type="number" min={0} value={f.hanChangGio} onChange={set("hanChangGio")} /></label>
          <label className="nh-field"><span className="nh-flabel">Nhắc mỗi (giờ, 0 = tắt)</span><input type="number" min={0} value={f.nhacGio} onChange={set("nhacGio")} /></label>
          <label className="nh-field"><span className="nh-flabel">Số người tối đa</span><input type="number" min={2} max={30} value={f.toiDa} onChange={set("toiDa")} /></label>
          <label className="nh-field ql-wide"><span className="nh-flabel">Kênh gửi bài nói (Zalo…)</span><input value={f.kenhGuiBai} onChange={set("kenhGuiBai")} /></label>
          <label className="nh-consent"><input type="checkbox" checked={f.khoaNguoiMoi} onChange={set("khoaNguoiMoi")} /> <span>Khoá nhận người mới</span></label>
          <label className="nh-consent"><input type="checkbox" checked={f.chatTat} onChange={set("chatTat")} /> <span>Tạm tắt Hỏi đáp</span></label>
        </div>
        <button
          type="button"
          className="kt-btn kt-btn--pri"
          onClick={() =>
            sua({ viec: "nhom", caiDat: { ten: f.ten, tenHuongDan: f.tenHuongDan, nguoiTaoId: f.nguoiTaoId, nguong: { quiz: +f.quiz, "listen-speak": +f.say, tf: String(f.tf).trim() === "xong" ? "xong" : +f.tf }, hanChangGio: +f.hanChangGio, nhacGio: +f.nhacGio, toiDa: +f.toiDa, kenhGuiBai: f.kenhGuiBai, khoaNguoiMoi: f.khoaNguoiMoi, chatTat: f.chatTat } }, "Đã lưu cài đặt")
          }
        >
          Lưu cài đặt
        </button>
      </section>

      <section className="nh-card">
        <h2>Thành viên ({d.members.length})</h2>
        <p className="kt-muted">PIN mã hoá một chiều — không ai xem được PIN cũ. Quên PIN: đặt PIN mới rồi báo người đó. Trang này không xoá người, không bỏ PIN.</p>
        <div className="nh-table-wrap">
          <table className="nh-table ql-tv">
            <thead>
              <tr>
                <th>Tên</th><th>ID</th><th>Trạng thái</th><th>PIN</th><th>Bài đang mở</th><th>Vào nhóm</th><th>Hoạt động</th><th></th>
              </tr>
            </thead>
            <tbody>
              {d.members.map((m) => (
                <React.Fragment key={m.id}>
                  <tr>
                    <td>
                      <input className="ql-ten" defaultValue={m.ten} onBlur={(e) => e.target.value.trim() && e.target.value !== m.ten && sua({ viec: "tv", id: m.id, ten: e.target.value }, `Đổi tên ${m.id}`)} />
                      {m.laNguoiTao && <small> · trưởng nhóm</small>}
                    </td>
                    <td className="nh-code">{m.id}</td>
                    <td>
                      <select value={m.trangThai === "tam-nghi" ? "tam-nghi" : "hoc"} onChange={(e) => sua({ viec: "tv", id: m.id, trangThai: e.target.value }, `${m.ten}: ${e.target.value === "hoc" ? "học" : "tạm nghỉ"}`)}>
                        <option value="hoc">Đang học</option>
                        <option value="tam-nghi">Tạm nghỉ</option>
                      </select>
                    </td>
                    <td>
                      {m.coPin ? "có PIN" : <b className="ql-warn">chưa có</b>}
                      {m.khoaDen && new Date(m.khoaDen) > new Date() && (
                        <button type="button" className="nh-mini" onClick={() => sua({ viec: "mo-khoa", id: m.id }, `Mở khoá ${m.id}`)}>
                          Mở khoá
                        </button>
                      )}
                    </td>
                    <td>{m.dangDo}</td>
                    <td>{t(m.vaoLuc)}</td>
                    <td>{t(m.hoatDongLuc)}</td>
                    <td className="nh-row">
                      <button type="button" className="nh-mini" onClick={() => { setPinFor(pinFor === m.id ? "" : m.id); setPin(""); }}>
                        {m.coPin ? "Đặt PIN mới" : "Thêm PIN"}
                      </button>
                      <button type="button" className="nh-mini" onClick={async () => setNk(nk?.id === m.id ? null : { id: m.id, ...(await ql(mk, `?ma=${ma}&nk=${m.id}`)) })}>
                        Nhật ký
                      </button>
                    </td>
                  </tr>
                  {pinFor === m.id && (
                    <tr>
                      <td colSpan={8}>
                        <form className="nh-row" onSubmit={(e) => { e.preventDefault(); sua({ viec: "pin", id: m.id, pin }, `Đã đặt PIN mới cho ${m.ten}`); setPinFor(""); }}>
                          <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} placeholder="PIN mới ••••" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} autoFocus />
                          <button type="submit" className="kt-btn kt-btn--pri" disabled={pin.length !== 4}>Lưu PIN mới</button>
                        </form>
                      </td>
                    </tr>
                  )}
                  {nk?.id === m.id && (
                    <tr>
                      <td colSpan={8}>
                        <ol className="nh-nk-list">
                          {nk.ds.map((x, i) => (
                            <li key={i} className={x.chung ? "is-chung" : x.dang ? "is-dang" : ""}>
                              <time>{t(x.luc)}</time>
                              <span>{x.viec}{x.chiTiet && <small> · {x.chiTiet}</small>}</span>
                            </li>
                          ))}
                          {!nk.ds.length && <li>Chưa có hoạt động.</li>}
                        </ol>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function QuanLiNhom() {
  const [mk, setMk] = useState("");
  const [ds, setDs] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [chon, setChon] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMk(ssGet()), []);
  const load = useCallback(async () => {
    if (!mk) return;
    setBusy(true);
    try {
      setDs((await ql(mk)).nhom);
      setErr("");
    } catch (x) {
      setErr(x.message);
      if (x.status === 401) {
        ssSet("");
        setMk("");
      }
    }
    setBusy(false);
  }, [mk]);
  useEffect(() => {
    load();
  }, [load]);
  const loc = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (ds || []).filter((g) => !s || [g.ma, g.ten, g.chuoi, g.tenHuongDan, g.nguoiTaoId].some((x) => String(x || "").toLowerCase().includes(s)));
  }, [ds, q]);
  return (
    <KtShell>
      <div className="nh-wrap ql">
        {!mk ? (
          <Login onOk={setMk} />
        ) : chon ? (
          <ChiTiet mk={mk} ma={chon} onBack={() => { setChon(""); load(); }} />
        ) : (
          <>
            <h1 className="kt-h1">Quản lý nhóm học</h1>
            <div className="nh-row ql-bar">
              <label className="ql-search">
                <Search size={16} aria-hidden="true" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên nhóm, chuỗi, trưởng nhóm…" />
              </label>
              <button type="button" className="kt-btn" onClick={load} disabled={busy}>
                <RefreshCw size={16} className={busy ? "nh-spin" : ""} aria-hidden="true" /> Cập nhật
              </button>
              <button type="button" className="kt-btn" onClick={() => { ssSet(""); setMk(""); setDs(null); }}>
                Thoát
              </button>
            </div>
            {err && <p className="hkt-u-err">{err}</p>}
            {ds && <p className="kt-muted">{loc.length}/{ds.length} nhóm · {ds.reduce((n, g) => n + g.soNguoi, 0)} người</p>}
            <div className="nh-table-wrap">
              <table className="nh-table ql-ds">
                <thead>
                  <tr>
                    <th>Mã</th><th>Tên nhóm</th><th>Chuỗi</th><th>Trưởng nhóm</th><th>Người</th><th>Bài mở</th><th>Hoạt động</th><th>Tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {loc.map((g) => (
                    <tr key={g.ma} onClick={() => setChon(g.ma)} className="ql-row">
                      <td className="nh-code">{g.ma}</td>
                      <td>{g.ten}{g.veDichLuc && " 🎉"}</td>
                      <td>{g.chuoi}</td>
                      <td>{g.tenHuongDan} <small>({g.nguoiTaoId || "—"})</small></td>
                      <td>{g.dangHoc}/{g.soNguoi}</td>
                      <td>{g.chang}/{g.soBai}</td>
                      <td>{t(g.hoatDongLuc)}</td>
                      <td>{t(g.taoLuc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </KtShell>
  );
}
