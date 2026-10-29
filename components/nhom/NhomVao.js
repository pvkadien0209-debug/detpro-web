"use client";
// #230 Học cùng — /nhom/<mã>: "Bạn là ai?" chọn ID (gõ PIN nếu có) hoặc tạo ID mới (thiết kế mục 3).
// + PinGate: cổng PIN cho trang cây và trang bài trong nhóm (PIN giữ trong bộ nhớ tab).
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Lock, UserPlus, Users, KeyRound } from "lucide-react";
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
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("moi")) setMoi(true);
    setAi((q.get("ai") || "").toLowerCase());
  }, []);
  // #253: máy này đã vào nhóm → vào thẳng cây của mình
  useEffect(() => {
    const toi = getMyId(ma);
    if (data && toi && !new URLSearchParams(window.location.search).get("doi") && data.members.some((m) => m.id === toi)) navigate(nhomPath(ma, toi));
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
    if (!dongY) return setMsg("Tick ô “Tôi đồng ý…” ở trên rồi bấm lại.");
    setBusy(true);
    setMsg("");
    try {
      await api(`${ma}/vao`, { body: { moi: true, id, ten, pin } });
      setPin(ma, id, pin);
      go(id);
    } catch (x) {
      setMsg(errText(x));
      if (x instanceof ApiErr && x.status === 409) {
        setSuaId(true);
        reload();
      }
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

        <h2 className="nh-h2">1. Bạn là ai? Bấm vào tên của bạn</h2>
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
          <form className="nh-card nh-door-new" onSubmit={create}>
            <h2>2. Tạo tên của bạn</h2>
            <label className="nh-field">
              <span className="nh-flabel">Tên hiển thị trong nhóm</span>
              <input
                value={ten}
                maxLength={40}
                autoFocus
                placeholder="Ví dụ: Lan"
                onChange={(e) => {
                  setTen(e.target.value);
                  if (!idTouched) setId(idFromName(e.target.value));
                }}
              />
            </label>
            {suaId ? (
              <label className="nh-field">
                <span className="nh-flabel">ID (chữ thường không dấu, số, dấu gạch)</span>
                <input
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
                  ID: <b>{id}</b>{" "}
                  <button type="button" className="kt-linkbtn" onClick={() => setSuaId(true)}>
                    đổi
                  </button>
                </p>
              )
            )}
            <label className="nh-field">
              <span className="nh-flabel">Đặt PIN 4 số (nhớ PIN để vào lại trên máy khác)</span>
              <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </label>
            <label className="nh-consent">
              <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
              <span>Tôi đồng ý nhóm lưu tên, tiến độ, lời nhắn và tin Hỏi đáp của tôi (tự xoá 30 ngày sau khi nhóm về đích; rời nhóm là xoá ngay).</span>
            </label>
            {msg && <p className="hkt-u-err">{msg}</p>}
            <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || !idOk || !ten.trim() || pin.length !== 4}>
              Vào nhóm
            </button>
          </form>
        )}
        {!moi && msg && <p className="hkt-u-err">{msg}</p>}
        <p className="kt-muted nh-note">Đổi máy: mở lại link nhóm, bấm tên của bạn và gõ PIN — tiến độ nằm trên máy chủ.</p>
      </div>
    </KtShell>
  );
}
