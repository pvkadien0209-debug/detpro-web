"use client";
// Công tắc song ngữ dùng chung (X5, T4): Song ngữ / Chỉ Việt / Chỉ Anh — máy nhớ lựa chọn.
import React from "react";
import useStoredState from "./useStoredState";
import { KT_STORAGE } from "./config";

export const useLang = () => useStoredState(KT_STORAGE.lang, "both");

export function LangToggle({ lang, setLang }) {
  const opts = [
    ["both", "Song ngữ"],
    ["vi", "Chỉ Việt"],
    ["en", "Chỉ Anh"],
  ];
  return (
    <div className="hkt-seg" role="radiogroup" aria-label="Ngôn ngữ hiển thị">
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={lang === v}
          className={lang === v ? "is-on" : ""}
          onClick={() => setLang(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Hiển thị một khối {en, vi} theo lựa chọn ngôn ngữ. Mặc định EN trên, VI dưới.
 *  viFirst (UXC-Q5, #044): phần DẠY KIẾN THỨC (giải thích, bài đọc, tóm tắt) để tiếng Việt trước. */
export function Bi({ value, lang, as: Tag = "p", className = "", viFirst = false }) {
  if (!value) return null;
  const en = lang !== "vi" && value.en && (
    <Tag key="en" className={`hkt-bi-en${lang === "both" && viFirst ? " is-second" : ""}`} lang="en">
      {value.en}
    </Tag>
  );
  const vi = lang !== "en" && value.vi && (
    <Tag key="vi" className={`hkt-bi-vi${lang === "both" && !viFirst ? " is-second" : ""}`} lang="vi">
      {value.vi}
    </Tag>
  );
  return <div className={`hkt-bi${viFirst ? " is-vi-first" : ""} ${className}`}>{viFirst ? [vi, en] : [en, vi]}</div>;
}
