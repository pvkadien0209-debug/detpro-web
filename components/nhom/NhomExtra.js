"use client";
// #231 Học cùng — trên cây của từng người: Thống kê luyện tập + Lời nhắn / chọc nhau (icon + câu mẫu).
import React, { useState } from "react";
import { BarChart3, Heart, Trash2, Send } from "lucide-react";
import { api } from "./nhomClient";
import { baiLabel, errText } from "./NhomShared";
import { baiKey, pct, NHAN_ICON, NHAN_MAU } from "@/components/hkt/nhomRules";

const ago = (d) => {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.round(s / 60)} phút trước`;
  if (s < 86400) return `${Math.round(s / 3600)} giờ trước`;
  return `${Math.round(s / 86400)} ngày trước`;
};

/** Thống kê kết quả / quá trình thực hành của một người, theo từng bài. */
export function StatsCard({ nhom, m }) {
  const rows = nhom.chuoi.bai.map((u, k) => ({ u, k, t: m.tom?.[baiKey(u)] })).filter((r) => r.t?.s);
  const sum = rows.reduce(
    (a, { t: { s } }) => ({
      q: a.q + s.quiz.ok, qf: a.qf + s.quiz.first, sv: a.sv + s.say.ok, luot: a.luot + s.say.luot, khop: a.khop + (s.say.tb || 0) * s.say.luot, tl: a.tl + s.tf.lam, td: a.td + s.tf.dung,
    }),
    { q: 0, qf: 0, sv: 0, luot: 0, khop: 0, tl: 0, td: 0 }
  );
  return (
    <section className="nh-card nh-stats">
      <h2>
        <BarChart3 size={18} aria-hidden="true" /> Thống kê của {m.ten}
      </h2>
      {!rows.length ? (
        <p className="kt-muted">Chưa luyện bài nào.</p>
      ) : (
        <>
          <div className="nh-kpis">
            <span>
              <b>{pct(sum.qf, sum.q)}%</b>
              <small>Trắc nghiệm đúng ngay lần đầu</small>
            </span>
            <span>
              <b>{sum.luot ? Math.round(sum.khop / sum.luot) : "—"}{sum.luot ? "%" : ""}</b>
              <small>Nghe nói: khớp trung bình ({sum.luot} lượt nói)</small>
            </span>
            <span>
              <b>{pct(sum.td, sum.tl)}%</b>
              <small>True or false đúng ({sum.tl} câu)</small>
            </span>
          </div>
          <div className="nh-table-wrap">
            <table className="nh-table nh-stab">
              <thead>
                <tr>
                  <th>Bài</th>
                  <th>Trắc nghiệm</th>
                  <th>Nghe nói</th>
                  <th>True/False</th>
                  <th>Mở Bảng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ u, k, t: { s } }) => (
                  <tr key={baiKey(u)}>
                    <th title={u.title}>{baiLabel(u, k)}</th>
                    <td>
                      {s.quiz.ok}/40 <small>· đúng ngay {s.quiz.first} · sai {s.quiz.sai}</small>
                    </td>
                    <td>
                      {s.say.ok}/40 <small>· {s.say.luot} lượt{s.say.tb !== null ? ` · khớp TB ${s.say.tb}%` : ""}{s.say.chuaHieu ? ` · chưa hiểu ${s.say.chuaHieu}` : ""}</small>
                      {s.say.luot > 0 && (
                        <span className="nh-bins" title="Lượt nói theo mức khớp: <50% · 50–69% · 70–89% · ≥90%">
                          {s.say.bins.map((n, j) => (
                            <i key={j} className={`b${j}`} style={{ flexGrow: n || 0.0001 }} />
                          ))}
                        </span>
                      )}
                    </td>
                    <td>
                      {s.tf.dung}/{s.tf.lam} <small>· {s.tf.diem} điểm</small>
                    </td>
                    <td>{s.bang}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/** Lời nhắn trên cây của người m: xem + (nếu là người khác) gửi icon / câu mẫu, gắn bài tuỳ chọn. */
export function NhanCard({ ma, who, meKey, nhom, m, nhan, onSent }) {
  const [icon, setIcon] = useState(null);
  const [mau, setMau] = useState(null);
  const [bai, setBai] = useState("");
  const [msg, setMsg] = useState("");
  const list = nhan.filter((x) => x.den === m.id);
  const canSend = m.id !== meKey;
  const send = async () => {
    setMsg("");
    try {
      await api(`${ma}/nhan`, { id: who.id, body: { k: who.k, den: m.id, icon, mau, bai: bai || undefined } });
      setIcon(null);
      setMau(null);
      setBai("");
      setMsg("Đã gửi lên cây của " + m.ten);
      onSent?.();
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const del = async (x) => {
    try {
      await api(`${ma}/nhan/xoa`, { id: who.id, body: { k: who.k, nhan: x._id } });
      onSent?.();
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const lbl = (b) => {
    const k = nhom.chuoi.bai.findIndex((u) => baiKey(u) === b);
    return k >= 0 ? baiLabel(nhom.chuoi.bai[k], k) : "";
  };
  return (
    <section className="nh-card nh-nhan">
      <h2>
        <Heart size={18} aria-hidden="true" /> Lời nhắn trên cây của {m.ten} {list.length > 0 && <small>({list.length})</small>}
      </h2>
      {canSend && (
        <div className="nh-nhan-form">
          <div className="nh-icons" role="group" aria-label="Chọn icon">
            {NHAN_ICON.map((x) => (
              <button key={x} type="button" className={icon === x ? "is-on" : ""} aria-pressed={icon === x} onClick={() => setIcon(icon === x ? null : x)}>
                {x}
              </button>
            ))}
          </div>
          <div className="nh-chips" role="group" aria-label="Câu mẫu">
            {NHAN_MAU.map((t, i) => (
              <button key={i} type="button" className={mau === i ? "is-on" : ""} aria-pressed={mau === i} onClick={() => setMau(mau === i ? null : i)}>
                {t}
              </button>
            ))}
          </div>
          <div className="nh-row">
            <select value={bai} onChange={(e) => setBai(e.target.value)} aria-label="Gắn vào bài">
              <option value="">Không gắn bài</option>
              {nhom.chuoi.bai.map((u, k) => (
                <option key={baiKey(u)} value={baiKey(u)}>
                  {baiLabel(u, k)}
                </option>
              ))}
            </select>
            <button type="button" className="kt-btn kt-btn--pri" disabled={icon === null && mau === null} onClick={send}>
              <Send size={14} aria-hidden="true" /> Gửi
            </button>
          </div>
        </div>
      )}
      {msg && <p className="nh-msgline">{msg}</p>}
      {list.length ? (
        <ul className="nh-nhan-list">
          {list.map((x) => (
            <li key={x._id}>
              <span className="nh-nhan-ic">{x.icon || "💬"}</span>
              <span>
                <b>{x.tu === "huong-dan" ? `${x.ten} (hướng dẫn)` : x.ten}</b> {x.chu}
                <small>
                  {x.bai ? ` · ${lbl(x.bai)}` : ""} · {ago(x.luc)}
                </small>
              </span>
              {(who.k || x.tu === meKey || x.den === meKey) && (
                <button type="button" onClick={() => del(x)} aria-label="Xoá lời nhắn">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="kt-muted">{canSend ? `Chưa có lời nhắn — gửi ${m.ten} một icon hoặc câu động viên.` : "Chưa ai nhắn gì trên cây của bạn."}</p>
      )}
    </section>
  );
}

/** Số lời nhắn mới cho tôi (so với lần xem trước — nhớ trên máy, chỉ để tiện). */
const seenKey = (ma, id) => `dp.nhom.nhan.${ma}.${id}`;
export function nhanMoi(ma, id, nhan) {
  let seen = "";
  try {
    seen = localStorage.getItem(seenKey(ma, id)) || "";
  } catch {
    /* bỏ qua */
  }
  return nhan.filter((x) => x.den === id && (!seen || new Date(x.luc) > new Date(seen))).length;
}
export function markNhanSeen(ma, id, nhan) {
  const mine = nhan.filter((x) => x.den === id);
  if (!mine.length) return;
  try {
    localStorage.setItem(seenKey(ma, id), mine[0].luc);
  } catch {
    /* bỏ qua */
  }
}
