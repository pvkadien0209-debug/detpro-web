"use client";
// #228 — Trang /huong-dan: hai băng video quẹt ngang (hướng dẫn chung + bắt đầu với DetPro) và vài lời khuyên ngắn.
import React from "react";
import { Link } from "@/lib/router";
import KtShell from "./KtShell";
import HomeVideos from "./HomeVideos";
import { GUIDE_VIDEOS, HOME_VIDEOS } from "./trangChuVideoData";

const TIPS = [
  ["Mỗi ngày 20–30 phút", "Đều đặn quan trọng hơn học dồn."],
  ["Đi đúng thứ tự 5 phần", "Đọc → Bảng → Trắc nghiệm → Nghe nói → True or false."],
  ["Sai thì đọc giải thích", "Rồi bấm “Làm lại câu sai” tới khi đúng hết."],
  ["Rảnh tay thì nghe 40 câu", "Ở Bảng thông tin: hiện câu hỏi, đáp án, cả hai hoặc nghe chay."],
  ["Hôm sau ôn lại", "Làm lại câu sai trước khi học bài mới."],
];

export default function GuidePage() {
  return (
    <KtShell active="home">
      <section className="kt-guide-head">
        <h1>Hướng dẫn học trên DetPro</h1>
        <p>Vì sao nên học theo cách này, và làm thế nào cho hiệu quả — mỗi video vài chục giây, tiếng Anh có phụ đề Việt.</p>
      </section>
      <HomeVideos list={GUIDE_VIDEOS} title="Học hiệu quả trên DetPro" id="kt-gd-h" sub={`${GUIDE_VIDEOS.length} video hướng dẫn · tổng quan, vì sao, từng phần chi tiết`} />
      <ol className="kt-4steps kt-tips">
        {TIPS.map(([b, t], k) => (
          <li key={b}>
            <i>{k + 1}</i>
            <b>{b}</b>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <HomeVideos list={HOME_VIDEOS} title="Bắt đầu với DetPro" id="kt-gd-h2" />
      <p className="kt-muted" style={{ marginTop: 16 }}>
        <Link to="/knowledge">Chọn một chủ đề để bắt đầu →</Link>
      </p>
    </KtShell>
  );
}
