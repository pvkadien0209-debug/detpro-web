"use client";
// #230 Học cùng — phần dùng chung: tải nhóm (hỏi lại máy chủ định kỳ), đồng hồ chặng, chuông nhắc, nút chép, Hỏi đáp.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/lib/router";
import { Bell, Copy, Check, MessageCircle, Send, Mic, Square, Trash2, X, Reply, CircleCheck, Play, Pause, Tag } from "lucide-react";
import { api, ApiErr, tepUrl } from "./nhomClient";
import { dongHo, fmtHan } from "@/components/hkt/nhomRules";
import { startRecording, canRecord } from "@/components/hkt/recorder";

/** Tải GET /api/nhom/<mã> và hỏi lại mỗi `every` ms (mục 10: 10–15 giây). Lệch giờ máy ↔ máy chủ được bù (skew). */
export function useNhomView(ma, { every = 12000, k } = {}) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const skew = useRef(0);
  const load = useCallback(async () => {
    try {
      const d = k ? await api(`${ma}/huong-dan`, { k }) : await api(ma);
      skew.current = d.now - Date.now();
      setData(d);
      setErr(null);
      return d;
    } catch (e) {
      setErr(e);
      return null;
    }
  }, [ma, k]);
  useEffect(() => {
    load();
    if (!every) return;
    const t = setInterval(() => document.visibilityState === "visible" && load(), every);
    return () => clearInterval(t);
  }, [load, every]);
  return { data, err, reload: load, skew };
}

/** Đồng hồ chạy từng giây. */
export function useNow(skewRef, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now + (skewRef?.current || 0);
}

/** Chặng đang mở + đồng hồ. */
export function changInfo(nhom, now) {
  const ch = nhom.changHienTai || 0;
  const n = nhom.chuoi.bai.length;
  if (ch >= n) return { ch, xong: true };
  return { ch, u: nhom.chuoi.bai[ch], dh: dongHo(nhom.moChangLuc?.[ch], nhom.hanChangGio, now) };
}
export const baiLabel = (u, k) => (u?.kind === "tong" ? "Bài tổng" : `Bài ${k}`);

export function Countdown({ dh, big, label }) {
  if (!dh) return null;
  return (
    <span className={`nh-cd is-${dh.muc} ${big ? "is-big" : ""}`} role="timer" aria-live="off">
      <span aria-hidden="true">⏳</span> {label ? `${label} · ` : ""}
      {fmtHan(dh.con)}
    </span>
  );
}

/** Chuông nhắc (4a): lắc, chấm đỏ đếm số lần nhắc; càng gần hạn càng to, lắc nhanh hơn. */
export function NhacBell({ nhom, now, chuaXong }) {
  const { dh, ch } = changInfo(nhom, now);
  if (!nhom.nhacGio || !chuaXong) return null;
  const mo = nhom.moChangLuc?.[ch];
  if (!mo) return null;
  const lan = Math.floor((now - new Date(mo).getTime()) / (nhom.nhacGio * 3600e3));
  if (lan < 1) return null;
  const muc = dh?.muc || "xanh";
  const left = dh ? (dh.con >= 0 ? `Còn ${Math.max(1, Math.round(dh.con / 3600e3))} giờ!` : "Quá hạn rồi!") : "Làm bài thôi!";
  return (
    <span className={`nh-bell is-${muc}`} title={`Nhắc lần ${lan}: bạn chưa xong ${baiLabel(nhom.chuoi.bai[ch], ch)}`}>
      <img src="/brand/det-think.png" alt="" className="nh-bell-det" />
      <span className="nh-bell-ico">
        <Bell size={18} aria-hidden="true" />
        <b>{lan}</b>
      </span>
      <span className="nh-bell-t">{left}</span>
    </span>
  );
}

export function CopyBtn({ text, children, className = "kt-btn" }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          t.remove();
        }
        setOk(true);
        setTimeout(() => setOk(false), 1600);
      }}
    >
      {ok ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {ok ? "Đã chép" : children}
    </button>
  );
}

export const origin = () => (typeof window !== "undefined" ? window.location.origin : "https://detpro.vercel.app");

export function errText(e) {
  if (!e) return "";
  if (e instanceof ApiErr) {
    if (e.status === 404) return e.message;
    if (e.status === 500 && /MONGODB_URI/.test(e.message)) return "Máy chủ chưa nối cơ sở dữ liệu.";
    return e.message;
  }
  return "Mất kết nối — thử lại sau ít giây.";
}

// ---------- Hỏi đáp nhóm (mục 8) ----------
const fmtTime = (d) => {
  const x = new Date(d);
  const now = new Date();
  const hm = x.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return x.toDateString() === now.toDateString() ? hm : `${x.getDate()}/${x.getMonth() + 1} ${hm}`;
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function AudioMsg({ src, giay }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  return (
    <span className="nh-au">
      <button
        type="button"
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) a.play().catch(() => {});
          else a.pause();
        }}
        aria-label={on ? "Dừng" : "Nghe"}
      >
        {on ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
      </button>
      <span>Tin giọng {giay ? mmss(giay) : ""}</span>
      <audio ref={ref} src={src} preload="none" onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => setOn(false)} />
    </span>
  );
}

const lastSeenKey = (ma, who) => `dp.nhom.seen.${ma}.${who}`;
const readSeen = (ma, who) => {
  try {
    return localStorage.getItem(lastSeenKey(ma, who)) || "";
  } catch {
    return "";
  }
};
const writeSeen = (ma, who, v) => {
  try {
    localStorage.setItem(lastSeenKey(ma, who), v);
  } catch {
    /* bỏ qua */
  }
};

/**
 * Hỏi đáp: who = { id } (học viên) hoặc { k } (trưởng nhóm). gan = nhãn tự gắn khi hỏi từ trang bài.
 * floating: nút 💬 nổi + khung trượt; không thì hiện thẳng trong trang.
 */
export function NhomChat({ ma, who, gan, floating = false, chatTat, linkFor, slotId, chiBai }) {
  const [open, setOpen] = useState(!floating);
  const [all, setAll] = useState([]);
  // #250 (NHA E): chiBai = chỉ hiện tin gắn một bài (Hỏi đáp trên thân cây)
  const list = chiBai ? all.filter((x) => x.gan?.bai === chiBai || (x.traLoi && all.some((y) => y._id === x.traLoi && y.gan?.bai === chiBai))) : all;
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [useTag, setUseTag] = useState(true);
  const [rec, setRec] = useState(null); // { h, ms }
  const [draft, setDraft] = useState(null); // { blob, ms, url }
  const lastRef = useRef("");
  const boxRef = useRef(null);
  const meKey = who.k ? "huong-dan" : who.id;
  const [seen, setSeen] = useState("");
  useEffect(() => setSeen(readSeen(ma, meKey)), [ma, meKey]);
  const [slotEl, setSlotEl] = useState(null);
  useEffect(() => {
    if (!slotId) return;
    const find = () => setSlotEl(document.getElementById(slotId));
    find();
    const t = setInterval(find, 1000); // thanh nhóm có thể dựng lại
    return () => clearInterval(t);
  }, [slotId]);

  const pull = useCallback(async () => {
    try {
      const d = await api(`${ma}/tin`, { query: { sau: lastRef.current } });
      if (d.tin.length) {
        lastRef.current = d.tin[d.tin.length - 1].luc;
        setAll((l) => {
          const m = new Map(l.map((x) => [x._id, x]));
          d.tin.forEach((x) => m.set(x._id, x));
          return [...m.values()].sort((a, b) => new Date(a.luc) - new Date(b.luc));
        });
      }
    } catch {
      /* hỏi lại lượt sau */
    }
  }, [ma]);
  const full = useCallback(async () => {
    lastRef.current = "";
    setAll([]);
    await pull();
  }, [pull]);

  useEffect(() => {
    pull();
    const t = setInterval(() => document.visibilityState === "visible" && pull(), open ? 5000 : 30000);
    return () => clearInterval(t);
  }, [pull, open]);

  useEffect(() => {
    if (!open || !list.length) return;
    const last = list[list.length - 1].luc;
    writeSeen(ma, meKey, last);
    setSeen(last);
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const unread = list.filter((x) => !x.xoa && x.tu !== meKey && (!seen || new Date(x.luc) > new Date(seen))).length;
  const byId = new Map(list.map((x) => [x._id, x]));
  const tagNow = gan && useTag ? gan : null;

  const send = async () => {
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      if (draft) {
        const f = new FormData();
        f.append("audio", draft.blob, "tin.webm");
        f.append("giay", String(Math.round(draft.ms / 1000)));
        if (tagNow) f.append("gan", JSON.stringify(tagNow));
        if (reply) f.append("traLoi", reply._id);
        if (who.k) f.append("k", who.k);
        await api(`${ma}/tin`, { id: who.id, form: f });
        URL.revokeObjectURL(draft.url);
        setDraft(null);
      } else {
        if (!text.trim()) return;
        await api(`${ma}/tin`, { id: who.id, body: { chu: text, gan: tagNow, traLoi: reply?._id, k: who.k } });
        setText("");
      }
      setReply(null);
      await pull();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const startRec = async () => {
    setErr("");
    try {
      const h = await startRecording({
        maxMs: 120000,
        onTick: (ms) => setRec((r) => (r ? { ...r, ms } : r)),
        onAutoStop: () => stopRec(h),
      });
      setRec({ h, ms: 0 });
    } catch {
      setErr("Không mở được micro — cho phép micro trên thanh địa chỉ.");
    }
  };
  const stopRec = async (h = rec?.h) => {
    const r = await h?.stop();
    setRec(null);
    if (r?.blob) setDraft({ ...r, url: URL.createObjectURL(r.blob) });
  };
  const act = async (t, body) => {
    try {
      await api(`${ma}/tin/sua`, { id: who.id, body: { tin: t._id, k: who.k, ...body } });
      await full();
    } catch (e) {
      setErr(errText(e));
    }
  };

  const panel = (
    <section className={`nh-chat ${floating ? "is-float" : ""}`} aria-label="Hỏi đáp nhóm">
      <header>
        <b>
          <MessageCircle size={18} aria-hidden="true" /> Hỏi đáp nhóm
        </b>
        {floating && (
          <button type="button" onClick={() => setOpen(false)} aria-label="Đóng Hỏi đáp">
            <X size={20} />
          </button>
        )}
      </header>
      <div className="nh-msgs" ref={boxRef}>
        {!list.length && <p className="kt-muted nh-empty">Chưa có tin nào. Có gì chưa hiểu, hỏi ở đây — cả nhóm và trưởng nhóm cùng thấy.</p>}
        {list.map((t) => {
          const mine = t.tu === meKey;
          const q = t.traLoi && byId.get(t.traLoi);
          const cls = t.tu === "huong-dan" ? "is-hd" : t.tu === "det" ? "is-det" : mine ? "is-me" : "";
          return (
            <article key={t._id} className={`nh-msg ${cls} ${t.xoa ? "is-del" : ""}`}>
              <header>
                <b>{t.tu === "huong-dan" ? `${t.ten} · hướng dẫn` : t.ten}</b>
                <time>{fmtTime(t.luc)}</time>
                {t.daGiaiDap && (
                  <span className="nh-solved">
                    <CircleCheck size={13} aria-hidden="true" /> Đã giải đáp
                  </span>
                )}
              </header>
              {q && <blockquote>{q.xoa ? "(tin đã xoá)" : `${q.ten}: ${q.loai === "giong" ? "🎤 tin giọng" : q.chu.slice(0, 120)}`}</blockquote>}
              {t.gan?.nhan &&
                (linkFor && t.gan.bai ? (
                  <Link className="nh-tag" to={linkFor(t.gan)}>
                    <Tag size={12} aria-hidden="true" /> {t.gan.nhan}
                  </Link>
                ) : (
                  <span className="nh-tag">
                    <Tag size={12} aria-hidden="true" /> {t.gan.nhan}
                  </span>
                ))}
              {t.xoa ? <p className="kt-muted">(tin đã xoá)</p> : t.loai === "giong" ? (
                <>
                  {t.chu && <p>{t.chu}</p>}
                  <AudioMsg src={tepUrl(ma, t.tep)} giay={t.giay} />
                </>
              ) : <p>{t.chu}</p>}
              {!t.xoa && t.tu !== "det" && (
                <footer>
                  <button type="button" onClick={() => setReply(t)}>
                    <Reply size={13} aria-hidden="true" /> Trả lời
                  </button>
                  {(who.k || mine) && (
                    <button type="button" onClick={() => act(t, { daGiaiDap: !t.daGiaiDap })}>
                      <CircleCheck size={13} aria-hidden="true" /> {t.daGiaiDap ? "Bỏ đánh dấu" : "Đã giải đáp"}
                    </button>
                  )}
                  {(who.k || mine) && (
                    <button type="button" onClick={() => act(t, { xoa: true })}>
                      <Trash2 size={13} aria-hidden="true" /> Xoá
                    </button>
                  )}
                </footer>
              )}
            </article>
          );
        })}
      </div>
      {chatTat && !who.k ? (
        <p className="nh-chat-off">Trưởng nhóm đang tạm tắt Hỏi đáp.</p>
      ) : (
        <div className="nh-compose">
          {reply && (
            <p className="nh-replying">
              Trả lời {reply.ten}: {reply.loai === "giong" ? "🎤 tin giọng" : reply.chu.slice(0, 60)}
              <button type="button" onClick={() => setReply(null)} aria-label="Bỏ trả lời">
                <X size={14} />
              </button>
            </p>
          )}
          {gan && (
            <label className="nh-tagopt">
              <input type="checkbox" checked={useTag} onChange={(e) => setUseTag(e.target.checked)} /> Gắn nhãn “{gan.nhan}”
            </label>
          )}
          {rec ? (
            <div className="nh-recbar">
              <span className="hkt-u-tx-dot" aria-hidden="true" /> Đang ghi {mmss(rec.ms / 1000)} / 2:00
              <button type="button" className="kt-btn" onClick={() => stopRec()}>
                <Square size={14} aria-hidden="true" /> Dừng
              </button>
            </div>
          ) : draft ? (
            <div className="nh-recbar">
              <audio src={draft.url} controls />
              <button
                type="button"
                className="kt-btn"
                onClick={() => {
                  URL.revokeObjectURL(draft.url);
                  setDraft(null);
                }}
              >
                <Trash2 size={14} aria-hidden="true" /> Bỏ
              </button>
              <button type="button" className="kt-btn kt-btn--pri" onClick={send} disabled={busy}>
                <Send size={14} aria-hidden="true" /> Gửi
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea value={text} maxLength={2000} rows={2} placeholder="Viết câu hỏi hoặc trả lời…" onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              {canRecord() && (
                <button type="button" className="nh-ib" onClick={startRec} aria-label="Ghi tin giọng (tối đa 2 phút)" title="Tin giọng tối đa 2 phút">
                  <Mic size={18} />
                </button>
              )}
              <button type="submit" className="nh-ib is-pri" disabled={busy || !text.trim()} aria-label="Gửi">
                <Send size={18} />
              </button>
            </form>
          )}
          {err && <p className="hkt-u-err">{err}</p>}
        </div>
      )}
    </section>
  );

  if (!floating) return panel;
  // trang bài: nút Hỏi đáp nằm trong thanh "Đang ở nhóm" (không che phần luyện)
  const slot = slotEl && !open ? (
    createPortal(
      <button type="button" className="nh-chatbtn" onClick={() => setOpen(true)} aria-label={`Hỏi đáp nhóm${unread ? ` (${unread} tin mới)` : ""}`}>
        <MessageCircle size={16} aria-hidden="true" /> Hỏi đáp
        {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
      </button>,
      slotEl
    )
  ) : null;
  return (
    <>
      {slot}
      {!open && !slotEl && (
        <button type="button" className="nh-chatfab" onClick={() => setOpen(true)} aria-label={`Hỏi đáp nhóm${unread ? ` (${unread} tin mới)` : ""}`}>
          <MessageCircle size={24} aria-hidden="true" />
          {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
        </button>
      )}
      {open && panel}
    </>
  );
}
