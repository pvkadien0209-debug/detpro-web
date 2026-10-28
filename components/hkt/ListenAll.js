"use client";
// #228 — "Nghe cả 40 câu" ở phần Bảng thông tin: phát lần lượt câu hỏi → đáp án đúng của cả bài (như nghe podcast),
// chọn cách hiện chữ: Câu hỏi · Đáp án · Cả hai · Không hiện (nghe chay). Bấm một câu để nghe từ câu đó.
// Giọng: playText (audioPlayer.js → /api/tts, dự phòng giọng trình duyệt). Tự cuộn tới câu đang đọc.
import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { playText, stopAudio } from "./audioPlayer";

const SHOW = [
  ["q", "Câu hỏi"],
  ["a", "Đáp án"],
  ["qa", "Cả hai"],
  ["none", "Nghe chay"],
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ListenAll({ questions }) {
  const [show, setShow] = useState("qa");
  const [readAnswer, setReadAnswer] = useState(true);
  const [vi, setVi] = useState(false);
  const [loop, setLoop] = useState(false);
  const [cur, setCur] = useState(-1);
  const [step, setStep] = useState(""); // "q" | "a" — đang đọc câu hỏi hay đáp án
  const [playing, setPlaying] = useState(false);
  const run = useRef(0);
  const listRef = useRef(null);
  const n = questions.length;

  useEffect(() => () => { run.current++; stopAudio(); }, []);

  useEffect(() => {
    if (cur < 0) return;
    const el = listRef.current?.querySelector(`[data-i="${cur}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cur]);

  async function start(from = 0) {
    const id = ++run.current;
    stopAudio();
    setPlaying(true);
    let i = from;
    while (id === run.current) {
      if (i >= n) {
        if (!loop) break;
        i = 0;
      }
      const q = questions[i];
      setCur(i);
      setStep("q");
      await playText(q.q);
      if (id !== run.current) return;
      if (readAnswer) {
        await wait(700);
        if (id !== run.current) return;
        setStep("a");
        await playText(q.options[0]);
        if (id !== run.current) return;
      }
      await wait(1200);
      i++;
    }
    if (id === run.current) {
      setPlaying(false);
      setStep("");
    }
  }
  function stop() {
    run.current++;
    stopAudio();
    setPlaying(false);
    setStep("");
  }
  const go = (d) => start(Math.max(0, Math.min(n - 1, (cur < 0 ? 0 : cur) + d)));

  return (
    <section className="kt-la" aria-label="Nghe cả 40 câu">
      <div className="kt-la-bar">
        <div className="kt-la-main">
          <button type="button" className="kt-la-play" onClick={() => (playing ? stop() : start(cur < 0 || cur >= n - 1 ? 0 : cur))} aria-label={playing ? "Dừng" : "Nghe tất cả"}>
            {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            <span>{playing ? "Dừng" : cur > 0 ? "Nghe tiếp" : `Nghe tất cả ${n} câu`}</span>
          </button>
          <button type="button" className="kt-la-ico" onClick={() => go(-1)} aria-label="Câu trước" disabled={cur <= 0}>
            <SkipBack size={18} />
          </button>
          <button type="button" className="kt-la-ico" onClick={() => go(1)} aria-label="Câu sau" disabled={cur >= n - 1}>
            <SkipForward size={18} />
          </button>
          <span className="kt-la-pos">{cur >= 0 ? `${cur + 1}/${n}` : `${n} câu`}</span>
        </div>
        <div className="kt-la-opts">
          <span className="kt-la-seg" role="group" aria-label="Hiện chữ">
            {SHOW.map(([k, t]) => (
              <button key={k} type="button" className={show === k ? "is-on" : ""} aria-pressed={show === k} onClick={() => setShow(k)}>
                {t}
              </button>
            ))}
          </span>
          <label>
            <input type="checkbox" checked={readAnswer} onChange={(e) => setReadAnswer(e.target.checked)} /> Đọc đáp án
          </label>
          <label>
            <input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} /> Tiếng Việt
          </label>
          <button type="button" className={`kt-la-ico ${loop ? "is-on" : ""}`} aria-pressed={loop} onClick={() => setLoop(!loop)} title="Lặp lại cả bài">
            <Repeat size={16} />
          </button>
        </div>
      </div>
      <ol className="kt-la-list" ref={listRef}>
        {questions.map((q, i) => {
          const on = i === cur;
          const showQ = show === "q" || show === "qa";
          const showA = show === "a" || show === "qa";
          return (
            <li key={i} data-i={i} className={on ? "is-on" : ""}>
              <button type="button" onClick={() => start(i)} aria-label={`Nghe từ câu ${i + 1}`}>
                <i>{i + 1}</i>
                <span>
                  {showQ && (
                    <b lang="en" className={on && step === "q" ? "is-read" : ""}>
                      {q.q}
                    </b>
                  )}
                  {showQ && vi && q.vi && <small>{q.vi}</small>}
                  {showA && (
                    <em lang="en" className={on && step === "a" ? "is-read" : ""}>
                      → {q.options[0]}
                    </em>
                  )}
                  {!showQ && !showA && <small>{on ? "Đang nghe…" : "Bấm để nghe"}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
