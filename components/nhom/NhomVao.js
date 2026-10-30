"use client";
// #230 Học cùng — /nhom/<mã>: "Bạn là ai?" chọn ID (gõ PIN nếu có) hoặc tạo ID mới (thiết kế mục 3).
// + PinGate: cổng PIN cho trang cây và trang bài trong nhóm (PIN giữ trong bộ nhớ tab).
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Lock, UserPlus, Users, KeyRound, Eye, EyeOff } from "lucide-react";
import { useBaoTroThu } from "@/components/hkt/troThuCtx"; // #319
import KtShell, { useBodyClass } from "@/components/hkt/KtShell";
import { VongDetLoading } from "@/components/hkt/VongDet";
import { api, setPin, getPin, ApiErr, getMyId, setMyId, rememberGroup } from "./nhomClient";
import { useNhomView, errText } from "./NhomShared";
import { idFromName, isId, nhomPath } from "@/components/hkt/nhomRules";

function PinForm({ ma, id, ten, onOk, onCancel, msg, inline }) {
  const [pin, setP] = useState("");
  const [err, setErr] = useState(msg || "");
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setPin(ma, id, pin);
    try {
      await api(`${ma}/vao`, { id, body: { id } });
      setMyId(ma, id); // #253: nhớ "tôi là ai" trên máy này
      onOk();
    } catch (x) {
      setPin(ma, id, "");
      const left = x.data?.conLai;
      setErr(`${errText(x)}${left !== undefined && x.status === 401 ? ` — còn ${left} lần thử` : ""}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className={`nh-card nh-pin ${inline ? "is-inline" : ""}`} onSubmit={go}>
      <h2>
        <Lock size={18} aria-hidden="true" /> {inline ? "Gõ PIN của bạn" : `${ten || id} — gõ PIN`}
      </h2>
      {/* #267: PIN luôn hiện •••• (trưởng nhóm hay chia sẻ màn hình) */}
      <input type="password" inputMode="numeric" autoComplete="off" pattern="\d{4}" maxLength={4} autoFocus value={pin} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} aria-label="PIN 4 số" placeholder="••••" />
      {err && <p className="hkt-u-err">{err}</p>}
      <div className="nh-row">
        {onCancel && (
          <button type="button" className="kt-btn" onClick={onCancel}>
            {inline ? "Không phải tôi" : "Chọn tên khác"}
          </button>
        )}
        <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || pin.length !== 4}>
          Vào
        </button>
      </div>
      <p className="kt-muted">Quên PIN? Nhắn trưởng nhóm đặt lại (tab Học viên).</p>
    </form>
  );
}

/** Cổng vào trang của một học viên: kiểm ID (+PIN) bằng GET tiến độ; render children(tienDo, reloadProg). */
export function PinGate({ ma, id, children }) {
  const [state, setState] = useState({ s: "load" });
  const navigate = useNavigate();
  const check = async () => {
    try {
      const d = await api(`${ma}/tien-do`, { id });
      setState({ s: "ok", prog: d.prog, ten: d.ten });
    } catch (e) {
      // #267: thiếu / sai PIN, hoặc ID không có → về CỬA NHÓM (một màn duy nhất), chọn sẵn tên này
      if (e.status === 401 || e.status === 423 || e.status === 404 || e.status === 400) navigate(`${nhomPath(ma)}?doi=1&ai=${encodeURIComponent(id)}`, { replace: true });
      else setState({ s: "err", e });
    }
  };
  useEffect(() => {
    check();
  }, [ma, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.s === "ok") setMyId(ma, id); // #253
  }, [state.s]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state.s === "load")
    return (
      <div className="nh-center">
        <VongDetLoading />
      </div>
    );
  if (state.s === "pin")
    return (
      <div className="nh-center">
        <PinForm ma={ma} id={id} ten={state.ten} msg={state.msg} onOk={check} onCancel={() => navigate(`${nhomPath(ma)}?doi=1`)} />
      </div>
    );
  if (state.s === "err")
    return (
      <div className="nh-center nh-card">
        <h1 className="kt-h1">Không vào được</h1>
        <p>{errText(state.e)}</p>
        <Link className="kt-btn" to={nhomPath(ma)}>
          Về cửa nhóm
        </Link>
      </div>
    );
  return children(state.prog, state.ten, check);
}

export default function NhomVao({ ma }) {
  useBodyClass("nh-in"); // #253
  const { data, err, reload } = useNhomView(ma, { every: 0 });
  const navigate = useNavigate();
  const [pick, setPick] = useState(null); // tên đang chọn → hiện ô PIN ngay dưới tên (#267: một màn duy nhất)
  const [ai, setAi] = useState(""); // ?ai=<id>: link riêng của một người (vd. ai đó gửi nhầm link /nhom/<mã>/<tên>)
  const [moi, setMoi] = useState(false);
  const [ten, setTen] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [suaId, setSuaId] = useState(false);
  const [pin, setP] = useState("");
  const [dongY, setDongY] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hienPin, setHienPin] = useState(false); // #319 xem lại PIN vừa gõ
  const [nhay, setNhay] = useState(""); // #319 ô đang cần điền (viền nhấp nháy)
  const tenRef = useRef(null);
  const pinRef = useRef(null);
  const dongYRef = useRef(null);
  const formRef = useRef(null);
  // #319 bước đang làm khi tạo tên mới: 1 tên · 2 PIN · 3 đồng ý · 4 bấm Vào nhóm
  const buoc = !ten.trim() ? 1 : pin.length !== 4 ? 2 : !dongY ? 3 : 4;
  useBaoTroThu(() => ({ loai: "cua", moi, buoc }), [moi, buoc]);
  useEffect(() => setMsg((m) => (m.startsWith("Còn thiếu") ? "" : m)), [buoc]); // điền xong chỗ thiếu → tắt nhắc
  useEffect(() => {
    if (moi) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [moi]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("moi")) setMoi(true);
    setAi((q.get("ai") || "").toLowerCase());
  }, []);
  // #253: máy này đã vào nhóm → vào thẳng cây của mình
  useEffect(() => {
    const toi = getMyId(ma);
    if (data && toi && !new URLSearchParams(window.location.search).get("doi") && data.members.some((m) => m.id === toi)) navigate(nhomPath(ma, toi));
    // #319 nhóm mới chỉ có trưởng nhóm → người mở link gần như chắc là người mới: mở sẵn khung tạo tên
    if (data && !ai && !toi && !data.nhom.khoaNguoiMoi && data.members.length <= 1) setMoi(true);
    if (data && ai && !pick) {
      const m = data.members.find((x) => x.id === ai);
      if (m) setPick(m);
    }
  }, [data, ai]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err)
    return (
      <KtShell>
        <div className="nh-wrap">
          <h1 className="kt-h1">Không mở được nhóm {ma}</h1>
          <p>{errText(err)}</p>
          <p>Kiểm tra lại link trưởng nhóm gửi.</p>
        </div>
      </KtShell>
    );
  if (!data)
    return (
      <KtShell>
        <div className="nh-center">
          <VongDetLoading />
        </div>
      </KtShell>
    );
  const g = data.nhom;
  const go = (mid) => {
    setMyId(ma, mid);
    rememberGroup(ma, g.ten, mid);
    navigate(nhomPath(ma, mid));
  };
  const enter = async (m) => {
    setMsg("");
    setMoi(false);
    if (m.coPin && !getPin(ma, m.id)) return setPick(m);
    try {
      await api(`${ma}/vao`, { id: m.id, body: { id: m.id } });
      go(m.id);
    } catch (e) {
      if (e.status === 401) setPick(m);
      else setMsg(errText(e));
    }
  };
  const create = async (e) => {
    e.preventDefault();
    // #319 thiếu gì nói rõ + đưa con trỏ tới đúng ô
    const thieu = !ten.trim() ? ["tên", tenRef, "ten"] : !idOk ? ["ID hợp lệ", null, "id"] : pin.length !== 4 ? ["PIN đủ 4 số", pinRef, "pin"] : !dongY ? ["tick ô đồng ý", dongYRef, "dongy"] : null;
    if (thieu) {
      setMsg(`Còn thiếu: ${thieu[0]}. Làm theo dòng 👉 rồi bấm “Vào nhóm” lại nhé.`);
      setNhay(thieu[2]);
      thieu[1]?.current?.focus();
      thieu[1]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setNhay(""), 2400);
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await api(`${ma}/vao`, { body: { moi: true, id, ten, pin } });
      setPin(ma, id, pin);
      go(id);
    } catch (x) {
      if (x instanceof ApiErr && x.status === 409) {
        setMsg(`Tên đăng nhập “${id}” đã có người dùng. Sửa ô ID bên dưới — thêm số hoặc chữ đầu họ, ví dụ ${id}2 hoặc ${id}-${(ten.trim().split(/\s+/)[0] || "x").charAt(0).toLowerCase()}.`);
        setSuaId(true);
        setNhay("id");
        setTimeout(() => setNhay(""), 2400);
        reload();
      } else setMsg(errText(x));
    } finally {
      setBusy(false);
    }
  };
  const idOk = isId(id);
  const aiM = ai && data.members.find((x) => x.id === ai);

  return (
    <KtShell>
      <div className="nh-wrap nh-door">
        <p className="kt-kicker">
          <Users size={16} aria-hidden="true" /> Nhóm học {ma}
        </p>
        <h1 className="kt-h1">{g.ten}</h1>
        <p className="kt-lead">
          Chuỗi “{g.chuoi.title}” · {g.chuoi.bai.length} bài · trưởng nhóm: {g.tenHuongDan}
        </p>
        {aiM && (
          <p className="nh-door-note">
            Link này là trang của <b>{aiM.ten}</b>. Nếu bạn là {aiM.ten}, gõ PIN bên dưới. Nếu không phải — chọn tên của bạn, hoặc bấm <b>“Tôi là người mới”</b>.
          </p>
        )}

        {!moi && !pick && !g.khoaNguoiMoi && (
          <button type="button" className="nh-door-chao" onClick={() => { setPick(null); setMoi(true); }}>
            <span aria-hidden="true">👋</span>
            <span>
              <b>Lần đầu vào nhóm này?</b> Bấm vào đây — mình chỉ từng bước (khoảng 1 phút): gõ tên → đặt PIN 4 số → vào học.
            </span>
          </button>
        )}
        <h2 className="nh-h2">1. Bạn là ai? Bấm vào tên của bạn (đã vào nhóm trước đây)</h2>
        <div className="nh-ids">
          {data.members.map((m) => (
            <React.Fragment key={m.id}>
              <button type="button" className={`nh-idbtn ${pick?.id === m.id ? "is-on" : ""}`} onClick={() => enter(m)}>
                <span className="nh-av" aria-hidden="true">
                  {m.ten.trim().charAt(0).toUpperCase()}
                </span>
                <span>
                  <b>
                    {m.ten}
                    {g.nguoiTaoId === m.id && " · trưởng nhóm"}
                  </b>
                  <small>
                    {m.id}
                    {m.coPin && (
                      <>
                        {" "}
                        · <KeyRound size={12} aria-label="có PIN" />
                      </>
                    )}
                    {m.trangThai === "tam-nghi" && " · tạm nghỉ"}
                  </small>
                </span>
              </button>
              {pick?.id === m.id && (
                <div className="nh-door-pin">
                  <PinForm ma={ma} id={m.id} ten={m.ten} inline onOk={() => go(m.id)} onCancel={() => setPick(null)} />
                </div>
              )}
            </React.Fragment>
          ))}
          {!g.khoaNguoiMoi && (
            <button type="button" className={`nh-idbtn is-new ${moi ? "is-on" : ""}`} onClick={() => { setPick(null); setMoi(true); }}>
              <span className="nh-av" aria-hidden="true">
                <UserPlus size={18} />
              </span>
              <span>
                <b>Tôi là người mới</b>
                <small>chưa có tên trong danh sách</small>
              </span>
            </button>
          )}
        </div>
        {g.khoaNguoiMoi && <p className="kt-muted">Nhóm đã khoá nhận người mới.</p>}

        {moi && (
          <form className="nh-card nh-door-new" onSubmit={create} ref={formRef} noValidate>
            <h2>2. Tạo tên của bạn — 4 bước</h2>
            {/* #319 hướng dẫn cầm tay chỉ việc: bước đang làm sáng lên, xong có dấu ✓ */}
            <ol className="nh-buoc" aria-label="Các bước">
              {["Gõ tên", "Đặt PIN 4 số", "Tick đồng ý", "Bấm Vào nhóm"].map((t, k) => (
                <li key={t} className={k + 1 < buoc ? "is-xong" : k + 1 === buoc ? "is-nay" : ""}>
                  <i>{k + 1 < buoc ? "✓" : k + 1}</i> {t}
                </li>
              ))}
            </ol>

            <div className={`nh-bstep ${buoc === 1 ? "is-nay" : ""}`}>
              {buoc === 1 && <p className="nh-chi">👉 <b>Bước 1:</b> gõ tên bạn muốn cả nhóm thấy (tên thật hoặc tên thường gọi), ví dụ “Oanh”.</p>}
              <label className="nh-field">
                <span className="nh-flabel">Tên hiển thị trong nhóm</span>
                <input
                  ref={tenRef}
                  className={nhay === "ten" ? "is-nhay" : ""}
                  value={ten}
                  maxLength={40}
                  autoFocus
                  placeholder="Ví dụ: Oanh"
                  onChange={(e) => {
                    setTen(e.target.value);
                    if (!idTouched) setId(idFromName(e.target.value));
                  }}
                />
              </label>
              {suaId ? (
                <label className="nh-field">
                  <span className="nh-flabel">ID — tên đăng nhập (chữ thường không dấu, số, dấu gạch)</span>
                  <input
                    className={nhay === "id" ? "is-nhay" : ""}
                    value={id}
                    maxLength={20}
                    onChange={(e) => {
                      setIdTouched(true);
                      setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                  />
                </label>
              ) : (
                id && (
                  <p className="kt-muted nh-idline">
                    Tên đăng nhập (máy tự tạo, không cần sửa): <b>{id}</b>{" "}
                    <button type="button" className="kt-linkbtn" onClick={() => setSuaId(true)}>
                      đổi
                    </button>
                  </p>
                )
              )}
            </div>

            <div className={`nh-bstep ${buoc === 2 ? "is-nay" : ""}`}>
              {buoc === 2 && <p className="nh-chi">👉 <b>Bước 2:</b> đặt 4 số bất kỳ làm PIN — như mật khẩu ngắn, để vào lại nhóm trên máy khác. <b>Chụp màn hình hoặc ghi lại.</b></p>}
              <label className="nh-field">
                <span className="nh-flabel">PIN 4 số</span>
                <span className="nh-pinrow">
                  <input
                    ref={pinRef}
                    className={nhay === "pin" ? "is-nhay" : ""}
                    type={hienPin ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setP(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                  />
                  <button type="button" className="nh-mat" onClick={() => setHienPin((v) => !v)} aria-label={hienPin ? "Ẩn PIN" : "Xem PIN vừa gõ"} title={hienPin ? "Ẩn PIN" : "Xem PIN vừa gõ"}>
                    {hienPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <small className="nh-pindem">{pin.length}/4 số</small>
                </span>
              </label>
              {pin.length === 4 && /^(\d)\1{3}$|^1234$|^0123$|^4321$/.test(pin) && <p className="kt-muted nh-pinyeu">PIN này dễ đoán — đổi 4 số khác cho an toàn hơn (vẫn dùng được nếu bạn muốn).</p>}
            </div>

            <div className={`nh-bstep ${buoc === 3 ? "is-nay" : ""}`}>
              {buoc === 3 && <p className="nh-chi">👉 <b>Bước 3:</b> tick vào ô vuông bên dưới để đồng ý.</p>}
              <label className={`nh-consent ${nhay === "dongy" ? "is-nhay" : ""}`}>
                <input ref={dongYRef} type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
                <span>Tôi đồng ý nhóm lưu tên, tiến độ, lời nhắn và tin Hỏi đáp của tôi (tự xoá 30 ngày sau khi nhóm về đích; rời nhóm là xoá ngay).</span>
              </label>
            </div>

            {buoc === 4 && <p className="nh-chi">👉 <b>Bước 4:</b> bấm “Vào nhóm”. Lần sau trên máy này tự vào; máy khác thì bấm tên <b>{ten.trim()}</b> + gõ PIN.</p>}
            {msg && <p className="hkt-u-err">{msg}</p>}
            <button type="submit" className={`kt-btn kt-btn--pri nh-vaonhom ${buoc === 4 ? "is-nay" : ""}`} disabled={busy}>
              {busy ? "Đang vào…" : "Vào nhóm"}
            </button>
          </form>
        )}
        {!moi && msg && <p className="hkt-u-err">{msg}</p>}
        <p className="kt-muted nh-note">Đổi máy: mở lại link nhóm, bấm tên của bạn và gõ PIN — tiến độ nằm trên máy chủ.</p>
      </div>
    </KtShell>
  );
}
