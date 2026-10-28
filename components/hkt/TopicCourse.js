"use client";
// SP09 (#063, Đ4) — Trang chủ đề kiểu trang khoá học (tham khảo F8):
// tên to · mô tả · "Chuỗi này viết cho …" · "Bạn sẽ biết cách" (mỗi bài một dòng ✓) · "Nội dung chuỗi" mở/gập N bài × 5 phần (số bài lấy từ dữ liệu, #078) (✓ đã xong)
// · thẻ dính bên phải với nút Bắt đầu học / Học tiếp bài N · điện thoại: nút dính dưới.
// #079: chọn bài và theo dõi tiến độ ngay ở đây — mỗi bài có nút vào học (Bắt đầu / Học tiếp / Ôn lại) + 5 chấm tiến độ;
// dòng "Bạn sẽ biết cách" bấm được để vào bài.
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Check, ChevronDown, Layers, Clock, BookOpen, Mic, Users, Table2, MousePointerClick, ListChecks, CircleCheck } from "lucide-react";
import KtShell, { TopicThumb } from "./KtShell";
import { useVideoSet, hasVideo } from "./UnitVideo"; // #241 tick xanh bài có video
import { LEVELS, bandOf } from "./unitData"; // #244
import { loadUnitsIndex, unitPath, audiencePath, readUnitProgress, partDone, unitDoneCount, PARTS, learnTypePath, lowerFirst } from "./unitData";

export const PART_ICONS = { "": BookOpen, info: Table2, quiz: MousePointerClick, "listen-speak": Mic, "true-or-false": ListChecks };
export const partMeta = (key, u) => ({ "": `${u.readMin || 6} phút đọc`, info: "40 câu", quiz: "40 câu", "listen-speak": "40 câu", "true-or-false": "80 câu" }[key]);

/** Bài nên học tiếp trong chuỗi: bài đầu tiên chưa xong đủ 5 phần. */
export function nextUnit(units) {
  return units.find((u) => unitDoneCount(readUnitProgress(u.audience, u.slug)) < PARTS.length) || units[0];
}

export default function TopicCourse({ topic, persona, active = "topics" }) {
  const [idx, setIdx] = useState(null);
  const units = topic.units;
  const nu = nextUnit(units);
  const nuNo = units.indexOf(nu);
  const started = units.some((u) => readUnitProgress(u.audience, u.slug));
  const [open, setOpen] = useState(() => new Set([nuNo]));
  const vset = useVideoSet();
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => {});
  }, []);
  const door = (idx?.learnTypes || []).find((x) => x.slug === topic.learnType); // #080
  const minutes = units.reduce((n, u) => n + (u.readMin || 6) + 30, 0);
  const label = (k) => (units[k].kind === "tong" ? "Bài tổng" : `Bài ${k}`);
  const ctaText = started ? `Học tiếp ${label(nuNo).toLowerCase()}` : "Bắt đầu học";
  const cta = unitPath(nu.audience, nu.slug);
  const toggle = (k) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  return (
    <KtShell active={active}>
      <Helmet>
        <title>{`${topic.title.vi} — ${units.length} bài kiến thức, luyện nghe nói tiếng Anh`}</title>
        <meta name="description" content={topic.intro} />
      </Helmet>
      <div className="kt-course">
        <div>
          <TopicThumb idx={idx} topic={topic} branchTitle={topic.branchTitle.vi} className="kt-mthumb" />
          <nav className="kt-crumbs" aria-label="Vị trí">
            <Link to="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            {door && (
              <>
                <Link to={learnTypePath(door)}>{door.title.vi}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <Link to={door ? `${learnTypePath(door)}#${topic.branch}` : `/knowledge#${topic.branch}`}>{topic.branchTitle.vi}</Link>
          </nav>
          <h1>{topic.title.vi}</h1>
          <p className="kt-lead">
            {topic.promise ? (
              <>
                <b>Sau chuỗi này, bạn sẽ:</b> {topic.promise.charAt(0).toLowerCase() + topic.promise.slice(1)}
              </>
            ) : (
              topic.intro
            )}
          </p>
          <div className="kt-meta">
            <span>
              <Layers size={15} aria-hidden="true" />
              {units.length} bài
            </span>
            <span>
              <Clock size={15} aria-hidden="true" />
              khoảng {Math.round(minutes / 60)} giờ
            </span>
            <span className={`kt-lvl is-${bandOf(topic.level)}`} title={LEVELS[bandOf(topic.level)].can}>
              Tiếng Anh {bandOf(topic.level)} ({topic.level})
            </span>
          </div>
          {/* #244: bộ câu hỏi – trả lời ở mức nào thì hoàn thành được */}
          <details className="kt-lvlnote">
            <summary>
              Câu hỏi và câu trả lời ở mức <b>{LEVELS[bandOf(topic.level)].ten}</b> ({LEVELS[bandOf(topic.level)].cefr}) — {LEVELS[bandOf(topic.level)].can}
            </summary>
            <ul>
              {Object.entries(LEVELS).map(([k, l]) => (
                <li key={k} className={k === bandOf(topic.level) ? "is-on" : ""}>
                  <b className={`kt-lvl is-${k}`}>{k}</b> {l.cefr} · câu trả lời {l.tu} · {l.can}
                </li>
              ))}
            </ul>
            <small>Chưa đủ trình độ vẫn học được: bật Tiếng Việt, chọn “Cả hai” để đọc câu hỏi và đáp án, hoặc chuyển sang Gõ.</small>
          </details>
          <div className="kt-for">
            <Users size={22} aria-hidden="true" />
            <div>
              <b>
                Chuỗi này viết cho <Link to={audiencePath(topic.audience)}>{lowerFirst(topic.audienceTitle)}</Link>
              </b>
              {persona && <p>{persona}</p>}
            </div>
          </div>

          <h2 className="kt-sec">Bạn sẽ biết cách</h2>
          <ul className="kt-learnlist">
            {units.map((u) => (
              <li key={u.slug}>
                <Check size={20} aria-hidden="true" />
                <Link to={unitPath(u.audience, u.slug)}>{u.title.replace(/\?$/, "")}</Link>
                {vset && <CircleCheck size={16} className={`kt-vtick-ic ${hasVideo(vset, u) ? "is-full" : "is-none"}`} aria-label={hasVideo(vset, u) ? "đã có video" : "chưa có video"} />}
              </li>
            ))}
          </ul>

          <h2 className="kt-sec">Nội dung chuỗi</h2>
          <div className="kt-syl-head">
            <span>
              <b>{units.length}</b> bài · <b>{units.length * 5}</b> phần luyện · <b>{units.length * 200}</b> câu trả lời
            </span>
            <button type="button" className="kt-link" onClick={() => setOpen(open.size === units.length ? new Set() : new Set(units.map((_, k) => k)))}>
              {open.size === units.length ? "Thu gọn tất cả" : "Mở rộng tất cả"}
            </button>
          </div>
          {units.map((u, k) => {
            const p = readUnitProgress(u.audience, u.slug);
            const n = unitDoneCount(p);
            const isOpen = open.has(k);
            const isNext = started && k === nuNo && n < 5;
            const go = n === 5 ? "Ôn lại" : n > 0 || p ? "Học tiếp" : "Bắt đầu";
            return (
              <div key={u.slug} className={`kt-unit ${isOpen ? "is-open" : ""} ${isNext ? "is-next" : ""}`}>
                <div className="kt-urow">
                  <button type="button" onClick={() => toggle(k)} aria-expanded={isOpen}>
                    <span className={`kt-n ${n === 5 ? "is-done" : ""}`}>{n === 5 ? <Check size={16} aria-hidden="true" /> : u.kind === "tong" ? "T" : k}</span>
                    <span className="tt">
                      {u.title}
                      {vset && (
                        <span className={`kt-vtick is-inline ${hasVideo(vset, u) ? "is-full" : "is-none"}`} title={hasVideo(vset, u) ? "Bài đã có video" : "Bài chưa có video"}>
                          <CircleCheck size={14} aria-hidden="true" /> {hasVideo(vset, u) ? "video" : "chưa video"}
                        </span>
                      )}
                      <small>
                        <span className="kt-dots" aria-hidden="true">
                          {PARTS.map((pt) => (
                            <i key={pt.key} className={partDone(p, pt.key) ? "is-done" : ""} />
                          ))}
                        </span>
                        {label(k)} · {n}/5 phần đã xong{isNext ? " · học tiếp ở đây" : ""}
                      </small>
                    </span>
                    <ChevronDown size={18} className="kt-chev" aria-hidden="true" />
                  </button>
                  <Link className={`kt-ugo ${isNext || (!started && k === 0) ? "is-pri" : ""}`} to={unitPath(u.audience, u.slug)} aria-label={`${go} ${label(k).toLowerCase()}: ${u.title}`}>
                    {go}
                  </Link>
                </div>
                {isOpen && (
                  <ol className="kt-parts">
                    {PARTS.map((pt) => {
                      const Icon = PART_ICONS[pt.key];
                      const d = partDone(p, pt.key);
                      return (
                        <li key={pt.key}>
                          <Link to={unitPath(u.audience, u.slug, pt.key)} state={{ tab: true }}>
                            <Icon size={18} aria-hidden="true" />
                            {pt.label}
                            <span className={`r ${d ? "is-done" : ""}`}>{d ? "Đã xong" : partMeta(pt.key, u)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
        </div>

        <aside className="kt-side">
          <div className="kt-side-box">
            <TopicThumb idx={idx} topic={topic} branchTitle={topic.branchTitle.vi} />
            <p className="kt-free">Miễn phí</p>
            <Link className="kt-btn kt-btn--pri kt-btn--big" to={cta}>
              {ctaText}
            </Link>
            <ul>
              <li>
                <Layers size={18} aria-hidden="true" />
                {units.length} bài{units[0]?.kind === "tong" ? ", bài tổng mở đầu" : ""}
              </li>
              <li>
                <BookOpen size={18} aria-hidden="true" />
                Mỗi bài: bài viết + 40 câu
              </li>
              <li>
                <Mic size={18} aria-hidden="true" />
                Luyện nghe nói tiếng Anh
              </li>
              <li>
                <Clock size={18} aria-hidden="true" />
                Học lúc nào cũng được, máy nhớ chỗ dừng
              </li>
            </ul>
            {/* #230 Học cùng: người hướng dẫn mở lớp cho chuỗi này */}
            <Link className="kt-btn nh-open" to={`/nhom/tao?chu-de=${topic.branch}/${topic.slug}`}>
              <Users size={18} aria-hidden="true" /> Mở lớp hướng dẫn
            </Link>
            <p className="kt-muted nh-open-t">Dạy một nhóm học chuỗi này: cả nhóm xong bài trước mới mở bài sau.</p>
          </div>
        </aside>
      </div>
      <div className="kt-mcta">
        <Link className="kt-btn kt-btn--pri kt-btn--big" to={cta}>
          {ctaText}
        </Link>
      </div>
    </KtShell>
  );
}
