"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import React from "react";
import stringSimilarity from "string-similarity";
import ReadMessage from "./ReadMessage_2024";
/* ════════════════════════════════════════════════════════════════════
   Dictaphone — chỉ xử lý check logic
   KHÔNG có speech-to-text, KHÔNG có mic UI
   Đọc input từ #dtphTranscript.textContent → gọi check()
   #chartContainer nằm CỐ ĐỊNH ở bên ngoài (không bị unmount theo
   component này) → ở đây chỉ lo lưu trữ (localStorage) và cập nhật
   biểu đồ mỗi khi có dữ liệu mới, KHÔNG cần render lúc mount.
════════════════════════════════════════════════════════════════════ */
const STATS_KEY = "dtph_score_stats_v1";
// 5 khoảng: 0.5-0.6, 0.6-0.7, 0.7-0.8, 0.8-0.9, 0.9-1.0
const BUCKETS = [
  { min: 0.5, max: 0.6, label: "0.5–0.6", color: "#f87171" },
  { min: 0.6, max: 0.7, label: "0.6–0.7", color: "#fb923c" },
  { min: 0.7, max: 0.8, label: "0.7–0.8", color: "#fbbf24" },
  { min: 0.8, max: 0.9, label: "0.8–0.9", color: "#a3e635" },
  { min: 0.9, max: 1.01, label: "0.9–1.0", color: "#34d399" }, // 1.01 để bucket cuối nhận luôn sim === 1
];
/* ── Đọc / lưu thống kê từ localStorage ──────────────────────────── */
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return BUCKETS.map(() => 0);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === BUCKETS.length) {
      return parsed.map((n) => (Number.isFinite(n) ? n : 0));
    }
    return BUCKETS.map(() => 0);
  } catch {
    return BUCKETS.map(() => 0);
  }
}
function saveStats(counts) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(counts));
  } catch {
    // ignore quota / privacy-mode errors
  }
}
function addSimToStats(sim) {
  const counts = loadStats();
  const idx = BUCKETS.findIndex((b) => sim >= b.min && sim < b.max);
  if (idx !== -1) {
    counts[idx] += 1;
    saveStats(counts);
  }
  return counts;
}
function resetStats() {
  const counts = BUCKETS.map(() => 0);
  saveStats(counts);
  return counts;
}
/* ── Cập nhật biểu đồ ngang (1 dòng duy nhất) vào #chartContainer ──
   #chartContainer cố định ở bên ngoài → hàm này chỉ cập nhật nội dung,
   không cần lo việc div bị mất đi khi component re-render.
   5 cột đặt cạnh nhau theo chiều ngang, mỗi cột là 1 thanh dọc nhỏ
   → không làm tăng height của khu vực chứa.
──────────────────────────────────────────────────────────────────── */
function renderChart() {
  const container = document.getElementById("chartContainer");
  if (!container) return;
  const counts = loadStats();
  const total = counts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...counts);
  const barH = 26; // chiều cao tối đa của cột
  const barW = 14;
  const gap = 10;
  const labelH = 10;
  const svgH = barH + labelH + 4;
  const svgW = BUCKETS.length * (barW + gap) - gap;
  const bars = BUCKETS.map((b, i) => {
    const count = counts[i] || 0;
    const h = Math.max(
      Math.round((count / maxCount) * barH),
      count > 0 ? 3 : 1,
    );
    const x = i * (barW + gap);
    const y = barH - h;
    return `
      <rect x="${x}" y="0" width="${barW}" height="${barH}"
        rx="3" fill="rgba(148,163,184,0.12)"></rect>
      <rect x="${x}" y="${y}" width="${barW}" height="${h}"
        rx="3" fill="${b.color}"></rect>
      <text x="${x + barW / 2}" y="${barH + 9}" text-anchor="middle"
        font-size="8.5" fill="#94a3b8" font-family="inherit">${count}</text>
    `;
  }).join("");
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <svg viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}"
        xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        ${bars}
      </svg>
      <span style="font-size:0.6rem;color:#64748b;white-space:nowrap;">
        0.5→1.0 (${total})
      </span>
      <button id="dtphStatsResetBtn"
        style="font-size:0.58rem;padding:1px 6px;border-radius:5px;border:1px solid rgba(148,163,184,0.25);
        background:rgba(100,116,139,0.18);color:#94a3b8;cursor:pointer;white-space:nowrap;">
        Xóa
      </button>
    </div>
  `;
  const resetBtn = document.getElementById("dtphStatsResetBtn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      resetStats();
      renderChart();
    };
  }
}
const Dictaphone = ({
  CMDlist,
  GENDER,
  setScore,
  addElementIfNotExist,
  ObjVoices,
}) => {
  /* ── Đọc text từ DOM ─────────────────────────────────────────── */
  const getInput = () =>
    document.getElementById("dtphTranscript")?.textContent?.trim() || "";
  /* ── Check ───────────────────────────────────────────────────── */
  function check(input) {
    const objTR = findBest(input, CMDlist, 0.5);
    if (!objTR || !objTR.qs) {
      ReadMessage(
        ObjVoices,
        "Sorry, what did you say?",
        GENDER,
        GENDER === 1 ? [{ id: "sorryFemale" }] : [{ id: "sorryMale" }],
      );
      return;
    }
    // Lưu lại độ khớp (sim) vào thống kê + cập nhật biểu đồ cố định
    if (typeof objTR._sim === "number") {
      addSimToStats(objTR._sim);
      renderChart();
    }
    const awArr = objTR.aw || [];
    const aw01Arr = objTR.aw01 || [];
    const idx = Math.floor(Math.random() * (awArr.length || 1));
    const answer = awArr[idx];
    const audio = aw01Arr[idx];
    const el = document.getElementById("youmean");
    if (el) el.innerText = "You mean: " + JSON.stringify(objTR.qs);
    if (answer)
      ReadMessage(
        ObjVoices,
        answer,
        GENDER,
        audio?.id ? [{ id: audio.id, st: audio.st }] : undefined,
      );
    if (objTR.action?.[0]) {
      if (objTR.action[0] === "WRONG") {
        const btn = document.getElementById("btnBoQua");
        if (btn) btn.click();
        else if (typeof setScore === "function") setScore((S) => S - 2);
      } else if (typeof addElementIfNotExist === "function") {
        addElementIfNotExist(objTR.action[0]);
      }
    }
  }
  /* ── Render: hidden DOM anchor + trigger button ──────────────── */
  return (
    <div style={{ display: "" }}>
      <div id="youmean" />
      <div style={{ display: "none" }} id="dtphTranscript" />
      <button
        style={{ display: "none" }}
        id="checkBTN"
        onClick={() => check(getInput())}
      />
    </div>
  );
};
export default Dictaphone;
/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function countWordsInStatement(str) {
  return str.trim().split(/\s+/).length;
}

function findBest(statement, cmdList, threshold, minLengthRatio = 0.7) {
  if (!statement || !Array.isArray(cmdList)) return null;
  const normStatement = statement.toLowerCase();
  const statementWordCount = countWordsInStatement(normStatement);
  let maxSim = -1;
  let best = null;
  for (const obj of cmdList) {
    for (const q of obj.qs || []) {
      if (!q) continue;
      const normQ = q.toLowerCase();
      const qWordCount = countWordsInStatement(normQ);
      if (statementWordCount / qWordCount < minLengthRatio) continue;
      const sim = stringSimilarity.compareTwoStrings(normStatement, normQ);
      if (sim >= threshold && sim > maxSim) {
        maxSim = sim;
        best = obj;
        if (sim === 1) {
          best._sim = sim;
          return best;
        }
      }
    }
  }
  if (best) best._sim = maxSim;
  return best;
}
