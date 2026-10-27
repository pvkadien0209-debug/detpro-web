// Tải dữ liệu Học kiến thức (JSON tĩnh trong public/jsonData/knowledge). Có cache trong phiên.
const base = () => `/jsonData/knowledge`;
const cache = new Map();

function load(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`${base()}/${path}.json`).then((r) => {
        if (!r.ok) throw new Error("not-found");
        return r.json();
      }).catch((e) => {
        cache.delete(path); // cho phép thử lại
        throw e;
      })
    );
  }
  return cache.get(path);
}

export const loadCatalog = () => load("index");
export const loadTopic = (branch, topic) => load(`${branch}/${topic}/topic`);
export const loadLesson = (branch, topic, lesson) => load(`${branch}/${topic}/${lesson}`);

export const lessonPath = (branch, topic, lesson, section) =>
  `/knowledge/${branch}/${topic}/${lesson}${section ? `/${section}` : ""}`;

// ---------- Tiến độ làm bài (SP01 · M5) ----------
// Khoá: hkt.progress.<branch>/<topic>/<lesson>
// { queue:[chỉ số câu], current, done, correct, mode:"all"|"retry",
//   answers:{ qid:{chosen, correct, mode, input, sim, attempts, at} }, startedAt, updatedAt }
// KHÔNG dùng trường "createdAt": App.js tự xoá các mục có createdAt sau 10 giờ.
export const progressKey = (branch, topic, lesson) => `hkt.progress.${branch}/${topic}/${lesson}`;

/** Tiến độ bài. Trả về null nếu chưa có. */
export function readProgress(branch, topic, lesson) {
  try {
    const raw = window.localStorage.getItem(progressKey(branch, topic, lesson));
    const p = raw ? JSON.parse(raw) : null;
    return p && p.answers && Array.isArray(p.queue) ? p : null;
  } catch {
    return null;
  }
}
export function writeProgress(branch, topic, lesson, p) {
  try {
    window.localStorage.setItem(progressKey(branch, topic, lesson), JSON.stringify(p));
  } catch {
    /* bỏ qua */
  }
}
export function clearProgress(branch, topic, lesson) {
  try {
    window.localStorage.removeItem(progressKey(branch, topic, lesson));
  } catch {
    /* bỏ qua */
  }
}
/** Tính lại done / correct từ answers. */
export function tally(p) {
  const list = Object.values(p.answers || {});
  return { ...p, done: list.length, correct: list.filter((a) => a.correct).length };
}
export function newProgress(total) {
  const now = Date.now();
  return { queue: Array.from({ length: total }, (_, i) => i), current: 0, done: 0, correct: 0, mode: "all", answers: {}, startedAt: now, updatedAt: now };
}
/** Danh sách câu sai (theo thứ tự trong bài). */
export const wrongIndexes = (p, questions) =>
  questions.map((q, i) => (p.answers[q.id] && !p.answers[q.id].correct ? i : -1)).filter((i) => i >= 0);

// ---------- Lượt học (Hướng C, #044) ----------
// Mỗi nhánh lớn của cây kiến thức = một lượt (6–11 câu, khoảng 5 phút). Không cần thêm dữ liệu:
// câu hỏi đã gắn vào nhánh qua tree[].children[].questions. Câu nào chưa gắn nhánh → lượt "Ôn tập" cuối.
// Tiến độ vẫn một khoá cho cả bài; khi đang làm một lượt: { ..., mode: "part" | "retry", part: số lượt (1…) }.
export function lessonParts(lesson) {
  const qs = lesson?.questions || [];
  const idx = new Map(qs.map((q, i) => [q.id, i]));
  const seen = new Set();
  const parts = (lesson?.tree || [])
    .map((b) => {
      const list = [];
      (b.children || []).forEach((c) =>
        (c.questions || []).forEach((id) => {
          if (idx.has(id) && !seen.has(id)) {
            seen.add(id);
            list.push(idx.get(id));
          }
        })
      );
      list.sort((a, b2) => a - b2);
      return { title: b.title, points: b.children || [], qIdx: list };
    })
    .filter((p) => p.qIdx.length);
  const rest = qs.map((_, i) => i).filter((i) => !seen.has(qs[i].id));
  if (rest.length) parts.push({ title: { vi: "Ôn tập", en: "Review" }, points: [], qIdx: rest });
  parts.forEach((p, i) => (p.no = i + 1));
  return parts;
}
/** Thống kê một lượt từ tiến độ (đã làm, đúng, xong chưa). */
export function partStats(p, part, questions) {
  const ans = p?.answers || {};
  let done = 0;
  let correct = 0;
  part.qIdx.forEach((i) => {
    const a = ans[questions[i].id];
    if (a) {
      done++;
      if (a.correct) correct++;
    }
  });
  return { done, correct, total: part.qIdx.length, complete: done === part.qIdx.length };
}
export const partOfQuestion = (parts, i) => parts.find((pt) => pt.qIdx.includes(i)) || null;
/** Lượt nên làm tiếp: lượt đang dở trong tiến độ, nếu không thì lượt đầu tiên chưa xong. */
export function currentPart(p, parts, questions) {
  if (p?.part && parts[p.part - 1] && !partStats(p, parts[p.part - 1], questions).complete) return parts[p.part - 1];
  return parts.find((pt) => !partStats(p, pt, questions).complete) || null;
}
/** Số "điều đã biết thêm" = số ý nhỏ của các lượt đã xong (UXC-Q7, không có điểm hay chuỗi ngày). */
export const knownCount = (p, parts, questions) =>
  parts.reduce((n, pt) => n + (partStats(p, pt, questions).complete ? pt.points.length : 0), 0);
