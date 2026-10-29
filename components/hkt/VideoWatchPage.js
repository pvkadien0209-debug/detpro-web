"use client";
// #171 (SP12 YT1) — Trang xem một video /videos/<bài>, "xem như YouTube":
//   khung video lớn (Drive — YT-Q1 #170; bấm ảnh bìa mới mở, không tự phát), tên bài, chuỗi, "Dành cho …", thời lượng,
//   vị trí trong chuỗi + "Bài tiếp", nút nhỏ Luyện 40 câu · Đọc bài · Xem sau (YT-Q5: lời mời học nhẹ), giới thiệu trích bài viết,
//   cột "Tiếp theo" (máy tính: bên phải; điện thoại: dưới video). Lịch sử "đã mở" lưu trên trình duyệt (YT-Q6).
import DriveVideo from "./DriveVideo"; // #272
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, BookOpen, ListChecks } from "lucide-react";
import KtShell from "./KtShell";
import { loadUnit, unitPath, lowerFirst } from "./unitData";
import { VongDetLoading } from "./VongDet";
import { useVideos, fmtDur, markOpened, readLater, toggleLater, upNext } from "./videoData";
import { VideoCard, VideoThumb, titleOf, topicOf } from "./VideosPage";

const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const cut = (s, n = 320) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")}…` : s);

export default function VideoWatchPage() {
  const { slug } = useParams();
  const data = useVideos();
  const v = data?.bySlug[slug];
  const idx = data?.idx;
  const [open, setOpen] = useState(false);
  const [later, setLater] = useState(() => readLater());
  const [intro, setIntro] = useState("");

  useEffect(() => {
    setOpen(false);
    window.scrollTo?.(0, 0);
  }, [slug]);

  useEffect(() => {
    let live = true;
    setIntro("");
    if (v?.u) loadUnit(v.u.audience, v.u.slug).then((u) => live && setIntro(cut(plain(u?.article?.intro)))).catch(() => {});
    return () => {
      live = false;
    };
  }, [v]);

  const chain = useMemo(() => (data && v?.t ? data.list.filter((x) => x.t?.slug === v.t.slug) : []), [data, v]);
  const pos = chain.findIndex((x) => x.slug === slug);
  const nextInChain = pos >= 0 ? chain[pos + 1] : null;
  const prevInChain = pos > 0 ? chain[pos - 1] : null;
  const next = useMemo(() => (data && v ? upNext(data.list, v, 12) : []), [data, v]);

  if (!data)
    return (
      <KtShell active="videos">
        <VongDetLoading size={28} />
      </KtShell>
    );
  if (!v)
    return (
      <KtShell active="videos">
        <h1 className="kt-h1">Không tìm thấy video này</h1>
        <p className="kt-lead">Video có thể chưa được tải lên hoặc đã đổi tên.</p>
        <Link className="kt-btn kt-btn--pri" to="/videos">
          Về trang Video
        </Link>
      </KtShell>
    );

  const title = titleOf(v);
  const who = v.u?.audienceTitle || v.t?.audienceTitle;
  const isLater = later.includes(slug);
  return (
    <KtShell active="videos">
      <Helmet>
        <title>{`${title} — video`}</title>
      </Helmet>
      <div className="kt-watch">
        <div className="kt-watch-main">
          <div className="kt-watch-player">
            {open ? (
              <DriveVideo id={v.drive} title={`Video: ${title}`} />
            ) : (
              <button
                type="button"
                className="kt-watch-cover"
                onClick={() => {
                  markOpened(slug);
                  setOpen(true);
                }}
                aria-label={`Xem video: ${title}`}
              >
                <VideoThumb v={v} idx={idx} w={1280} />
              </button>
            )}
          </div>

          <h1 className="kt-watch-t">{title}</h1>
          <p className="kt-watch-meta">
            {topicOf(v) && <span>{topicOf(v)}</span>}
            {who && <span>Dành cho {lowerFirst(who)}</span>}
            {v.dur > 0 && <span>{fmtDur(v.dur)}</span>}
            {chain.length > 1 && pos >= 0 && (
              <span>
                Bài {pos + 1}/{chain.length} trong chuỗi
              </span>
            )}
          </p>

          <div className="kt-watch-act">
            {v.u && (
              <>
                <Link className="kt-wbtn is-pri" to={unitPath(v.u.audience, v.u.slug, "quiz")}>
                  <ListChecks size={16} aria-hidden="true" /> Luyện 40 câu
                </Link>
                <Link className="kt-wbtn" to={unitPath(v.u.audience, v.u.slug)}>
                  <BookOpen size={16} aria-hidden="true" /> Đọc bài
                </Link>
              </>
            )}
            <button type="button" className={`kt-wbtn ${isLater ? "is-on" : ""}`} aria-pressed={isLater} onClick={() => setLater(toggleLater(slug))}>
              {isLater ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />} {isLater ? "Đã lưu xem sau" : "Xem sau"}
            </button>
          </div>

          {(prevInChain || nextInChain) && (
            <div className="kt-watch-chain">
              {prevInChain ? (
                <Link to={`/videos/${prevInChain.slug}`}>
                  <ArrowLeft size={15} aria-hidden="true" /> Bài trước
                </Link>
              ) : (
                <span />
              )}
              {nextInChain && (
                <Link to={`/videos/${nextInChain.slug}`} className="is-next">
                  Bài tiếp trong chuỗi: {titleOf(nextInChain)} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          {intro && <p className="kt-watch-intro">{intro}</p>}
        </div>

        <aside className="kt-watch-next" aria-label="Video tiếp theo">
          <h2>Tiếp theo</h2>
          {next.map((x) => (
            <VideoCard key={x.slug} v={x} idx={idx} compact />
          ))}
          <Link className="kt-vshelf-more" to="/videos">
            Tất cả video
          </Link>
        </aside>
      </div>
    </KtShell>
  );
}
