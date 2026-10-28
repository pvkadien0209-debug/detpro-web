"use client";
// SP10 · #098 — Video tóm tắt bài (khuôn W, 16:9) đặt dưới tên bài, không tự phát (VQ9, VW-Q).
// Danh sách video: public/videos/dp/index.json  { "<audience>/<slug>": { file, poster, duration } }
// Video do my-sta-video (CSK004) render; bài chưa có video thì không hiện gì.
// #115: video nhúng từ Google Drive (thư mục chia sẻ "bất cứ ai có đường liên kết"): dòng manifest ghi
//   "drive": "<mã tệp>" hoặc nguyên đường dẫn https://drive.google.com/file/d/<mã>/view → phát bằng khung xem của Drive.
import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const base = () => `/videos/dp`;
let manifest = null;
export const loadManifest = () => // #163: dùng chung cho trang Video
  (manifest ||= fetch(`${base()}/index.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({})));

// #116: danh sách tệp trong thư mục Drive (tên → mã tệp), tải một lần.
let driveList = null;
// #171: thông tin thêm của từng tệp (tên → { dur: độ dài ms của video, t: ngày sửa }) cho trang Video
const driveInfo = {};
export const getDriveInfo = () => driveInfo;
// #165: thư mục DetProMedia có thể chia thư mục con (video / img / audio …) → đọc cả thư mục con (sâu tối đa 2 cấp).
//   Tên tệp vẫn phải là duy nhất: <slug>--w01.mp4, <slug>--w01.jpg …; trùng tên thì lấy tệp sửa gần nhất.
// #190 (Next.js): việc đọc thư mục Drive chuyển sang máy chủ (lib/drive.server.js, /api/drive-list) — khoá API không còn
// nằm trong mã trình duyệt. Trả về đúng dạng cũ: { "<tên tệp>": "<mã tệp>" }; getDriveInfo() vẫn có dur/t của từng tệp.
export const loadDriveList = () => {
  if (driveList) return driveList;
  return (driveList = fetch("/api/drive-list")
    .then((r) => (r.ok ? r.json() : { files: {}, info: {} }))
    .then((d) => {
      Object.assign(driveInfo, d.info || {});
      return d.files || {};
    })
    .catch(() => ({})));
};

// #241: tập hợp bài ĐÃ CÓ VIDEO (Drive <slug>--w01.mp4 hoặc dòng manifest) → tick xanh ở thẻ chủ đề, trang chủ đề, mục lục
let videoSetP = null;
export const loadVideoSet = () =>
  (videoSetP ||= Promise.all([loadManifest(), loadDriveList()]).then(([m, list]) => {
    const s = new Set();
    Object.keys(list).forEach((f) => f.endsWith("--w01.mp4") && s.add(f.slice(0, -9)));
    Object.entries(m).forEach(([k, row]) => (row?.drive || row?.file) && s.add(k));
    return s;
  }));
export const hasVideo = (set, u) => !!set && (set.has(u.slug) || set.has(`${u.audience}/${u.slug}`));
/** Hook: Set bài có video (null khi chưa tải). */
export function useVideoSet() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let live = true;
    loadVideoSet().then((x) => live && setS(x));
    return () => {
      live = false;
    };
  }, []);
  return s;
}

/** Lấy mã tệp Drive từ mã trần hoặc đường dẫn /file/d/<mã>/… hoặc ?id=<mã>. */
export const driveId = (x) => {
  if (!x) return null;
  const m = String(x).match(/\/file\/d\/([\w-]{10,})/) || String(x).match(/[?&]id=([\w-]{10,})/);
  return m ? m[1] : /^[\w-]{10,}$/.test(x) ? x : null;
};

export default function UnitVideo({ audience, slug, title }) {
  const [v, setV] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let live = true;
    setV(null);
    setOpen(false);
    // Thứ tự: dòng "drive" trong index.json → tệp cùng tên <slug>--w01.mp4 trong thư mục Drive → dòng "file" (video thử)
    Promise.all([loadManifest(), loadDriveList()]).then(([m, list]) => {
      if (!live) return;
      const row = m[`${audience}/${slug}`] || {};
      const id = row.drive || list[`${slug}--w01.mp4`];
      setV(id || row.file ? { ...row, drive: id || null, cover: list[`${slug}--w01.jpg`] || null } : null); // #164: ảnh bìa
    });
    return () => {
      live = false;
    };
  }, [audience, slug]);

  useEffect(() => {
    if (open) ref.current?.play().catch(() => {});
  }, [open]);

  if (!v) return null;
  const drive = driveId(v.drive);
  if (!drive && !v.file) return null;
  const src = drive ? `https://drive.google.com/file/d/${drive}/preview` : `${base()}/${v.file}`;
  const poster = v.poster ? `${base()}/${v.poster}` : v.cover || drive ? `https://drive.google.com/thumbnail?id=${v.cover || drive}&sz=w1280` : undefined;
  return (
    <figure className="kt-uvideo">
      {open && drive ? (
        <iframe src={src} title={`Video tóm tắt: ${title}`} allow="autoplay; fullscreen" allowFullScreen loading="lazy" />
      ) : open ? (
        <video ref={ref} src={src} poster={poster} controls playsInline preload="metadata" aria-label={`Video tóm tắt: ${title}`} />
      ) : (
        <button type="button" className="kt-uvideo-cover" onClick={() => setOpen(true)} aria-label={`Xem video tóm tắt${v.duration ? ` (${v.duration})` : ""}`}>
          {poster && <img src={poster} alt="" loading="lazy" />}
          <span className="kt-uvideo-play">
            <Play size={28} aria-hidden="true" fill="currentColor" />
          </span>
          <span className="kt-uvideo-tag">▶ Xem tóm tắt{v.duration ? ` · ${v.duration}` : ""}</span>
        </button>
      )}
      <figcaption>{drive ? "Video tóm tắt bài" : "Video tóm tắt bài · chưa có giọng đọc (bản thử)"}</figcaption>
    </figure>
  );
}
