"use client";
// #354 Hỗ trợ người mới (lưu trên máy): nghe chậm 🐢, chế độ "Mới bắt đầu / Đang lên / Khá vững", tiếng Việt mở sẵn.
import { useEffect, useState } from "react";
import { KT_STORAGE } from "./config";

const K_CHAM = "hkt.ngheCham"; // "1" = nghe chậm 0,75×
const K_CHEDO = "hkt.cheDo"; // moi | len | vung
const K_VI = "hkt.viMoSan"; // "1" = tiếng Việt mở sẵn
const EV = "hkt-hotro";

const get = (k) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k, v) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* bỏ qua */
  }
  try {
    window.dispatchEvent(new Event(EV));
  } catch {
    /* bỏ qua */
  }
};

export const TOC_CHAM = 0.75;
/** Tốc độ phát hiện tại (audioPlayer đọc mỗi lần phát). */
export const tocDoNghe = () => (typeof window !== "undefined" && get(K_CHAM) === "1" ? TOC_CHAM : 1);
export const viMoSan = () => typeof window !== "undefined" && get(K_VI) === "1";
export const docCheDo = () => (typeof window !== "undefined" ? get(K_CHEDO) : null);

/** Áp chế độ: bật sẵn công cụ hợp với trình độ (đổi lại được bất cứ lúc nào). */
export function apCheDo(cd) {
  set(K_CHEDO, cd);
  if (cd === "moi") {
    set(K_CHAM, "1");
    set(K_VI, "1");
    set(KT_STORAGE.drillShow, JSON.stringify("qa"));
  } else if (cd === "len") {
    set(K_CHAM, null);
    set(K_VI, null);
    set(KT_STORAGE.drillShow, JSON.stringify("qa"));
  } else {
    set(K_CHAM, null);
    set(K_VI, null);
  }
}

function useNghe(k) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const doc = () => setV(get(k) === "1");
    doc();
    window.addEventListener(EV, doc);
    window.addEventListener("storage", doc);
    return () => {
      window.removeEventListener(EV, doc);
      window.removeEventListener("storage", doc);
    };
  }, [k]);
  return [v, (on) => set(k, on ? "1" : null)];
}
export const useNgheCham = () => useNghe(K_CHAM);

/** Nút 🐢 bật / tắt nghe chậm — đặt cạnh các nút nghe. */
export function NutCham({ className = "kt-dicon kt-cham" }) {
  const [on, setOn] = useNgheCham();
  return (
    <button type="button" className={`${className} ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => setOn(!on)} title={on ? "Đang nghe chậm (0,75×) — bấm để về tốc độ thường" : "Nghe chậm lại (0,75×)"}>
      <span aria-hidden="true">🐢</span>
      <span className="kt-cham-t">{on ? "0,75×" : "1×"}</span>
    </button>
  );
}
