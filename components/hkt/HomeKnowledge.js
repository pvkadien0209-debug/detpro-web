"use client";
// SP04 · Trang chủ "/" — SP09 (#063, Đ3): giao diện mới tham khảo F8.
// Khối chào + số liệu nội dung (UX-Q7) · khối "Bạn đang học dở" · lối tắt theo hoàn cảnh · mỗi nhánh một hàng thẻ chủ đề.
// Trang chủ cũ (khoá Rèn luyện HỌC 2 – RÈN 8) vẫn ở /ren-luyen.
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Layers, Clock } from "lucide-react";
import KtShell, { TopicThumb } from "./KtShell";
import { VongDetLoading } from "./VongDet";
import {
  loadUnitsIndex, readLastUnit, readUnitProgress, unitPath, audiencePath, PARTS, unitDoneCount, seriesProgress,
  learnTypePath, openLearnTypes, branchesOf,
} from "./unitData";

const nf = (n) => n.toLocaleString("vi-VN");

/** Thẻ chủ đề dùng chung (trang chủ, trang Chủ đề, Của tôi). */
export function TopicCard({ idx, topic }) {
  const prog = seriesProgress(topic.units);
  const minutes = topic.units.reduce((n, u) => n + (u.readMin || 6) + 30, 0);
  return (
    <Link className="kt-card" to={`/knowledge/${topic.branch}/${topic.slug}`}>
      <TopicThumb idx={idx} topic={topic} branchTitle={topic.branchTitle?.vi} />
      <div className="kt-card-body">
        <h3>{topic.title.vi}</h3>
        <div className="kt-meta">
          <span>
            <Layers size={15} aria-hidden="true" />
            {topic.units.length} bài
          </span>
          <span>
            <Clock size={15} aria-hidden="true" />
            khoảng {Math.round(minutes / 60)} giờ
          </span>
        </div>
        {prog.done > 0 && (
          <div className="kt-bar" title={`${prog.done}/${prog.total} phần đã xong`}>
            <i style={{ width: `${(prog.done / prog.total) * 100}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomeKnowledge() {
  const [idx, setIdx] = useState(null);
  useEffect(() => {
    loadUnitsIndex().then(setIdx).catch(() => {});
  }, []);

  const topics = idx ? idx.branches.flatMap((b) => b.topics.map((t) => ({ ...t, branch: b.slug, branchTitle: b.title }))) : [];
  const nUnits = topics.reduce((n, t) => n + t.units.length, 0);

  // Bài đang học dở; chưa có thì gợi ý bài tổng đầu tiên
  const last = readLastUnit();
  let resume = null;
  topics.forEach((t) =>
    t.units.forEach((u) => {
      if (last && u.audience === last.audience && u.slug === last.slug) resume = { t, u, part: last.part };
    })
  );
  const first = topics[0] && { t: topics[0], u: topics[0].units[0], part: "" };
  const r = resume || first;
  const rDone = r ? unitDoneCount(readUnitProgress(r.u.audience, r.u.slug)) : 0;
  const partLabel = r ? PARTS.find((p) => p.key === (r.part || ""))?.label : "";

  return (
    <KtShell active="home">
      <Helmet>
        <title>Mỗi ngày biết thêm một điều hay — học kiến thức qua câu hỏi trắc nghiệm</title>
        <meta
          name="description"
          content="Kiến thức thật cho việc thật trong đời: chuẩn bị đại học xa nhà, phỏng vấn, đi làm, bán hàng, du lịch… Đọc một bài ngắn rồi trả lời câu hỏi bằng cách nghe và nói tiếng Anh. Miễn phí."
        />
      </Helmet>
      <section className="kt-hero">
        <div className="kt-hello">
          <span className="kt-stripe" aria-hidden="true" />
          <h1>Kiến thức thật cho việc thật trong đời</h1>
          <p>Đọc một bài ngắn, rồi trả lời câu hỏi bằng cách nghe và nói tiếng Anh. Mỗi bài viết riêng cho một hoàn cảnh cụ thể.</p>
          <dl className="kt-stats">
            <div>
              <dd>{nf(topics.length)}</dd>
              <dt>chủ đề</dt>
            </div>
            <div>
              <dd>{nf(nUnits)}</dd>
              <dt>bài</dt>
            </div>
            <div>
              <dd>{nf(nUnits * 40)}</dd>
              <dt>câu hỏi</dt>
            </div>
            <div>
              <dd>0đ</dd>
              <dt>miễn phí</dt>
            </div>
          </dl>
        </div>
        {r && (
          <div className="kt-resume">
            <small>{resume ? "Bạn đang học dở" : "Bắt đầu từ đây"}</small>
            <TopicThumb idx={idx} topic={r.t} branchTitle={r.t.branchTitle.vi} small />
            <h3>{r.u.title}</h3>
            <div className="kt-meta">
              <span>{resume ? `Phần ${partLabel} · ${rDone}/5 phần đã xong` : `Bài tổng · ${r.u.readMin || 6} phút đọc + 40 câu`}</span>
            </div>
            {resume && (
              <div className="kt-bar">
                <i style={{ width: `${(rDone / 5) * 100}%` }} />
              </div>
            )}
            <Link className="kt-btn kt-btn--pri" to={unitPath(r.u.audience, r.u.slug, r.part)}>
              {resume ? "Học tiếp" : "Bắt đầu học"}
            </Link>
          </div>
        )}
      </section>

      {idx && (
        <div className="kt-doors">
          {openLearnTypes(idx).map((x) => (
            <Link key={x.slug} to={learnTypePath(x)} className={`kt-door kt-door--${x.slug}`}>
              <b>{x.title.vi}</b>
              <span>{x.intro}</span>
              <small>{x.topics} chủ đề →</small>
            </Link>
          ))}
        </div>
      )}

      {idx && (
        <>
          <div className="kt-row-head">
            <h2>Bạn đang ở hoàn cảnh nào?</h2>
            <Link to="/for">Xem cả {idx.audiences.length} hoàn cảnh</Link>
          </div>
          <div className="kt-chips">
            {idx.audiences
              .filter((a) => a.units.length)
              .slice(20, 30)
              .map((a) => (
                <Link key={a.slug} className="kt-chip" to={audiencePath(a.slug)}>
                  {a.title}
                </Link>
              ))}
          </div>

          {/* #080: hai cửa vào — Học kỹ năng / Học kiến thức (+ Học chuyên môn khi có chuỗi) */}
          {openLearnTypes(idx).map((x) => (
            <div key={x.slug} className="kt-door-group">
              <div className="kt-door-head">
                <h2>{x.title.vi}</h2>
                <p>{x.intro}</p>
                <Link to={learnTypePath(x)}>Xem cả {x.topics} chủ đề</Link>
              </div>
              {branchesOf(idx, x.slug).map((b) => {
                const list = b.topics.map((t) => ({ ...t, branch: b.slug, branchTitle: b.title }));
                return (
                  <section key={b.slug}>
                    <div className="kt-row-head">
                      <h3>{b.title.vi}</h3>
                      {list.length > 4 && <Link to={`${learnTypePath(x)}#${b.slug}`}>Xem tất cả {list.length} chủ đề</Link>}
                    </div>
                    {b.intro && <p className="kt-branch-intro">{b.intro}</p>}
                    <div className="kt-tiles">
                      {list.slice(0, 4).map((t) => (
                        <TopicCard key={t.slug} idx={idx} topic={t} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ))}
        </>
      )}
      {!idx && (
        <p className="kt-muted">
          <VongDetLoading />
        </p>
      )}

      <section className="kt-legacy">
        <p>
          Bạn tìm <strong>khoá rèn luyện tiếng Anh HỌC 2 – RÈN 8</strong> và hướng dẫn ghép âm?
        </p>
        <Link className="kt-btn" to="/ren-luyen">
          Đến trang Rèn luyện
        </Link>
      </section>
    </KtShell>
  );
}
