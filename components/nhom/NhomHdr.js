"use client";
// #232 Học cùng — HƯỚNG DẪN RIÊNG: tài liệu người hướng dẫn tự làm (video tự quay → link, audio, chữ…) gắn vào cả lớp / một bài / một phần.
// (Khác "hướng dẫn chung" = PartGuide + 7 video có sẵn, nói cách dùng từng phần.)
// Học viên: trong phần bài có hướng dẫn riêng → lần đầu tự hiện ra HỎI "xem ngay?", sau đó có nút trên thanh nhóm.
// Người hướng dẫn: thêm / xoá, đăng kèm lên Hỏi đáp, chép lời + link để gửi Zalo.
import React, { useEffect, useRef, useState } from "react";
import { Pin, ExternalLink, Trash2, Mic, Square, Upload, Plus } from "lucide-react";
import { Modal } from "@/components/hkt/UnitParts";
import { api, tepUrl } from "./nhomClient";
import { CopyBtn, origin, errText, baiLabel } from "./NhomShared";
import { startRecording, canRecord } from "@/components/hkt/recorder";
import { PART_KEYS, PART_SHORT, baiKey } from "@/components/hkt/nhomRules";
import { useAskTurn } from "@/components/hkt/askQueue";

const seenKey = (id) => `dp.hdr.seen.${id}`;
const isSeen = (id) => {
  try {
    return !!localStorage.getItem(seenKey(id));
  } catch {
    return true;
  }
};
const markSeen = (list) => {
  try {
    list.forEach((x) => localStorage.setItem(seenKey(x._id), "1"));
  } catch {
    /* bỏ qua */
  }
};

/** Hướng dẫn riêng áp cho một chỗ: bai = "aud/slug" | null (cả lớp), part = khoá phần | undefined (mọi phần của bài). */
export function hdrFor(hdr = [], bai, part) {
  if (!bai) return hdr.filter((x) => !x.bai);
  return hdr.filter((x) => x.bai === bai && (part === undefined || x.phan === "*" || x.phan === part));
}
export const hdrPlace = (nhom, x) => {
  if (!x.bai) return "Cả lớp";
  const k = nhom.chuoi.bai.findIndex((u) => baiKey(u) === x.bai);
  return `${k >= 0 ? baiLabel(nhom.chuoi.bai[k], k) : "Bài"}${x.phan !== "*" ? ` · ${PART_SHORT[x.phan] ?? x.phan}` : ""}`;
};

/** Video nhúng được: YouTube, Google Drive. */
function embedOf(url) {
  try {
    const u = new URL(url);
    const yt = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.hostname.includes("youtube.com") ? u.searchParams.get("v") || (u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null) : null;
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt}`;
    const d = u.hostname === "drive.google.com" && u.pathname.match(/\/file\/d\/([^/]+)/);
    if (d) return `https://drive.google.com/file/d/${d[1]}/preview`;
  } catch {
    /* không phải link */
  }
  return null;
}

export function HdrItem({ ma, nhom, x, onDelete }) {
  const emb = x.loai === "link" ? embedOf(x.url) : null;
  return (
    <article className="nh-hdr">
      <header>
        <Pin size={15} aria-hidden="true" /> <b>{x.tieuDe}</b>
        <small>{hdrPlace(nhom, x)}</small>
        {onDelete && (
          <button type="button" className="nh-mini is-danger" onClick={() => onDelete(x)}>
            <Trash2 size={12} aria-hidden="true" /> Xoá
          </button>
        )}
      </header>
      {x.chu && <p className="nh-hdr-chu">{x.chu}</p>}
      {x.loai === "audio" && x.tep && <audio src={tepUrl(ma, x.tep)} controls preload="none" />}
      {emb && (
        <div className="nh-hdr-vid">
          <iframe src={emb} title={x.tieuDe} allow="autoplay; fullscreen; encrypted-media" allowFullScreen loading="lazy" />
        </div>
      )}
      {x.loai === "link" && (
        <a className="kt-btn" href={x.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={15} aria-hidden="true" /> Mở link
        </a>
      )}
    </article>
  );
}

/** Học viên: nút + hỏi lần đầu cho các hướng dẫn riêng của một chỗ. */
export function HdrButton({ ma, nhom, list, className = "nh-hdrbtn", place }) {
  const [mode, setMode] = useState(null); // "ask" | "open"
  const ids = list.map((x) => x._id).join(",");
  useEffect(() => {
    setMode(list.some((x) => !isSeen(x._id)) ? "ask" : null);
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const turn = useAskTurn(`hdr-${ids}`, (mode === "ask" || mode === "open") && list.length > 0, 1); // giữ lượt cả khi đang mở xem // hướng dẫn riêng hỏi trước hướng dẫn chung
  if (!list.length) return null;
  const close = () => {
    markSeen(list);
    setMode(null);
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setMode("open")} title="Hướng dẫn riêng của người hướng dẫn">
        <Pin size={14} aria-hidden="true" /> <span className="t">Hướng dẫn riêng </span>({list.length})
      </button>
      {mode === "ask" && turn && (
        <div className="kt-guideask is-hdr" role="dialog" aria-label="Hướng dẫn riêng">
          <p>
            📌 {nhom.tenHuongDan || "Người hướng dẫn"} có <b>{list.length} hướng dẫn riêng</b> {place ? `cho ${place}` : ""} — xem ngay?
          </p>
          <div>
            <button type="button" className="is-pri" onClick={() => setMode("open")}>
              Xem ngay
            </button>
            <button type="button" onClick={close}>
              Để sau
            </button>
          </div>
          <small>Lúc nào cần, bấm nút “Hướng dẫn riêng”.</small>
        </div>
      )}
      <Modal open={mode === "open"} onClose={close} title={`Hướng dẫn riêng${place ? ` · ${place}` : ""}`} wide>
        <div className="nh-hdrlist">
          {list.map((x) => (
            <HdrItem key={x._id} ma={ma} nhom={nhom} x={x} />
          ))}
        </div>
      </Modal>
    </>
  );
}

/** Lời + link để dán sang Zalo. */
const shareText = (ma, nhom, x) =>
  [`📌 ${nhom.ten} — hướng dẫn riêng (${hdrPlace(nhom, x)}): ${x.tieuDe}`, x.chu, x.loai === "link" ? x.url : x.loai === "audio" ? `Nghe: ${origin()}${tepUrl(ma, x.tep)}` : "", `Vào học: ${origin()}/nhom/${ma}`]
    .filter(Boolean)
    .join("\n");

/** Người hướng dẫn: thêm / xem / xoá hướng dẫn riêng. */
export function HdrTab({ ma, k, data, reload }) {
  const { nhom } = data;
  const list = data.hdr || [];
  const [bai, setBai] = useState("");
  const [phan, setPhan] = useState("*");
  const [loai, setLoai] = useState("link");
  const [tieuDe, setTieuDe] = useState("");
  const [chu, setChu] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null); // { blob, ms, url, name }
  const [rec, setRec] = useState(null);
  const [dangChat, setDangChat] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  const reset = () => {
    setTieuDe("");
    setChu("");
    setUrl("");
    if (file?.url) URL.revokeObjectURL(file.url);
    setFile(null);
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (loai === "audio") {
        if (!file) throw new Error("Ghi âm hoặc chọn tệp âm thanh trước");
        const f = new FormData();
        f.append("audio", file.blob, file.name || "huong-dan.webm");
        Object.entries({ k, bai, phan, tieuDe, chu, giay: Math.round((file.ms || 0) / 1000), dangChat: dangChat ? "1" : "" }).forEach(([a, b]) => f.append(a, String(b)));
        await api(`${ma}/hdr`, { k, form: f });
      } else {
        await api(`${ma}/hdr`, { k, body: { k, bai: bai || null, phan, tieuDe, chu, url: loai === "link" ? url : "", dangChat } });
      }
      reset();
      await reload();
      setMsg("Đã thêm. Học viên sẽ được hỏi xem khi vào đúng chỗ" + (dangChat ? "; đã đăng lên Hỏi đáp." : "."));
    } catch (x) {
      setMsg(x.message && !x.status ? x.message : errText(x));
    } finally {
      setBusy(false);
    }
  };
  const startRec = async () => {
    try {
      const h = await startRecording({ maxMs: 15 * 60e3, onTick: (ms) => setRec((r) => (r ? { ...r, ms } : r)) });
      setRec({ h, ms: 0 });
    } catch {
      setMsg("Không mở được micro.");
    }
  };
  const stopRec = async () => {
    const r = await rec?.h.stop();
    setRec(null);
    if (r?.blob) setFile({ ...r, url: URL.createObjectURL(r.blob) });
  };
  const del = async (x) => {
    if (!window.confirm(`Xoá hướng dẫn riêng “${x.tieuDe}”?`)) return;
    try {
      await api(`${ma}/hdr/xoa`, { k, body: { k, hdr: x._id } });
      await reload();
    } catch (e) {
      setMsg(errText(e));
    }
  };
  const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

  return (
    <div className="nh-hdrtab">
      <form className="nh-card" onSubmit={save}>
        <h2>
          <Plus size={18} aria-hidden="true" /> Thêm hướng dẫn riêng
        </h2>
        <p className="kt-muted">Bài bạn tự quay (đưa lên YouTube / Drive rồi dán link), ghi âm giọng bạn, hoặc lời dặn bằng chữ. Học viên vào đúng bài / phần sẽ được hỏi xem.</p>
        <div className="nh-row">
          <label className="nh-field">
            <span className="nh-flabel">Gắn vào</span>
            <select value={bai} onChange={(e) => { setBai(e.target.value); setPhan("*"); }}>
              <option value="">Cả lớp (hiện ở cây nhóm)</option>
              {nhom.chuoi.bai.map((u, i) => (
                <option key={baiKey(u)} value={baiKey(u)}>
                  {baiLabel(u, i)} · {u.title.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
          {bai && (
            <label className="nh-field">
              <span className="nh-flabel">Phần</span>
              <select value={phan} onChange={(e) => setPhan(e.target.value)}>
                <option value="*">Mọi phần của bài</option>
                {PART_KEYS.map((p) => (
                  <option key={p} value={p}>
                    {PART_SHORT[p]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="nh-chips" role="group" aria-label="Loại">
          {[["link", "Link (video tự quay, tài liệu…)"], ["audio", "Âm thanh"], ["chu", "Chữ"]].map(([v, t]) => (
            <button key={v} type="button" className={loai === v ? "is-on" : ""} aria-pressed={loai === v} onClick={() => setLoai(v)}>
              {t}
            </button>
          ))}
        </div>
        <label className="nh-field">
          <span className="nh-flabel">Tiêu đề</span>
          <input value={tieuDe} maxLength={120} onChange={(e) => setTieuDe(e.target.value)} placeholder="Ví dụ: Cô chữa 5 câu hay sai ở Bài 2" />
        </label>
        {loai === "link" && (
          <label className="nh-field">
            <span className="nh-flabel">Link (YouTube, Google Drive… — YouTube và Drive xem được ngay trên trang)</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/… hoặc https://drive.google.com/file/d/…" required />
          </label>
        )}
        {loai === "audio" && (
          <div className="nh-field">
            <span className="nh-flabel">Âm thanh (ghi ngay hoặc chọn tệp, tối đa 4 MB)</span>
            {rec ? (
              <div className="nh-recbar">
                <span className="hkt-u-tx-dot" aria-hidden="true" /> Đang ghi {mmss(rec.ms)}
                <button type="button" className="kt-btn" onClick={stopRec}>
                  <Square size={14} aria-hidden="true" /> Dừng
                </button>
              </div>
            ) : file ? (
              <div className="nh-recbar">
                <audio src={file.url} controls />
                <button type="button" className="kt-btn" onClick={() => { URL.revokeObjectURL(file.url); setFile(null); }}>
                  <Trash2 size={14} aria-hidden="true" /> Bỏ
                </button>
              </div>
            ) : (
              <div className="nh-row">
                {canRecord() && (
                  <button type="button" className="kt-btn" onClick={startRec}>
                    <Mic size={14} aria-hidden="true" /> Ghi âm
                  </button>
                )}
                <button type="button" className="kt-btn" onClick={() => fileRef.current?.click()}>
                  <Upload size={14} aria-hidden="true" /> Chọn tệp
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile({ blob: f, ms: 0, url: URL.createObjectURL(f), name: f.name });
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
        )}
        <label className="nh-field">
          <span className="nh-flabel">{loai === "chu" ? "Nội dung" : "Lời dặn kèm (tuỳ chọn)"}</span>
          <textarea rows={3} maxLength={3000} value={chu} onChange={(e) => setChu(e.target.value)} required={loai === "chu"} />
        </label>
        <label className="nh-switch">
          <input type="checkbox" checked={dangChat} onChange={(e) => setDangChat(e.target.checked)} /> Đăng kèm lên Hỏi đáp nhóm
        </label>
        <button type="submit" className="kt-btn kt-btn--pri" disabled={busy || rec}>
          {busy ? "Đang lưu…" : "Thêm hướng dẫn riêng"}
        </button>
        {msg && <p className="nh-msgline">{msg}</p>}
      </form>
      <section className="nh-card">
        <h2>
          <Pin size={18} aria-hidden="true" /> Đã có ({list.length})
        </h2>
        {!list.length && <p className="kt-muted">Chưa có hướng dẫn riêng nào.</p>}
        <div className="nh-hdrlist">
          {list.map((x) => (
            <div key={x._id} className="nh-hdrwrap">
              <HdrItem ma={ma} nhom={nhom} x={x} onDelete={del} />
              <CopyBtn text={shareText(ma, nhom, x)} className="nh-mini">
                Chép để gửi Zalo
              </CopyBtn>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
