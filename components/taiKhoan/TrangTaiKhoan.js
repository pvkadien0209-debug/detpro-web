"use client";
// #370 Trang /tai-khoan — đăng nhập / tạo tài khoản (TUỲ CHỌN) + quản lí: thông tin, mật khẩu, email (chưa xác thực),
// nhóm + tiến độ, "Nhóm tôi hướng dẫn" (bảng gom mọi lớp), thiết bị, tải dữ liệu, xoá tài khoản.
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/router";
import KtShell from "@/components/hkt/KtShell";
import { myGroups, getMyId, loadK, getPin, setMyId, rememberGroup } from "@/components/nhom/nhomClient";
import { baiKey } from "@/components/hkt/nhomRules";
import { tk, docCo, ghiCo, dongBoNgay, xoaMay, EV } from "./tkClient";

/** #370 nhóm đã gắn tài khoản (máy chủ) → máy này nhớ luôn (danh sách nhóm + ID của tôi). */
function apNhom(ds) {
  for (const x of [...(ds || [])].reverse()) {
    if (!getMyId(x.ma)) setMyId(x.ma, x.id);
    if (!myGroups().some((y) => y.ma === x.ma)) rememberGroup(x.ma, x.ten, x.id);
  }
}
/** #370 nhóm trên máy có PIN mà chưa gắn → gắn lặng lẽ (học viên cũ tự đồng bộ vào tài khoản). */
async function ganTuMay(ds) {
  let moi = ds || [];
  for (const g of myGroups()) {
    const id = g.id || getMyId(g.ma);
    const pin = id && getPin(g.ma, id);
    if (!pin || moi.some((x) => x.ma === g.ma && x.id === id)) continue;
    try {
      moi = (await tk("gan-nhom", { ma: g.ma, id, pin })).nhom;
    } catch {
      /* PIN cũ sai / đã gắn tài khoản khác → bỏ qua */
    }
  }
  return moi;
}

const fmt = (d) => (d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—");
const loi = (e) => e?.message || "Có lỗi, thử lại";

function useCo() {
  const [co, setCo] = useState(null);
  useEffect(() => {
    const doc = () => setCo(docCo());
    doc();
    window.addEventListener(EV, doc);
    return () => window.removeEventListener(EV, doc);
  }, []);
  return co;
}

// ---------- Chưa đăng nhập ----------
function VaoTaiKhoan({ onVao }) {
  const [moi, setMoi] = useState(false);
  const [f, setF] = useState({ ten: "", mk: "", mk2: "", tenHien: "", email: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const gui = async (e) => {
    e.preventDefault();
    setErr("");
    if (moi && f.mk !== f.mk2) return setErr("Hai lần mật khẩu chưa giống nhau");
    setBusy(true);
    try {
      const r = await tk(moi ? "dang-ky" : "dang-nhap", moi ? { ten: f.ten, mk: f.mk, tenHien: f.tenHien, email: f.email } : { ten: f.ten, mk: f.mk });
      ghiCo({ ten: r.u.ten, tenHien: r.u.tenHien });
      const n = await dongBoNgay().catch(() => 0);
      onVao(r.u, n);
    } catch (x) {
      setErr(loi(x) + (x.data?.conLai != null && x.data.conLai < 3 ? ` (còn ${x.data.conLai} lần thử)` : ""));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tk-wrap">
      <div className="nh-card tk-loi-ich">
        <h2>Tài khoản là tuỳ chọn</h2>
        <p>Không đăng nhập vẫn học bình thường — tiến độ lưu trên máy này. Có tài khoản thì:</p>
        <ul>
          <li>📱 Đổi máy / dùng nhiều máy: đăng nhập là có lại tiến độ, chuỗi bài đang học.</li>
          <li>👥 Các nhóm học tự nhớ (khỏi gõ lại PIN); người hướng dẫn có bảng gom mọi lớp.</li>
          <li>🔒 Mất máy: đăng xuất từ xa ở mục “Thiết bị”.</li>
        </ul>
      </div>
      <form className="nh-card tk-form" onSubmit={gui}>
        <div className="tk-tab" role="tablist">
          <button type="button" role="tab" aria-selected={!moi} className={!moi ? "is-on" : ""} onClick={() => setMoi(false)}>
            Đăng nhập
          </button>
          <button type="button" role="tab" aria-selected={moi} className={moi ? "is-on" : ""} onClick={() => setMoi(true)}>
            Tạo tài khoản
          </button>
        </div>
        <label className="nh-field">
          <span className="nh-flabel">Tên đăng nhập</span>
          <input value={f.ten} onChange={set("ten")} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="vd. oanh.nguyen" required />
          {moi && <small className="kt-muted">3–30 ký tự: chữ thường không dấu, số, dấu . _ -</small>}
        </label>
        <label className="nh-field">
          <span className="nh-flabel">Mật khẩu</span>
          <input type="password" value={f.mk} onChange={set("mk")} autoComplete={moi ? "new-password" : "current-password"} minLength={6} required />
        </label>
        {moi && (
          <>
            <label className="nh-field">
              <span className="nh-flabel">Gõ lại mật khẩu</span>
              <input type="password" value={f.mk2} onChange={set("mk2")} autoComplete="new-password" minLength={6} required />
            </label>
            <label className="nh-field">
              <span className="nh-flabel">Tên hiển thị (không bắt buộc)</span>
              <input value={f.tenHien} onChange={set("tenHien")} maxLength={40} placeholder="vd. Oanh" />
            </label>
            <label className="nh-field">
              <span className="nh-flabel">Email (không bắt buộc)</span>
              <input type="email" value={f.email} onChange={set("email")} autoComplete="email" placeholder="để lấy lại mật khẩu sau này" />
              <small className="kt-muted">Chưa gửi thư xác thực — tính năng lấy lại mật khẩu qua email sẽ có sau. Nhớ kỹ mật khẩu nhé.</small>
            </label>
          </>
        )}
        {err && <p className="nh-err">{err}</p>}
        <button type="submit" className="kt-btn kt-btn--pri" disabled={busy}>
          {busy ? "Đang xử lý…" : moi ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

// ---------- Nhóm tôi hướng dẫn: gom mọi lớp ----------
function NhomHuongDanCuaToi({ nhoms }) {
  const [ds, setDs] = useState(null);
  useEffect(() => {
    let huy = false;
    Promise.all(
      nhoms.map((x) =>
        fetch(`/api/nhom/${x.ma}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
          .then((v) => ({ x, v }))
      )
    ).then((l) => {
      if (huy) return;
      const out = [];
      for (const { x, v } of l) {
        if (!v?.nhom) continue;
        const g = v.nhom;
        const toiId = x.id || getMyId(x.ma);
        const laHd = !!loadK(x.ma) || (toiId && g.nguoiTaoId === toiId) || v.members?.some((m) => m.id === toiId && m.trangThai === "huong-dan");
        if (!laHd) continue;
        const ch = g.changHienTai || 0;
        const u = g.chuoi?.bai?.[ch];
        const cur = u ? baiKey(u) : null;
        const hoc = (v.members || []).filter((m) => m.trangThai === "hoc");
        const cham = cur ? hoc.filter((m) => !(m.tom?.[cur]?.g || []).every(Boolean)) : [];
        let choSua = 0;
        for (const m of v.members || []) for (const n of Object.values(m.noi || {})) if (n?.baoGui && !n.xanh) choSua++;
        out.push({ ma: x.ma, ten: g.ten, ch, tong: g.chuoi?.bai?.length || 0, veDich: !!g.veDichLuc, soHoc: hoc.length, cham, choSua });
      }
      setDs(out);
    });
    return () => {
      huy = true;
    };
  }, [nhoms]);
  if (!ds) return <p className="kt-muted">Đang tải các lớp…</p>;
  if (!ds.length) return <p className="kt-muted">Chưa có lớp nào bạn hướng dẫn trên tài khoản này. Lập nhóm ở trang một chủ đề → “Mở nhóm học”.</p>;
  return (
    <div className="tk-lop">
      {ds.map((l) => (
        <article key={l.ma} className={`tk-lop-o ${l.choSua ? "is-can" : ""}`}>
          <header>
            <b>{l.ten}</b> <span className="nh-code">{l.ma}</span>
          </header>
          <p>
            {l.veDich ? "🏆 Đã về đích cả chuỗi" : `Đang ở bài ${l.ch + 1}/${l.tong}`} · {l.soHoc} người học
          </p>
          <p>
            🎤 <b>{l.choSua}</b> bài nói chờ sửa · {!l.soHoc ? "👋 chưa có người học nào vào — gửi link nhóm qua Zalo" : l.cham.length ? <>🐢 chưa xong bài này: {l.cham.map((m) => m.ten).join(", ")}</> : "✅ cả nhóm đã xong bài đang mở"}
          </p>
          <div className="nh-row">
            <Link className="kt-btn kt-btn--pri" to={`/nhom/${l.ma}/huong-dan`}>
              Mở trang hướng dẫn
            </Link>
            <Link className="kt-btn" to={`/nhom/${l.ma}`}>
              Xem cây nhóm
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

// ---------- Đã đăng nhập ----------
function QuanLi({ u, setU, onRa, thongBao, nhomTk0 }) {
  const [nhomTk, setNhomTk] = useState(nhomTk0 || []);
  const [gan, setGan] = useState({ ma: "", id: "", pin: "" });
  const [msg, setMsg] = useState(thongBao || "");
  const [err, setErr] = useState("");
  const [tenHien, setTenHien] = useState(u.tenHien);
  const [email, setEmail] = useState(u.email);
  const [mk, setMk] = useState({ cu: "", moi: "", moi2: "" });
  const [tb, setTb] = useState(null);
  const [xoa, setXoa] = useState("");
  const [xoaMayNay, setXoaMayNay] = useState(false);
  const [nhoms, setNhoms] = useState([]);
  const co = useCo();

  const taiTb = useCallback(() => tk("thiet-bi").then((r) => setTb(r.ds)).catch(() => {}), []);
  useEffect(() => {
    taiTb();
    setNhoms(myGroups());
    const doc = () => setNhoms(myGroups());
    window.addEventListener("dp-dong-bo", doc);
    return () => window.removeEventListener("dp-dong-bo", doc);
  }, [taiTb]);

  const lam = async (fn, ok) => {
    setErr("");
    setMsg("");
    try {
      await fn();
      if (ok) setMsg(ok);
    } catch (x) {
      setErr(loi(x));
    }
  };
  const luuTt = () =>
    lam(async () => {
      const r = await tk("sua", { tenHien, email });
      setU(r.u);
      ghiCo({ tenHien: r.u.tenHien });
    }, "Đã lưu thông tin");
  const doiMk = (e) => {
    e.preventDefault();
    if (mk.moi !== mk.moi2) return setErr("Hai lần mật khẩu mới chưa giống nhau");
    lam(async () => {
      await tk("sua", { mkCu: mk.cu, mkMoi: mk.moi });
      setMk({ cu: "", moi: "", moi2: "" });
      taiTb();
    }, "Đã đổi mật khẩu — các máy khác đã được đăng xuất");
  };
  const dongBo = () => lam(async () => setMsg(`Đã đồng bộ (${await dongBoNgay()} mục cập nhật trên máy này)`));
  const ra = () =>
    lam(async () => {
      await dongBoNgay().catch(() => {});
      await tk("dang-xuat", {});
      if (xoaMayNay) xoaMay();
      ghiCo(null);
      onRa();
    });
  const xoaTk = (e) => {
    e.preventDefault();
    if (!window.confirm("Xoá hẳn tài khoản và dữ liệu đồng bộ trên máy chủ? Không khôi phục được.")) return;
    lam(async () => {
      await tk("xoa", { mk: xoa });
      ghiCo(null);
      onRa();
    });
  };

  const hocVien = nhoms.filter((x) => !loadK(x.ma));
  return (
    <div className="tk-wrap">
      <div className="nh-card tk-dau">
        <h2>
          👋 {u.tenHien} <small className="kt-muted">@{u.ten}</small>
        </h2>
        <p className="kt-muted">
          Tạo ngày {fmt(u.taoLuc)} · Đồng bộ lần cuối trên máy này: {fmt(co?.dongBoLuc)}{" "}
          <button type="button" className="kt-linkbtn" onClick={dongBo}>
            Đồng bộ ngay
          </button>
        </p>
        {msg && <p className="nh-ok">{msg}</p>}
        {err && <p className="nh-err">{err}</p>}
      </div>

      <section className="nh-card">
        <h2>🎧 Nhóm tôi hướng dẫn</h2>
        <p className="kt-muted">Gom mọi lớp ở một chỗ: bài đang mở, bài nói chờ sửa, ai chưa xong. Ở các lớp có bật “Chỉ hướng dẫn”, bạn không bắt buộc làm bài.</p>
        <NhomHuongDanCuaToi nhoms={nhoms} />
      </section>

      <section className="nh-card">
        <h2>📚 Nhóm đang học + tiến độ</h2>
        {hocVien.length ? (
          <ul className="tk-ds">
            {hocVien.map((x) => {
              const id = x.id || getMyId(x.ma);
              const da = nhomTk.find((y) => y.ma === x.ma && y.id === id);
              return (
                <li key={x.ma}>
                  <span>
                    <Link to={`/nhom/${x.ma}${id ? `/${id}` : ""}`}>{x.ten || x.ma}</Link> <span className="nh-code">{x.ma}</span>
                    {id && <small className="kt-muted"> · ID {id}</small>}
                    <br />
                    <small className={da ? "tk-gan" : "kt-muted"}>{da ? "🔗 đã gắn tài khoản — máy nào đăng nhập cũng vào được, khỏi PIN" : "chưa gắn tài khoản (vào bằng PIN)"}</small>
                  </span>
                  {da && (
                    <button type="button" className="nh-mini" onClick={() => lam(async () => setNhomTk((await tk("bo-gan", { ma: x.ma, id })).nhom), "Đã bỏ gắn — ID vẫn vào được bằng PIN")}>
                      Bỏ gắn
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="kt-muted">Chưa vào nhóm học nào.</p>
        )}
        <details className="tk-ganTay">
          <summary>🔗 Gắn ID nhóm cũ vào tài khoản (mã nhóm + ID + PIN)</summary>
          <form
            className="nh-row"
            onSubmit={(e) => {
              e.preventDefault();
              lam(async () => {
                const r = await tk("gan-nhom", { ma: gan.ma.trim().toUpperCase(), id: gan.id.trim().toLowerCase(), pin: gan.pin });
                setNhomTk(r.nhom);
                apNhom(r.nhom);
                setNhoms(myGroups());
                setGan({ ma: "", id: "", pin: "" });
              }, "Đã gắn — nhóm có trong tài khoản, máy nào đăng nhập cũng vào được");
            }}
          >
            <input value={gan.ma} onChange={(e) => setGan({ ...gan, ma: e.target.value })} placeholder="Mã nhóm (6 ký tự)" maxLength={6} required />
            <input value={gan.id} onChange={(e) => setGan({ ...gan, id: e.target.value })} placeholder="ID của bạn trong nhóm" required />
            <input type="password" inputMode="numeric" value={gan.pin} onChange={(e) => setGan({ ...gan, pin: e.target.value.replace(/\D/g, "") })} placeholder="PIN" maxLength={6} required />
            <button type="submit" className="kt-btn">Gắn</button>
          </form>
        </details>
        <p>
          <Link className="kt-btn" to="/me">
            Xem tiến độ tự học (Của tôi)
          </Link>
        </p>
      </section>

      <section className="nh-card">
        <h2>✏️ Thông tin</h2>
        <label className="nh-field">
          <span className="nh-flabel">Tên hiển thị</span>
          <input value={tenHien} onChange={(e) => setTenHien(e.target.value)} maxLength={40} />
        </label>
        <label className="nh-field">
          <span className="nh-flabel">
            Email (tuỳ chọn) {u.email && <small className="tk-chua">chưa xác thực</small>}
          </span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="để lấy lại mật khẩu sau này" />
          <small className="kt-muted">Xác thực email và lấy lại mật khẩu qua email sẽ có sau.</small>
        </label>
        <button type="button" className="kt-btn kt-btn--pri" onClick={luuTt}>
          Lưu thông tin
        </button>
      </section>

      <form className="nh-card" onSubmit={doiMk}>
        <h2>🔑 Đổi mật khẩu</h2>
        <input type="text" name="username" value={u.ten} autoComplete="username" readOnly hidden />
        <label className="nh-field">
          <span className="nh-flabel">Mật khẩu hiện tại</span>
          <input type="password" value={mk.cu} onChange={(e) => setMk({ ...mk, cu: e.target.value })} autoComplete="current-password" required />
        </label>
        <label className="nh-field">
          <span className="nh-flabel">Mật khẩu mới (ít nhất 6 ký tự)</span>
          <input type="password" value={mk.moi} onChange={(e) => setMk({ ...mk, moi: e.target.value })} autoComplete="new-password" minLength={6} required />
        </label>
        <label className="nh-field">
          <span className="nh-flabel">Gõ lại mật khẩu mới</span>
          <input type="password" value={mk.moi2} onChange={(e) => setMk({ ...mk, moi2: e.target.value })} autoComplete="new-password" minLength={6} required />
        </label>
        <button type="submit" className="kt-btn">
          Đổi mật khẩu
        </button>
      </form>

      <section className="nh-card">
        <h2>💻 Thiết bị đang đăng nhập</h2>
        {tb ? (
          <ul className="tk-ds">
            {tb.map((x) => (
              <li key={x.id}>
                <span>
                  <b>{x.thietBi}</b> {x.mayNay && <em>(máy này)</em>}
                  <br />
                  <small className="kt-muted">
                    Đăng nhập {fmt(x.taoLuc)} · dùng gần nhất {fmt(x.dungLuc)}
                  </small>
                </span>
                {!x.mayNay && (
                  <button type="button" className="nh-mini" onClick={() => lam(async () => setTb((await tk("thiet-bi", { id: x.id })).ds), "Đã đăng xuất máy đó")}>
                    Đăng xuất máy này
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="kt-muted">Đang tải…</p>
        )}
        {tb?.length > 1 && (
          <button type="button" className="kt-btn" onClick={() => lam(async () => setTb((await tk("thiet-bi", { id: "khac" })).ds), "Đã đăng xuất mọi máy khác")}>
            Đăng xuất mọi máy khác
          </button>
        )}
      </section>

      <section className="nh-card">
        <h2>🚪 Đăng xuất</h2>
        <label className="nh-check">
          <input type="checkbox" checked={xoaMayNay} onChange={(e) => setXoaMayNay(e.target.checked)} />
          <span>Xoá tiến độ + nhóm trên máy này (máy dùng chung). Dữ liệu vẫn còn trong tài khoản.</span>
        </label>
        <button type="button" className="kt-btn" onClick={ra}>
          Đăng xuất
        </button>
      </section>

      <section className="nh-card tk-nguy">
        <h2>📦 Dữ liệu của tôi</h2>
        <p>
          <a className="kt-btn" href="/api/tai-khoan/tai-du-lieu" download>
            Tải toàn bộ dữ liệu (JSON)
          </a>
        </p>
        <form onSubmit={xoaTk}>
          <p className="kt-muted">Xoá tài khoản: xoá thông tin đăng nhập và dữ liệu đồng bộ trên máy chủ. Bài làm trong các nhóm thuộc về nhóm, không xoá ở đây.</p>
          <input type="text" name="username" value={u.ten} autoComplete="username" readOnly hidden />
          <div className="nh-row">
            <input type="password" value={xoa} onChange={(e) => setXoa(e.target.value)} placeholder="Gõ mật khẩu để xoá" autoComplete="current-password" required />
            <button type="submit" className="kt-btn is-danger">
              Xoá tài khoản
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function TrangTaiKhoan() {
  const [u, setU] = useState(undefined); // undefined = đang kiểm
  const [tb, setTb] = useState("");
  const [nhomTk, setNhomTk] = useState([]);
  const nap = async (r) => {
    // #370 có lại các nhóm đã gắn + gắn lặng lẽ nhóm cũ trên máy (học viên đang có tự đồng bộ)
    apNhom(r.nhom);
    const ds = await ganTuMay(r.nhom || []);
    apNhom(ds);
    setNhomTk(ds);
  };
  useEffect(() => {
    tk()
      .then(async (r) => {
        if (r.u) {
          ghiCo({ ten: r.u.ten, tenHien: r.u.tenHien });
          await nap(r);
        } else if (docCo()) ghiCo(null);
        setU(r.u);
      })
      .catch(() => setU(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <KtShell active="me">
      <h1 className="kt-h1">Tài khoản</h1>
      {u === undefined ? (
        <p className="kt-muted">Đang kiểm…</p>
      ) : u ? (
        <QuanLi key={nhomTk.length} u={u} setU={setU} thongBao={tb} nhomTk0={nhomTk} onRa={() => setU(null)} />
      ) : (
        <VaoTaiKhoan
          onVao={async (x, n) => {
            setTb(n ? `Đã đồng bộ — ${n} mục tiến độ/nhóm cập nhật trên máy này.` : "Đã đăng nhập — tiến độ trên máy này sẽ tự đồng bộ.");
            await nap(await tk()).catch(() => {});
            setU(x);
          }}
        />
      )}
    </KtShell>
  );
}
