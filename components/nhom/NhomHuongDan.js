"use client";
// #230 Học cùng — /nhom/<mã>/huong-dan?k=<mã hướng dẫn>: trang của trưởng nhóm.
// Tổng quan (cây + bảng; bấm tên một người: thống kê + lời nhắn), Bài nói tự do (nhận xét + duyệt đã nhận),
// Học viên (PIN, Tạm nghỉ, xoá), Cài đặt (4a), Hỏi đáp. #231: bỏ tab giọng Nghe nói (không ghi giọng nữa).
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { ShieldCheck, TreeDeciduous, Users, Settings, MessageCircle, Flower2, UserPlus } from "lucide-react";
import KtShell, { useBodyClass } from "@/components/hkt/KtShell";
import { VongDetLoading } from "@/components/hkt/VongDet";
import NhomTree from "./NhomTree";
import { NhomTable } from "./NhomCay";
import { StatsCard, NhanCard } from "./NhomExtra";
import PartGuide from "@/components/hkt/PartGuide";
import NhatKyList from "./NhomNhatKy"; // #260
import { PartPopup, QaPopup } from "./NhomPopup"; // #250 (NHA A3, E); bỏ tab "Hướng dẫn riêng" (NHA H)
import { api, saveK, loadK, tepUrl, rememberGroup } from "./nhomClient";
import { useNhomView, useNow, changInfo, baiLabel, Countdown, CopyBtn, origin, errText, NhomChat } from "./NhomShared";
import { PART_KEYS, PART_SHORT, baiKey, baiMo, baiMoCua, nhomPath, nhomUnitPath, fmtHan, mocNho, phanDangLam } from "@/components/hkt/nhomRules";

const TABS = [
  ["tq", TreeDeciduous, "Tổng quan"],
  ["noi", Flower2, "Bài nói tự do"],
  ["hv", Users, "Học viên"],
  ["cd", Settings, "Cài đặt"],
  ["chat", MessageCircle, "Hỏi đáp"],
];

function KeyForm({ ma, onKey }) {
  const [k, setK] = useState("");
  return (
    <form
      className="nh-card nh-pin"
      onSubmit={(e) => {
        e.preventDefault();
        onKey(k.trim().toUpperCase());
      }}
    >
      <h2>
        <ShieldCheck size={18} aria-hidden="true" /> Mã hướng dẫn nhóm {ma}
      </h2>
      <input value={k} onChange={(e) => setK(e.target.value)} placeholder="10 ký tự" autoFocus />
      <button type="submit" className="kt-btn kt-btn--pri" disabled={k.trim().length < 6}>
        Vào
      </button>
    </form>
  );
}

// ---------- Bài nói tự do: học viên × bài ----------
export function NoiTab({ ma, k, uid, data, reload, now }) {
  const { nhom, members } = data;
  const [note, setNote] = useState({});
  const [err, setErr] = useState("");
  const call = async (body) => {
    setErr("");
    try {
      await api(`${ma}/quan-ly`, { k, id: uid, body: { k, ...body } });
      await reload();
    } catch (e) {
      setErr(errText(e));
    }
  };
  return (
    <div className="nh-card">
      <h2>Bài nói tự do — kiểm tra, nhận xét, duyệt đã nhận</h2>
      <p className="kt-muted">
        Học viên gửi audio qua kênh nhóm{nhom.kenhGuiBai ? "" : " (bạn chưa dán kênh gửi bài — vào Cài đặt)"} rồi bấm “Đã gửi bài nói” → ô vàng. Bạn nghe bên đó, ghi nhận xét vào ô (học viên thấy trên bông của mình), rồi bấm <b>Duyệt đã nhận</b> → xanh, qua mốc. Vàng quá 2 ngày có dấu ⚠.
      </p>
      <div className="nh-table-wrap">
        <table className="nh-table nh-noi">
          <thead>
            <tr>
              <th>Học viên</th>
              {nhom.chuoi.bai.map((u, i) => (
                <th key={baiKey(u)} title={u.title}>
                  {baiLabel(u, i)}
                  <button type="button" className="nh-mini" onClick={() => call({ viec: "tich-cot", bai: baiKey(u) })} title="Duyệt hết các bài đã báo gửi ở cột này">
                    Duyệt cột
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <th>{m.ten}</th>
                {nhom.chuoi.bai.map((u) => {
                  const key = baiKey(u);
                  const n = m.noi?.[key];
                  const old = n?.baoGui && !n.xanh && now - new Date(n.baoGui).getTime() > 2 * 864e5;
                  const nk = `${m.id}|${key}`;
                  return (
                    <td key={key} className={`nh-noicell ${n?.xanh ? "is-on" : n?.baoGui ? "is-yellow" : ""}`}>
                      <button type="button" onClick={() => call({ viec: "tich-noi", id: m.id, bai: key, xanh: !n?.xanh, ghiChu: note[nk] ?? n?.ghiChu })}>
                        {n?.xanh ? "✓ Đã duyệt" : n?.baoGui ? `${old ? "⚠ " : ""}Đã gửi${n.soLan > 1 ? ` ×${n.soLan}` : ""} · Duyệt` : "— · Duyệt"}
                      </button>
                      <input
                        className="nh-noinote"
                        placeholder="nhận xét"
                        value={note[nk] ?? n?.ghiChu ?? ""}
                        onChange={(e) => setNote((x) => ({ ...x, [nk]: e.target.value }))}
                        onBlur={() => note[nk] !== undefined && note[nk] !== (n?.ghiChu || "") && call({ viec: "tich-noi", id: m.id, bai: key, xanh: !!n?.xanh, ghiChu: note[nk] })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {err && <p className="hkt-u-err">{err}</p>}
    </div>
  );
}

// ---------- Học viên ----------
export function HvTab({ ma, k, uid, data, reload }) {
  const [err, setErr] = useState("");
  const [nk, setNk] = useState(""); // #260 đang xem nhật ký của ai
  const [pinFor, setPinFor] = useState(""); // #267 đặt lại PIN: ô nhập ẩn •••• thay cho hộp prompt (lộ số khi chia sẻ màn hình)
  const [pinNew, setPinNew] = useState("");
  const call = async (body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setErr("");
    try {
      await api(`${ma}/quan-ly`, { k, id: uid, body: { k, ...body } });
      await reload();
    } catch (e) {
      setErr(errText(e));
    }
  };
  return (
    <div className="nh-card">
      <h2>Học viên ({data.members.length}/{data.nhom.toiDa})</h2>
      <ul className="nh-hv">
        {data.members.map((m) => (
          <li key={m.id} className={m.trangThai === "tam-nghi" ? "is-pause" : ""}>
            <span>
              <b>{m.ten}</b> <small>({m.id}{m.coPin ? " · có PIN" : ""})</small>
              {m.trangThai === "tam-nghi" && <em> · Tạm nghỉ (không tính vào luật nhóm)</em>}
            </span>
            <span className="nh-row">
              <button type="button" className="nh-mini" onClick={() => { const t = window.prompt("Tên hiển thị mới", m.ten); if (t) call({ viec: "doi-ten", id: m.id, ten: t }); }}>
                Đổi tên
              </button>
              <button type="button" className="nh-mini" onClick={() => { setPinFor(pinFor === m.id ? "" : m.id); setPinNew(""); }}>
                {m.coPin ? "Đặt lại PIN" : "Đặt PIN"}
              </button>
              <button type="button" className="nh-mini" onClick={() => setNk(nk === m.id ? "" : m.id)} aria-expanded={nk === m.id}>
                Nhật ký
              </button>
              <button type="button" className="nh-mini" onClick={() => call({ viec: "trang-thai", id: m.id, trangThai: m.trangThai === "hoc" ? "tam-nghi" : "hoc" })}>
                {m.trangThai === "hoc" ? "Tạm nghỉ" : "Học lại"}
              </button>
              <button type="button" className="nh-mini is-danger" onClick={() => call({ viec: "xoa-id", id: m.id }, `Xoá ID “${m.id}” và toàn bộ dữ liệu của người này?`)}>
                Xoá
              </button>
            </span>
            {pinFor === m.id && (
              <form className="nh-row nh-pinreset" onSubmit={(e) => { e.preventDefault(); call({ viec: "pin", id: m.id, pin: pinNew }); setPinFor(""); }}>
                <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pinNew} placeholder="PIN mới ••••" onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ""))} autoFocus />
                <button type="submit" className="kt-btn kt-btn--pri" disabled={pinNew.length !== 4}>
                  Lưu PIN mới
                </button>
                <span className="kt-muted">Báo PIN mới cho {m.ten} (nhắn riêng).</span>
              </form>
            )}
            {nk === m.id && (
              <div className="nh-nk-in">
                <NhatKyList ma={ma} uid={uid} k={k} ai={m.id} title={`Nhật ký học của ${m.ten}`} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <label className="nh-switch">
        <input type="checkbox" checked={!!data.nhom.khoaNguoiMoi} onChange={(e) => call({ viec: "cai-dat", caiDat: { khoaNguoiMoi: e.target.checked } })} /> Khoá nhận người mới
      </label>
      {err && <p className="hkt-u-err">{err}</p>}
    </div>
  );
}

// ---------- Cài đặt (4a) ----------
export function CdTab({ ma, k, uid, data, reload }) {
  const g = data.nhom;
  const [f, setF] = useState(() => ({
    ten: g.ten, tenHuongDan: g.tenHuongDan, quiz: g.nguong.quiz, say: g.nguong["listen-speak"], tf: g.nguong.tf, hanChangGio: g.hanChangGio, nhacGio: g.nhacGio,
    kenhGuiBai: g.kenhGuiBai, batBuocPin: g.batBuocPin, chatTat: g.chatTat, toiDa: g.toiDa,
  }));
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  // #250 (NHA G): luôn hiện đúng giá trị đang lưu trên máy chủ (MongoDB) — tải lại khi dữ liệu nhóm đổi mà mình chưa sửa dở
  useEffect(() => {
    if (dirty) return;
    setF({ ten: g.ten, tenHuongDan: g.tenHuongDan, quiz: g.nguong.quiz, say: g.nguong["listen-speak"], tf: g.nguong.tf, hanChangGio: g.hanChangGio, nhacGio: g.nhacGio, kenhGuiBai: g.kenhGuiBai, batBuocPin: g.batBuocPin, chatTat: g.chatTat, toiDa: g.toiDa });
  }, [g, dirty]);
  const set = (k2) => (e) => {
    setDirty(true);
    setF((x) => ({ ...x, [k2]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  };
  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api(`${ma}/quan-ly`, {
        k,
        id: uid,
        body: {
          k, viec: "cai-dat",
          caiDat: { ten: f.ten, tenHuongDan: f.tenHuongDan, nguong: { quiz: +f.quiz, "listen-speak": +f.say, tf: f.tf === "xong" ? "xong" : +f.tf }, hanChangGio: +f.hanChangGio, nhacGio: +f.nhacGio, kenhGuiBai: f.kenhGuiBai, batBuocPin: f.batBuocPin, chatTat: f.chatTat, toiDa: +f.toiDa },
        },
      });
      await reload();
      setDirty(false);
      setMsg(`Đã lưu lên máy chủ lúc ${new Date().toLocaleTimeString("vi-VN")} — áp cho bài đang mở trở đi.`);
    } catch (x) {
      setMsg(errText(x));
    }
  };
  return (
    <form className="nh-card nh-cdform" onSubmit={save}>
      <h2>Cài đặt nhóm</h2>
      <p className="kt-muted">
        Đang dùng (lưu trên máy chủ): qua Trắc nghiệm {g.nguong.quiz}/40 · Nghe nói {g.nguong["listen-speak"]}/40 · True or false {g.nguong.tf === "xong" ? "làm xong lượt" : `đúng ≥ ${g.nguong.tf}%`} · đếm ngược {g.hanChangGio ? `${g.hanChangGio} giờ/bài` : "tắt"} · nhắc {g.nhacGio ? `mỗi ${g.nhacGio} giờ` : "tắt"} · tối đa {g.toiDa} người{g.batBuocPin ? " · bắt buộc PIN" : ""}. Chỉ trưởng nhóm (có link này) đổi được.
      </p>
      <label className="nh-field"><span className="nh-flabel">Tên nhóm</span><input value={f.ten} onChange={set("ten")} maxLength={80} /></label>
      <label className="nh-field"><span className="nh-flabel">Tên trưởng nhóm</span><input value={f.tenHuongDan} onChange={set("tenHuongDan")} maxLength={40} /></label>
      <label className="nh-field"><span className="nh-flabel">Qua Trắc nghiệm khi đúng (/40)</span><input type="number" min={1} max={40} value={f.quiz} onChange={set("quiz")} /></label>
      <label className="nh-field"><span className="nh-flabel">Qua Nghe nói khi nói đúng (/40)</span><input type="number" min={1} max={40} value={f.say} onChange={set("say")} /></label>
      <label className="nh-field">
        <span className="nh-flabel">True or false</span>
        <select value={f.tf === "xong" ? "xong" : "pct"} onChange={(e) => { setDirty(true); setF((x) => ({ ...x, tf: e.target.value === "xong" ? "xong" : 80 })); }}>
          <option value="xong">Làm xong lượt</option>
          <option value="pct">Đúng ≥ N%</option>
        </select>
        {f.tf !== "xong" && <input type="number" min={1} max={100} value={f.tf} onChange={set("tf")} aria-label="Phần trăm đúng" />}
      </label>
      <label className="nh-field"><span className="nh-flabel">Đếm ngược mỗi bài (giờ, 0 = tắt)</span><input type="number" min={0} max={720} value={f.hanChangGio} onChange={set("hanChangGio")} /></label>
      <label className="nh-field"><span className="nh-flabel">Nhắc hối thúc mỗi (giờ, 0 = tắt)</span><input type="number" min={0} max={168} value={f.nhacGio} onChange={set("nhacGio")} /></label>
      <label className="nh-field"><span className="nh-flabel">Kênh gửi bài nói tự do</span><input type="url" value={f.kenhGuiBai} onChange={set("kenhGuiBai")} placeholder="https://zalo.me/g/…" /></label>
      <label className="nh-field"><span className="nh-flabel">Số học viên tối đa</span><input type="number" min={2} max={30} value={f.toiDa} onChange={set("toiDa")} /></label>
      <label className="nh-switch"><input type="checkbox" checked={f.batBuocPin} onChange={set("batBuocPin")} /> Mọi ID phải có PIN</label>
      <label className="nh-switch"><input type="checkbox" checked={f.chatTat} onChange={set("chatTat")} /> Tạm tắt Hỏi đáp (chỉ tôi gửi được)</label>
      <button type="submit" className="kt-btn kt-btn--pri">Lưu cài đặt</button>
      {msg && <p className="nh-msgline">{msg}</p>}
    </form>
  );
}

function Inner({ ma, k }) {
  const { data, err, reload, skew } = useNhomView(ma, { k, every: 15000 });
  const now = useNow(skew);
  const [tab, setTab] = useState("tq");
  const [view, setView] = useState("nhom");
  const [tblMode, setTblMode] = useState(false);
  const [pop, setPop] = useState(null); // #250 làm phần bài (ID học của trưởng nhóm) trong cửa sổ nổi
  const [qa, setQa] = useState(null); // #250 Hỏi đáp riêng một bài
  useEffect(() => {
    if (data?.nhom) rememberGroup(ma, data.nhom.ten);
  }, [data?.nhom?.ten]); // eslint-disable-line react-hooks/exhaustive-deps
  const dots = useMemo(() => {
    const d = {};
    data?.members?.forEach((m) => Object.entries(m.noi || {}).forEach(([b, n]) => n.baoGui && !n.xanh && (d[`${b}|noi`] = 1)));
    return d;
  }, [data]);
  if (err && !data)
    return (
      <div className="nh-wrap">
        <p className="hkt-u-err">{errText(err)}</p>
        {err.status === 403 && <KeyForm ma={ma} onKey={(x) => { saveK(ma, x); window.location.search = `?k=${x}`; }} />}
      </div>
    );
  if (!data)
    return (
      <div className="nh-center">
        <VongDetLoading />
      </div>
    );
  const { nhom, members } = data;
  const ci = changInfo(nhom, now);
  const curKey = ci.u ? baiKey(ci.u) : null;
  const slow = ci.u ? members.filter((m) => m.trangThai === "hoc" && !(m.tom?.[curKey]?.g || []).every(Boolean) || (ci.u && m.trangThai === "hoc" && !m.tom?.[curKey])) : [];
  const nhac = ci.u
    ? `⏰ ${nhom.ten} — ${baiLabel(ci.u, ci.ch)}: ${ci.u.title}${ci.dh ? ` (${fmtHan(ci.dh.con)})` : ""}\nChưa xong: ${slow.map((m) => `${m.ten} (${m.tom?.[curKey]?.d || "chưa bắt đầu"})`).join(", ") || "không ai 🎉"}\nVào học: ${origin()}/nhom/${ma}`
    : "";
  const myId = nhom.nguoiTaoId && members.some((m) => m.id === nhom.nguoiTaoId) ? nhom.nguoiTaoId : null;
  const meM = myId ? members.find((m) => m.id === myId) : null;
  const myJ = ci.u && meM ? phanDangLam(meM.tom?.[curKey]) : 5;
  const openPart = (u, k, pk) => myId && setPop({ title: `${baiLabel(u, k)} · ${PART_SHORT[pk]}`, href: nhomUnitPath(ma, myId, u.audience, u.slug, pk) });
  const yellowOld = members.flatMap((m) => Object.entries(m.noi || {}).filter(([, n]) => n.baoGui && !n.xanh && now - new Date(n.baoGui).getTime() > 2 * 864e5).map(([b]) => `${m.ten} · ${b.split("/")[1]}`));

  return (
    <div className="nh-wrap nh-hd">
      <header className="nh-head">
        <div>
          <p className="kt-kicker">
            <ShieldCheck size={16} aria-hidden="true" /> Trưởng nhóm · nhóm {ma}
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
            </p>
          )}
        </div>
      </header>
      {yellowOld.length > 0 && (
        <p className="nh-alert">
          {yellowOld.length > 0 && (
            <button type="button" onClick={() => setTab("noi")}>
              ⚠ Bài nói báo gửi quá 2 ngày chưa nhận: {yellowOld.join(", ")}
            </button>
          )}
        </p>
      )}
      <div className="nh-tabs" role="tablist">
        {TABS.map(([key, I, t]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "is-on" : ""} onClick={() => setTab(key)}>
            <I size={16} aria-hidden="true" /> {t}
          </button>
        ))}
      </div>
      {tab === "tq" && (
        <>
          <div className="nh-who" role="group">
            <button type="button" className={!tblMode && view === "nhom" ? "is-on" : ""} onClick={() => { setTblMode(false); setView("nhom"); }}>
              Cây cả nhóm
            </button>
            {members.map((m) => (
              <button key={m.id} type="button" className={!tblMode && view === m.id ? "is-on" : ""} onClick={() => { setTblMode(false); setView(m.id); }}>
                {m.ten}
              </button>
            ))}
            <button type="button" className={tblMode ? "is-on" : ""} onClick={() => setTblMode(true)}>
              Xem dạng bảng
            </button>
          </div>
          {tblMode ? (
            <NhomTable nhom={nhom} members={members} onNoi={() => setTab("noi")} />
          ) : (
            <div className="nh-cay-grid">
              <NhomTree
                nhom={nhom}
                members={members}
                meId={myId || undefined}
                view={view}
                dots={dots}
                tinBai={data.tinBai}
                onQa={setQa}
                onLeaf={myId && (view === "nhom" || view === myId) ? (x) => baiMoCua(x.k, nhom, members.find((m) => m.id === myId)) && openPart(x.u, x.k, x.pk) : undefined}
                onFlower={() => setTab("noi")}
              />
              <aside className="nh-side">
                {view !== "nhom" && members.find((m) => m.id === view) && (
                  <>
                    <StatsCard nhom={nhom} m={members.find((m) => m.id === view)} />
                    <NhanCard ma={ma} who={{ k }} meKey="huong-dan" nhom={nhom} m={members.find((m) => m.id === view)} nhan={data.nhan || []} onSent={reload} />
                  </>
                )}
                <section className="nh-card">
                  <h2>Chưa xong bài đang mở</h2>
                  {/* #250 (NHA A3): đồng hồ tính theo MỐC NHỎ (5 phần chia đều hạn chặng) + nút làm ngay */}
                  {ci.u && (
                    <div className="nh-moc">
                      <span>
                        Bài hiện tại: <b>{baiLabel(ci.u, ci.ch)}</b>
                      </span>
                      <Countdown dh={ci.dh} big />
                      {meM && myJ < 5 && (
                        <>
                          <span>
                            Phần của bạn: <b>{myJ + 1}. {PART_SHORT[PART_KEYS[myJ]]}</b>
                          </span>
                          <Countdown dh={mocNho(nhom.moChangLuc?.[ci.ch], nhom.hanChangGio, myJ, now)} />
                          <button type="button" className="kt-btn kt-btn--pri" onClick={() => openPart(ci.u, ci.ch, PART_KEYS[myJ])}>
                            Làm phần này ngay
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <ul className="nh-slow">
                    {slow.map((m) => (
                      <li key={m.id}>
                        <span>
                          <b>{m.ten}</b> · {m.tom?.[curKey]?.d || "chưa bắt đầu"}
                        </span>
                        <Countdown dh={mocNho(nhom.moChangLuc?.[ci.ch], nhom.hanChangGio, phanDangLam(m.tom?.[curKey]), now)} label={`mốc ${phanDangLam(m.tom?.[curKey]) + 1}`} />
                      </li>
                    ))}
                    {!slow.length && <li>Không ai — bài sau sắp mở.</li>}
                  </ul>
                  <p className="kt-muted">Học viên bỏ dở? Chuyển “Tạm nghỉ” ở tab Học viên để nhóm đi tiếp.</p>
                </section>
              </aside>
            </div>
          )}
        </>
      )}
      {tab === "noi" && <NoiTab ma={ma} k={k} data={data} reload={reload} now={now} />}
      {tab === "hv" && <HvTab ma={ma} k={k} data={data} reload={reload} />}
      {tab === "cd" && <CdTab ma={ma} k={k} data={data} reload={reload} />}
      {tab === "chat" && (
        <NhomChat ma={ma} who={{ k }} linkFor={null} />
      )}

      {/* #250 (NHA C): bạn cũng là người học — chọn tên + PIN, hoặc tham gia mới */}
      <section className="nh-card nh-alsome">
        <h2>Bạn cũng học</h2>
        <div className="nh-row">
          {myId && (
            <Link className="kt-btn kt-btn--pri" to={nhomPath(ma, myId)}>
              Vào học với ID {myId} (gõ PIN)
            </Link>
          )}
          <select defaultValue="" onChange={(e) => e.target.value && (window.location.href = nhomPath(ma, e.target.value))} aria-label="Chọn tên của bạn">
            <option value="">— Chọn tên của bạn rồi gõ PIN —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.ten} ({m.id})
              </option>
            ))}
          </select>
          <Link className="kt-btn" to={`${nhomPath(ma)}?moi=1`}>
            <UserPlus size={16} aria-hidden="true" /> Tham gia mới
          </Link>
        </div>
        <p className="kt-muted">Link học viên: {origin()}/nhom/{ma}</p>
      </section>

      {/* #250 (NHA B): các nút chung đặt dưới cùng */}
      <div className="nh-foot">
        <button type="button" className="kt-btn" onClick={reload} title="Lấy dữ liệu mới nhất từ máy chủ">
          Cập nhật
        </button>
        <PartGuide k="huong-dan" className="kt-btn nh-guide" label="Hướng dẫn chung" />
        <CopyBtn text={`${origin()}/nhom/${ma}`}>Chép link nhóm</CopyBtn>
        {nhac && (
          <CopyBtn text={nhac} className="kt-btn kt-btn--pri">
            Chép lời nhắc (Zalo)
          </CopyBtn>
        )}
      </div>

      {pop && <PartPopup title={pop.title} href={pop.href} onClose={() => { setPop(null); reload(); }} />}
      {qa && (
        <QaPopup
          ma={ma}
          who={{ k }}
          label={`${baiLabel(qa.u, qa.k)}: ${qa.u.title}`}
          gan={{ bai: baiKey(qa.u), phan: "", cau: null, nhan: baiLabel(qa.u, qa.k) }}
          linkFor={null}
          onClose={() => { setQa(null); reload(); }}
        />
      )}
    </div>
  );
}

export default function NhomHuongDan({ ma }) {
  useBodyClass("nh-in"); // #253
  const [k, setK] = useState(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("k");
    if (q) {
      saveK(ma, q.toUpperCase());
      setK(q.toUpperCase());
    } else setK(loadK(ma) || "");
  }, [ma]);
  return (
    <KtShell>
      {k === null ? (
        <div className="nh-center">
          <VongDetLoading />
        </div>
      ) : k ? (
        <Inner ma={ma} k={k} />
      ) : (
        <div className="nh-wrap">
          <KeyForm ma={ma} onKey={(x) => { saveK(ma, x); setK(x); }} />
        </div>
      )}
    </KtShell>
  );
}
