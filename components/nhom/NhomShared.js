"use client";
// #230 Học cùng — phần dùng chung: tải nhóm (hỏi lại máy chủ định kỳ), đồng hồ chặng, chuông nhắc, nút chép, Hỏi đáp.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/lib/router";
import { Bell, Copy, Check, MessageCircle, Send, Mic, Square, Trash2, X, Reply, CircleCheck, Play, Pause, Tag } from "lucide-react";
import { api, ApiErr, tepUrl } from "./nhomClient";
import { dongHo, fmtHan, NHAN_DOC } from "@/components/hkt/nhomRules";
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
// #298 dòng "ai đang làm gì" chen trong Hỏi đáp (chỉ hiển thị, không lưu thành tin)
const HD_ICON = (v) => (/^Đang làm/.test(v) ? "✏️" : /^Đạt điều kiện/.test(v) ? "🌟" : /^Đã xong/.test(v) ? "✅" : /^Xong cả/.test(v) ? "🌸" : /^Báo đã gửi bài nói/.test(v) ? "🎤" : /^Vào nhóm/.test(v) ? "👋" : /^Nhận huy hiệu/.test(v) ? "🏅" : "🎉");
const K_HD = "dp.nhom.chatHoatDong";

/** #359 mở khung Hỏi đáp và điền sẵn lời (người học sửa rồi tự bấm Gửi). */
export const vietChat = (text) => {
  try { window.dispatchEvent(new CustomEvent("nh-chat-viet", { detail: text })); } catch { /* bỏ qua */ }
};
/** #359 khối "Chưa đọc được?" — 2 nút điền sẵn lời nhắn người hướng dẫn. */
export function NhanDoc({ bai, gon = false }) {
  return (
    <div className={`nh-nhandoc${gon ? " is-gon" : ""}`}>
      <p>{NHAN_DOC.ghiChu}</p>
      <div className="nh-row">
        <button type="button" className="kt-btn" onClick={() => vietChat(NHAN_DOC.choNay(bai))}>💬 Chỗ này mình chưa đọc được</button>
        <button type="button" className="kt-btn" onClick={() => vietChat(NHAN_DOC.tuDau)}>🆘 Chưa biết đọc, cần học từ đầu</button>
      </div>
    </div>
  );
}

export function NhomChat({ ma, who, gan, floating = false, chatTat, linkFor, slotId, chiBai, hd, members = [] }) {
  const [hienHd, setHienHd] = useState(true);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(K_HD) === "0") setHienHd(false);
    } catch {
      /* mặc định bật */
    }
  }, []);
  const doiHienHd = () =>
    setHienHd((v) => {
      try {
        window.localStorage.setItem(K_HD, v ? "0" : "1");
      } catch {
        /* bỏ qua */
      }
      return !v;
    });
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
  const taRef = useRef(null); // #354 bấm vào tin → trả lời
  useEffect(() => {
    // #359 nút "Nhắn người hướng dẫn" ở nơi khác → mở chat, điền sẵn lời
    const nghe = (e) => {
      setOpen(true);
      setText(String(e.detail || ""));
      setTimeout(() => { const t = taRef.current; if (t) { t.focus(); t.scrollIntoView({ block: "center", behavior: "smooth" }); } }, 60);
    };
    window.addEventListener("nh-chat-viet", nghe);
    return () => window.removeEventListener("nh-chat-viet", nghe);
  }, []);
  const traLoiTin = (t) => {
    if (t.xoa || t.tu === "det" || (chatTat && !who.k)) return;
    setReply(t);
    setTimeout(() => taRef.current?.focus(), 30);
  };
  const toiTin = (tid) => {
    const el = boxRef.current?.querySelector(`[data-tin="${tid}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("is-flash");
    setTimeout(() => el.classList.remove("is-flash"), 1400);
  };
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
    // #298 khung mở sẵn cạnh cây: 10 giây; bong bóng đóng: 15 giây (để tin mới hiện xem trước)
    const t = setInterval(() => document.visibilityState === "visible" && pull(), open ? (floating ? 5000 : 10000) : 15000);
    return () => clearInterval(t);
  }, [pull, open, floating]);

  // #298 bong bóng Hỏi đáp mở → ẩn Đét trợ thủ (không che ô gõ trên điện thoại)
  useEffect(() => {
    if (!floating || !open) return;
    document.body.classList.add("nh-chat-mo");
    return () => document.body.classList.remove("nh-chat-mo");
  }, [floating, open]);

  // #298 tin mới của người khác khi bong bóng đang đóng → hiện xem trước vài giây cạnh nút
  const moLuc = useRef(Date.now());
  const [peek, setPeek] = useState(null);
  useEffect(() => {
    if (!floating || open || !list.length) return;
    const t = list[list.length - 1];
    if (t.xoa || t.tu === meKey || new Date(t.luc).getTime() < moLuc.current) return;
    setPeek(t);
    const h = setTimeout(() => setPeek(null), 7000);
    return () => clearTimeout(h);
  }, [list.length, open, floating]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {hd && !chiBai && (
          <button type="button" className={`nh-hdtoggle ${hienHd ? "is-on" : ""}`} onClick={doiHienHd} title="Hiện / ẩn dòng ai đang làm gì trong Hỏi đáp">
            {hienHd ? "✏️ Hoạt động: bật" : "✏️ Hoạt động: tắt"}
          </button>
        )}
        {floating && (
          <button type="button" onClick={() => setOpen(false)} aria-label="Đóng Hỏi đáp">
            <X size={20} />
          </button>
        )}
      </header>
      <div className="nh-msgs" ref={boxRef}>
        {!list.length && <p className="kt-muted nh-empty">Chưa có tin nào. Có gì chưa hiểu, hỏi ở đây — cả nhóm và trưởng nhóm cùng thấy.</p>}
        {(() => {
          // #298 trộn tin + dòng hoạt động theo thời gian
          const hds = hd && hienHd && !chiBai ? hd.ds.slice(0, 30).map((x) => ({ _hd: true, ...x })) : [];
          if (!hds.length) return list;
          return [...list, ...hds].sort((a, b) => new Date(a.luc) - new Date(b.luc));
        })().map((t) => {
          if (t._hd) {
            const ten = t.id === "*" ? "" : t.id === who.id ? "Bạn" : members.find((m) => m.id === t.id)?.ten || t.id;
            const v = /^Cả nhóm/.test(t.viec) ? t.viec : t.viec.charAt(0).toLowerCase() + t.viec.slice(1);
            return (
              <p key={`hd-${t.k}`} className="nh-hdline">
                <span aria-hidden="true">{HD_ICON(t.viec)}</span> {ten && <b>{ten}</b>} {v} <time>{fmtTime(t.luc)}</time>
              </p>
            );
          }
          const mine = t.tu === meKey;
          const q = t.traLoi && byId.get(t.traLoi);
          const cls = t.tu === "huong-dan" ? "is-hd" : t.tu === "det" ? "is-det" : mine ? "is-me" : "";
          return (
            <article
              key={t._id}
              data-tin={t._id}
              className={`nh-msg ${cls} ${t.xoa ? "is-del" : ""} ${!t.xoa && t.tu !== "det" ? "is-bam" : ""} ${reply?._id === t._id ? "is-traloi" : ""}`}
              title={!t.xoa && t.tu !== "det" ? "Bấm vào tin để trả lời (câu trả lời đính kèm tin này)" : undefined}
              onClick={(e) => {
                if (e.target.closest("a,button,audio,input,textarea,blockquote")) return;
                traLoiTin(t);
              }}
            >
              <header>
                <b>{t.tu === "huong-dan" ? `${t.ten} · hướng dẫn` : t.ten}</b>
                <time>{fmtTime(t.luc)}</time>
                {t.daGiaiDap && (
                  <span className="nh-solved">
                    <CircleCheck size={13} aria-hidden="true" /> Đã giải đáp
                  </span>
                )}
              </header>
              {q && (
                <blockquote className="is-bam" title="Bấm để tới tin gốc" onClick={() => toiTin(q._id)}>
                  ↩ {q.xoa ? "(tin đã xoá)" : `${q.ten}: ${q.loai === "giong" ? "🎤 tin giọng" : q.chu.slice(0, 120)}`}
                </blockquote>
              )}
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
          {gan && !who.k && !text && !reply && (
            <p className="nh-docnhanh">
              {/* #359 trong bài: gắn sẵn câu đang làm → chỉ cần bấm */}
              <button type="button" onClick={() => { setText(`🔤 Câu này mình chưa đọc được: … (ghi từ / chỗ khó). Nhờ người hướng dẫn chỉ cách đọc.`); setUseTag(true); setTimeout(() => taRef.current?.focus(), 30); }}>🔤 Câu này mình chưa đọc được</button>
              <button type="button" onClick={() => { setText(NHAN_DOC.tuDau); setTimeout(() => taRef.current?.focus(), 30); }}>🆘 Chưa biết đọc, cần học từ đầu</button>
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
              <textarea ref={taRef} value={text} maxLength={2000} rows={2} placeholder={reply ? `Trả lời ${reply.ten}…` : "Viết câu hỏi… (bấm vào một tin để trả lời tin đó)"} onChange={(e) => setText(e.target.value)}
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
      {!open && peek && (
        <button type="button" className={`nh-chatpeek ${slotEl ? "is-top" : ""}`} onClick={() => { setPeek(null); setOpen(true); }}>
          <b>{peek.tu === "det" ? "Đét" : peek.ten}:</b> {peek.loai === "giong" ? "🎤 tin giọng" : (peek.chu || "").slice(0, 90)}
        </button>
      )}
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

// ---------- #268 Nhận xét bài nói: chữ thường có định dạng nhẹ (an toàn, không HTML) ----------
// Quy ước (giống chữ dán từ Claude / ChatGPT / Word): "- " hoặc "• " gạch đầu dòng · thụt 2 dấu cách = ý con · "1. " danh sách số ·
// **đậm** · `mã / đường dẫn` · "# Tiêu đề" · dòng trống = đoạn mới · link https://… bấm được.
const inlineFmt = (s, key) =>
  s.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g).map((x, i) =>
    /^\*\*[^*]+\*\*$/.test(x) ? (
      <b key={`${key}-${i}`}>{x.slice(2, -2)}</b>
    ) : /^`[^`]+`$/.test(x) ? (
      <code key={`${key}-${i}`}>{x.slice(1, -1)}</code>
    ) : /^https?:\/\//.test(x) ? (
      <a key={`${key}-${i}`} href={x} target="_blank" rel="noopener noreferrer">
        {x}
      </a>
    ) : (
      x
    )
  );
export function NhanXet({ text, className = "" }) {
  if (!text) return null;
  const blocks = [];
  let list = null; // { so: bool, li: [{ t, con: [] }] }
  String(text)
    .replace(/\r/g, "")
    .split("\n")
    .forEach((line, i) => {
      const bul = line.match(/^(\s*)[-•*]\s+(.*)$/);
      const num = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
      const m = bul ? { thut: bul[1].length, so: false, t: bul[2] } : num ? { thut: num[1].length, so: true, t: num[3] } : null;
      if (m) {
        if (!m.t.trim()) return; // gạch đầu dòng trống (mẫu chưa điền) → bỏ
        if (m.thut >= 2 && list?.li.length) return void list.li[list.li.length - 1].con.push(inlineFmt(m.t, i)); // ý con
        if (!list || list.so !== m.so) blocks.push((list = { so: m.so, li: [] }));
        list.li.push({ t: inlineFmt(m.t, i), con: [] });
        return;
      }
      list = null;
      const h = line.match(/^#{1,4}\s+(.*)$/);
      if (h) blocks.push({ h: inlineFmt(h[1], i) });
      else if (line.trim()) blocks.push({ p: inlineFmt(line, i) });
      else blocks.push({ gap: true });
    });
  const Li = ({ x }) => (
    <li>
      {x.t}
      {x.con.length > 0 && (
        <ul>
          {x.con.map((c, j) => (
            <li key={j}>{c}</li>
          ))}
        </ul>
      )}
    </li>
  );
  return (
    <div className={`nh-nx ${className}`}>
      {blocks.map((b, i) =>
        b.li ? (
          b.so ? (
            <ol key={i}>{b.li.map((x, j) => <Li key={j} x={x} />)}</ol>
          ) : (
            <ul key={i}>{b.li.map((x, j) => <Li key={j} x={x} />)}</ul>
          )
        ) : b.h ? (
          <h4 key={i}>{b.h}</h4>
        ) : b.p ? (
          <p key={i}>{b.p}</p>
        ) : (
          <div key={i} className="nh-nx-gap" />
        )
      )}
    </div>
  );
}
