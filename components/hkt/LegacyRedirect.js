"use client";
// U3-Q2 (#061): bỏ 200 bài viết cũ và 13 bài học 50 câu cũ — đường dẫn cũ chuyển thẳng sang bài mới.
//   /articles                       → /for (tất cả người nghe)
//   /articles/<chuỗi>               → /for/<người-nghe của chuỗi>
//   /articles/<chuỗi>/<bài>         → /for/<người-nghe>/<bài>   (bảng chuyển trong units/index.json → legacy)
//   /knowledge/<nhánh>/<chủ-đề>/<bài-học>/…  → /knowledge/<nhánh>/<chủ-đề> (trang chủ đề với chuỗi bài mới)
//   KG-Q1 (#112): /knowledge/<nhánh cũ>/<chủ-đề> → /knowledge/<nhánh mới>/<chủ-đề> khi chủ đề đã chuyển nhánh
//     (ví dụ science/solar-system, travel-vietnam/world-heritage, food-health/vietnamese-food → explore-world/…) — movedTopicPath, dùng ở TopicPage.
// File dữ liệu cũ (jsonData/knowledge/**/lesson-N.json, jsonData/articles/**) và code cũ vẫn còn trên máy, chỉ không còn đường vào.
import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { loadUnitsIndex, audiencePath } from "./unitData";

export function ArticlesRedirect() {
  const { series, slug } = useParams();
  const [to, setTo] = useState(null);
  useEffect(() => {
    if (!series) return setTo("/for");
    loadUnitsIndex()
      .then((idx) => {
        const lg = idx.legacy || {};
        if (slug && lg.articles?.[`${series}/${slug}`]) setTo(`/for/${lg.articles[`${series}/${slug}`]}`);
        else if (lg.series?.[series]) setTo(audiencePath(lg.series[series]));
        else setTo("/for");
      })
      .catch(() => setTo("/for"));
  }, [series, slug]);
  if (!to)
    return (
      <main className="hkt-page">
        <p className="hkt-message-inline">Đang chuyển sang bài mới…</p>
      </main>
    );
  return <Navigate to={to} replace />;
}

/** Chủ đề không có ở nhánh `branch` nhưng có ở nhánh khác (đã chuyển nhánh) → đường dẫn mới; không thấy → null. */
export async function movedTopicPath(branch, topic) {
  const idx = await loadUnitsIndex();
  const b = idx.branches.find((x) => x.slug !== branch && x.topics.some((t) => t.slug === topic));
  return b ? `/knowledge/${b.slug}/${topic}` : null;
}

export function OldLessonRedirect() {
  const { branch, topic } = useParams();
  return <Navigate to={`/knowledge/${branch}/${topic}`} replace />;
}
