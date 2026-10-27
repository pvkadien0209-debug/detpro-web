"use client";
// #206 — Hướng dẫn lần đầu ở trang chủ: 4 bóng chỉ (TC-Q4), chỉ hiện một lần (nhớ trong trình duyệt).
// Xem lại: chân trang "Xem lại hướng dẫn" → /?huong-dan=1
import React, { useEffect, useLayoutEffect, useState } from "react";

const KEY = "dp.tour.home";
const STEPS = [
  { sel: [".kt-search", '.kt-tabbar a[href="/knowledge"]'], title: "Tìm bài bạn cần", text: "Gõ điều bạn cần: phỏng vấn, thuê trọ, IELTS… (trên điện thoại: mục Chủ đề)." },
  { sel: [".kt-tiles .kt-card"], title: "Mỗi thẻ là một chuỗi bài", text: "Một chuỗi bài cho một hoàn cảnh. Bấm để xem các bài và bắt đầu từ bài tổng." },
  { sel: [".kt-go", '.kt-tabbar a:nth-child(3)'], title: "Học tiếp", text: "Lần sau bấm đây để quay lại đúng chỗ đang học. Tiến độ lưu trên máy của bạn." },
  { sel: ['.kt-rail a[href="/videos"]', '.kt-tabbar a[href="/videos"]'], title: "Ngại đọc? Xem video", text: "Mỗi bài có video tóm tắt, tiếng Anh có phụ đề Việt." },
];

const visible = (el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};
const find = (sels) => sels.map((s) => document.querySelector(s)).find(visible) || null;

export default function HomeTour({ ready }) {
  const [step, setStep] = useState(-1);
  const [box, setBox] = useState(null);

  useEffect(() => {
    if (!ready) return;
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      /* chế độ riêng tư */
    }
    const force = new URLSearchParams(window.location.search).has("huong-dan");
    if (!seen || force) {
      const t = setTimeout(() => setStep(0), 700);
      return () => clearTimeout(t);
    }
  }, [ready]);

  useLayoutEffect(() => {
    if (step < 0) return;
    const el = find(STEPS[step].sel);
    if (!el) {
      // bước không có chỗ chỉ (vd. màn hình hẹp) → bỏ qua
      if (step + 1 < STEPS.length) setStep(step + 1);
      else done();
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const place = () => setBox(el.getBoundingClientRect());
    const t = setTimeout(place, 350);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function done() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* bỏ qua */
    }
    setStep(-1);
    setBox(null);
  }

  if (step < 0 || !box) return null;
  const s = STEPS[step];
  const pad = 6;
  const below = box.top < window.innerHeight / 2;
  const w = Math.min(320, window.innerWidth - 32);
  const left = Math.max(16, Math.min(window.innerWidth - w - 16, box.left + box.width / 2 - w / 2));
  const tip = below ? { top: box.bottom + 14, left, width: w } : { bottom: window.innerHeight - box.top + 14, left, width: w };
  return (
    <div className="kt-tour" role="dialog" aria-modal="true" aria-labelledby="kt-tour-h">
      <div className="kt-tour-hole" style={{ top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 }} />
      <div className="kt-tour-tip" style={tip}>
        <small>
          Hướng dẫn {step + 1}/{STEPS.length}
        </small>
        <b id="kt-tour-h">{s.title}</b>
        <p>{s.text}</p>
        <div>
          <button type="button" onClick={done}>
            Bỏ qua
          </button>
          <button type="button" className="is-pri" onClick={() => (step + 1 < STEPS.length ? (setBox(null), setStep(step + 1)) : done())} autoFocus>
            {step + 1 < STEPS.length ? "Tiếp" : "Xong"}
          </button>
        </div>
      </div>
    </div>
  );
}
