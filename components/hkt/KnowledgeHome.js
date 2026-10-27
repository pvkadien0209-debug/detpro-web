"use client";
// SP02 · P1 — Trang tất cả chủ đề: /knowledge — SP09 (#063, Đ2): thẻ chủ đề có ảnh bìa, theo nhánh (A-Q1).
// #080 (PL-Q1…Q4): chia hai cửa "Học kỹ năng" / "Học kiến thức" (+ "Học chuyên môn" khi có chuỗi).
// /knowledge = tất cả, nhóm theo cửa → nhánh; /learn/skills, /learn/knowledge, /learn/professional = một cửa.
import React, { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import KtShell from "./KtShell";
import { VongDetLoading } from "./VongDet";
import { TopicCard } from "./HomeKnowledge";
import { loadUnitsIndex, learnTypePath, openLearnTypes, branchesOf } from "./unitData";

// `seen`: ở trang "Tất cả", một nhánh có thể nằm ở hai cửa (ví dụ Du lịch & Việt Nam) — chỉ lần đầu mang id #nhánh.
function Branches({ idx, lt, seen }) {
  return branchesOf(idx, lt).map((b) => (
    <section key={b.slug} id={!seen || !seen.has(b.slug) ? (seen?.add(b.slug), b.slug) : undefined}>
      <div className="kt-row-head">
        <h2>{b.title.vi}</h2>
      </div>
      {b.intro && <p className="kt-branch-intro">{b.intro}</p>}
      <div className="kt-tiles is-grid">
        {b.topics.map((t) => (
          <TopicCard key={t.slug} idx={idx} topic={{ ...t, branch: b.slug, branchTitle: b.title }} />
        ))}
      </div>
    </section>
  ));
}

export function LearnTabs({ idx, cur }) {
  const doors = openLearnTypes(idx);
  return (
    <nav className="kt-ltabs" aria-label="Loại học">
      <Link to="/knowledge" className={!cur ? "is-on" : ""} aria-current={!cur ? "page" : undefined}>
        Tất cả
      </Link>
      {doors.map((x) => (
        <Link key={x.slug} to={learnTypePath(x)} className={cur === x.slug ? "is-on" : ""} aria-current={cur === x.slug ? "page" : undefined}>
          {x.title.vi} <span>{x.topics}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function KnowledgeHome() {
  const { type } = useParams(); // skills | knowledge | professional
  const [idx, setIdx] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => setError(true));
  }, []);
  useEffect(() => {
    // #nhánh từ trang chủ ("Xem tất cả … chủ đề")
    const id = window.location.hash.slice(1);
    if (idx && id) document.getElementById(id)?.scrollIntoView();
  }, [idx]);
  const door = type && idx ? (idx.learnTypes || []).find((x) => x.path === type) : null;
  const notFound = type && idx && (!door || !door.topics);

  return (
    <KtShell active="topics">
      <Helmet>
        <title>{door ? `${door.title.vi} — các chủ đề học qua câu hỏi nghe nói tiếng Anh` : "Tất cả chủ đề — học kiến thức qua câu hỏi nghe nói tiếng Anh"}</title>
        <meta
          name="description"
          content={
            door
              ? `${door.intro} Mỗi chủ đề gồm nhiều bài, mỗi bài một bài viết và 40 câu hỏi.`
              : "Học kỹ năng hoặc học kiến thức: công việc, đời sống sinh viên, kinh doanh nhỏ, du lịch, ăn uống, khoa học… Mỗi chủ đề gồm nhiều bài, mỗi bài một bài viết và 40 câu hỏi."
          }
        />
      </Helmet>
      <h1 className="kt-h1">{door ? door.title.vi : "Tất cả chủ đề"}</h1>
      <p className="kt-lead">
        {door ? door.intro : "Chọn học kỹ năng (biết cách làm) hoặc học kiến thức (hiểu đúng điều thường gặp)."} Mỗi chủ đề gồm các chuỗi bài viết cho từng hoàn cảnh cụ thể, dài ngắn tuỳ nội dung. Mỗi bài có 40 câu hỏi để luyện bằng nghe và nói tiếng Anh.
      </p>
      {idx && <LearnTabs idx={idx} cur={door?.slug} />}
      {error && <p className="kt-muted">Chưa tải được danh sách chủ đề. Thử tải lại trang.</p>}
      {!idx && !error && (
        <p className="kt-muted">
          <VongDetLoading />
        </p>
      )}
      {notFound && <p className="kt-muted">Chưa có chủ đề ở mục này.</p>}
      {idx && door && <Branches idx={idx} lt={door.slug} />}
      {idx &&
        !type &&
        ((seen) => openLearnTypes(idx).map((x) => (
          <div key={x.slug} className="kt-door-group" id={x.path}>
            <div className="kt-door-head">
              <h2>{x.title.vi}</h2>
              <p>{x.intro}</p>
            </div>
            <Branches idx={idx} lt={x.slug} seen={seen} />
          </div>
        )))(new Set())}
    </KtShell>
  );
}
