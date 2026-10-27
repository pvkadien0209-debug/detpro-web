"use client";
// SP08 · U3 — Cây người nghe (một cây thông tin phụ, A-Q1/A-Q4). SP09 (#063): giao diện mới.
//   /for              tất cả hoàn cảnh (người nghe), xếp theo nhánh chủ đề — thẻ có ảnh bìa
//   /for/:audience    hồ sơ người nghe (A-Q6) + chuỗi bài: dùng chung trang kiểu khoá học với trang chủ đề
//                     (hiện mỗi người nghe ứng với đúng một chủ đề)
import React, { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Layers } from "lucide-react";
import KtShell, { TopicThumb } from "./KtShell";
import TopicCourse from "./TopicCourse";
import { loadUnitsIndex, audiencePath } from "./unitData";

export function AudiencesHome() {
  const [idx, setIdx] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => setError(true));
  }, []);
  return (
    <KtShell active="for">
      <Helmet>
        <title>Bài học theo hoàn cảnh — bạn đang ở hoàn cảnh nào?</title>
        <meta name="description" content="Các chuỗi bài viết và câu hỏi luyện nghe nói, soạn riêng cho từng hoàn cảnh: tân sinh viên xa nhà, người đi phỏng vấn, nhân viên mới, chủ cửa hàng nhỏ, lần đầu đi nước ngoài…" />
      </Helmet>
      <h1 className="kt-h1">Bạn đang ở hoàn cảnh nào?</h1>
      <p className="kt-lead">Mỗi chuỗi bài viết riêng cho một hoàn cảnh. Chọn hoàn cảnh giống bạn nhất.</p>
      {error && <p className="kt-muted">Chưa tải được danh sách. Thử tải lại trang.</p>}
      {!idx && !error && <p className="kt-muted">Đang tải…</p>}
      {idx?.branches.map((b) => {
        const auds = idx.audiences.filter((a) => a.branch === b.slug);
        if (!auds.length) return null;
        return (
          <section key={b.slug}>
            <div className="kt-row-head">
              <h2>{b.title.vi}</h2>
            </div>
            <div className="kt-tiles is-grid">
              {auds.map((a) => (
                <Link key={a.slug} className="kt-card" to={audiencePath(a.slug)}>
                  <TopicThumb idx={idx} topic={{ slug: a.topic, title: a.title }} branchTitle={b.title.vi} />
                  <div className="kt-card-body">
                    <h3>Chuỗi “{a.series}”</h3>
                    <div className="kt-meta">
                      <span>
                        <Layers size={15} aria-hidden="true" />
                        {a.units.length} bài
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </KtShell>
  );
}

export default function AudiencePage() {
  const { audience } = useParams();
  const [idx, setIdx] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => setError(true));
  }, []);
  const a = idx?.audiences.find((x) => x.slug === audience);
  const b = a && idx.branches.find((x) => x.slug === a.branch);
  const t = b?.topics.find((x) => x.slug === a.topic);

  if (error || (idx && !t))
    return (
      <KtShell active="for">
        <h1 className="kt-h1">Không tìm thấy trang này</h1>
        <p>
          <Link className="kt-btn" to="/for">
            Xem tất cả hoàn cảnh
          </Link>
        </p>
      </KtShell>
    );
  if (!t)
    return (
      <KtShell active="for">
        <p className="kt-muted">Đang tải…</p>
      </KtShell>
    );
  return <TopicCourse topic={{ ...t, branch: b.slug, branchTitle: b.title }} persona={a.persona} active="for" />;
}
