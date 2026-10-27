"use client";
// #163 — Trang "Video": tất cả video tóm tắt bài đã có (thư mục Drive DetProMedia + public/videos/dp/index.json).
// #171 (SP12 YT2, chốt YT-Q3): mặc định xem dạng KỆ như YouTube — "Đã mở gần đây", "Xem sau", "Mới", rồi mỗi chuỗi bài một kệ
//   cuộn ngang; nút chuyển sang LƯỚI (tìm + lọc chủ đề như #163). Bấm thẻ → trang xem /videos/<bài> (VideoWatchPage).
//   Video vẫn phát bằng Drive (YT-Q1, #170). Không tự phát.
import React, { useMemo, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Play, Search, Rows3, LayoutGrid } from "lucide-react";
import KtShell from "./KtShell";
import { topicColor, lowerFirst } from "./unitData";
import { VongDetLoading } from "./VongDet";
import { useVideos, fmtDur, coverUrl, readHistory, readLater } from "./videoData";
import useStoredState from "./useStoredState";

const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
export const titleOf = (v) => v.u?.title || v.slug;
export const topicOf = (v) => v.t?.title?.vi || v.t?.title || "";

/** Ảnh bìa + thời lượng; dùng chung cho thẻ, kệ, cột "Tiếp theo". */
export function VideoThumb({ v, idx, w = 640 }) {
  const [noThumb, setNoThumb] = useState(false);
  const thumb = coverUrl(v, w);
  return (
    <span className="kt-vthumb" style={{ background: v.t ? topicColor(idx, v.t.slug) : "#334155" }}>
      {thumb && !noThumb && <img src={thumb} alt="" loading="lazy" onError={() => setNoThumb(true)} />}
      {(noThumb || !thumb) && <span className="kt-vcard-ph">{titleOf(v)}</span>}
      {v.dur > 0 && <span className="kt-vthumb-dur">{fmtDur(v.dur)}</span>}
      <span className="kt-vcard-play" aria-hidden="true">
        <Play size={16} fill="currentColor" />
      </span>
    </span>
  );
}

export function VideoCard({ v, idx, compact }) {
  const who = v.u?.audienceTitle || v.t?.audienceTitle;
  // #196: màu của chủ đề (giống ảnh bìa chủ đề) → viền, nhãn chủ đề, nền nhạt của thẻ
  const tc = v.t ? topicColor(idx, v.t.slug) : "#334155";
  return (
    <Link className={`kt-vcard ${compact ? "is-compact" : ""}`} style={{ "--tc": tc }} to={`/videos/${v.slug}`} aria-label={`Xem video: ${titleOf(v)}`}>
      <span className="kt-vcard-media">
        <VideoThumb v={v} idx={idx} w={compact ? 320 : 640} />
      </span>
      <span className="kt-vcard-body">
        {topicOf(v) && <span className="kt-vcard-topic">{topicOf(v)}</span>}
        <span className="kt-vcard-t">{titleOf(v)}</span>
        {who && !compact && <span className="kt-vcard-who">Dành cho {lowerFirst(who)}</span>}
      </span>
    </Link>
  );
}

function Shelf({ title, items, idx, more }) {
  if (!items.length) return null;
  return (
    <section className="kt-vshelf">
      <div className="kt-vshelf-h">
        <h2>{title}</h2>
        {more}
      </div>
      <div className="kt-vshelf-row">
        {items.map((v) => (
          <VideoCard key={v.slug} v={v} idx={idx} />
        ))}
      </div>
    </section>
  );
}

export default function VideosPage() {
  const data = useVideos();
  const list = data?.list;
  const idx = data?.idx;
  const [view, setView] = useStoredState("dp.video.view", "shelf");
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");

  const topics = useMemo(() => {
    const seen = new Map();
    (list || []).forEach((v) => v.t && !seen.has(v.t.slug) && seen.set(v.t.slug, topicOf(v)));
    return [...seen];
  }, [list]);

  const shown = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    return (list || []).filter(
      (v) => (!topic || v.t?.slug === topic) && words.every((w) => fold(`${v.u?.title} ${v.u?.titleEn} ${topicOf(v)} ${v.slug}`).includes(w))
    );
  }, [list, q, topic]);

  const shelves = useMemo(() => {
    if (!list) return null;
    const by = data.bySlug;
    const pick = (slugs) => slugs.map((s) => by[s]).filter(Boolean).slice(0, 15);
    const history = pick(readHistory().map((h) => h.slug));
    const later = pick(readLater());
    const fresh = [...list].sort((a, b) => a.rank - b.rank).slice(0, 15);
    const byTopic = topics.map(([slug, name]) => ({ slug, name, items: list.filter((v) => v.t?.slug === slug) }));
    const loose = list.filter((v) => !v.t);
    return { history, later, fresh, byTopic, loose };
  }, [list, data, topics]);

  const searching = q.trim() || topic;
  const grid = view === "grid" || searching;

  return (
    <KtShell active="videos">
      <Helmet>
        <title>Video tóm tắt bài học</title>
      </Helmet>
      <div className="kt-vtop">
        <h1 className="kt-h1">Video</h1>
        {list?.length > 0 && (
          <div className="kt-vview" role="group" aria-label="Cách hiện">
            <button
              type="button"
              className={!grid ? "is-on" : ""}
              aria-pressed={!grid}
              onClick={() => {
                setQ("");
                setTopic("");
                setView("shelf");
              }}
            >
              <Rows3 size={16} aria-hidden="true" /> Kệ
            </button>
            <button type="button" className={grid ? "is-on" : ""} aria-pressed={grid} onClick={() => setView("grid")}>
              <LayoutGrid size={16} aria-hidden="true" /> Lưới
            </button>
          </div>
        )}
      </div>
      <p className="kt-lead">Chọn một video để xem; xem xong có video tiếp theo. Muốn học kỹ thì bấm “Luyện 40 câu” dưới video.</p>
      {!list && <VongDetLoading size={28} />}
      {list && !list.length && <p className="kt-muted">Chưa có video nào.</p>}
      {list?.length > 0 && (
        <>
          <div className="kt-vbar">
            <label className="kt-vsearch">
              <Search size={16} aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên bài, chủ đề…" aria-label="Tìm video" />
            </label>
            {topics.length > 1 && (
              <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Lọc theo chủ đề">
                <option value="">Tất cả chủ đề ({list.length})</option>
                {topics.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            {grid && <span className="kt-muted">{shown.length} video</span>}
          </div>
          {grid ? (
            <>
              <div className="kt-vgrid">
                {shown.map((v) => (
                  <VideoCard key={v.slug} v={v} idx={idx} />
                ))}
              </div>
              {!shown.length && <p className="kt-muted">Không thấy video phù hợp.</p>}
            </>
          ) : (
            <>
              <Shelf title="Đã mở gần đây" items={shelves.history} idx={idx} />
              <Shelf title="Xem sau" items={shelves.later} idx={idx} />
              <Shelf title="Mới" items={shelves.fresh} idx={idx} />
              {shelves.byTopic.map((s) => (
                <Shelf
                  key={s.slug}
                  title={s.name}
                  items={s.items}
                  idx={idx}
                  more={
                    s.items.length > 1 && (
                      <Link className="kt-vshelf-more" to={`/videos/${s.items[0].slug}`}>
                        Xem cả chuỗi ({s.items.length})
                      </Link>
                    )
                  }
                />
              ))}
              <Shelf title="Video khác" items={shelves.loose} idx={idx} />
            </>
          )}
        </>
      )}
    </KtShell>
  );
}
