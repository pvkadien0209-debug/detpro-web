// SP01 · M2 — So khớp câu người học nói/gõ với 4 đáp án (Q1, §3 kế hoạch; nhiều cách nói #012).
// Dùng chung cho chế độ Nói, chế độ Gõ và bộ kiểm tra dữ liệu (N3).
import { MATCH } from "./config";

const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
function numberToWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  return String(n);
}

/** Chuẩn hoá: viết thường, % → percent, $ → dollars, số → chữ, bỏ dấu câu. */
export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/(\d+)\s*%/g, "$1 percent")
    .replace(/\$\s*(\d+)/g, "$1 dollars")
    .replace(/\d+/g, (d) => numberToWords(parseInt(d, 10)))
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Độ giống Dice theo cặp ký tự (giống thư viện string-similarity của bản nháp). */
export function dice(a, b) {
  a = a.replace(/\s+/g, "");
  b = b.replace(/\s+/g, "");
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const m = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const g = a.substr(i, 2);
    m.set(g, (m.get(g) || 0) + 1);
  }
  let inter = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const g = b.substr(i, 2);
    const c = m.get(g) || 0;
    if (c > 0) {
      m.set(g, c - 1);
      inter++;
    }
  }
  return (2 * inter) / (a.length + b.length - 2);
}

/** Tỉ lệ từ của đáp án có xuất hiện trong câu nói (Q1). */
export function wordMatch(spokenNorm, answerNorm) {
  const said = new Set(spokenNorm.split(" "));
  const words = answerNorm.split(" ").filter(Boolean);
  if (!words.length) return 0;
  return words.filter((w) => said.has(w)).length / words.length;
}

export const formsOf = (opt) => [opt.text, ...(opt.variants || []), ...(opt.alt || [])].filter(Boolean);

/** Điểm của một câu nói so với một đáp án = điểm cao nhất trên mọi cách nói của đáp án. */
export function scoreOption(input, opt) {
  const s = normalize(input);
  let best = { sim: 0, wm: 0, form: opt.text };
  for (const f of formsOf(opt)) {
    const n = normalize(f);
    const sim = dice(s, n);
    const wm = wordMatch(s, n);
    if (sim > best.sim || (sim === best.sim && wm > best.wm)) best = { sim, wm, form: f };
  }
  return best;
}

/**
 * So khớp với 4 đáp án.
 * Trả về { status: "match" | "none" | "ambiguous", key, sim, scores }
 */
export function matchAnswer(input, options, cfg = MATCH) {
  if (!normalize(input)) return { status: "none", key: null, sim: 0, scores: [] };
  const scores = options.map((o) => ({ key: o.key, ...scoreOption(input, o) }));
  const passing = scores.filter((s) => s.sim >= cfg.sim && s.wm >= cfg.wordMatch).sort((a, b) => b.sim - a.sim);
  if (!passing.length) return { status: "none", key: null, sim: 0, scores };
  if (passing.length > 1 && passing[0].sim - passing[1].sim < cfg.margin) {
    return { status: "ambiguous", key: null, sim: passing[0].sim, scores };
  }
  return { status: "match", key: passing[0].key, sim: passing[0].sim, scores };
}
