"use client";
// SP08 · U3 — Các phần của một bài theo người nghe (bài viết + 40 câu):
// 1 Bài viết · 2 Bảng thông tin · 3 Trắc nghiệm · 4 Nghe nói (luyện nói) · 5 True or false (80 câu, luyện phân biệt đúng – sai) — tên phần #060.
// Kế hoạch: DetPro/san-pham/sp08-bai-hoc-theo-nguoi-nghe.md §3–§4, §8.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router"; // Next.js: thay react-router-dom
import { Volume2, Square, Mic, Keyboard, Check, X, ClipboardList, ArrowRight, ArrowLeft, RotateCcw, Headphones, Send, Grid3x3, Shuffle, Languages, BarChart3, Eraser } from "lucide-react";
import { KT_STORAGE } from "./config";
import useStoredState from "./useStoredState";
import useSpeechInput, { speechSupported } from "./useSpeechInput";
import { playText, stopAudio } from "./audioPlayer";
import { matchAnswer, scoreOption } from "./matcher";
import { MATCH } from "./config";
import { shownOptions, shuffle, newQaRun, reshuffleQaRest, qaTotal, paraKind, frameOf, hasIllustrativeCharacters } from "./unitData";
import VongDet from "./VongDet";
import { useNhom } from "@/components/nhom/nhomClient"; // #230 Học cùng

const html = (s) => ({ __html: s });

// ---------- Phát âm: một khoá chung cho cả trang (không phát chồng) ----------
export function usePlayer() {
  const [playing, setPlaying] = useState(null);
  const ref = useRef(null);
  ref.current = playing;
  const play = useCallback(async (id, text) => {
    if (ref.current === id) {
      stopAudio();
      setPlaying(null);
      return;
    }
    stopAudio();
    setPlaying(id);
    await playText(text);
    setPlaying((p) => (p === id ? null : p));
  }, []);
  const stop = useCallback(() => {
    stopAudio();
    setPlaying(null);
  }, []);
  useEffect(() => () => stopAudio(), []);
  return { playing, play, stop };
}

export function Listen({ player, id, text, children, className = "", title }) {
  const on = player.playing === id;
  return (
    <button
      type="button"
      className={`hkt-listen ${className} ${on ? "is-playing" : ""}`}
      onClick={() => player.play(id, text)}
      aria-pressed={on}
      title={title}
    >
      {on ? <Square size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

// ---------- Popup ----------
export function Modal({ open, onClose, title, children, wide }) {
  const boxRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    boxRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prev && prev.focus) prev.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="hkt-u-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`hkt-u-sheet ${wide ? "is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={boxRef}>
        <div className="hkt-u-sheet-head">
          <h3>{title}</h3>
          <button type="button" className="hkt-btn hkt-u-close" onClick={onClose}>
            <X size={16} aria-hidden="true" /> Đóng
          </button>
        </div>
        <div className="hkt-u-sheet-body">{children}</div>
      </div>
    </div>
  );
}

/**
 * #083: câu tiếng Việt trong phần luyện không hiện sẵn — bấm "Tiếng Việt" (hoặc phím V) mới hiện.
 * Mỗi câu mới lại ẩn (đặt key theo câu ở chỗ dùng). Bảng thông tin, Giải thích, mục Đáp án vẫn hiện đủ.
 */
export function ViHint({ text, className = "hkt-u-qvi" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "v" && e.key !== "V") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!text) return null;
  return open ? (
    <p className={`${className} kt-vi is-open`}>
      {text}{" "}
      <button type="button" className="kt-vibtn is-on" onClick={() => setOpen(false)} aria-pressed="true" title="Ẩn tiếng Việt (V)">
        Ẩn
      </button>
    </p>
  ) : (
    <p className={`${className} kt-vi`}>
      <button type="button" className="kt-vibtn" onClick={() => setOpen(true)} aria-pressed="false" title="Hiện câu tiếng Việt (V)">
        <Languages size={14} aria-hidden="true" /> Tiếng Việt
      </button>
    </p>
  );
}

/** Popup giải thích dùng chung (§3): câu hỏi · đáp án đúng · Trích trong bài · Giải thích thêm. */
export function ExplainBody({ q, i, para, player }) {
  return (
    <div className="hkt-u-explain">
      <p className="hkt-u-qvi">{q.vi}</p>
      <p className="hkt-u-qen" lang="en">
        {q.q} <Listen player={player} id={`ex-q-${i}`} text={q.q} className="hkt-u-ico" title="Nghe câu hỏi" />
      </p>
      <p className="hkt-u-label">Đáp án đúng</p>
      <p className="hkt-u-right" lang="en">
        <Check size={18} aria-hidden="true" /> {q.options[0]}{" "}
        <Listen player={player} id={`ex-a-${i}`} text={q.options[0]} className="hkt-u-ico" title="Nghe đáp án" />
      </p>
      <p className="hkt-u-label">Trích trong bài</p>
      <blockquote className="hkt-u-quote" dangerouslySetInnerHTML={html(para[q.para] || "")} />
      <p className="hkt-u-label">Giải thích thêm</p>
      <p>{q.explain}</p>
    </div>
  );
}

// ---------- Khung minh hoạ (#065): mỗi loại một biểu tượng + màu; K4 giấu lời giải sau nút ----------
function FrameBox({ id, frame }) {
  const [open, setOpen] = useState(false);
  let body = frame.body;
  let answer = null;
  if (frame.code === "k4") {
    const i = body.indexOf("Lời giải:");
    if (i > 0) {
      answer = body.slice(i + "Lời giải:".length).trim();
      body = body.slice(0, i).trim();
    }
  }
  if (frame.code === "k7") body = body.replace(/\s*(Cách [AB]:)/g, (m, w) => `<br><b>${w}</b>`);
  if (frame.code === "k5") body = body.replace(/\s*(Trước:|Sau:)/g, (m, w) => `<br><b>${w}</b>`).replace(/^<br>/, "");
  return (
    <div id={id} className={`kt-frame kt-frame--${frame.code}`}>
      <span className="kt-frame-tag">
        <span aria-hidden="true">{frame.icon}</span> {frame.label}
      </span>
      <p dangerouslySetInnerHTML={html(body)} />
      {answer !== null &&
        (open ? (
          <p className="kt-frame-ans">
            <b>Lời giải:</b> <span dangerouslySetInnerHTML={html(answer)} />
          </p>
        ) : (
          <button type="button" className="kt-frame-reveal" onClick={() => setOpen(true)}>
            Nghĩ xong rồi? Xem lời giải
          </button>
        ))}
    </div>
  );
}

// ---------- 1. Bài viết ----------
export function ArticleView({ unit, para, onStart, started, prev, next, questionsLink }) {
  const a = unit.article;
  return (
    <article className="hkt-u-article">
      <p className="hkt-u-intro" dangerouslySetInnerHTML={html(a.intro)} />
      <p className="hkt-u-cta">
        <button type="button" className="hkt-btn hkt-btn--primary" onClick={onStart}>
          {started ? "Luyện tiếp" : "Bắt đầu luyện"} <ArrowRight size={18} aria-hidden="true" />
        </button>
        <span className="hkt-muted">40 câu hỏi bám theo bài này</span>
      </p>
      {a.body.map((s, k) => (
        <section key={k}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p) => {
            const kind = paraKind(p.text);
            if (kind === "frame") return <FrameBox key={p.id} id={p.id} frame={frameOf(p.text)} />;
            const text = kind === "check" ? p.text.replace(/ ☐/g, "<br>☐") : p.text;
            return <p key={p.id} id={p.id} className={kind ? `is-${kind}` : undefined} dangerouslySetInnerHTML={html(text)} />;
          })}
        </section>
      ))}
      <section>
        <h2>Kết luận</h2>
        <p dangerouslySetInnerHTML={html(a.outro)} />
        {/* KC-Q7 (#112): bài có nhân vật minh hoạ → một dòng chữ nhỏ cuối bài viết */}
        {hasIllustrativeCharacters(unit) && <p className="hkt-u-illus">Nhân vật trong bài là minh hoạ.</p>}
      </section>
      {/* U3-Q1 (#061): mục Đáp án và giải thích chi tiết — 40 câu, mỗi câu gập/mở (B-Q13: cũng là "Câu hỏi thường gặp" cho Google) */}
      <section className="hkt-u-faq" id="dap-an">
        <h2>Đáp án và giải thích chi tiết</h2>
        <p className="hkt-muted">Luyện xong rồi hãy mở. Bấm vào từng câu để xem đáp án đúng, đoạn trích trong bài và giải thích thêm.</p>
        <ol>
          {unit.questions.map((q, i) => (
            <li key={i}>
              <details>
                <summary>
                  <span lang="en">{q.q}</span>
                  <span className="hkt-muted">{q.vi}</span>
                </summary>
                <div className="hkt-u-ans">
                  <p className="hkt-u-right" lang="en">
                    <Check size={18} aria-hidden="true" /> {q.options[0]}
                  </p>
                  <p className="hkt-u-label">Trích trong bài</p>
                  <blockquote className="hkt-u-quote" dangerouslySetInnerHTML={html(para[q.para] || "")} />
                  <p className="hkt-u-label">Giải thích thêm</p>
                  <p>{q.explain}</p>
                </div>
              </details>
            </li>
          ))}
        </ol>
        <p>
          <Link to={questionsLink}>Xem Bảng thông tin: 40 câu, mỗi câu 3 đáp án</Link>
        </p>
      </section>
      {(prev || next) && (
        <nav className="hkt-u-seq" aria-label="Bài trong chuỗi">
          {prev ? (
            <Link to={prev.to}>
              <ArrowLeft size={16} aria-hidden="true" /> <span>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={next.to}>
              <span>{next.title}</span> <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}

// ---------- 2. Bảng thông tin (bảng câu hỏi, cũng là bảng tham khảo; không đánh dấu đáp án đúng — #053) ----------
// Máy tính: bảng 5 cột · điện thoại: mỗi hàng một thẻ, 3 đáp án xếp dọc (B-Q3) — chỉ khác CSS.
export function QuestionTable({ questions, player, mode = "ref", pick, onPick, idPrefix = "t" }) {
  return (
    <div className={`hkt-u-table is-${mode}`}>
      <table>
        <thead>
          <tr>
            <th scope="col">STT</th>
            <th scope="col">Câu hỏi</th>
            <th scope="col">Câu 1</th>
            <th scope="col">Câu 2</th>
            <th scope="col">Câu 3</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => (
            <tr key={i} className={pick?.ok?.[i] ? "is-done" : undefined}>
              <td className="hkt-u-no">{i + 1}</td>
              <td className="hkt-u-q">
                <span lang="en">{q.q}</span>
                <Listen player={player} id={`${idPrefix}-q-${i}`} text={q.q} className="hkt-u-ico" title="Nghe câu hỏi" />
                <span className="hkt-u-vi">{q.vi}</span>
              </td>
              {shownOptions(q).map((o, k) => {
                if (mode !== "pick")
                  return (
                    <td key={k} className="hkt-u-opt" data-label={`Câu ${k + 1}`} lang="en">
                      {o.text}
                    </td>
                  );
                const ok = pick?.ok?.[i] && o.ok;
                const bad = pick?.bad?.[`${i}-${k}`];
                return (
                  <td key={k} className="hkt-u-opt" data-label={`Câu ${k + 1}`}>
                    <button
                      type="button"
                      lang="en"
                      className={`hkt-u-cell ${ok ? "is-ok" : ""} ${bad ? "is-bad" : ""}`}
                      onClick={() => onPick(i, k, o)}
                      aria-label={`Câu ${i + 1}, đáp án ${k + 1}: ${o.text}${ok ? " — đúng" : bad ? " — sai" : ""}`}
                    >
                      {ok && <Check size={16} aria-hidden="true" />}
                      {bad && <X size={16} aria-hidden="true" />}
                      {o.text}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pill({ children, tone }) {
  return <span className={`hkt-u-pill ${tone ? `is-${tone}` : ""}`}>{children}</span>;
}

// ---------- 3. Trắc nghiệm — FX-Q1 (#068): từng câu một trong khung cố định ----------
// Đọc / nghe câu hỏi, bấm 1 trong 3 đáp án. Đúng → tô vàng, tự sang câu chưa làm sau 1,5 giây
// (bấm "Giải thích" thì dừng lại). Sai → tô đỏ, chọn lại. Ô "Câu x/40" mở lưới 40 câu để nhảy.
export function PickPart({ unit, prog, update, player, openExplain, refButton, onNextPart }) {
  const qs = unit.questions;
  const pick = { ok: {}, bad: {}, wrong: 0, ...(prog.pick || {}) }; // #269 dữ liệu thiếu khoá (bản cũ / máy chủ) không làm sập trang
  const [tuSang, setTuSang] = useTuSang(); // #285
  const [dung, setDung] = useState(false);
  const okCount = Object.keys(pick.ok).length;
  const firstOpen = () => {
    for (let k = 0; k < qs.length; k++) if (!pick.ok[k]) return k;
    return 0;
  };
  const i = Math.min(pick.pos ?? firstOpen(), qs.length - 1);
  const q = qs[i];
  const opts = shownOptions(q);
  const solved = !!pick.ok[i];
  const [gridOpen, setGridOpen] = useState(false);
  const [review, setReview] = useState(false); // #160: xong cả 40 câu → hiện báo cáo; bấm "Xem lại từng câu" mới về câu hỏi
  const grp = useNhom();
  useEffect(() => { grp?.setCau?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const stageRef = useStageTop(i);
  const go = (n) => update({ pick: { ...pick, pos: Math.max(0, Math.min(qs.length - 1, n)) } });
  const nextOpen = (from = i, ok = pick.ok) => {
    for (let k = 1; k <= qs.length; k++) {
      const n = (from + k) % qs.length;
      if (!ok[n]) return n;
    }
    return null;
  };
  const n = nextOpen();
  useEffect(() => {
    player.stop();
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  // #160: đúng → KHÔNG tự sang câu; người học tự bấm "Câu tiếp" (hoặc Enter)

  const onPick = (k) => {
    const o = opts[k];
    if (solved) {
      if (o.ok) openExplain(i);
      return;
    }
    if (o.ok) {
      const ok = { ...pick.ok, [i]: 1 };
      update({ pick: { ...pick, ok, pos: i } });
    } else if (!pick.bad[`${i}-${k}`]) {
      update({ pick: { ...pick, bad: { ...pick.bad, [`${i}-${k}`]: 1 }, wrong: pick.wrong + 1, pos: i } });
    }
  };
  const explain = () => {
    setDung(true); // #285 đang đọc giải thích → không tự sang câu
    openExplain(i);
  };
  useEffect(() => setDung(false), [i]);
  const keys = {
    1: () => onPick(0),
    2: () => onPick(1),
    3: () => onPick(2),
    q: () => player.play(`pk-q-${i}`, q.q),
    ArrowLeft: () => i > 0 && go(i - 1),
    ArrowRight: () => i < qs.length - 1 && go(i + 1),
  };
  if (solved && n !== null) keys.Enter = () => go(n);
  useDrillKeys(keys, [i, solved, n, pick]);
  const badHere = opts.some((o, k) => pick.bad[`${i}-${k}`]);
  const allDone = okCount === qs.length;
  if (allDone && !review)
    return (
      <PartReport
        kind="quiz" unit={unit} prog={prog} player={player} openExplain={openExplain}
        onReview={() => setReview(true)}
        onRetryWrong={() => {
          const w = partStats("quiz", unit, prog).wrongList.map((x) => x.i);
          const ok = { ...pick.ok };
          const bad = { ...pick.bad };
          w.forEach((k) => delete ok[k]);
          Object.keys(bad).forEach((key) => w.includes(+key.split("-")[0]) && delete bad[key]);
          setReview(true);
          update({ pick: { ok, bad, wrong: 0, pos: w[0] ?? 0, lu: Date.now() } }); // #290 lượt mới
        }}
        onRestart={() => {
          setReview(true);
          update({ pick: { ok: {}, bad: {}, wrong: 0, pos: 0, lu: Date.now() } });
        }}
        onNextPart={onNextPart} nextLabel="Sang Nghe nói"
      />
    );

  return (
    <div className="kt-drill">
      <div className="kt-dhead">
        <div className="hkt-u-pills">
          {/* NV-Q7 (#112): Vòng Đét lấp theo số câu đã làm đúng, đủ 40 câu thì khép */}
          <VongDet value={okCount / qs.length} size={30} label={`${okCount}/${qs.length} câu đã làm đúng`} />
          <button type="button" className="hkt-u-pill kt-dpillbtn" onClick={() => setGridOpen(true)} title="Chọn câu">
            <Grid3x3 size={14} aria-hidden="true" /> Câu {i + 1}/{qs.length}
          </button>
          <Pill tone="ok">Đúng {okCount}</Pill>
          <Pill tone="bad">Sai {pick.wrong}</Pill>
        </div>
        <div className="kt-dnav">
          <button type="button" className="kt-dicon kt-darrow" disabled={i === 0} onClick={() => go(i - 1)} aria-label="Câu trước" title="Câu trước (←)">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="kt-dicon kt-darrow" disabled={i === qs.length - 1} onClick={() => go(i + 1)} aria-label="Câu sau" title="Câu sau (→)">
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          {refButton}
        </div>
      </div>
      <div className="hkt-progress-bar">
        <span style={{ width: `${(okCount / qs.length) * 100}%` }} />
      </div>
      <div className="kt-dstage" ref={stageRef}>
        {allDone && (
          <div className="hkt-u-done">
            Xong cả {qs.length} câu Trắc nghiệm.{" "}
            <button type="button" className="hkt-btn hkt-btn--primary" onClick={() => setReview(false)}>
              <BarChart3 size={16} aria-hidden="true" /> Xem báo cáo
            </button>
          </div>
        )}
        <div className="kt-q kt-dq">
          <span className="no">{i + 1}</span>
          <div>
            <b lang="en">{q.q}</b>
            <ViHint key={`pk-vi-${i}`} text={q.vi} className="vi" />
          </div>
          <Listen player={player} id={`pk-q-${i}`} text={q.q} className="hkt-u-ico" title="Nghe câu hỏi (Q)" />
        </div>
      </div>
      <div className="kt-ddock">
        <div className="kt-dchoices">
          {opts.map((o, k) => {
            const ok = solved && o.ok;
            const bad = pick.bad[`${i}-${k}`];
            return (
              <button
                key={k}
                type="button"
                lang="en"
                className={`kt-opt ${ok ? "is-ok" : ""} ${bad ? "is-bad" : ""}`}
                onClick={() => onPick(k)}
                aria-label={`Đáp án ${k + 1}: ${o.text}${ok ? " — đúng" : bad ? " — sai" : ""}`}
              >
                <i>{k + 1}</i>
                {o.text}
              </button>
            );
          })}
        </div>
        {solved ? (
          <div className="kt-drow is-ok">
            <span className="kt-dmsg">
              <Check size={18} aria-hidden="true" /> Đúng.
            </span>
            <button type="button" className="hkt-btn" onClick={explain}>
              Giải thích
            </button>
            {n !== null && <NextBtn onGo={() => go(n)} auto={tuSang} dung={dung} resetKey={i} />}
            <TuSangChip on={tuSang} setOn={setTuSang} />
          </div>
        ) : (
          <Status fb={badHere ? { tone: "bad", text: "Chưa đúng — chọn lại." } : null} />
        )}
        <KeyHint>Phím tắt: 1 2 3 chọn đáp án · Q nghe câu hỏi · V tiếng Việt · Enter câu tiếp · ← → đổi câu</KeyHint>
      </div>
      <Modal open={gridOpen} onClose={() => setGridOpen(false)} title="Chọn câu">
        <div className="kt-dgrid">
          {qs.map((_, k) => (
            <button
              key={k}
              type="button"
              className={`${pick.ok[k] ? "is-done" : ""} ${k === i ? "is-cur" : ""}`}
              onClick={() => {
                go(k);
                setGridOpen(false);
              }}
              aria-label={`Câu ${k + 1}${pick.ok[k] ? " — đã đúng" : ""}`}
            >
              {k + 1}
            </button>
          ))}
        </div>
        {(okCount > 0 || pick.wrong > 0) && (
          <p>
            <button
              type="button"
              className="hkt-link"
              onClick={() => {
                update({ pick: { ok: {}, bad: {}, wrong: 0, pos: 0, lu: Date.now() } });
                setGridOpen(false);
              }}
            >
              Làm lại từ đầu
            </button>
          </p>
        )}
      </Modal>
    </div>
  );
}

// ---------- Ô trả lời: tab Nói / Gõ (nhớ tab đã chọn — B-Q10) ----------
export function AnswerBox({ onSubmit, placeholder, disabled, hint, quick, compact }) {
  const [mode, setMode] = useStoredState(KT_STORAGE.answerMode, "speak");
  // Next.js (#190): máy chủ không biết trình duyệt có nhận giọng nói không → coi như "Gõ" cho tới khi trang hiện
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const canSpeak = mounted && speechSupported;
  const m = canSpeak ? mode : "type";
  const [typed, setTyped] = useState("");
  const [heard, setHeard] = useState(null); // U3-Q3 (#061): câu máy nghe được — chờ người học bấm "Gửi"
  const sendNowRef = useRef(false); // #156: bấm Gửi lúc đang nghe → dừng mic rồi gửi luôn
  const sp = useSpeechInput((alts) => {
    if (sendNowRef.current) {
      sendNowRef.current = false;
      onSubmit(alts, "speak");
      return;
    }
    setHeard(alts);
  });
  const inputRef = useRef(null);
  useEffect(() => {
    if (disabled) sp.abort();
    setHeard(null);
    sendNowRef.current = false;
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = () => {
    if (disabled) return;
    if (sp.recording) {
      if (!sp.text) return;
      sendNowRef.current = true;
      sp.stop();
      return;
    }
    if (!heard) return;
    onSubmit(heard, "speak");
    setHeard(null);
  };
  const go = (e) => {
    e?.preventDefault();
    const v = typed.trim();
    if (!v || disabled) return;
    onSubmit([v], "type");
    setTyped("");
  };
  return (
    <div className={`hkt-u-answer ${compact ? "is-compact" : ""}`}>
      <div className="hkt-seg" role="tablist" aria-label="Cách trả lời">
        <button type="button" role="tab" aria-selected={m === "speak"} className={m === "speak" ? "is-on" : ""} disabled={!canSpeak} onClick={() => setMode("speak")}>
          <Mic size={14} aria-hidden="true" /> Nói
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={m === "type"}
          className={m === "type" ? "is-on" : ""}
          onClick={() => {
            sp.abort();
            setMode("type");
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <Keyboard size={14} aria-hidden="true" /> Gõ
        </button>
      </div>
      {m === "speak" ? (
        <div className="hkt-u-speak is-v2">
          {/* #156: khung chữ nghe được là trọng tâm — to, rõ; nút nhỏ gọn bên dưới */}
          <div className={`hkt-u-tx ${sp.recording ? "is-live" : ""} ${(sp.recording ? sp.text : heard) ? "has-text" : ""}`} aria-live="polite">
            <span className="hkt-u-tx-label">
              {sp.recording ? (
                <>
                  <span className="hkt-u-tx-dot" aria-hidden="true" /> Đang nghe — nói xong bấm Gửi
                </>
              ) : heard ? (
                "Máy nghe được"
              ) : (
                "Câu bạn nói sẽ hiện ở đây"
              )}
            </span>
            <p lang="en">{sp.recording ? sp.text || "…" : heard ? heard[0] : <span className="hkt-u-tx-ph">Bấm mic rồi nói câu trả lời bằng tiếng Anh</span>}</p>
          </div>
          <div className="hkt-u-tx-actions">
            {sp.recording ? (
              <button type="button" className="hkt-u-sbtn is-stop" onClick={() => sp.stop()} disabled={disabled}>
                <Square size={14} aria-hidden="true" /> Dừng
              </button>
            ) : (
              <button
                type="button"
                className="hkt-u-sbtn is-mic"
                disabled={disabled}
                onClick={() => {
                  setHeard(null);
                  sp.start();
                }}
              >
                <Mic size={15} aria-hidden="true" /> {heard ? "Nói lại" : "Nói"}
              </button>
            )}
            {/* #161: nút Xoá — xoá chữ đã nghe để nói lại (đang nghe thì vẫn nghe tiếp) */}
            <button
              type="button"
              className="hkt-u-sbtn is-clear"
              onClick={() => (sp.recording ? sp.clear() : setHeard(null))}
              disabled={disabled || (sp.recording ? !sp.text : !heard)}
            >
              <Eraser size={14} aria-hidden="true" /> Xoá
            </button>
            <button type="button" className="hkt-u-sbtn is-send" onClick={send} disabled={disabled || (sp.recording ? !sp.text : !heard)}>
              <Send size={14} aria-hidden="true" /> Gửi
            </button>
          </div>
          {sp.error && <p className="hkt-u-err">{sp.error}</p>}
          {hint && !compact && <p className="hkt-hint-sm">{hint}</p>}
        </div>
      ) : (
        <form className="hkt-type" onSubmit={go}>
          <input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={placeholder} lang="en" disabled={disabled} aria-label={placeholder} />
          <button type="submit" className="hkt-btn hkt-btn--primary" disabled={disabled || !typed.trim()}>
            <Send size={16} aria-hidden="true" /> Gửi
          </button>
        </form>
      )}
      {quick}
    </div>
  );
}

/** U3-Q3 (#061): máy không hiểu câu trả lời → hỏi lại bằng tiếng. #161: anh giữ lại (#160 đã bỏ). */
const askAgain = (player) => player.play(`again-${Date.now()}`, "Sorry, what did you say?");

/** Chọn phương án nhận dạng khớp được (nếu có), rồi so khớp với 3 đáp án theo thứ tự hiện. */
function matchAlts(alts, opts, cfg) {
  const options = opts.map((o, k) => ({ key: k, text: o.text }));
  let first = null;
  for (const a of alts) {
    const r = matchAnswer(a, options, cfg);
    if (!first) first = { ...r, said: a };
    if (r.status === "match") return { ...r, said: a };
  }
  return first;
}

// #162: Nghe nói — câu nói khớp ≥ 50% với một đáp án là nhận (bỏ điều kiện 70% số từ); dưới 50% → "máy chưa hiểu".
const SAY_MATCH = { ...MATCH, sim: 0.5, wordMatch: 0 };
/** Độ khớp (%) của câu nói với đáp án đúng — lấy phương án nhận dạng khớp nhất. */
const pctTo = (alts, text) => Math.round(Math.max(0, ...alts.map((a) => scoreOption(a, { text }).sim)) * 100);
/** Các mức độ khớp cho biểu đồ. */
export const PCT_BINS = [
  { label: "Dưới 50%", lo: 0, hi: 50, tone: "bad" },
  { label: "50–60%", lo: 50, hi: 60, tone: "mid" },
  { label: "60–70%", lo: 60, hi: 70, tone: "mid" },
  { label: "70–80%", lo: 70, hi: 80, tone: "ok" },
  { label: "80–90%", lo: 80, hi: 90, tone: "ok" },
  { label: "90–100%", lo: 90, hi: 101, tone: "ok" },
];

// ---------- Khung luyện tập cố định (#067) ----------
// Nghe nói và True or false: đầu khung (số câu, điểm) + vùng câu hỏi + "dock" thao tác luôn nằm ở đáy khung.
// Trang không cuộn; câu mới luôn bắt đầu ở đầu khung; phím tắt cho máy tính.
function useDrillKeys(map, deps) {
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector(".hkt-modal-back, [role='dialog']")) return;
      const fn = map[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
function useStageTop(key) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo?.(0, 0);
  }, [key]);
  return ref;
}
/** #073: nút đảo thứ tự câu (Nghe nói, True or false) — câu đã làm giữ kết quả. */
function ShuffleButton({ onClick }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 1600);
    return () => clearTimeout(t);
  }, [flash]);
  return (
    <button
      type="button"
      className={`kt-dicon ${flash ? "is-flash" : ""}`}
      onClick={() => {
        onClick();
        setFlash(true);
      }}
      aria-label="Đảo thứ tự các câu chưa làm"
      title={flash ? "Đã đảo thứ tự" : "Đảo thứ tự các câu chưa làm"}
    >
      <Shuffle size={18} aria-hidden="true" />
    </button>
  );
}
const canHover = () => typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;
function KeyHint({ children }) {
  // Next.js (#190): máy chủ không biết có chuột hay không → quyết định sau khi trang hiện (tránh lệch HTML)
  const [hover, setHover] = useState(false);
  useEffect(() => setHover(canHover()), []);
  return hover ? <p className="kt-dkeys">{children}</p> : null;
}
// #229: tuỳ chọn hiện chữ khi luyện (dùng chung Nghe nói và True or false) — nhớ trên máy
const SHOW_MODES = [
  ["none", "Chỉ nghe"],
  ["q", "Câu hỏi"],
  ["a", "Đáp án"],
  ["qa", "Cả hai"],
];
function useDrillShow() {
  const [show, setShow] = useStoredState(KT_STORAGE.drillShow, "none");
  // #285 (LB-Q2): điện thoại chưa chọn lần nào → mặc định "Cả hai" (đọc trên màn hình); ai đổi thì máy nhớ
  useEffect(() => {
    try {
      if (window.localStorage.getItem(KT_STORAGE.drillShow) === null && window.matchMedia?.("(pointer: coarse)").matches) setShow("qa");
    } catch {
      /* bỏ qua */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const v = SHOW_MODES.some(([k]) => k === show) ? show : "none";
  return { show: v, setShow, showQ: v === "q" || v === "qa", showA: v === "a" || v === "qa" };
}
function ShowSeg({ show, setShow }) {
  return (
    <div className="kt-dshow" role="group" aria-label="Hiện chữ">
      {SHOW_MODES.map(([k, t]) => (
        <button key={k} type="button" className={show === k ? "is-on" : ""} aria-pressed={show === k} onClick={() => setShow(k)}>
          {k === "none" && <Headphones size={14} aria-hidden="true" />} {t}
        </button>
      ))}
    </div>
  );
}
// #231: Nghe nói trên điện thoại — nhắc chọn "Cả hai" (đọc câu hỏi + đáp án trên màn hình) và chỉ NÓI đáp án
// (điện thoại, nhất là iPhone, chuyển qua lại giữa phát tiếng và micro dễ lỗi — #045).
let phoneTipOff = false; // "Để sau": ẩn tới khi tải lại trang
function PhoneTip({ show, setShow }) {
  const [phone, setPhone] = useState(false);
  const [off, setOff] = useState(phoneTipOff);
  useEffect(() => setPhone(typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches), []);
  if (!phone || off || show === "qa") return null;
  return (
    <div className="kt-phonetip" role="note">
      <span>
        📱 Trên điện thoại nên chọn <b>Cả hai</b>: đọc câu hỏi và đáp án trên màn hình, rồi chỉ bấm <b>Nói</b> đáp án đúng.
      </span>
      <span className="kt-phonetip-b">
        <button type="button" className="is-pri" onClick={() => setShow("qa")}>
          Chọn Cả hai
        </button>
        <button
          type="button"
          onClick={() => {
            phoneTipOff = true;
            setOff(true);
          }}
        >
          Để sau
        </button>
      </span>
    </div>
  );
}
// #285 (LB-Q1): trả lời ĐÚNG → tự sang câu sau 3 giây (thấy đếm ngược, bấm là sang ngay); sai thì dừng để đọc giải thích.
// Công tắc "Tự sang câu" nhớ trên máy; bấm "Giải thích" thì dừng đếm.
function useTuSang() {
  const [on, setOn] = useStoredState("hkt.tuSangCau", true);
  return [on !== false, (v) => setOn(v)];
}
function NextBtn({ onGo, auto, dung, label = "Câu tiếp", resetKey }) {
  const [n, setN] = useState(3);
  const goRef = useRef(onGo);
  goRef.current = onGo;
  const chay = auto && !dung;
  useEffect(() => {
    setN(3);
    if (!chay) return undefined;
    const t = setInterval(() => setN((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [chay, resetKey]);
  useEffect(() => {
    if (chay && n <= 0) goRef.current();
  }, [n, chay]);
  return (
    <button type="button" className="hkt-btn hkt-btn--primary kt-dnext" onClick={onGo}>
      {label}
      {chay && n > 0 ? <b className="kt-dem"> {n}</b> : null} <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}
function TuSangChip({ on, setOn }) {
  return (
    <button type="button" className={`kt-tusang ${on ? "is-on" : ""}`} onClick={() => setOn(!on)} aria-pressed={on} title="Trả lời đúng thì tự sang câu sau 3 giây">
      Tự sang câu: {on ? "Bật" : "Tắt"}
    </button>
  );
}
function Status({ fb }) {
  return (
    <div className={`kt-dstatus ${fb ? `is-${fb.tone}` : ""}`} role="status" aria-live="polite">
      {fb && (
        <>
          <span>{fb.text}</span>
          {fb.said && <span className="hkt-u-said" lang="en">Máy nghe được: “{fb.said}”</span>}
        </>
      )}
    </div>
  );
}

// ---------- 4. Nghe nói — luyện nói: nghe câu hỏi, đọc / gõ câu trả lời (không hiện chữ — #050) ----------
export function SayPart({ unit, prog, update, player, openExplain, refButton, onNextPart }) {
  const qs = unit.questions;
  const say = { pos: 0, ok: {}, wrong: 0, bad: {}, ...(prog.say || {}) }; // #269 an toàn khi thiếu khoá
  const [tuSang, setTuSang] = useTuSang(); // #285
  const [dung, setDung] = useState(false);
  const i = Math.min(say.pos || 0, qs.length - 1);
  const q = qs[i];
  // #073: thứ tự câu (mặc định 1→40; bấm "Đảo" để trộn). say.pos vẫn là số thứ tự câu hỏi gốc.
  const order = say.order?.length === qs.length ? say.order : [...Array(qs.length).keys()];
  const at = order.indexOf(i);
  const opts = shownOptions(q);
  const [fb, setFb] = useState(null);
  const [review, setReview] = useState(false); // #160
  const { show, setShow, showQ, showA } = useDrillShow(); // #229
  const grp = useNhom(); // #230
  useEffect(() => { grp?.setCau?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const stageRef = useStageTop(i);
  useEffect(() => {
    setFb(null);
    player.stop();
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const solved = !!say.ok[i];
  const okCount = Object.keys(say.ok).length;
  const go = (n) => update({ say: { ...say, pos: Math.max(0, Math.min(qs.length - 1, n)) } });
  const goAt = (k) => k >= 0 && k < order.length && go(order[k]);
  const nextOpen = () => {
    for (let k = 1; k <= qs.length; k++) {
      const n = order[(at + k) % qs.length];
      if (!say.ok[n]) return n;
    }
    return null;
  };
  const reshuffle = () => {
    const o = shuffle([...Array(qs.length).keys()]);
    const first = o.find((k) => !say.ok[k]);
    update({ say: { ...say, order: o, pos: first ?? o[0] } });
  };

  const onSubmit = (alts, mode) => {
    if (solved) return;
    const r = matchAlts(alts, opts, SAY_MATCH);
    const said = { ...say.said, [i]: r.said }; // #160: câu máy nghe được — cho báo cáo cuối
    // #162: mỗi lượt NÓI ghi độ khớp (%) với đáp án đúng → báo cáo phân theo mức
    const p = pctTo(alts, opts.find((o) => o.ok).text);
    const base = { ...say, said, ...(mode === "speak" ? { reads: [...(say.reads || []), { i, p }].slice(-600) } : {}) };
    if (r.status === "match" && opts[r.key].ok) {
      update({ say: { ...base, ok: { ...say.ok, [i]: k1(r.key) } } });
      setFb(null);
    } else if (r.status === "match") {
      update({ say: { ...base, wrong: say.wrong + 1, bad: { ...say.bad, [i]: (say.bad?.[i] || 0) + 1 } } });
      setFb({ tone: "bad", text: `Bạn vừa nói đáp án ${r.key + 1} — chưa đúng (khớp đáp án đúng ${p}%). Nghe lại và thử tiếp.`, said: r.said });
    } else {
      // U3-Q3 (#061): máy không hiểu (không khớp / gần nhiều đáp án) → không tính Sai, hỏi lại
      askAgain(player);
      update({ say: { ...base, unclear: (say.unclear || 0) + 1, miss: { ...say.miss, [i]: (say.miss?.[i] || 0) + 1 } } });
      setFb({ tone: "warn", text: `“What did you say?” — khớp đáp án đúng ${p}% (cần từ 50%). Nói lại (hoặc gõ) đầy đủ hơn. Không tính Sai.`, said: r.said });
    }
  };
  const solvedKey = solved ? say.ok[i] - 1 : null;
  useEffect(() => setDung(false), [i]); // #285
  const n = nextOpen();
  const keys = {
    q: () => player.play(`sy-q-${i}`, q.q),
    1: () => player.play(`sy-o-${i}-0`, opts[0].text),
    2: () => player.play(`sy-o-${i}-1`, opts[1].text),
    3: () => player.play(`sy-o-${i}-2`, opts[2].text),
    ArrowLeft: () => goAt(at - 1),
    ArrowRight: () => goAt(at + 1),
  };
  if (solved && n !== null) keys.Enter = () => go(n);
  useDrillKeys(keys, [i, solved, n, say]);
  const allDone = okCount === qs.length;
  if (allDone && !review)
    return (
      <PartReport
        kind="say" unit={unit} prog={prog} player={player} openExplain={openExplain}
        onReview={() => setReview(true)}
        onRetryWrong={() => {
          const w = partStats("say", unit, prog).wrongList.map((x) => x.i);
          const ok = { ...say.ok };
          const bad = { ...say.bad };
          const miss = { ...say.miss };
          w.forEach((k) => {
            delete ok[k];
            delete bad[k];
            delete miss[k];
          });
          setReview(true);
          update({ say: { ...say, ok, bad, miss, wrong: 0, unclear: 0, pos: w[0] ?? 0, lu: Date.now() } }); // #290
        }}
        onRestart={() => {
          setReview(true);
          update({ say: { pos: 0, ok: {}, wrong: 0, order: say.order, lu: Date.now() } }); // làm lại: xoá cả lượt nói (reads)
        }}
        onNextPart={onNextPart} nextLabel="Sang True or false"
      />
    );

  return (
    <div className="kt-drill">
      <div className="kt-dhead">
        <div className="hkt-u-pills">
          <VongDet value={okCount / qs.length} size={30} label={`${okCount}/${qs.length} câu đã nói đúng`} />
          <Pill>Câu {at + 1}/{qs.length}</Pill>
          <Pill tone="ok">Đúng {okCount}</Pill>
          <Pill tone="bad">Sai {say.wrong}</Pill>
        </div>
        <div className="kt-dnav">
          <ShuffleButton onClick={reshuffle} />
          <button type="button" className="kt-dicon kt-darrow" disabled={at === 0} onClick={() => goAt(at - 1)} aria-label="Câu trước" title="Câu trước (←)">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="kt-dicon kt-darrow" disabled={at === qs.length - 1} onClick={() => goAt(at + 1)} aria-label="Câu sau" title="Câu sau (→)">
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          {refButton}
        </div>
      </div>
      <div className="hkt-progress-bar">
        <span style={{ width: `${(okCount / qs.length) * 100}%` }} />
      </div>
      <div className="kt-dstage" ref={stageRef}>
        {allDone && (
          <div className="hkt-u-done">
            Xong cả {qs.length} câu Nghe nói.{" "}
            <button type="button" className="hkt-btn hkt-btn--primary" onClick={() => setReview(false)}>
              <BarChart3 size={16} aria-hidden="true" /> Xem báo cáo
            </button>
          </div>
        )}
        <Listen player={player} id={`sy-q-${i}`} text={q.q} className="hkt-listen--lg">
          Nghe câu hỏi
        </Listen>
        <ShowSeg show={show} setShow={setShow} />
        {solved || showQ ? (
          <div className="hkt-u-reveal">
            <p className="hkt-u-qen" lang="en">{q.q}</p>
            <ViHint key={`sy-vi-${i}`} text={q.vi} />
          </div>
        ) : !showA ? (
          <p className="kt-dnote">
            <Headphones size={15} aria-hidden="true" /> Chỉ nghe — chữ hiện khi bạn nói đúng đáp án
          </p>
        ) : null}
        {solved ? (
          // #074: đã đúng → chỉ hiện chữ đáp án đúng; 3 đáp án vẫn nghe lại được bằng hàng nút
          <>
            <div className="kt-dopts">
              {opts.map((o, k) => (
                <Listen key={k} player={player} id={`sy-o-${i}-${k}`} text={o.text} className={`kt-dopt ${k === solvedKey ? "is-ok" : ""}`}>
                  Đáp án {k + 1}
                </Listen>
              ))}
            </div>
            <p className="kt-dans" lang="en">
              <Check size={16} aria-hidden="true" /> {opts[solvedKey].text}
            </p>
          </>
        ) : (
          <div className={`kt-dopts ${showA ? "is-text" : ""}`}>
            {opts.map((o, k) => (
              <Listen key={k} player={player} id={`sy-o-${i}-${k}`} text={o.text} className="kt-dopt">
                {showA ? (
                  <span className="kt-dopt-t">
                    <b>{k + 1}</b> <span lang="en">{o.text}</span>
                  </span>
                ) : (
                  `Đáp án ${k + 1}`
                )}
              </Listen>
            ))}
          </div>
        )}
      </div>
      <div className="kt-ddock">
        {solved ? (
          <div className="kt-drow is-ok">
            <span className="kt-dmsg">
              <Check size={18} aria-hidden="true" /> Đúng — đáp án {solvedKey + 1}.
            </span>
            <button type="button" className="hkt-btn" onClick={() => { setDung(true); openExplain(i); }}>
              Giải thích
            </button>
            {n !== null && <NextBtn onGo={() => go(n)} auto={tuSang} dung={dung} resetKey={i} />}
            <TuSangChip on={tuSang} setOn={setTuSang} />
          </div>
        ) : (
          <>
            <Status fb={fb} />
            <AnswerBox onSubmit={onSubmit} placeholder="Gõ đáp án đúng…" hint="Nghe 3 đáp án rồi nói lại đáp án đúng." compact />
          </>
        )}
        <KeyHint>Phím tắt: Q nghe câu hỏi · 1 2 3 nghe đáp án · V tiếng Việt (khi đã đúng) · Enter câu tiếp · ← → đổi câu</KeyHint>
      </div>
    </div>
  );
}
// lưu số thứ tự đáp án đúng (+1 để khác 0)
const k1 = (k) => k + 1;

// ---------- 5. True or false: 80 câu (#060) — nghe câu hỏi + câu trả lời, phân biệt đúng / sai ----------
// Không hiện chữ (#049); +1 / −1, không chọn lại; 40 TRUE + 40 FALSE, rải đều (unitData.newQaRun).
export function TrueFalsePart({ unit, prog, update, player, openExplain, refButton, results, onNextPart }) {
  const qs = unit.questions;
  const qa = prog.qa && prog.qa.items?.length === qaTotal(qs.length) ? prog.qa : null;
  useEffect(() => {
    // #262: tạo lượt mới chỉ khi tiến độ MỚI NHẤT chưa có lượt (đọc trong hàm, không dùng prog lúc dựng — tránh xoá lượt / mốc cũ)
    if (!qa) update((p) => (p.qa && p.qa.items?.length === qaTotal(qs.length) ? {} : { qa: newQaRun(qs.length) }));
  }, [qa]); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = qa?.pos ?? 0;
  const it = qa?.items[pos];
  const [fb, setFb] = useState(null);
  const { show, setShow, showQ, showA } = useDrillShow(); // #229
  const grp = useNhom(); // #230
  const [tuSang, setTuSang] = useTuSang(); // #285
  const [dung, setDung] = useState(false);
  useEffect(() => setDung(false), [pos]);
  useEffect(() => { grp?.setCau?.(it?.i ?? 0); }, [it?.i]); // eslint-disable-line react-hooks/exhaustive-deps
  const stageRef = useStageTop(`${pos}-${qa?.runs}`);
  useEffect(() => {
    setFb(null);
    player.stop();
  }, [pos, qa?.runs]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = qa && it && !qa.finished;
  const q = live ? qs[it.i] : null;
  const doneHere = live ? qa.done[pos] : null;
  const set = (patch) => update({ qa: { ...qa, ...patch } });
  const next = () => (pos + 1 >= qa.items.length ? set({ finished: true }) : set({ pos: pos + 1 }));
  const cand = live ? q.options[it.cand] : "";
  const judge = (v, said) => {
    if (!live || doneHere) return;
    const right = v === it.truth;
    setFb(null);
    set({ d2pt: qa.d2pt + (right ? 1 : -1), d2n: qa.d2n + 1, done: { ...qa.done, [pos]: { right, chose: v, ...(said ? { said } : {}) } } });
  };
  const keys = live
    ? doneHere
      ? { Enter: next, n: next, q: () => player.play(`tf-q-${pos}`, q.q), a: () => player.play(`tf-a-${pos}`, cand) }
      : { t: () => judge(true), f: () => judge(false), q: () => player.play(`tf-q-${pos}`, q.q), a: () => player.play(`tf-a-${pos}`, cand) }
    : {};
  useDrillKeys(keys, [pos, !!doneHere, live, qa?.runs]);

  if (!qa || !it) return <p className="hkt-message-inline">Đang chuẩn bị…</p>;

  if (qa.finished) {
    return (
      // #160: báo cáo cuối phần (thay cho bảng kết quả ngắn)
      <PartReport
        kind="tf" unit={unit} prog={prog} player={player} openExplain={openExplain}
        onRestart={() => update({ qa: { ...newQaRun(qs.length), runs: (qa.runs || 1) + 1, lu: Date.now() } })}
        restartLabel="Làm lại (trộn mới)"
        overall={results}
        onNextPart={onNextPart} nextLabel="Sang bài tiếp"
      />
    );
  }

  const okN = Object.values(qa.done).filter((d) => d.right).length;
  const badN = Object.keys(qa.done).length - okN;
  const onSubmit = (alts) => {
    const s = alts.join(" ").toLowerCase();
    if (/\b(true|right|correct|yes)\b|đúng/.test(s)) judge(true, alts[0]);
    else if (/\b(false|wrong|no|not)\b|sai/.test(s)) judge(false, alts[0]);
    else {
      askAgain(player);
      setFb({ tone: "warn", text: "“What did you say?” — máy chưa hiểu, hãy nói “true” hoặc “false”.", said: alts[0] });
    }
  };
  return (
    <div className="kt-drill">
      <div className="kt-dhead">
        <div className="hkt-u-pills">
          <Pill>Câu {pos + 1}/{qa.items.length}</Pill>
          <Pill tone="ok">Đúng {okN}</Pill>
          <Pill tone="bad">Sai {badN}</Pill>
          <Pill tone={qa.d2pt < 0 ? "bad" : "ok"}>{qa.d2pt} điểm</Pill>
        </div>
        <div className="kt-dnav">
          <ShuffleButton onClick={() => set({ items: reshuffleQaRest(qa.items, doneHere ? pos + 1 : pos) })} />
          {refButton}
        </div>
      </div>
      <div className="hkt-progress-bar">
        <span style={{ width: `${(Object.keys(qa.done).length / qa.items.length) * 100}%` }} />
      </div>
      <div className="kt-dstage" ref={stageRef}>
        <div className="hkt-u-btns">
          <Listen player={player} id={`tf-q-${pos}`} text={q.q}>
            Nghe câu hỏi
          </Listen>
          <Listen player={player} id={`tf-a-${pos}`} text={cand}>
            Nghe câu trả lời
          </Listen>
        </div>
        <ShowSeg show={show} setShow={setShow} />
        {doneHere || showQ || showA ? (
          <div className="hkt-u-reveal">
            {(doneHere || showQ) && <p className="hkt-u-qen" lang="en">{q.q}</p>}
            {(doneHere || showQ) && <ViHint key={`tf-vi-${pos}`} text={q.vi} />}
            {(doneHere || showA) && <blockquote className="hkt-u-cand" lang="en">{cand}</blockquote>}
          </div>
        ) : (
          <p className="kt-dnote">
            <Headphones size={15} aria-hidden="true" /> Chỉ nghe — câu trả lời vừa nghe đúng hay sai? Đúng +1, sai −1, không chọn lại.
          </p>
        )}
      </div>
      <div className="kt-ddock">
        <div className="hkt-u-tf">
          {[true, false].map((v) => {
            const cls = doneHere ? (v === it.truth ? "is-ok" : v === doneHere.chose ? "is-bad" : "") : "";
            return (
              <button key={String(v)} type="button" className={`hkt-btn hkt-u-tfbtn ${cls}`} disabled={!!doneHere} onClick={() => judge(v)}>
                {v ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />} {v ? "True" : "False"}
              </button>
            );
          })}
        </div>
        {doneHere ? (
          <div className={`kt-drow ${doneHere.right ? "is-ok" : "is-bad"}`}>
            <span className="kt-dmsg">
              {doneHere.right ? "Chính xác! +1" : "Chưa đúng −1"} · Câu này là <b>{it.truth ? "TRUE" : "FALSE"}</b>
            </span>
            <button type="button" className="hkt-btn" onClick={() => { setDung(true); openExplain(it.i); }}>
              Giải thích
            </button>
            {/* #285: đúng → tự sang câu sau 3 giây; sai → dừng để xem đáp án đúng */}
            <NextBtn onGo={next} auto={tuSang && doneHere.right} dung={dung} label="Tiếp" resetKey={pos} />
            <TuSangChip on={tuSang} setOn={setTuSang} />
          </div>
        ) : (
          // #285 (LB-Q2): True or false chỉ chọn bằng tay (bỏ ô Nói / Gõ)
          <Status fb={fb} />
        )}
        <KeyHint>Phím tắt: Q nghe câu hỏi · A nghe câu trả lời · T true · F false · V tiếng Việt (khi đã chọn) · Enter tiếp</KeyHint>
      </div>
    </div>
  );
}

// ---------- #160 Báo cáo cuối mỗi phần luyện: đã làm gì · câu đúng / sai · % đúng (biểu đồ) · câu cần luyện lại ----------
const PART_NAME = { quiz: "Trắc nghiệm", say: "Nghe nói", tf: "True or false" };
/** Số liệu một phần. first = đúng ngay lần đầu; fixed = đúng sau khi sai; wrongList = câu từng sai (để luyện lại). */
export function partStats(kind, unit, prog) {
  const qs = unit.questions;
  if (kind === "tf") {
    const qa = prog.qa;
    const items = qa?.items || [];
    const done = qa?.done || {};
    const answered = Object.keys(done).length;
    const right = Object.values(done).filter((d) => d.right).length;
    const wrongList = Object.entries(done)
      .filter(([, d]) => !d.right)
      .map(([p, d]) => ({ i: items[p].i, pos: +p, q: qs[items[p].i].q, cand: qs[items[p].i].options[items[p].cand], truth: items[p].truth, chose: d.chose, said: d.said }));
    return { total: items.length, answered, first: right, fixed: 0, wrong: answered - right, pct: answered ? Math.round((right / answered) * 100) : 0, points: qa?.d2pt || 0, wrongList };
  }
  const p = (kind === "quiz" ? prog.pick : prog.say) || {};
  const ok = p.ok || {};
  const tries = {};
  if (kind === "quiz") Object.keys(p.bad || {}).forEach((key) => (tries[+key.split("-")[0]] = (tries[+key.split("-")[0]] || 0) + 1));
  else Object.entries(p.bad || {}).forEach(([k, n]) => (tries[+k] = n));
  const miss = p.miss || {};
  const answered = Object.keys(ok).length;
  const wrongIs = qs.map((_, k) => k).filter((k) => tries[k]);
  const first = Object.keys(ok).filter((k) => !tries[k]).length;
  const wrongList = wrongIs.map((k) => ({ i: k, q: qs[k].q, tries: tries[k], miss: miss[k] || 0, said: p.said?.[k], solved: !!ok[k] }));
  return {
    total: qs.length, answered, first, fixed: answered - first, wrong: Object.values(tries).reduce((a, b) => a + b, 0),
    unclear: p.unclear || 0, pct: qs.length ? Math.round((first / qs.length) * 100) : 0, wrongList,
    legacy: (p.wrong || 0) > 0 && !wrongIs.length, // tiến độ cũ (trước #160) không ghi câu nào sai
  };
}

function StackBar({ parts }) {
  const sum = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <>
      <div className="kt-rep-bar" role="img" aria-label={parts.map((p) => `${p.label} ${p.n}`).join(", ")}>
        {parts.map((p) => p.n > 0 && <span key={p.label} className={`is-${p.tone}`} style={{ width: `${(p.n / sum) * 100}%` }} title={`${p.label}: ${p.n}`} />)}
      </div>
      <ul className="kt-rep-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <i className={`is-${p.tone}`} aria-hidden="true" /> {p.label} <b>{p.n}</b>
          </li>
        ))}
      </ul>
    </>
  );
}

/** #161: biểu đồ thanh ngang — mỗi dòng: nhãn · thanh (theo giá trị lớn nhất) · số. */
function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="kt-rep-hb">
      {rows.map((r) => (
        <div key={r.label} className="row">
          <span className="n">{r.label}</span>
          <span className="t" role="img" aria-label={`${r.label}: ${r.v}`}>
            <span className={`is-${r.tone || "ok"}`} style={{ width: `${(r.v / max) * 100}%` }} />
          </span>
          <span className="v">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

/** #162: thống kê độ khớp câu nói (máy nghe → chữ) với đáp án đúng — Nghe nói. ≥ 50% là đạt. */
export function speechStats(prog) {
  const reads = prog.say?.reads || [];
  const bins = PCT_BINS.map((b) => ({ ...b, v: reads.filter((r) => r.p >= b.lo && r.p < b.hi).length }));
  const pass = reads.filter((r) => r.p >= 50).length;
  const qs = new Set(reads.map((r) => r.i));
  const best = {};
  reads.forEach((r) => (best[r.i] = Math.max(best[r.i] ?? 0, r.p)));
  const qPass = Object.values(best).filter((p) => p >= 50).length;
  const avg = reads.length ? Math.round(reads.reduce((a, r) => a + r.p, 0) / reads.length) : 0;
  const last = {};
  reads.forEach((r) => (last[r.i] = r.p));
  return { n: reads.length, pass, fail: reads.length - pass, pct: reads.length ? Math.round((pass / reads.length) * 100) : 0, nq: qs.size, qPass, avg, bins, last };
}

export function PartReport({ kind, unit, prog, player, openExplain, onReview, onRetryWrong, onRestart, restartLabel = "Làm lại từ đầu", onNextPart, nextLabel, overall }) {
  const s = partStats(kind, unit, prog);
  const sp = kind === "say" ? speechStats(prog) : null;
  const name = PART_NAME[kind];
  const did =
    kind === "quiz"
      ? `Đã làm đúng ${s.answered}/${s.total} câu trắc nghiệm, chọn nhầm ${s.wrong} lần.`
      : kind === "say"
      ? `Đã nói đúng ${s.answered}/${s.total} câu; nói nhầm đáp án ${s.wrong} lần${s.unclear ? `, máy chưa hiểu ${s.unclear} lần (không tính sai)` : ""}.`
      : `Đã trả lời ${s.answered}/${s.total} câu: đúng ${s.first}, sai ${s.wrong} · ${s.points} điểm.`;
  const pctLabel = kind === "tf" ? "Trả lời đúng" : kind === "say" ? "Nói đúng ngay lần đầu" : "Chọn đúng ngay lần đầu";
  const bar =
    kind === "tf"
      ? [
          { label: "Đúng", n: s.first, tone: "ok" },
          { label: "Sai", n: s.wrong, tone: "bad" },
        ]
      : [
          { label: "Đúng ngay lần đầu", n: s.first, tone: "ok" },
          { label: "Đúng sau khi sửa", n: s.fixed, tone: "mid" },
          ...(s.total - s.answered > 0 ? [{ label: "Chưa xong", n: s.total - s.answered, tone: "none" }] : []),
        ];
  const tip = s.pct >= 90 ? "Kết quả tốt — có thể sang phần tiếp." : s.pct >= 70 ? "Nên luyện lại các câu sai trước khi sang phần tiếp." : "Nên luyện lại các câu sai hoặc làm lại cả phần.";
  const sum = unitSummaryLite(unit, prog);
  return (
    <div className="kt-drill">
      <div className="kt-dstage kt-rep">
        <div className="kt-rep-head">
          <h2 className="kt-rep-h">Báo cáo · {name}</h2>
          <p className="kt-rep-did">{did}</p>
        </div>
        <div className="kt-rep-kpi">
          <div>
            <b>{s.pct}%</b>
            <span>{pctLabel}</span>
          </div>
          <div>
            <b>{s.wrong}</b>
            <span>{kind === "tf" ? "Câu sai" : "Lần sai"}</span>
          </div>
          {sp ? (
            <>
              <div>
                <b>{sp.n}</b>
                <span>Lượt đã nói ({sp.nq} câu)</span>
              </div>
              <div>
                <b>{sp.pct}%</b>
                <span>Lượt khớp ≥ 50%</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <b>{s.answered}</b>
                <span>Câu đã xong</span>
              </div>
              <div>
                <b>{s.total - s.answered}</b>
                <span>Câu chưa xong</span>
              </div>
            </>
          )}
        </div>

        <section className="kt-rep-sec">
          <h3 className="kt-rep-h3">Kết quả {s.total} câu</h3>
          <StackBar parts={bar} />
          <p className="kt-rep-tip">{tip}</p>
        </section>

        {sp && (
          <section className="kt-rep-sec">
            <h3 className="kt-rep-h3">Độ khớp câu nói với đáp án đúng (≥ 50% là đạt)</h3>
            {sp.n ? (
              <>
                <HBars rows={sp.bins.map((b) => ({ label: b.label, v: b.v, tone: b.tone }))} />
                <p className="kt-rep-note">
                  Đã nói {sp.n} lượt cho {sp.nq} câu: {sp.pass} lượt đạt (≥ 50%), {sp.fail} lượt dưới 50% · trung bình {sp.avg}%. Số câu có ít nhất một lượt đạt: {sp.qPass}/{sp.nq}.
                </p>
              </>
            ) : (
              <p className="kt-rep-note">Chưa có lượt nói nào được ghi (chỉ ghi từ bản cập nhật này, và chỉ khi trả lời bằng giọng nói).</p>
            )}
          </section>
        )}

        <section className="kt-rep-sec">
          <h3 className="kt-rep-h3">Câu cần luyện lại ({s.wrongList.length})</h3>
          {s.legacy && <p className="kt-rep-note">Các lượt làm trước bản cập nhật này không ghi lại từng câu sai — chỉ có tổng số lần sai.</p>}
          {s.wrongList.length ? (
            <ol className="kt-rep-list">
              {s.wrongList.map((w) => (
                <li key={`${w.i}-${w.pos ?? ""}`}>
                  <div className="q" lang="en">{w.q}</div>
                  <div className="m">
                    {kind === "tf" ? (
                      <>
                        <span lang="en">“{w.cand}”</span> là <b>{w.truth ? "TRUE" : "FALSE"}</b> — bạn chọn {w.chose ? "TRUE" : "FALSE"}
                        {w.said && <span lang="en"> (nói: “{w.said}”)</span>}
                      </>
                    ) : (
                      <>
                        Sai {w.tries} lần{w.miss ? ` · máy chưa hiểu ${w.miss} lần` : ""}
                        {sp?.last[w.i] != null && ` · khớp lần cuối ${sp.last[w.i]}%`}
                        {w.said && (
                          <>
                            {" "}· Máy nghe được lần cuối: <span lang="en">“{w.said}”</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="a">
                    <Listen player={player} id={`rep-${kind}-${w.i}-${w.pos ?? ""}`} text={w.q} className="hkt-u-ico" title="Nghe câu hỏi" />
                    <button type="button" className="hkt-link" onClick={() => openExplain(w.i)}>
                      Giải thích
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            !s.legacy && <p className="kt-rep-note">Không có câu nào sai.</p>
          )}
        </section>

        <section className="kt-rep-sec">
          <h3 className="kt-rep-h3">Cả bài</h3>
          <table className="kt-rep-tbl">
            <thead>
              <tr>
                <th>Phần</th>
                <th>% đúng ngay lần đầu</th>
                <th>Lượt nói khớp ≥ 50%</th>
              </tr>
            </thead>
            <tbody>
              {sum.map((r) => (
                <tr key={r.k}>
                  <td>{r.name}</td>
                  <td>
                    <span className="kt-rep-mini" role="img" aria-label={`${r.done ? r.pct : 0}%`}>
                      <span style={{ width: `${r.done ? r.pct : 0}%` }} />
                    </span>
                    {r.done ? `${r.pct}%` : "—"}
                  </td>
                  <td>
                    {r.sp ? (
                      <>
                        <span className="kt-rep-mini is-mid" role="img" aria-label={`${r.sp.pct}%`}>
                          <span style={{ width: `${r.sp.pct}%` }} />
                        </span>
                        {r.sp.pct}% ({r.sp.pass}/{r.sp.n})
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {overall}
        </section>

        <div className="kt-rep-act">
          {onReview && (
            <button type="button" className="hkt-btn" onClick={onReview}>
              Xem lại từng câu
            </button>
          )}
          {onRetryWrong && s.wrongList.length > 0 && (
            <button type="button" className="hkt-btn" onClick={onRetryWrong}>
              <RotateCcw size={15} aria-hidden="true" /> Luyện lại {s.wrongList.length} câu sai
            </button>
          )}
          {onRestart && (
            <button type="button" className="hkt-btn" onClick={onRestart}>
              <RotateCcw size={15} aria-hidden="true" /> {restartLabel}
            </button>
          )}
          {onNextPart && (
            <button type="button" className="hkt-btn hkt-btn--primary" onClick={onNextPart}>
              {nextLabel} <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
/** % đúng ngay lần đầu của 3 phần + độ khớp câu nói (Nghe nói) để so sánh. */
function unitSummaryLite(unit, prog) {
  return [
    ["quiz", !!Object.keys(prog.pick?.ok || {}).length],
    ["say", !!Object.keys(prog.say?.ok || {}).length],
    ["tf", !!Object.keys(prog.qa?.done || {}).length],
  ].map(([k, done]) => {
    const sp = k === "say" ? speechStats(prog) : null;
    return { k, name: PART_NAME[k], done, pct: done ? partStats(k, unit, prog).pct : 0, sp: sp?.n ? sp : null };
  });
}

/** 3 kết quả hiện riêng, không gộp (B-Q14). */
export function UnitResults({ s }) {
  if (!s) return null;
  return (
    <dl className="hkt-u-results">
      <div>
        <dt>Trắc nghiệm</dt>
        <dd>
          Đúng {s.pickOk}/{s.total} · sai {s.pickWrong} lần
        </dd>
      </div>
      <div>
        <dt>Nghe nói</dt>
        <dd>
          Đúng {s.sayOk}/{s.total} · sai {s.sayWrong} lần
        </dd>
      </div>
      <div>
        <dt>True or false</dt>
        <dd>
          {s.d2pt} điểm / {s.d2n} câu
        </dd>
      </div>
    </dl>
  );
}

export function RefButton({ onOpen, count }) {
  return (
    <button type="button" className="hkt-btn hkt-u-refbtn" onClick={onOpen}>
      <ClipboardList size={16} aria-hidden="true" /> Bảng thông tin
      {count > 0 && <span className="hkt-u-count" title="Số lần đã mở (chỉ bạn thấy)">{count}</span>}
    </button>
  );
}
