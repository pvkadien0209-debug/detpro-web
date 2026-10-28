"use client";
// #230 Học cùng — Cây chuỗi bài "thắp sáng" (thiết kế mục 5), vẽ bằng SVG theo dữ liệu.
// Gốc = bài đầu, thân đi từ dưới lên; mỗi bài một cành (trái/phải xen kẽ), 5 lá = 5 phần, bông cuối cành = bài nói tự do.
// view = "nhom" (cả nhóm: lá xanh nhạt + "2/4", xanh đậm phát sáng khi cả nhóm xong) hoặc id một người (cây riêng).
import React, { useEffect, useRef } from "react";
import VongDet from "@/components/hkt/VongDet";
import { PART_KEYS, PART_SHORT, PART_TIP, baiKey, baiMo, baiMoCua } from "@/components/hkt/nhomRules";

const W = 400;
const STEP = 132;
const PAD_TOP = 96;
const PAD_BOT = 56;
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Trạng thái một lá: { n (số người xong), of (số người đang học), all } */
export function leafState(members, key, k, view) {
  const list = view === "nhom" ? members.filter((m) => m.trangThai === "hoc") : members.filter((m) => m.id === view);
  const n = list.filter((m) => m.tom?.[key]?.g?.[k]).length;
  return { n, of: list.length, all: list.length > 0 && n === list.length };
}
export function flowerState(members, key, view) {
  const list = view === "nhom" ? members.filter((m) => m.trangThai === "hoc") : members.filter((m) => m.id === view);
  const xanh = list.filter((m) => m.noi?.[key]?.xanh).length;
  const vang = list.filter((m) => m.noi?.[key]?.baoGui && !m.noi?.[key]?.xanh).length;
  return { xanh, vang, of: list.length, all: list.length > 0 && xanh === list.length };
}

// #250: lá đánh số 1–5 + rê chuột thấy mô tả ngắn (NHA D); nút 💬 nhỏ trên thân mỗi chặng = Hỏi đáp của bài đó (NHA E)
export default function NhomTree({ nhom, members, meId, view = "nhom", onLeaf, onFlower, dots, onQa, tinBai }) {
  const bai = nhom.chuoi.bai;
  const n = bai.length;
  const ch = nhom.changHienTai || 0;
  const H = PAD_TOP + PAD_BOT + n * STEP;
  const trunkX = W / 2;
  const yOf = (k) => H - PAD_BOT - k * STEP - 40;
  const ref = useRef(null);
  useEffect(() => {
    // cuộn TRONG khung cây tới cành đang học (không cuộn cả trang)
    const go = () => {
      const box = ref.current;
      const el = box?.querySelector(".is-cur-branch");
      if (!box || !el) return;
      const d = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTop = Math.max(0, box.scrollTop + d - box.clientHeight / 2);
    };
    const t = setTimeout(go, 250); // chờ khung cây có kích thước thật
    return () => clearTimeout(t);
  }, [ch]);

  // phần trăm cả chuỗi (vòng Đét ở ngọn)
  let done = 0;
  bai.forEach((u, k) => PART_KEYS.forEach((_, j) => (done += leafState(members, baiKey(u), j, view).all ? 1 : 0)));
  const pct = n ? done / (n * PART_KEYS.length) : 0;
  const topY = yOf(Math.min(ch, n - 1));

  return (
    <div className="nh-tree" ref={ref}>
      <div className="nh-crown">
        <VongDet value={pct} size={58} />
        <span>
          <b>{Math.round(pct * 100)}%</b> cả chuỗi{nhom.veDichLuc ? " · Đét! Về đích" : ""}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cây chuỗi ${n} bài`}>
        <defs>
          <filter id="nhGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* thân: phần đã đi màu gỗ đậm */}
        <line x1={trunkX} y1={H - 8} x2={trunkX} y2={PAD_TOP - 40} className="nh-trunk" />
        <line x1={trunkX} y1={H - 8} x2={trunkX} y2={nhom.veDichLuc ? PAD_TOP - 40 : topY} className="nh-trunk is-walked" />
        <ellipse cx={trunkX} cy={H - 10} rx={70} ry={10} className="nh-ground" />
        {bai.map((u, k) => {
          const key = baiKey(u);
          const side = k % 2 === 0 ? 1 : -1;
          const y0 = yOf(k);
          const x1 = trunkX + side * 150;
          const y1 = y0 - 36;
          const open = meId ? baiMoCua(k, nhom, members.find((m) => m.id === meId)) : baiMo(k, ch); // #263
          const cur = k === ch && !nhom.veDichLuc;
          const started = k <= ch;
          const groupDone = PART_KEYS.every((_, j) => leafState(members, key, j, view).all);
          const fl = flowerState(members, key, view);
          const pt = (t) => [trunkX + (x1 - trunkX) * t, y0 + (y1 - y0) * t];
          const label = u.kind === "tong" ? "Bài tổng" : `Bài ${k}`;
          return (
            <g key={key} className={`nh-branch ${started ? "is-lit" : ""} ${cur ? "is-cur-branch" : ""} ${open ? "" : "is-locked"}`}>
              {cur && <rect x={Math.min(trunkX, x1) - 22} y={y1 - 60} width={Math.abs(x1 - trunkX) + 44} height={110} rx={18} className="nh-curbox" />}
              <path d={`M${trunkX} ${y0} Q ${trunkX + side * 70} ${y0 - 4} ${x1} ${y1}`} className="nh-limb" />
              <text x={trunkX + side * 14} y={y0 + 22} textAnchor={side > 0 ? "start" : "end"} className="nh-blabel">
                <tspan fontWeight="700">{label}</tspan>
                <tspan> · {cut(u.title, 20)}</tspan>
              </text>
              <text x={trunkX + side * 14} y={y0 + 38} textAnchor={side > 0 ? "start" : "end"} className="nh-bsub">
                {groupDone ? (view === "nhom" ? "✓ cả nhóm" : "✓ xong") : !open ? (k === ch + 1 ? "🔒 xong bài trước đã" : "🔒 chờ cả nhóm") : cur ? "đang học" : k === ch + 1 ? "làm trước được" : ""}
              </text>
              {PART_KEYS.map((pk, j) => {
                const [lx, ly] = pt(0.42 + j * 0.13);
                const up = j % 2 === 0 ? -1 : 1;
                const cx = lx;
                const cy = ly + up * 19;
                const st = leafState(members, key, j, view);
                const cls = !open ? "is-off" : st.all ? "is-all" : st.n > 0 ? "is-some" : "is-none";
                const rot = (up < 0 ? -35 : 35) * side;
                return (
                  <g
                    key={pk}
                    className={`nh-leaf ${cls}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${label} · ${PART_SHORT[pk]}: ${st.n}/${st.of} xong`}
                    onClick={() => onLeaf?.({ u, k, pk, j })}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onLeaf?.({ u, k, pk, j })}
                  >
                    <title>{`${j + 1}. ${PART_SHORT[pk]} — ${PART_TIP[pk]}${open ? ` · ${st.n}/${st.of} xong` : " · chưa mở"}`}</title>
                    <line x1={lx} y1={ly} x2={cx} y2={cy} className="nh-stem" />
                    <ellipse cx={cx} cy={cy} rx={17} ry={10} transform={`rotate(${rot} ${cx} ${cy})`} filter={st.all && open ? "url(#nhGlow)" : undefined} />
                    {view === "nhom" && open && st.n > 0 && !st.all ? (
                      <text x={cx} y={cy + 4} textAnchor="middle" className="nh-leafn">
                        {st.n}/{st.of}
                      </text>
                    ) : (
                      <text x={cx} y={cy + 4} textAnchor="middle" className="nh-leafno">
                        {j + 1}
                      </text>
                    )}
                    {dots?.[`${key}|${pk}`] && <circle cx={cx + 13} cy={cy - 9} r={5} className="nh-dot" />}
                  </g>
                );
              })}
              {onQa && (
                <g
                  className={`nh-qa ${tinBai?.[key] ? "has-tin" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Hỏi đáp ${label}${tinBai?.[key] ? ` (${tinBai[key]} tin)` : ""}`}
                  onClick={() => onQa({ u, k })}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onQa({ u, k })}
                >
                  <title>{`Hỏi đáp ${label}: hỏi – đáp riêng bài này`}</title>
                  <circle cx={trunkX} cy={y0} r={13} />
                  <text x={trunkX} y={y0 + 4} textAnchor="middle">
                    {tinBai?.[key] ? tinBai[key] : "?"}
                  </text>
                </g>
              )}
              <g
                className={`nh-flower ${!open ? "is-off" : fl.all ? "is-green" : fl.vang || fl.xanh ? "is-yellow" : "is-none"}`}
                role="button"
                tabIndex={0}
                aria-label={`${label} · Bài nói tự do`}
                onClick={() => onFlower?.({ u, k })}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlower?.({ u, k })}
              >
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx={x1 + side * 14} cy={y1 - 10} rx={5.5} ry={8} transform={`rotate(${a} ${x1 + side * 14} ${y1 - 2})`} />
                ))}
                <circle cx={x1 + side * 14} cy={y1 - 2} r={6} className="nh-fc" />
                {view === "nhom" && open && (fl.vang > 0 || (fl.xanh > 0 && !fl.all)) && (
                  <text x={x1 + side * 14} y={y1 + 30} textAnchor="middle" className="nh-leafn">
                    🎤 {fl.xanh}/{fl.of}
                  </text>
                )}
                {dots?.[`${key}|noi`] && <circle cx={x1 + side * 14 + 12} cy={y1 - 16} r={5} className="nh-dot" />}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
