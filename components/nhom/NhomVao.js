"use client";
// #230 Học cùng — /nhom/<mã>: "Bạn là ai?" chọn ID (gõ PIN nếu có) hoặc tạo ID mới (thiết kế mục 3).
// + PinGate: cổng PIN cho trang cây và trang bài trong nhóm (PIN giữ trong bộ nhớ tab).
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Lock, UserPlus, Users, KeyRound } from "lucide-react";
import KtShell, { useBodyClass } from "@/components/hkt/KtShell";
import { VongDetLoading } from "@/components/hkt/VongDet";
import { api, setPin, getPin, ApiErr, getMyId, setMyId } from "./nhomClient";
import { useNhomView, errText } from "./NhomShared";
import { idFromName, isId, nhomPath } from "@/components/hkt/nhomRules";

function PinForm({ ma, id, ten, onOk, onCancel, msg }) {
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
    <form className="nh-card nh-pin" onSubmit={go}>
      <h2>
        <Lock size={18} aria-hidden="true" /> {ten || id} — gõ PIN
      </h2>
      <input inputMode="numeric" pattern="\d{4}" maxLength={4} autoFocus value={pin} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} aria-label="PIN 4 số" placeholder="••••" />
      {err && <p className="hkt-u-err">{err}</p>}
      <div className="nh-row">
        {onCancel && (
          <button type="button" className="kt-btn" onClick={onCancel}>
            Chọn ID khác
          </button>
        )}
        <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || pin.length !== 4}>
          Vào
        </button>
      </div>
      <p className="kt-muted">Quên PIN? Nhắn người hướng dẫn đặt lại.</p>
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
      if (e.status === 401 || e.status === 423) setState({ s: "pin", msg: e.status === 423 ? e.message : "", ten: id });
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
  const [pick, setPick] = useState(null);
  const [moi, setMoi] = useState(false);
  const [ten, setTen] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [pin, setP] = useState("");
  const [dongY, setDongY] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // #250 (NHA C): từ trang người hướng dẫn "Tham gia mới" → mở sẵn khung tạo ID
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("moi")) setMoi(true);
  }, []);
  // #253: máy này đã vào nhóm → vào thẳng cây của mình (PIN đã lưu trên máy; sai/thiếu thì hỏi lại)
  useEffect(() => {
    const toi = getMyId(ma);
    if (data && toi && !new URLSearchParams(window.location.search).get("doi") && data.members.some((m) => m.id === toi)) navigate(nhomPath(ma, toi));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err)
    return (
      <KtShell>
        <div className="nh-wrap">
          <h1 className="kt-h1">Không mở được nhóm {ma}</h1>
          <p>{errText(err)}</p>
          <p>Kiểm tra lại link người hướng dẫn gửi.</p>
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
  const enter = async (m) => {
    setMsg("");
    if (m.coPin && !getPin(ma, m.id)) return setPick(m);
    try {
      await api(`${ma}/vao`, { id: m.id, body: { id: m.id } });
      setMyId(ma, m.id);
      navigate(nhomPath(ma, m.id));
    } catch (e) {
      if (e.status === 401) setPick(m);
      else setMsg(errText(e));
    }
  };
  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api(`${ma}/vao`, { body: { moi: true, id, ten, pin: pin || undefined } });
      if (pin) setPin(ma, id, pin);
      setMyId(ma, id);
      navigate(nhomPath(ma, id));
    } catch (x) {
      setMsg(errText(x));
      if (x instanceof ApiErr && x.status === 409) reload();
    } finally {
      setBusy(false);
    }
  };
  const idOk = isId(id);
  const needPin = g.batBuocPin;

  return (
    <KtShell>
      <div className="nh-wrap nh-door">
        <p className="kt-kicker">
          <Users size={16} aria-hidden="true" /> Học cùng · nhóm {ma}
        </p>
        <h1 className="kt-h1">{g.ten}</h1>
        <p className="kt-lead">
          Chuỗi “{g.chuoi.title}” · {g.chuoi.bai.length} bài · hướng dẫn: {g.tenHuongDan}
        </p>

        {pick ? (
          <PinForm ma={ma} id={pick.id} ten={pick.ten} onOk={() => navigate(nhomPath(ma, pick.id))} onCancel={() => setPick(null)} />
        ) : (
          <>
            <h2 className="nh-h2">Bạn là ai?</h2>
            <div className="nh-ids">
              {data.members.map((m) => (
                <button key={m.id} type="button" className="nh-idbtn" onClick={() => enter(m)}>
                  <span className="nh-av" aria-hidden="true">
                    {m.ten.trim().charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <b>
                      {m.ten}
                      {g.nguoiTaoId === m.id && " · người lập nhóm"}
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
              ))}
              {!g.khoaNguoiMoi && (
                <button type="button" className={`nh-idbtn is-new ${moi ? "is-on" : ""}`} onClick={() => setMoi(true)}>
                  <span className="nh-av" aria-hidden="true">
                    <UserPlus size={18} />
                  </span>
                  <span>
                    <b>Tôi là người mới</b>
                    <small>tự đặt ID</small>
                  </span>
                </button>
              )}
            </div>
            {g.khoaNguoiMoi && <p className="kt-muted">Nhóm đã khoá nhận người mới.</p>}

            {moi && (
              <form className="nh-card" onSubmit={create}>
                <h2>Tạo ID của bạn</h2>
                <label className="nh-field">
                  <span className="nh-flabel">Tên hiển thị</span>
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
                <label className="nh-field">
                  <span className="nh-flabel">ID (chữ thường không dấu, số, dấu gạch)</span>
                  <input
                    value={id}
                    maxLength={20}
                    placeholder="lan"
                    onChange={(e) => {
                      setIdTouched(true);
                      setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                  />
                </label>
                <label className="nh-field">
                  <span className="nh-flabel">PIN 4 số {needPin ? "(nhóm bắt buộc)" : "(tuỳ chọn — nên đặt nếu sợ người khác vào nhầm ID)"}</span>
                  <input inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
                </label>
                <label className="nh-consent">
                  <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
                  <span>
                    Tôi đồng ý nhóm lưu ID, tiến độ, lời nhắn và tin Hỏi đáp (kể cả tin giọng tôi tự gửi) — tự xoá 30 ngày sau khi nhóm về đích (hoặc 180 ngày không ai học); tôi có thể “Rời nhóm và xoá dữ liệu” bất cứ lúc nào.
                  </span>
                </label>
                {msg && <p className="hkt-u-err">{msg}</p>}
                <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || !idOk || !ten.trim() || !dongY || (needPin && pin.length !== 4) || (pin && pin.length !== 4)}>
                  Vào nhóm
                </button>
              </form>
            )}
            {!moi && msg && <p className="hkt-u-err">{msg}</p>}
            <p className="kt-muted nh-note">Ai có link nhóm đều vào được. Muốn chắc chắn, đặt PIN cho ID của bạn. Đổi máy: mở lại link này và chọn ID của bạn — tiến độ nằm trên máy chủ.</p>
          </>
        )}
      </div>
    </KtShell>
  );
}
