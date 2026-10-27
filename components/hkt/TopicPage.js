"use client";
// SP02 · P1 — Trang chủ đề: chuỗi bài. /knowledge/:branch/:topic
// SP08 · U3: chủ đề có bài theo người nghe (bài viết + 40 câu) → hiện chuỗi bài mới; bài học 50 câu cũ chỉ còn một đường dẫn nhỏ.
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { loadTopic, lessonPath, readProgress } from "./knowledgeData";
import { useLang, LangToggle, Bi } from "./Bilingual";
import { findUnitTopic, loadUnitsIndex } from "./unitData";
import TopicCourse from "./TopicCourse";
import { movedTopicPath } from "./LegacyRedirect";
import VongDet, { SIGN, VongDetLoading } from "./VongDet";
// Next.js: KnowledgeLesson.css nạp toàn cục ở app/layout.js
// Next.js: KnowledgePages.css nạp toàn cục ở app/layout.js

export default function TopicPage() {
  const { branch, topic } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [lang, setLang] = useLang();
  const [unitTopic, setUnitTopic] = useState(undefined); // undefined = đang tải, null = chưa có bài mới
  const [persona, setPersona] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setData(null);
    setError(false);
    setUnitTopic(undefined);
    // #120: chỉ tải topic.json kiểu cũ khi chủ đề KHÔNG có trong cây bài mới (units). Chủ đề mới không có tệp này;
    // gọi thừa làm dev server chuyển yêu cầu sang server :5000 → "Proxy error … ECONNREFUSED" khi server tắt.
    const legacy = () => loadTopic(branch, topic).then(setData).catch(() => setError(true));
    findUnitTopic(branch, topic)
      .then(async (t) => {
        if (!t) {
          legacy();
          // KG-Q1 (#112): đường dẫn cũ của chủ đề đã chuyển nhánh → chuyển sang nhánh mới
          const to = await movedTopicPath(branch, topic).catch(() => null);
          if (to) return navigate(to + window.location.hash, { replace: true });
        }
        setUnitTopic(t);
        if (t) loadUnitsIndex().then((i) => setPersona(i.audiences.find((a) => a.slug === t.audience)?.persona || null));
      })
      .catch(() => { setUnitTopic(null); legacy(); });
  }, [branch, topic]); // eslint-disable-line react-hooks/exhaustive-deps

  // SP09 (#063, Đ4): chủ đề có bài theo người nghe → trang kiểu trang khoá học
  if (unitTopic) return <TopicCourse topic={unitTopic} persona={persona} />;

  if (error && unitTopic === null)
    return (
      <main className="hkt-page">
        <div className="hkt-wrap">
          <VongDet sweep={SIGN} track={false} size={64} className="vd-missing" />
          <h1>Không tìm thấy chủ đề này</h1>
          <p>
            <Link to="/knowledge">Xem tất cả chủ đề</Link>
          </p>
        </div>
      </main>
    );
  if (!data || unitTopic === undefined)
    return (
      <main className="hkt-page">
        <div className="hkt-wrap">
          <p className="hkt-message-inline">
            <VongDetLoading />
          </p>
        </div>
      </main>
    );

  return (
    <main className="hkt-page">
      <Helmet>
        <title>{`${data.title.vi} — Học kiến thức`}</title>
        <meta name="description" content={data.intro?.vi || data.title.vi} />
      </Helmet>
      <div className="hkt-wrap">
        <nav className="hkt-crumbs" aria-label="Vị trí">
          <Link to="/knowledge">Học kiến thức</Link>
          <span aria-hidden="true">›</span>
          <span>{data.branchTitle?.vi}</span>
        </nav>
        <header className="hkt-topic-head">
          <div>
            <h1>{data.title.vi}</h1>
            <p className="hkt-topic-en" lang="en">
              {data.title.en} · {data.lessons.length} bài · {data.level}
            </p>
          </div>
          <LangToggle lang={lang} setLang={setLang} />
        </header>
        <Bi value={data.intro} lang={lang} className="hkt-intro" />

        {(() => {
          // P9 (#044): một nút rõ ràng "Bắt đầu / Học tiếp" — bài đầu tiên chưa làm xong
          const ready = data.lessons.filter((l) => l.status !== "planned");
          const next = ready.find((l) => {
            const p = readProgress(branch, topic, l.id);
            return !p || p.done < l.questions;
          });
          if (!next) return null;
          const started = !!readProgress(branch, topic, next.id);
          return (
            <p className="hkt-topic-cta">
              <Link className="hkt-btn hkt-btn--primary" to={lessonPath(branch, topic, next.id)}>
                {started ? "Học tiếp" : "Bắt đầu"}: Bài {data.lessons.indexOf(next) + 1} · {next.title.vi}
              </Link>
            </p>
          );
        })()}

        <h2 className="hkt-h2">Chuỗi bài</h2>
        <ol className="hkt-lessons">
          {data.lessons.map((l, i) => {
            const ready = l.status !== "planned";
            const prog = ready ? readProgress(branch, topic, l.id) : null;
            const inner = (
              <>
                <span className="hkt-lesson-no">Bài {i + 1}</span>
                <span className="hkt-lesson-title">
                  {l.title.vi}
                  <span className="hkt-topic-en" lang="en">{l.title.en}</span>
                </span>
                <span className="hkt-lesson-meta">
                  {!ready ? (
                    <span className="hkt-soon">Sắp có</span>
                  ) : prog ? (
                    <>
                      <span className="hkt-mini-bar">
                        <span style={{ width: `${(prog.done / l.questions) * 100}%` }} />
                      </span>
                      {prog.done}/{l.questions}
                    </>
                  ) : (
                    <>{l.questions} câu · Chưa bắt đầu</>
                  )}
                </span>
              </>
            );
            return (
              <li key={l.id}>
                {ready ? (
                  <Link className="hkt-lesson" to={lessonPath(branch, topic, l.id)}>
                    {inner}
                  </Link>
                ) : (
                  <div className="hkt-lesson is-soon" aria-disabled="true">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
