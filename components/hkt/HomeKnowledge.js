"use client";
// SP04 · Trang chủ "/" — SP09 (#063, Đ3): giao diện mới tham khảo F8.
// Khối chào + số liệu nội dung (UX-Q7) · khối "Bạn đang học dở" · lối tắt theo hoàn cảnh · mỗi nhánh một hàng thẻ chủ đề.
// #191: bỏ lời mời sang khoá Rèn luyện (/ren-luyen không còn trên web Next.js, #189).
// #206: băng video "Bắt đầu với DetPro" (quẹt ngang) + "Học một bài trong 4 bước" + hỏi đáp + 4 bóng chỉ lần đầu (#201).
import React, { useEffect, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { Layers, Clock, CircleCheck } from "lucide-react";
import { useVideoSet, hasVideo } from "./UnitVideo"; // #241
import { LEVELS, bandOf } from "./unitData"; // #244
import KtShell, { TopicThumb } from "./KtShell";
import { VongDetLoading } from "./VongDet";
import HomeVideos from "./HomeVideos";
import HomeTour from "./HomeTour";
import {
  loadUnitsIndex, readLastUnit, readUnitProgress, unitPath, audiencePath, PARTS, unitDoneCount, seriesProgress,
  learnTypePath, openLearnTypes, branchesOf,
} from "./unitData";

const nf = (n) => n.toLocaleString("vi-VN");

// #206 — "Học một bài trong 4 bước" và hỏi đáp cho người mới (kịch bản #201 §3)
const STEPS4 = [
  ["Chọn bài", "đúng hoàn cảnh của bạn"],
  ["Đọc bài", "khoảng 6 phút, hoặc xem video tóm tắt"],
  ["Luyện 3 phần", "Trắc nghiệm · Nghe nói · True or false"],
  ["Xem kết quả", "làm lại câu sai · lần sau bấm Học tiếp"],
];
const FAQ = [
  ["DetPro có mất phí không?", "Miễn phí, không cần tài khoản."],
  ["Tôi kém tiếng Anh có học được không?", "Được. Chữ có song ngữ, nghe lại bao nhiêu lần cũng được; không tiện nói thì chuyển sang Gõ."],
  ["Tiến độ lưu ở đâu?", "Trên trình duyệt của máy bạn. Đổi máy hoặc xoá dữ liệu trình duyệt thì tiến độ bắt đầu lại."],
  ["Mỗi ngày nên học bao lâu?", "20–30 phút là đủ. Đều đặn quan trọng hơn học dồn."],
  ["Nội dung pháp lý, tài chính có thay tư vấn được không?", "Không. Nội dung mang tính tham khảo chung, không thay thế tư vấn cho trường hợp cụ thể."],
];

/** Thẻ chủ đề dùng chung (trang chủ, trang Chủ đề, Của tôi). */
export function TopicCard({ idx, topic }) {
  const prog = seriesProgress(topic.units);
  const vset = useVideoSet(); // #241
  const nVid = vset ? topic.units.filter((u) => hasVideo(vset, u)).length : 0;
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
          <span className={`kt-lvl is-${bandOf(topic.level)}`} title={`Tiếng Anh ${LEVELS[bandOf(topic.level)].ten} (${LEVELS[bandOf(topic.level)].cefr}) — ${LEVELS[bandOf(topic.level)].can}`}>
            {/* #244 */}Tiếng Anh {bandOf(topic.level)}
          </span>
          {vset && (
            // #241: xanh = mọi bài đã có video · vàng = có một ít · xám = chưa có
            <span className={`kt-vtick ${nVid === topic.units.length ? "is-full" : nVid > 0 ? "is-some" : "is-none"}`} title={`${nVid}/${topic.units.length} bài đã có video`}>
              <CircleCheck size={15} aria-hidden="true" />
              {nVid === topic.units.length ? "Đủ video" : nVid > 0 ? `${nVid}/${topic.units.length} video` : "Chưa có video"}
            </span>
          )}
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

      <HomeVideos />
      <p className="kt-guide-link">
        <Link to="/huong-dan">🎬 Xem thêm 7 video hướng dẫn: vì sao và làm thế nào cho hiệu quả →</Link>
      </p>

      <ol className="kt-4steps" aria-label="Học một bài trong 4 bước">
        {STEPS4.map(([b, t], k) => (
          <li key={b}>
            <i>{k + 1}</i>
            <b>{b}</b>
            <span>{t}</span>
          </li>
        ))}
      </ol>

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

      <section className="kt-faq" aria-labelledby="kt-faq-h">
        <h2 id="kt-faq-h">Câu hỏi thường gặp</h2>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <HomeTour ready={!!idx} />
    </KtShell>
  );
}
