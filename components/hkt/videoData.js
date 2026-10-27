"use client";
// #171 (SP12, YT1–YT2) — dữ liệu chung cho trang Video và trang xem một video.
// Video lấy từ thư mục Drive DetProMedia (tên <slug>--w01.mp4, ảnh bìa <slug>--w01.jpg) + dòng "drive" trong public/videos/dp/index.json;
// mỗi video gắn với bài trong mục lục (slug) → tên bài, chủ đề (= chuỗi bài), người học, thứ tự.
// Lịch sử xem / Xem sau lưu trên trình duyệt người xem (chưa cần đăng nhập — YT-Q6).
import { useEffect, useState } from "react";
import { loadUnitsIndex } from "./unitData";
import { loadManifest, loadDriveList, driveId, getDriveInfo } from "./UnitVideo";

let cache = null;
/** Danh sách video: [{ slug, drive, cover, u, t, b, order, rank, dur }] — order = thứ tự trong mục lục, rank = mới lên Drive (0 = mới nhất). */
export const loadVideos = () => {
  if (cache) return cache;
  cache = Promise.all([loadUnitsIndex().catch(() => null), loadDriveList(), loadManifest()]).then(([idx, drive, man]) => {
    const where = {};
    let order = 0;
    (idx?.branches || []).forEach((b) =>
      b.topics.forEach((t) =>
        t.units.forEach((u) => {
          order++;
          if (!where[u.slug]) where[u.slug] = { u, t, b, order };
          const k = `${u.audience}/${u.slug}`;
          if (!where[k]) where[k] = where[u.slug];
        })
      )
    );
    const info = getDriveInfo();
    const out = {};
    let rank = 0;
    // Drive trả tệp theo ngày sửa mới nhất trước → rank nhỏ = mới
    Object.entries(drive || {}).forEach(([name, id]) => {
      const m = name.match(/^(.+)--w01\.mp4$/);
      if (!m || out[m[1]]) return;
      out[m[1]] = { slug: m[1], drive: id, cover: drive[`${m[1]}--w01.jpg`], rank: rank++, dur: info[name]?.dur || 0, ...(where[m[1]] || {}) };
    });
    Object.entries(man || {}).forEach(([k, row]) => {
      const id = driveId(row?.drive);
      const slug = k.split("/").pop();
      if (id && !out[slug]) out[slug] = { slug, drive: id, cover: drive?.[`${slug}--w01.jpg`], rank: rank++, dur: 0, ...(where[k] || where[slug] || {}) };
    });
    const list = Object.values(out).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.slug.localeCompare(b.slug));
    return { idx, list, bySlug: out };
  });
  cache.catch(() => (cache = null));
  return cache;
};

export function useVideos() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let live = true;
    loadVideos().then((x) => live && setD(x));
    return () => {
      live = false;
    };
  }, []);
  return d;
}

/** "7:12" từ mili giây; 0 → "". */
export const fmtDur = (ms) => {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

export const coverUrl = (v, w = 640) => (v.cover || v.drive ? `https://drive.google.com/thumbnail?id=${v.cover || v.drive}&sz=w${w}` : null);

// ---------- Lưu trên trình duyệt: lịch sử (video đã mở) và Xem sau ----------
const K_HIS = "dp.video.history"; // [{ slug, at }] mới nhất trước, tối đa 50
const K_LATER = "dp.video.later"; // [slug]
const read = (k, d) => {
  try {
    const v = JSON.parse(window.localStorage.getItem(k));
    return Array.isArray(v) ? v : d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* bỏ qua */
  }
};
export const readHistory = () => read(K_HIS, []);
export const markOpened = (slug) => write(K_HIS, [{ slug, at: Date.now() }, ...readHistory().filter((h) => h.slug !== slug)].slice(0, 50));
export const clearHistory = () => write(K_HIS, []);
export const readLater = () => read(K_LATER, []);
export const toggleLater = (slug) => {
  const l = readLater();
  const n = l.includes(slug) ? l.filter((s) => s !== slug) : [slug, ...l];
  write(K_LATER, n);
  return n;
};

/** Video tiếp theo: các bài sau bài này trong cùng chuỗi (chủ đề) → phần đầu chuỗi → cùng người học → cùng nhánh → còn lại. */
export function upNext(list, cur, n = 12) {
  if (!cur) return list.slice(0, n);
  const same = list.filter((v) => v.t && cur.t && v.t.slug === cur.t.slug && v.slug !== cur.slug);
  const after = same.filter((v) => (v.order ?? 0) > (cur.order ?? 0));
  const before = same.filter((v) => (v.order ?? 0) < (cur.order ?? 0));
  const seen = new Set([cur.slug, ...same.map((v) => v.slug)]);
  const pick = (f) => {
    const got = list.filter((v) => !seen.has(v.slug) && f(v));
    got.forEach((v) => seen.add(v.slug));
    return got;
  };
  const aud = pick((v) => v.u && cur.u && v.u.audience === cur.u.audience);
  const br = pick((v) => v.b && cur.b && v.b.slug === cur.b.slug);
  const rest = pick(() => true);
  return [...after, ...before, ...aud, ...br, ...rest].slice(0, n);
}
