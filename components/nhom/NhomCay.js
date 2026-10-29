"use client";
// #230 Học cùng — /nhom/<mã>/<id>: trang chính của học viên trong nhóm = CÂY CHUỖI (mục 5) + "Xem dạng bảng",
// đồng hồ chặng + chuông nhắc (4a), bài nói tự do (mục 6), ai đang làm gì, Giục bạn, Hỏi đáp (mục 8), cài đặt của tôi.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Users, TreeDeciduous, Table2, UserCog, Share2, ExternalLink, Check, LogOut, KeyRound, X, RefreshCw, Flower2, Settings } from "lucide-react";
import KtShell, { useBodyClass } from "@/components/hkt/KtShell";
import { NoiTab, HvTab, CdTab } from "./NhomHuongDan"; // #253 trưởng nhóm quản lý ngay trong trang nhóm
import { VongDetLoading } from "@/components/hkt/VongDet";
import NhomTree, { leafState } from "./NhomTree";
import { PinGate } from "./NhomVao";
import { StatsCard, NhanCard, nhanMoi, markNhanSeen } from "./NhomExtra";
import PartGuide from "@/components/hkt/PartGuide";
import NhatKyList from "./NhomNhatKy"; // #260
import { PartPopup, QaPopup } from "./NhomPopup"; // #250 (NHA A3, D, E); bỏ "Hướng dẫn riêng" (NHA H)
import { useNhomView, useNow, changInfo, baiLabel, Countdown, NhacBell, CopyBtn, origin, errText, NhomChat, NhanXet } from "./NhomShared";
import { api, setPin, setMyId, rememberGroup } from "./nhomClient";
import { useBaoTroThu } from "@/components/hkt/troThuCtx";
import { PART_KEYS, PART_SHORT, baiKey, baiMo, baiMoCua, nhomPath, nhomUnitPath, unitGreen, dangDo, mocNho, phanDangLam } from "@/components/hkt/nhomRules";

const ago = (d, now) => {
  const s = Math.max(0, (now - new Date(d).getTime()) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.round(s / 60)} phút trước`;
  if (s < 86400) return `${Math.round(s / 3600)} giờ trước`;
  return `${Math.round(s / 86400)} ngày trước`;
};

/** Bảng đèn: hàng = người, cột = 5 phần × bài + bông bài nói. */
export function NhomTable({ nhom, members, onCell, onNoi }) {
  const ch = nhom.changHienTai || 0;
  return (
    <div className="nh-table-wrap">
      <table className="nh-table">
        <thead>
          <tr>
            <th scope="col">Người</th>
            {nhom.chuoi.bai.map((u, k) => (
              <th key={baiKey(u)} scope="col" colSpan={6} className={k === ch ? "is-cur" : ""} title={u.title}>
                {baiLabel(u, k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className={m.trangThai !== "hoc" ? "is-pause" : ""}>
              <th scope="row">
                {m.ten}
                {m.trangThai === "tam-nghi" && <small> · tạm nghỉ</small>}
              </th>
              {nhom.chuoi.bai.map((u, k) => {
                const key = baiKey(u);
                const t = m.tom?.[key];
                const noi = m.noi?.[key];
                return (
                  <React.Fragment key={key}>
                    {PART_KEYS.map((pk, j) => (
                      <td key={pk} className={`nh-cell ${!baiMoCua(k, nhom, m) ? "is-off" : t?.g?.[j] ? "is-on" : ""}`} title={`${baiLabel(u, k)} · ${PART_SHORT[pk]}`} onClick={() => onCell?.(m, u, k, pk)}>
                        {t?.g?.[j] ? "●" : "○"}
                      </td>
                    ))}
                    <td
                      className={`nh-cell is-noi ${noi?.xanh ? "is-on" : noi?.baoGui ? "is-yellow" : ""}`}
                      title={`${baiLabel(u, k)} · Bài nói tự do${noi?.ghiChu ? ` — có nhận xét` : ""}`}
                      onClick={() => onNoi?.(m, u, k)}
                    >
                      ✿
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="kt-muted nh-legend">● xong · ○ chưa · ✿ bài nói tự do (vàng = đã báo gửi, xanh = trưởng nhóm đã nhận)</p>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="nh-sheet" role="dialog" aria-label={title}>
      <div className="nh-sheet-in">
        <header>
          <b>{title}</b>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function MySettings({ ma, me, nhom, onLeft }) {
  const [pin, setP] = useState("");
  const [msg, setMsg] = useState("");
  const savePin = async (v) => {
    setMsg("");
    try {
      await api(`${ma}/vao`, { id: me.id, body: { id: me.id, datPin: v } });
      setPin(ma, me.id, v);
      setP("");
      setMsg(v ? "Đã đặt PIN. Lần sau vào ID này cần gõ PIN." : "Đã bỏ PIN.");
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const leave = async () => {
    if (!window.confirm("Rời nhóm và xoá toàn bộ dữ liệu của bạn trong nhóm (tiến độ, tin nhắn, lời nhắn)? Không lấy lại được.")) return;
    try {
      await api(`${ma}/vao`, { id: me.id, body: { id: me.id, roi: true } });
      onLeft();
    } catch (e) {
      setMsg(errText(e));
    }
  };
  return (
    <div className="nh-my">
      <section className="nh-card">
        <h2>
          <KeyRound size={18} aria-hidden="true" /> PIN cho ID “{me.id}”
        </h2>
        <p className="kt-muted">{me.coPin ? "ID của bạn đang có PIN." : "ID chưa có PIN — ai có link nhóm cũng chọn được ID này."}</p>
        <div className="nh-row">
          <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} placeholder="PIN mới ••••" onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} />
          <button type="button" className="kt-btn kt-btn--pri" disabled={pin.length !== 4} onClick={() => savePin(pin)}>
            Đặt PIN
          </button>
          {me.coPin && !nhom.batBuocPin && (
            <button type="button" className="kt-btn" onClick={() => savePin("")}>
              Bỏ PIN
            </button>
          )}
        </div>
      </section>
      <NhatKyList ma={ma} uid={me.id} ai={me.id} />
      <section className="nh-card">
        <h2>Đổi người dùng trên máy này</h2>
        <p className="kt-muted">Máy này đang nhớ bạn là “{me.ten}” (và PIN). Máy dùng chung thì bấm để quên.</p>
        <button type="button" className="kt-btn" onClick={() => { setPin(ma, me.id, ""); setMyId(ma, ""); window.location.href = `${nhomPath(ma)}?doi=1`; }}>
          Quên tôi trên máy này
        </button>
      </section>
      <section className="nh-card">
        <h2>
          <LogOut size={18} aria-hidden="true" /> Rời nhóm
        </h2>
        <button type="button" className="kt-btn" onClick={leave}>
          Rời nhóm và xoá dữ liệu của tôi
        </button>
      </section>
      {msg && <p className="nh-msgline">{msg}</p>}
    </div>
  );
}

function Inner({ ma, id }) {
  const { data, err, reload, skew } = useNhomView(ma);
  const now = useNow(skew);
  const navigate = useNavigate();
  const [tab, setTab] = useState("cay");
  const [view, setView] = useState("nhom");
  const [leaf, setLeaf] = useState(null);
  const [flower, setFlower] = useState(null);
  const [pop, setPop] = useState(null); // #250 { title, href } — làm phần bài trong cửa sổ nổi
  const [qa, setQa] = useState(null); // #250 { u, k } — Hỏi đáp riêng một bài
  const [msg, setMsg] = useState("");
  const [busyR, setBusyR] = useState(false);

  const me = data?.members.find((m) => m.id === id);
  const nhom = data?.nhom;
  const ci = useMemo(() => (nhom ? changInfo(nhom, now) : {}), [nhom, now]);
  // #267: máy nhớ nhóm cho MỌI người (trang "Của tôi" có thẻ "Nhóm học của bạn")
  useEffect(() => {
    if (nhom && me) rememberGroup(ma, nhom.ten, id);
  }, [nhom?.ten, me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // #269 báo cho Đét trợ thủ: bạn đang ở bài nào, đã làm tới đâu (chỉ đọc từ dữ liệu nhóm)
  useBaoTroThu(() => {
    const m0 = data?.members.find((m) => m.id === id);
    const g0 = data?.nhom;
    if (!m0 || !g0) return null;
    const ch = g0.changHienTai || 0;
    const u = g0.chuoi.bai[Math.min(ch, g0.chuoi.bai.length - 1)];
    const key = baiKey(u);
    const t = m0.tom?.[key];
    const chu = g0.nguoiTaoId === id;
    const act = data.members.filter((m) => m.trangThai === "hoc");
    const sau = g0.chuoi.bai[ch + 1];
    return {
      loai: "nhom", laChu: chu, bai: baiLabel(u, ch), g: t?.g, a: t?.a, c: t?.c, chuaBatDau: !t || t.d === "chưa bắt đầu", noi: m0.noi?.[key],
      xongCa: !!g0.veDichLuc, tamNghi: m0.trangThai === "tam-nghi",
      choDuyet: chu ? data.members.reduce((n, m) => n + Object.values(m.noi || {}).filter((x) => x?.baoGui && !x.xanh).length, 0) : 0,
      slow: act.filter((m) => !(m.tom?.[key]?.g || []).every(Boolean)).length,
      lamTruoc: sau && (t?.g || []).every(Boolean) ? baiLabel(sau, ch + 1) : null,
      openPart: (pk) => setPop({ title: `${baiLabel(u, ch)} · ${PART_SHORT[pk]}`, href: nhomUnitPath(ma, id, u.audience, u.slug, pk) }),
      openFlower: () => setFlower({ u, k: ch }),
      hocTiep: () => sau && setPop({ title: `${baiLabel(sau, ch + 1)} · Bài viết`, href: nhomUnitPath(ma, id, sau.audience, sau.slug, "") }),
      mo: (tb) => setTab(tb),
    };
  }, [data, id]);
  if (err && !data) return <p className="nh-center hkt-u-err">{errText(err)}</p>;
  if (!data)
    return (
      <div className="nh-center">
        <VongDetLoading />
      </div>
    );
  if (!me)
    return (
      <div className="nh-wrap">
        <h1 className="kt-h1">ID “{id}” không còn trong nhóm</h1>
        <Link className="kt-btn" to={nhomPath(ma)}>
          Về cửa nhóm
        </Link>
      </div>
    );
  const active = data.members.filter((m) => m.trangThai === "hoc");
  const curKey = ci.u ? baiKey(ci.u) : null;
  const toDo = (m) => curKey && m.trangThai === "hoc" && !(m.tom?.[curKey]?.g || []).every(Boolean) || (curKey && !m.tom?.[curKey]);
  const meNotDone = ci.u && me.trangThai === "hoc" && !(me.tom?.[curKey]?.g?.length === 5 && me.tom[curKey].g.every(Boolean));
  const slow = ci.u ? active.filter((m) => !(m.tom?.[curKey]?.g?.length === 5 && m.tom[curKey].g.every(Boolean))) : [];
  const unitLink = (u, pk) => nhomUnitPath(ma, id, u.audience, u.slug, pk);
  const firstOpenPart = (u) => {
    // #267: chưa làm gì ở bài này → mở Bài viết trước; đã làm → phần bài tập chưa xong đầu tiên
    const t = me.tom?.[baiKey(u)];
    if (!t || t.d === "chưa bắt đầu") return "";
    const j = PART_KEYS.findIndex((_, x) => !t?.g?.[x]);
    return PART_KEYS[j < 0 ? 0 : j];
  };
  const giuc = async (m) => {
    try {
      await api(`${ma}/tin`, { id, body: { chu: `⏰ ${me.ten} giục ${m.ten}: vào làm ${baiLabel(ci.u, ci.ch)} nhé — ${m.tom?.[curKey]?.d || "chưa bắt đầu"}!` } });
      setMsg(`Đã giục ${m.ten} trong Hỏi đáp.`);
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const baoGui = async (u) => {
    try {
      await api(`${ma}/noi`, { id, body: { bai: baiKey(u) } });
      await reload();
      setMsg("Đã báo gửi — bông chuyển vàng, chờ trưởng nhóm nhận.");
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const share = `${origin()}/nhom/${ma}`;
  const laChu = nhom.nguoiTaoId === id; // #253 trưởng nhóm: có thêm các tab quản lý
  const capNhat = async () => {
    setBusyR(true);
    await reload();
    setBusyR(false);
    setMsg(`Đã cập nhật lúc ${new Date().toLocaleTimeString("vi-VN")}.`);
  };
  const openPart = (u, k, pk) => setPop({ title: `${baiLabel(u, k)} · ${PART_SHORT[pk]}`, href: unitLink(u, pk) });
  const nhan = data.nhan || [];
  const moi = nhanMoi(ma, id, nhan);
  const viewM = view !== "nhom" ? data.members.find((m) => m.id === view) : null;
  const nhanCount = (mid) => nhan.filter((x) => x.den === mid).length;
  const openView = (v) => {
    setView(v);
    if (v === id) markNhanSeen(ma, id, nhan);
  };

  return (
    <div className="nh-wrap nh-home">
      <header className="nh-head">
        <div>
          <p className="kt-kicker">
            <Users size={16} aria-hidden="true" /> Nhóm học {ma} · {me.ten}
            {laChu && " · trưởng nhóm"}
            {me.trangThai === "tam-nghi" && " · tạm nghỉ"}
          </p>
          <h1 className="kt-h1">{nhom.ten}</h1>
          {ci.xong ? (
            <p className="nh-goal">🎉 Cả nhóm đã về đích!</p>
          ) : (
            <p className="nh-now">
              <b>
                {baiLabel(ci.u, ci.ch)}: {ci.u.title}
              </b>
              <Countdown dh={ci.dh} big />
              <NhacBell nhom={nhom} now={now} chuaXong={meNotDone} />
            </p>
          )}
        </div>
      </header>
      {/* #267: MỘT nút chính; nút phụ thu nhỏ thành biểu tượng cùng hàng */}
      <div className="nh-actbar">
        {ci.u && meNotDone ? (
          <button type="button" className="kt-btn kt-btn--pri nh-cta" onClick={() => openPart(ci.u, ci.ch, firstOpenPart(ci.u))}>
            Học tiếp {baiLabel(ci.u, ci.ch)} · {me.tom?.[curKey]?.d || "bắt đầu"}
          </button>
        ) : ci.u && me.trangThai === "hoc" && ci.ch + 1 < nhom.chuoi.bai.length ? (
          <button type="button" className="kt-btn kt-btn--pri nh-cta" onClick={() => openPart(nhom.chuoi.bai[ci.ch + 1], ci.ch + 1, firstOpenPart(nhom.chuoi.bai[ci.ch + 1]))}>
            Bạn đã xong — làm trước {baiLabel(nhom.chuoi.bai[ci.ch + 1], ci.ch + 1)} trong lúc chờ bạn
          </button>
        ) : (
          <span className="nh-cta-sp" />
        )}
        <button type="button" className="kt-btn nh-ibtn" onClick={capNhat} disabled={busyR} title="Cập nhật: lấy dữ liệu mới nhất của cả nhóm">
          <RefreshCw size={18} aria-hidden="true" className={busyR ? "nh-spin" : ""} />
          <span>Cập nhật</span>
        </button>
        <PartGuide k={laChu ? "huong-dan" : "nhom"} className="kt-btn nh-ibtn" label="Hướng dẫn" />
        <CopyBtn text={share} className="kt-btn nh-ibtn">
          <Share2 size={18} aria-hidden="true" />
          <span>Chép link</span>
        </CopyBtn>
      </div>

      <div className="nh-tabs" role="tablist">
        {[
          ["cay", TreeDeciduous, "Cây"],
          ["bang", Table2, "Xem dạng bảng"],
          ["toi", UserCog, "Của tôi"],
          ...(laChu ? [["noi", Flower2, "Duyệt bài nói"], ["hv", Users, "Học viên"], ["cd", Settings, "Cài đặt nhóm"]] : []),
        ].map(([k, I, t]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-on" : ""} onClick={() => setTab(k)}>
            <I size={16} aria-hidden="true" /> {t}
          </button>
        ))}
      </div>
      {msg && <p className="nh-msgline">{msg}</p>}
      {moi > 0 && view !== id && (
        <button type="button" className="nh-newnhan" onClick={() => { setTab("cay"); openView(id); }}>
          💌 Bạn có {moi} lời nhắn mới trên cây — xem
        </button>
      )}

      {tab === "cay" && (
        <div className="nh-cay">
          <div className="nh-who" role="group" aria-label="Xem cây của">
            <button type="button" className={view === "nhom" ? "is-on" : ""} onClick={() => openView("nhom")}>
              Cả nhóm
            </button>
            {data.members.map((m) => (
              <button key={m.id} type="button" className={view === m.id ? "is-on" : ""} onClick={() => openView(m.id)}>
                {m.id === id ? `${m.ten} (tôi)` : m.ten}
                {nhanCount(m.id) > 0 && <small className="nh-who-n">❤ {nhanCount(m.id)}</small>}
              </button>
            ))}
          </div>
          <div className="nh-cay-grid">
            <NhomTree
              nhom={nhom}
              members={data.members}
              meId={id}
              view={view}
              tinBai={data.tinBai}
              onQa={setQa}
              onLeaf={(x) => (baiMoCua(x.k, nhom, me) && (view === id || view === "nhom") ? openPart(x.u, x.k, x.pk) : setLeaf(x))}
              onFlower={setFlower}
            />
            <aside className="nh-side">
              {viewM && <StatsCard nhom={nhom} m={viewM} />}
              {viewM && <NhanCard ma={ma} who={{ id }} meKey={id} nhom={nhom} m={viewM} nhan={nhan} onSent={reload} />}
              {!viewM && ci.u && (
                <section className="nh-card">
                  <h2>Ai chưa xong {baiLabel(ci.u, ci.ch)}</h2>
                  {slow.length ? (
                    <ul className="nh-slow">
                      {slow.map((m) => (
                        <li key={m.id}>
                          <span>
                            <b>{m.ten}</b> · {m.tom?.[curKey]?.d || "chưa bắt đầu"}
                          </span>
                          {m.id !== id && !meNotDone && (
                            <button type="button" className="nh-mini" onClick={() => giuc(m)}>
                              Giục bạn
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Mọi người đã xong — bài sau sắp mở.</p>
                  )}
                </section>
              )}
              {!viewM && <p className="kt-muted nh-hint">Bấm tên một người để xem thống kê và gửi lời nhắn, chọc nhau trên cây của họ.</p>}
              <section className="nh-card">
                <h2>Ai đang làm gì</h2>
                <ul className="nh-doing">
                  {data.members
                    .filter((m) => m.dangO)
                    .sort((a, b) => new Date(b.dangO.luc) - new Date(a.dangO.luc))
                    .map((m) => {
                      const k = nhom.chuoi.bai.findIndex((u) => baiKey(u) === m.dangO.bai);
                      return (
                        <li key={m.id}>
                          <b>{m.ten}</b> {now - new Date(m.dangO.luc).getTime() < 90e3 ? "đang làm" : "làm"} {k >= 0 ? baiLabel(nhom.chuoi.bai[k], k) : ""} · {PART_SHORT[m.dangO.phan] ?? m.dangO.phan}
                          {["quiz", "listen-speak", "true-or-false"].includes(m.dangO.phan) && m.tom?.[m.dangO.bai]?.c ? ` ${m.tom[m.dangO.bai].c[m.dangO.phan]}/${m.dangO.phan === "true-or-false" ? 80 : 40}` : ""}{" "}
                          <small>({ago(m.dangO.luc, now)})</small>
                        </li>
                      );
                    })}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      )}
      {tab === "bang" && (
        <NhomTable
          nhom={nhom}
          members={data.members}
          onCell={(m, u, k, pk) => setLeaf({ u, k, pk, j: PART_KEYS.indexOf(pk) })}
          onNoi={(m, u, k) => setFlower({ u, k })}
        />
      )}
      {laChu && tab === "noi" && <NoiTab ma={ma} uid={id} data={data} reload={reload} now={now} />}
      {laChu && tab === "hv" && <HvTab ma={ma} uid={id} data={data} reload={reload} />}
      {laChu && tab === "cd" && <CdTab ma={ma} uid={id} data={data} reload={reload} />}
      {tab === "toi" && <MySettings ma={ma} me={me} nhom={nhom} onLeft={() => navigate(nhomPath(ma))} />}

      {leaf && (
        <Sheet title={`${baiLabel(leaf.u, leaf.k)} · ${PART_SHORT[leaf.pk]}`} onClose={() => setLeaf(null)}>
          <p className="kt-muted">{leaf.u.title}</p>
          <ul className="nh-whodone">
            {data.members.map((m) => {
              const ok = m.tom?.[baiKey(leaf.u)]?.g?.[leaf.j];
              return (
                <li key={m.id} className={ok ? "is-ok" : ""}>
                  {ok ? <Check size={14} aria-hidden="true" /> : <span className="nh-o" />} {m.ten}
                  {!ok && leaf.pk !== "" && leaf.pk !== "info" && m.tom?.[baiKey(leaf.u)] && <small> · {m.tom[baiKey(leaf.u)].c?.[leaf.pk] || 0}</small>}
                </li>
              );
            })}
          </ul>
          {baiMoCua(leaf.k, nhom, me) ? (
            <button type="button" className="kt-btn kt-btn--pri" onClick={() => { setLeaf(null); openPart(leaf.u, leaf.k, leaf.pk); }}>
              Làm phần này
            </button>
          ) : (
            <p>🔒 {leaf.k === (nhom.changHienTai || 0) + 1 ? `Xong cả 5 phần ${baiLabel(nhom.chuoi.bai[leaf.k - 1], leaf.k - 1)} thì được làm trước bài này.` : `Mở khi cả nhóm xong ${baiLabel(nhom.chuoi.bai[leaf.k - 1], leaf.k - 1)}.`}</p>
          )}
        </Sheet>
      )}
      {flower && (
        <Sheet title={`${baiLabel(flower.u, flower.k)} · Bài nói tự do`} onClose={() => setFlower(null)}>
          <p>
            🎤 <b>Hãy nói những gì bạn nghĩ và nhớ</b> về bài “{flower.u.title}” — bằng tiếng Anh, dài ngắn tuỳ bạn — rồi gửi cho trưởng nhóm qua kênh của nhóm.
          </p>
          {(() => {
            const noi = me.noi?.[baiKey(flower.u)];
            return (
              <>
                <p className={`nh-noistate ${noi?.xanh ? "is-green" : noi?.baoGui ? "is-yellow" : ""}`}>
                  {noi?.xanh ? "✓ Trưởng nhóm đã nhận" : noi?.baoGui ? `Đã báo gửi ${noi.soLan > 1 ? `${noi.soLan} lần` : ""} — chờ trưởng nhóm nhận` : "Chưa gửi"}
                  {noi?.ghiChu && (
                    <span className="nh-note2">
                      <b>Nhận xét của trưởng nhóm:</b>
                      <NhanXet text={noi.ghiChu} />
                    </span>
                  )}
                </p>
                <div className="nh-row">
                  {nhom.kenhGuiBai ? (
                    <a className="kt-btn" href={nhom.kenhGuiBai} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} aria-hidden="true" /> Mở kênh gửi bài
                    </a>
                  ) : (
                    <span className="kt-muted">Trưởng nhóm chưa dán kênh gửi bài — hỏi trong Hỏi đáp.</span>
                  )}
                  {baiMoCua(flower.k, nhom, me) && (
                    <button type="button" className="kt-btn kt-btn--pri" onClick={() => baoGui(flower.u)}>
                      <Check size={16} aria-hidden="true" /> {noi?.baoGui ? "Tôi gửi thêm bài" : "Đã gửi bài nói"}
                    </button>
                  )}
                </div>
                <p className="kt-muted">Bài nói tự do không chặn nhóm. Gửi lại hoặc gửi nhiều bài đều được.</p>
              </>
            );
          })()}
        </Sheet>
      )}

      {pop && <PartPopup title={pop.title} href={pop.href} onClose={() => { setPop(null); reload(); }} />}
      {qa && (
        <QaPopup
          ma={ma}
          who={{ id }}
          label={`${baiLabel(qa.u, qa.k)}: ${qa.u.title}`}
          gan={{ bai: baiKey(qa.u), phan: "", cau: null, nhan: baiLabel(qa.u, qa.k) }}
          chatTat={nhom.chatTat}
          linkFor={(gan) => { const [aud, slug] = gan.bai.split("/"); return nhomUnitPath(ma, id, aud, slug, gan.phan); }}
          onClose={() => { setQa(null); reload(); }}
        />
      )}
      <NhomChat ma={ma} who={{ id }} floating chatTat={nhom.chatTat} linkFor={(gan) => {
        const [aud, slug] = gan.bai.split("/");
        return nhomUnitPath(ma, id, aud, slug, gan.phan);
      }} />
    </div>
  );
}

export default function NhomCay({ ma, id }) {
  useBodyClass("nh-in"); // #253: đã vào nhóm thì không có lối ra khỏi nhóm (ẩn menu chung của web)
  return (
    <KtShell>
      <PinGate ma={ma} id={id}>
        {() => <Inner ma={ma} id={id} />}
      </PinGate>
    </KtShell>
  );
}
