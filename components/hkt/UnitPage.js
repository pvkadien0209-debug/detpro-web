"use client";
// SP08 · U3 — Trang một bài theo người nghe: /for/:audience/:slug/:part?
// part (#060): (trống) Bài viết · info Bảng thông tin · quiz Trắc nghiệm · listen-speak Nghe nói · true-or-false True or false
// B-Q11: lần đầu mở → Bài viết + nút "Bắt đầu luyện"; lần sau → phần đang dở.
// SP09 (#063, Đ5): trang học toàn màn hình — thanh trên tối (tên chủ đề, vòng "x/50 phần"), mục lục bên phải
// (N bài × 5 phần, số bài lấy từ dữ liệu #078, ✓ đã xong; điện thoại: kéo ra), thanh dưới "Phần trước · Phần tiếp" (UX-Q2: bỏ thanh 5 phần ngang).
// #079: đổi bài không dựng lại cả trang — giữ khung (thanh trên, mục lục, chỗ cuộn mục lục), chỉ vùng nội dung chờ bài mới;
// mục lục: bấm tên bài là vào bài (học tiếp phần đang dở), nút mũi tên riêng để mở/gập 5 phần.
// #098: video tóm tắt (UnitVideo) dưới tên bài ở phần Bài viết.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "@/lib/router"; // Next.js: thay react-router-dom
import { Helmet } from "@/lib/helmet"; // Next.js: tiêu đề/mô tả đặt ở trang máy chủ (generateMetadata)
import { ChevronLeft, ChevronDown, Check, PanelRight, X } from "lucide-react";
import {
  loadUnit, loadUnitsIndex, primeUnit, PARTS, unitPath, readUnitProgress, writeUnitProgress, unitSummary,
  writeLastUnit, partDone, unitDoneCount, lowerFirst } from "./unitData";
import { useBodyClass } from "./KtShell";
import { PART_ICONS, partMeta } from "./TopicCourse";
import {
  usePlayer, Modal, ExplainBody, ArticleView, QuestionTable, PickPart, SayPart, TrueFalsePart, UnitResults, RefButton,
} from "./UnitParts";
import UnitVideo from "./UnitVideo";
import VongDet, { SIGN, VongDetLoading } from "./VongDet";
// Next.js: KnowledgeLesson.css nạp toàn cục ở app/layout.js
// Next.js: KnowledgePages.css nạp toàn cục ở app/layout.js
// Next.js: UnitPage.css nạp toàn cục ở app/layout.js
// Next.js: kt.css nạp toàn cục ở app/layout.js

const PRACTICE = ["quiz", "listen-speak", "true-or-false"];
// #067: hai phần luyện liên tục dùng khung cố định — trang không cuộn
const DRILL = ["quiz", "listen-speak", "true-or-false"]; // FX-Q1 (#068): thêm Trắc nghiệm

export default function UnitPage({ initialUnit = null }) {
  // #190 (Next.js): initialUnit = bài đọc sẵn ở máy chủ → HTML có đủ chữ bài (Google đọc được)
  const { audience, slug, part = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const key = `${audience}/${slug}`;
  const [loaded, setLoaded] = useState(() => {
    if (!initialUnit) return null;
    primeUnit(audience, slug, initialUnit);
    return { key, unit: initialUnit };
  }); // { key, unit } — giữ bài cũ trong lúc tải bài mới (#079)
  const unit = loaded?.unit || null;
  const loading = !loaded || loaded.key !== key;
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(false);
  const [prog, setProg] = useState({}); // #190: đọc localStorage sau khi trang hiện (effect bên dưới) — máy chủ không có localStorage
  const [explainI, setExplainI] = useState(null);
  const [refOpen, setRefOpen] = useState(false);
  const player = usePlayer();
  const [sideOpen, setSideOpen] = useState(true); // #190: điện thoại tự đóng trong effect bên dưới (tránh lệch HTML máy chủ)
  const [sideUnits, setSideUnits] = useState(() => new Set());
  const mainRef = useRef(null);
  const sideRef = useRef(null);
  useBodyClass("kt-shell");

  useEffect(() => {
    let live = true;
    setError(false);
    setProg(readUnitProgress(audience, slug) || {});
    loadUnit(audience, slug)
      .then((u) => live && setLoaded({ key: `${audience}/${slug}`, unit: u }))
      .catch(() =>
        // #086: bài đã chuyển sang chuỗi khác → tự chuyển tới địa chỉ mới
        loadUnitsIndex()
          .then((i) => {
            const to = i.legacy?.units?.[`${audience}/${slug}`];
            if (!live) return;
            if (to) navigate(`/for/${to}${part ? `/${part}` : ""}`, { replace: true });
            else setError(true);
          })
          .catch(() => live && setError(true))
      );
    loadUnitsIndex().then(setIndex).catch(() => {});
    return () => {
      live = false;
    };
  }, [audience, slug]);

  const partOk = PARTS.some((p) => p.key === part);

  // B-Q11: vào bài không ghi phần (không phải bấm thanh phần) → phần đang dở
  useEffect(() => {
    if (part || location.state?.tab) return;
    const p = readUnitProgress(audience, slug);
    if (p?.lastPart && PARTS.some((x) => x.key === p.lastPart)) navigate(unitPath(audience, slug, p.lastPart), { replace: true });
  }, [audience, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (patch) =>
      setProg((p) => {
        const n = { ...p, ...patch };
        writeUnitProgress(audience, slug, n);
        return n;
      }),
    [audience, slug]
  );

  // Nhớ phần đang luyện (chỉ 3 phần luyện) + bài đang học (nút "Học tiếp")
  useEffect(() => {
    if (PRACTICE.includes(part) && prog.lastPart !== part) update({ lastPart: part });
    writeLastUnit(audience, slug, part);
    player.stop();
    mainRef.current?.scrollTo(0, 0);
    if (window.innerWidth <= 960) setSideOpen(false);
  }, [part, audience, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const para = useMemo(() => {
    const m = {};
    unit?.article.body.forEach((s) => s.paragraphs.forEach((p) => (m[p.id] = p.text)));
    return m;
  }, [unit]);

  // Vị trí bài trong chủ đề — tìm theo địa chỉ (không đợi tải xong bài) để mục lục đổi ngay khi bấm (#079)
  const place = useMemo(() => {
    if (!index) return null;
    for (const b of index.branches)
      for (const t of b.topics) {
        const k = t.units.findIndex((u) => u.slug === slug && u.audience === audience);
        if (k >= 0) return { b, t, list: t.units, k };
      }
    return null;
  }, [index, audience, slug]);
  useEffect(() => {
    if (place) setSideUnits((s) => new Set([...s, place.k]));
  }, [place]);

  // Tải sẵn bài kế tiếp để bấm sang là có ngay (#079)
  useEffect(() => {
    const nx = place?.list[place.k + 1];
    if (nx && !loading) loadUnit(nx.audience, nx.slug).catch(() => {});
  }, [place, loading]);
  // Mục lục: giữ nguyên chỗ cuộn; chỉ cuộn khi mục đang học nằm ngoài khung nhìn (#079)
  useEffect(() => {
    const el = sideRef.current?.querySelector(".is-cur") || sideRef.current?.querySelector(".is-curunit");
    if (!el || !sideRef.current) return;
    const a = sideRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < a.top + 56 || r.bottom > a.bottom) el.scrollIntoView({ block: "nearest" });
  }, [place?.k, part, sideOpen, unit]);

  const openRef = () => {
    setRefOpen(true);
    update({ refOpens: (prog.refOpens || 0) + 1 }); // C-1: chỉ để người học tự xem
  };
  const closeExplain = useCallback(() => setExplainI(null), []);
  const closeRef = useCallback(() => setRefOpen(false), []);

  if (error || (!partOk && unit && !loading))
    return (
      <div className="kt-learn hkt-page">
        <div className="kt-lcontent">
          <VongDet sweep={SIGN} track={false} size={64} className="vd-missing" />
          <h1 className="kt-h1">Không tìm thấy bài này</h1>
          <p>
            <Link className="kt-btn" to="/knowledge">
              Xem tất cả chủ đề
            </Link>
          </p>
        </div>
      </div>
    );
  if (!unit && !error)
    return (
      <div className="kt-learn hkt-page">
        <p className="kt-lcontent kt-muted">
          <VongDetLoading />
        </p>
      </div>
    );

  const m = unit.meta;
  // KG-Q1 (#112): chủ đề có thể đã chuyển nhánh — lấy nhánh từ cây chủ đề (index), meta.branch của bài chỉ để dự phòng
  const topicHref = place ? `/knowledge/${place.b.slug}/${place.t.slug}` : `/knowledge/${m.branch}/${m.topic}`;
  const qs = unit.questions;
  const summary = unitSummary(prog, qs.length);
  const refButton = <RefButton onOpen={openRef} count={prog.refOpens || 0} />;
  const common = { unit, prog, update, player, openExplain: setExplainI, refButton };
  // nút "Sang phần tiếp" khi xong một phần (thanh dưới bị ẩn trên điện thoại khi đang luyện — FX-Q3)
  const onNextPart = () => goStep(nextStep, true);
  const startPart = PRACTICE.includes(prog.lastPart) ? prog.lastPart : "quiz";

  // Mục lục cả chuỗi + thứ tự đi: bài 0 phần 1…5, bài 1 phần 1…5, …
  const list = place?.list || [{ audience, slug, title: m.title, kind: m.kind }];
  const nextUnitStep = (st) => st && st.i !== (place ? place.k : 0);
  const k = place ? place.k : 0;
  const progOf = (u, i) => (i === k ? prog : readUnitProgress(u.audience, u.slug));
  const flat = list.flatMap((u, i) => PARTS.map((p) => ({ i, u, key: p.key })));
  const pos = flat.findIndex((x) => x.i === k && x.key === part);
  const prevStep = flat[pos - 1];
  const nextStep = flat[pos + 1];
  const doneAll = list.reduce((n, u, i) => n + unitDoneCount(progOf(u, i)), 0);
  const totalAll = list.length * PARTS.length;
  const markSeen = () => {
    if (part === "" || part === "info") update({ seen: { ...(prog.seen || {}), [part === "" ? "article" : "info"]: 1 } });
  };
  const goStep = (st, mark) => {
    if (!st) return;
    if (mark) markSeen();
    navigate(unitPath(st.u.audience, st.u.slug, st.key), { state: { tab: true } });
  };
  const partInfo = PARTS.find((p) => p.key === part);
  const drill = DRILL.includes(part);
  const PartIcon = PART_ICONS[part];
  const unitLabel = (u, i) => (u.kind === "tong" ? "Bài tổng" : `Bài ${i}`);
  const toggleUnit = (i) =>
    setSideUnits((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <div className={`kt-learn hkt-page ${drill ? "is-drill" : ""}`}>
      <Helmet>
        <title>{`${m.title} — dành cho ${lowerFirst(m.audienceTitle)}`}</title>
        <meta name="description" content={m.description} />
        {/* U3-Q1 (#061): 40 câu + đáp án đúng + giải thích cho Google (dạng Câu hỏi thường gặp) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: qs.map((q) => ({
              "@type": "Question",
              name: q.q,
              acceptedAnswer: { "@type": "Answer", text: `${q.options[0]}. ${q.explain}` },
            })),
          })}
        </script>
      </Helmet>
      <header className="kt-ltop">
        <Link className="kt-back" to={topicHref} aria-label="Về trang chủ đề">
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        <Link className="ttl" to={topicHref}>
          {place?.t?.title.vi || m.series}
        </Link>
        {drill && (
          <button type="button" className="kt-ltoc" onClick={() => setSideOpen((v) => !v)} aria-label={sideOpen ? "Ẩn mục lục" : "Hiện mục lục"} aria-pressed={sideOpen}>
            <PanelRight size={20} aria-hidden="true" />
          </button>
        )}
        <div className="kt-ring" title={`${doneAll}/${totalAll} phần đã xong`}>
          {/* NV-Q7 (#112): vòng "x/y phần" dùng đúng hình Vòng Đét (khe ở 1 giờ, khép khi xong cả chuỗi) */}
          <VongDet value={doneAll / totalAll} size={38} />
          <span>
            <b>
              {doneAll}/{totalAll}
            </b>{" "}
            phần đã xong
          </span>
        </div>
      </header>

      <div className={`kt-lwrap ${sideOpen ? "is-sideopen" : "is-noside"}`}>
        <div className={`kt-lmain ${drill ? "is-drill" : ""}`} ref={mainRef}>
          {loading ? (
            <div className="kt-lcontent">
              <p className="kt-muted kt-lload" role="status">
                Đang mở {list[k] ? `${unitLabel(list[k], k).toLowerCase()}: ${list[k].title}` : "bài"}…
              </p>
            </div>
          ) : (
          <div className="kt-lcontent" key={key}>
            {drill ? (
              <h1 className="kt-dtitle">
                <span className="kt-kicker">
                  {PartIcon && <PartIcon size={16} aria-hidden="true" />}
                  {unitLabel(list[k] || m, k)} · {partInfo?.label}
                </span>
                <span className="t">{m.title}</span>
              </h1>
            ) : (
              <>
                <span className="kt-kicker">
                  {PartIcon && <PartIcon size={16} aria-hidden="true" />}
                  {unitLabel(list[k] || m, k)} · {partInfo?.label}
                  {place && ` · ${k + 1}/${list.length} trong chuỗi`}
                  {part === "" && ` · ${list[k]?.readMin || 6} phút đọc`}
                </span>
                <h1 className="kt-h1">{m.title}</h1>
                <p className="kt-sub">
                  Chuỗi “{m.series}” · dành cho {lowerFirst(m.audienceTitle)} · bản nháp chờ duyệt
                </p>
                {/* #098: video tóm tắt dưới tên bài, chỉ ở phần Bài viết, không tự phát */}
                {part === "" && <UnitVideo audience={audience} slug={slug} title={m.title} />}
              </>
            )}
            {part === "" && (
              <ArticleView
                unit={unit}
                para={para}
                started={summary?.started}
                onStart={() => {
                  markSeen();
                  navigate(unitPath(audience, slug, startPart), { state: { tab: true } });
                }}
                questionsLink={unitPath(audience, slug, "info")}
              />
            )}
            {/* #086: bài nối bài — cuối bài viết có thẻ bài tiếp theo trong chuỗi */}
            {part === "" && place && (
              list[k + 1] ? (
                <Link className="kt-nextu" to={unitPath(list[k + 1].audience, list[k + 1].slug)}>
                  <small>Bài tiếp theo trong chuỗi “{m.series}” · {k + 2}/{list.length}</small>
                  <b>{list[k + 1].title}</b>
                  <span>{list[k + 1].description}</span>
                </Link>
              ) : (
                <Link className="kt-nextu is-last" to={topicHref}>
                  <small>Bạn đã đến bài cuối của chuỗi “{m.series}”</small>
                  <b>Xem lại cả chuỗi và phần còn chưa luyện</b>
                  {place.t?.promise && <span>{place.t.promise}</span>}
                </Link>
              )
            )}
            {part === "info" && (
              <>
                <p className="kt-muted">
                  Bảng thông tin (bảng câu hỏi) cũng là bảng tham khảo: 40 câu, mỗi câu 3 đáp án, <b>không đánh dấu đáp án đúng</b> — đọc bài viết để tự tìm.
                </p>
                <QuestionTable questions={qs} player={player} />
              </>
            )}
            {part === "quiz" && <PickPart {...common} onNextPart={nextStep ? onNextPart : null} />}
            {part === "listen-speak" && <SayPart {...common} onNextPart={nextStep ? onNextPart : null} />}
            {part === "true-or-false" && <TrueFalsePart {...common} results={<UnitResults s={summary} />} onNextPart={nextStep ? onNextPart : null} />}
            {summary?.started && !drill && part !== "" && (
              <details className="hkt-u-summary">
                <summary>Kết quả của bạn ở bài này</summary>
                <UnitResults s={summary} />
                {prog.refOpens > 0 && <p className="kt-muted">Đã mở Bảng thông tin {prog.refOpens} lần.</p>}
              </details>
            )}
          </div>
          )}
        </div>

        <aside className="kt-lside" aria-label="Nội dung chuỗi" ref={sideRef}>
          <h3>
            Nội dung chuỗi
            <button type="button" onClick={() => setSideOpen(false)} aria-label="Đóng mục lục">
              <X size={20} aria-hidden="true" />
            </button>
          </h3>
          {list.map((u, i) => {
            const p = progOf(u, i);
            const open = sideUnits.has(i);
            return (
              <div key={u.audience + u.slug} className={`kt-lunit ${i === k ? "is-curunit" : ""} ${open ? "is-open" : ""}`}>
                <div className="kt-lhead">
                  <Link to={unitPath(u.audience, u.slug)} aria-current={i === k ? "page" : undefined} title={i === k ? "Bài đang học" : "Vào bài này (mở phần đang dở)"}>
                    <span className="tt">
                      {unitLabel(u, i)}. {u.title}
                      <small>
                        <span className="kt-dots" aria-hidden="true">
                          {PARTS.map((pt) => (
                            <i key={pt.key} className={partDone(p, pt.key) ? "is-done" : ""} />
                          ))}
                        </span>
                        {unitDoneCount(p)}/5 phần{i === k ? " · đang học" : ""}
                      </small>
                    </span>
                  </Link>
                  <button type="button" className="kt-lexp" onClick={() => toggleUnit(i)} aria-expanded={open} aria-label={open ? "Thu gọn các phần" : "Xem 5 phần của bài"}>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                </div>
                {open && (
                  <ol>
                    {PARTS.map((pt) => {
                      const d = partDone(p, pt.key);
                      const cur = i === k && pt.key === part;
                      return (
                        <li key={pt.key}>
                          <Link className={cur ? "is-cur" : ""} to={unitPath(u.audience, u.slug, pt.key)} state={{ tab: true }} aria-current={cur ? "step" : undefined}>
                            <span className={`kt-st ${d ? "is-done" : ""}`}>{d && <Check size={12} aria-hidden="true" />}</span>
                            {pt.label}
                            <span className="r">{partMeta(pt.key, u)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
        </aside>
      </div>

      <footer className={`kt-lbot ${drill ? "is-drill" : ""}`}>
        <button type="button" className="kt-nav" disabled={!prevStep} onClick={() => goStep(prevStep)}>
          {nextUnitStep(prevStep) ? "‹ Bài trước" : "‹ Phần trước"}
        </button>
        <button type="button" className="kt-nav kt-nav--next" disabled={!nextStep} onClick={() => goStep(nextStep, true)}>
          {nextUnitStep(nextStep) ? "Sang bài tiếp ›" : "Phần tiếp ›"}
        </button>
        <div className="kt-where">
          <span>{partInfo?.label}</span>
          <button type="button" onClick={() => setSideOpen((v) => !v)} aria-label={sideOpen ? "Ẩn mục lục" : "Hiện mục lục"} aria-pressed={sideOpen}>
            <PanelRight size={20} aria-hidden="true" />
          </button>
        </div>
      </footer>

      <Modal open={explainI !== null} onClose={closeExplain} title={explainI !== null ? `Câu ${explainI + 1} · Giải thích` : ""}>
        {explainI !== null && <ExplainBody q={qs[explainI]} i={explainI} para={para} player={player} />}
      </Modal>
      <Modal open={refOpen} onClose={closeRef} title="Bảng thông tin" wide>
        <QuestionTable questions={qs} player={player} idPrefix="rf" />
      </Modal>
    </div>
  );
}
