"use client";
// #298 "Nhóm đang học" — cảm giác có người đang hoạt động (tâm lý tích cực):
// chấm xanh người đang học, dòng việc mới nhất của cả nhóm (tự cập nhật), khen nhanh một chạm (đăng vào Hỏi đáp),
// dải "đang diễn ra" chạy trên đầu cây (điện thoại).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./nhomClient";
import { NhomChat } from "./NhomShared";

const ONLINE_MS = 90e3;
const MOI = 25e3; // làm mới mỗi 25 giây khi trang đang mở

export function agoVN(t, now) {
  const s = Math.max(0, Math.round((now - new Date(t).getTime()) / 1000));
  if (s < 45) return "vừa xong";
  if (s < 3600) return `${Math.round(s / 60)} phút trước`;
  if (s < 86400) return `${Math.round(s / 3600)} giờ trước`;
  return `${Math.round(s / 86400)} ngày trước`;
}

const icon = (v) =>
  /^Đang làm/.test(v) ? "✏️" : /^Đạt điều kiện/.test(v) ? "🌟" : /^Đã xong/.test(v) ? "✅" : /^Xong cả/.test(v) ? "🌸" : /^Báo đã gửi bài nói/.test(v) ? "🎤" : /^Vào nhóm/.test(v) ? "👋" : /^Nhận huy hiệu/.test(v) ? "🏅" : "🎉";
const dangKhen = (v) => /^(Đạt điều kiện|Đã xong|Xong cả|Báo đã gửi bài nói|Nhận huy hiệu)/.test(v);
// "Đang làm Bài 1 · Trắc nghiệm: 12/40" → "đang làm Bài 1 · Trắc nghiệm: 12/40"
const loiViec = (v) => (/^Cả nhóm/.test(v) ? v : v.charAt(0).toLowerCase() + v.slice(1));

/** Dữ liệu dòng việc của nhóm (dùng chung cho thẻ và dải chạy). */
export function useHoatDong(ma, id) {
  const [ds, setDs] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const moRef = useRef(Date.now()); // việc sau lúc mở trang = "mới"
  const pull = useCallback(async () => {
    try {
      const d = await api(`${ma}/hoat-dong`, { id });
      setDs(d.ds || []);
      setNow(Date.now());
    } catch {
      /* lượt sau */
    }
  }, [ma, id]);
  useEffect(() => {
    pull();
    const t = setInterval(() => document.visibilityState === "visible" && pull(), MOI);
    const on = () => document.visibilityState === "visible" && pull();
    document.addEventListener("visibilitychange", on);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", on);
    };
  }, [pull]);
  return { ds, now, moLuc: moRef.current, reload: pull };
}

function tenOf(members, x, id) {
  if (x.id === "*") return "";
  if (x.id === id) return "Bạn";
  return members.find((m) => m.id === x.id)?.ten || x.id;
}

/** Thẻ "Nhóm đang học" (cột phải trang cây). */
export function SoiNoiCard({ ma, id, me, members, hd }) {
  const { ds, now, moLuc } = hd;
  const [daKhen, setDaKhen] = useState(() => new Set());
  const [msg, setMsg] = useState("");
  const online = members.filter((m) => m.dangO && now - new Date(m.dangO.luc).getTime() < ONLINE_MS);
  const khen = async (x, ten) => {
    setDaKhen((s) => new Set(s).add(x.k));
    try {
      await api(`${ma}/tin`, { id, body: { chu: `👏 ${me.ten} khen ${ten}: ${x.viec.replace(/^Đạt điều kiện/, "đạt").replace(/^Đã xong/, "xong").replace(/^Xong cả/, "xong cả").replace(/^Nhận huy hiệu/, "nhận huy hiệu")} — giỏi quá!` } });
      setMsg(`Đã gửi lời khen ${ten} vào Hỏi đáp.`);
    } catch {
      setMsg("Chưa gửi được lời khen — thử lại sau.");
    }
  };
  const list = ds.slice(0, 6); // chi tiết đầy đủ nằm trong Hỏi đáp
  return (
    <section className="nh-card nh-soinoi" aria-live="polite">
      <h2>
        <span className={`nh-live ${online.length ? "is-on" : ""}`} aria-hidden="true" /> Nhóm đang học
      </h2>
      {me && (
        <p className={`nh-toi-lua ${me.homNay === null ? "is-cho" : ""}`}>
          {me.chuoi > 0
            ? me.homNay === null
              ? <>🔥 Chuỗi <b>{me.chuoi} ngày</b> — hôm nay chưa học, làm vài câu để giữ chuỗi nhé!</>
              : <>🔥 Chuỗi <b>{me.chuoi} ngày</b> liên tiếp · hôm nay {me.homNay} câu</>
            : <>🌱 Làm vài câu hôm nay để bắt đầu chuỗi ngày học 🔥</>}
        </p>
      )}
      <p className="nh-online">
        {online.length ? (
          <>
            {online.map((m) => (
              <span key={m.id} className="nh-onchip">
                <i aria-hidden="true" /> {m.id === id ? "Bạn" : m.ten}
                {m.chuoi > 1 && <small> 🔥{m.chuoi}</small>}
              </span>
            ))}
            <span className="kt-muted"> đang trong bài</span>
          </>
        ) : (
          <span className="kt-muted">Chưa ai đang trong bài — vào làm trước, cả nhóm sẽ thấy bạn ở đây 💪</span>
        )}
      </p>
      {list.length ? (
        <ul className="nh-feed">
          {list.map((x) => {
            const ten = tenOf(members, x, id);
            const moi = new Date(x.luc).getTime() > moLuc;
            return (
              <li key={x.k} className={moi ? "is-new" : ""}>
                <span className="nh-feed-i" aria-hidden="true">{icon(x.viec)}</span>
                <span className="nh-feed-t">
                  {ten && <b>{ten}</b>} {loiViec(x.viec)} <small>· {agoVN(x.luc, now)}</small>
                </span>
                {dangKhen(x.viec) && x.id !== id && x.id !== "*" && (
                  <button type="button" className="nh-khen" disabled={daKhen.has(x.k)} onClick={() => khen(x, ten)} title="Gửi lời khen vào Hỏi đáp">
                    {daKhen.has(x.k) ? "Đã khen" : "👏 Khen"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="kt-muted">Chưa có hoạt động trong 3 ngày qua.</p>
      )}
      {msg && <p className="nh-msgline">{msg}</p>}
    </section>
  );
}

/** Dải "đang diễn ra" trên đầu cây — xoay vòng 3 việc mới nhất. */
export function SoiNoiStrip({ id, members, hd }) {
  const { ds, now } = hd;
  const top = ds.filter((x) => x.id !== id).slice(0, 3);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (top.length < 2) return;
    const t = setInterval(() => setI((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, [top.length]);
  const online = members.filter((m) => m.id !== id && m.dangO && now - new Date(m.dangO.luc).getTime() < ONLINE_MS).length;
  if (!top.length && !online) return null;
  const x = top.length ? top[i % top.length] : null;
  return (
    <div className="nh-strip" aria-live="polite">
      {online > 0 && (
        <span className="nh-strip-on">
          <i aria-hidden="true" /> {online} người đang học
        </span>
      )}
      {x && (
        <span key={x.k} className="nh-strip-t">
          {icon(x.viec)} <b>{tenOf(members, x, id)}</b> {loiViec(x.viec)} · {agoVN(x.luc, now)}
        </span>
      )}
    </div>
  );
}

/** Hỏi đáp trên trang bài: tự lấy dòng hoạt động của nhóm để chen vào khung chat. */
export function NhomChatHd(props) {
  const hd = useHoatDong(props.ma, props.who.id);
  return <NhomChat {...props} hd={hd} />;
}

/** #301 Hàng huy hiệu của một người (trên cây của người đó). */
export function HuyHieuRow({ m, la }) {
  const ds = [...(m?.huyHieu || [])].sort((a, b) => new Date(b.luc) - new Date(a.luc));
  return (
    <section className="nh-huyhieu" aria-label={`Huy hiệu của ${m.ten}`}>
      <b>🏅 Huy hiệu {la ? "của bạn" : `của ${m.ten}`}</b>
      {ds.length ? (
        <ul>
          {ds.map((x) => (
            <li key={x.ma} title={new Date(x.luc).toLocaleDateString("vi-VN")}>
              <span aria-hidden="true">{x.icon}</span> {x.ten}
            </li>
          ))}
        </ul>
      ) : (
        <span className="kt-muted"> Chưa có — xong bài đầu tiên trong nhóm hoặc học 3 ngày liền là có ngay 🔥</span>
      )}
    </section>
  );
}
