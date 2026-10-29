"use client";
// SP09 (#063, Đ9) — "Của tôi": chủ đề đang học + kết quả từng bài (lưu trên máy người học, chưa cần đăng nhập).
// Không điểm thưởng, không chuỗi ngày (UXC-Q7).
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Check, Users } from "lucide-react";
import { myGroups } from "@/components/nhom/nhomClient"; // #267 nhóm học trên máy này
import KtShell from "./KtShell";
import { TopicCard } from "./HomeKnowledge";
import { loadUnitsIndex, readUnitProgress, unitSummary, unitDoneCount, unitPath, PARTS, partDone, seriesProgress } from "./unitData";

export default function MyPage() {
  const [idx, setIdx] = useState(null);
  const [nhoms, setNhoms] = useState([]);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => {});
    setNhoms(myGroups());
  }, []);
  const topics = idx ? idx.branches.flatMap((b) => b.topics.map((t) => ({ ...t, branch: b.slug, branchTitle: b.title }))) : [];
  const learning = topics.filter((t) => t.units.some((u) => readUnitProgress(u.audience, u.slug)));
  const rows = learning.flatMap((t) =>
    t.units
      .map((u) => ({ t, u, p: readUnitProgress(u.audience, u.slug) }))
      .filter((x) => x.p)
  );
  const doneParts = learning.reduce((n, t) => n + seriesProgress(t.units).done, 0);

  return (
    <KtShell active="me">
      <Helmet>
        <title>Của tôi — chủ đề đang học và kết quả</title>
      </Helmet>
      <h1 className="kt-h1">Của tôi</h1>
      <p className="kt-lead">
        Tiến độ lưu trên trình duyệt của máy này.{" "}
        {learning.length > 0 && (
          <>
            Bạn đang học <b>{learning.length}</b> chủ đề, đã xong <b>{doneParts}</b> phần.
          </>
        )}
      </p>
      {nhoms.length > 0 && (
        <>
          <div className="kt-row-head">
            <h2>Nhóm học của bạn</h2>
          </div>
          <div className="nh-mygroups">
            {nhoms.map((g) => (
              <Link key={g.ma} className="kt-btn nh-mygroup" to={g.id ? `/nhom/${g.ma}/${g.id}` : `/nhom/${g.ma}`}>
                <Users size={18} aria-hidden="true" />
                <span>
                  <b>{g.ten}</b>
                  <small>
                    Nhóm {g.ma}
                    {g.id ? ` · ${g.id}` : ""} — Học tiếp
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
      {!idx && <p className="kt-muted">Đang tải…</p>}
      {idx && !learning.length && (
        <div className="kt-resume" style={{ maxWidth: 520 }}>
          <h3>Bạn chưa học bài nào</h3>
          <p className="kt-muted" style={{ margin: 0 }}>Chọn một chủ đề, đọc bài viết rồi luyện 40 câu. Kết quả sẽ hiện ở đây.</p>
          <Link className="kt-btn kt-btn--pri" to="/knowledge">
            Chọn chủ đề
          </Link>
        </div>
      )}
      {learning.length > 0 && (
        <>
          <div className="kt-row-head">
            <h2>Chủ đề đang học</h2>
          </div>
          <div className="kt-tiles is-grid">
            {learning.map((t) => (
              <TopicCard key={t.slug} idx={idx} topic={t} />
            ))}
          </div>
          <div className="kt-row-head">
            <h2>Kết quả từng bài</h2>
          </div>
          <div className="kt-my">
            {rows.map(({ t, u, p }) => {
              const s = unitSummary(p, 40);
              return (
                <Link key={u.audience + u.slug} className="kt-my-row" to={unitPath(u.audience, u.slug)}>
                  <span className="kt-my-t">
                    {u.title}
                    <small>{t.title.vi}</small>
                  </span>
                  <span className="kt-my-parts" aria-label={`${unitDoneCount(p)}/5 phần đã xong`}>
                    {PARTS.map((pt) => (
                      <span key={pt.key} className={`kt-st ${partDone(p, pt.key) ? "is-done" : ""}`} title={pt.label}>
                        {partDone(p, pt.key) && <Check size={12} aria-hidden="true" />}
                      </span>
                    ))}
                  </span>
                  <span className="kt-my-r">
                    Trắc nghiệm {s.pickOk}/40 · Nghe nói {s.sayOk}/40 · True or false {s.d2pt} điểm
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </KtShell>
  );
}
