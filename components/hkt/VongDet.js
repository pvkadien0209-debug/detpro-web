"use client";
// NV-Q7 (#112) — Vòng Đét trên web. Hình đã khoá theo NV-Q2: vàng #ffd23f, khe 60° ở hướng 1 giờ (từ 12 giờ tới 2 giờ),
// dáng chữ ký tô 300°; khép đủ 360° = xong. Không đổi màu, không đổi hướng khe, không xoay vòng.
// Vẽ giống DetRing trong video (vid/src/rootComponents/CSK004/cast/rig/ring.jsx): nét bắt đầu ở 2 giờ, chạy theo chiều kim đồng hồ.
//   <VongDet value={done / total} size={32} label="12/40 câu đúng" />  vòng tiến độ: 0 → 300°, đủ (value = 1) thì khép 360° kèm hiệu ứng nhẹ
//   <VongDet sweep={300} track={false} />                              dáng chữ ký (trang không tìm thấy)
//   <VongDetLoading />                                                  biểu tượng đang tải (vòng tự vẽ lại, khe vẫn ở 1 giờ)
// label: tên đọc cho trình đọc màn hình + chữ hiện khi rê chuột; không có label thì vòng chỉ để trang trí (aria-hidden).
import React, { useEffect, useRef, useState } from "react";
// Next.js: VongDet.css nạp toàn cục ở app/layout.js

export const RING = "#ffd23f";
export const SIGN = 300; // độ tô của dáng chữ ký
const R = 14; // trong khung 40×40, nét dày 6 (giữ tỉ lệ nét/bán kính cố định ở mọi cỡ)
const C = 2 * Math.PI * R;

export default function VongDet({ value = 0, size = 32, label, sweep, track = true, className = "" }) {
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const s = sweep != null ? Math.max(0, Math.min(360, sweep)) : v >= 1 ? 360 : v * SIGN;
  const closed = s >= 359.5;
  // Hiệu ứng khép chỉ chạy khi vòng vừa khép lúc đang xem (mở lại bài đã xong thì không chạy)
  const was = useRef(closed);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    const justClosed = closed && !was.current;
    was.current = closed;
    if (!justClosed) return undefined;
    setPop(true);
    const t = setTimeout(() => setPop(false), 900);
    return () => clearTimeout(t);
  }, [closed]);
  const a11y = label ? { role: "img", "aria-label": label, title: label } : { "aria-hidden": true };
  return (
    <span className={`vd ${closed ? "is-closed" : ""} ${pop ? "is-pop" : ""} ${className}`} style={{ width: size, height: size }} {...a11y}>
      <svg width={size} height={size} viewBox="0 0 40 40" focusable="false">
        {track && <circle className="vd-track" cx="20" cy="20" r={R} fill="none" strokeWidth="6" />}
        {pop && <circle className="vd-halo" cx="20" cy="20" r={R} fill="none" stroke={RING} strokeWidth="3" />}
        {s > 0.5 && (
          <circle
            className="vd-arc"
            cx="20"
            cy="20"
            r={R}
            fill="none"
            stroke={RING}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${closed ? C : (C * s) / 360} ${C}`}
            transform="rotate(-30 20 20)" /* vòng SVG bắt đầu ở 3 giờ; lùi 30° → bắt đầu ở 2 giờ, khe ở 12–2 giờ */
          />
        )}
      </svg>
    </span>
  );
}

/** Biểu tượng đang tải: Vòng Đét tự vẽ 0 → 300° lặp lại (người chọn giảm chuyển động: đứng yên ở 300°). */
export function VongDetLoading({ label = "Đang tải…", size = 22 }) {
  return (
    <span className="vd-loading" role="status">
      <VongDet sweep={SIGN} track={false} size={size} className="is-loading" />
      <span>{label}</span>
    </span>
  );
}
