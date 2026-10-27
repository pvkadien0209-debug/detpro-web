// SP08 · U3 — Dữ liệu "bài theo người nghe" (bài viết + 40 câu). JSON tĩnh trong public/jsonData/units,
// dựng bằng DetPro/noi-dung/soan/build_units.py. Có cache trong phiên.
import { loadCatalog } from "./knowledgeData";

const base = () => `/jsonData/units`;
const cache = new Map();
function load(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`${base()}/${path}.json`)
        .then((r) => {
          if (!r.ok) throw new Error("not-found");
          return r.json();
        })
        .catch((e) => {
          cache.delete(path);
          throw e;
        })
    );
  }
  return cache.get(path);
}

export const loadUnitsIndex = () => load("index");
/** #190 (Next.js): trang máy chủ đã đọc sẵn bài → nạp vào cache để trình duyệt không tải lại. */
export function primeUnit(audience, slug, data) {
  const path = `${audience}/${slug}`;
  if (data && !cache.has(path)) cache.set(path, Promise.resolve(data));
}
export const loadUnit = (audience, slug) => load(`${audience}/${slug}`);

/** Chủ đề trong cây bài mới (null nếu chủ đề chưa có bài theo người nghe). */
export async function findUnitTopic(branch, topic) {
  const idx = await loadUnitsIndex();
  const b = idx.branches.find((x) => x.slug === branch);
  const t = b?.topics.find((x) => x.slug === topic);
  return t ? { ...t, branch, branchTitle: b.title } : null;
}

/**
 * Danh mục cho menu theo nhánh chủ đề (A-Q1, #057): danh mục cũ + cây bài mới.
 * Chủ đề có bài mới → "available", số bài = số bài mới; nhánh/chủ đề chỉ có ở cây mới được thêm vào.
 */
export async function loadMergedCatalog() {
  const [cat, idx] = await Promise.all([
    loadCatalog().catch(() => ({ branches: [] })),
    loadUnitsIndex().catch(() => ({ branches: [] })),
  ]);
  const branches = cat.branches.map((b) => ({ ...b, topics: b.topics.map((t) => ({ ...t })) }));
  idx.branches.forEach((ub) => {
    let b = branches.find((x) => x.slug === ub.slug);
    if (!b) {
      b = { slug: ub.slug, title: ub.title, topics: [] };
      // chèn theo thứ tự của cây mới
      const after = idx.branches.slice(0, idx.branches.indexOf(ub)).map((x) => x.slug);
      let pos = 0;
      branches.forEach((x, i) => after.includes(x.slug) && (pos = i + 1));
      branches.splice(pos, 0, b);
    }
    ub.topics.forEach((ut) => {
      let t = b.topics.find((x) => x.slug === ut.slug);
      if (!t) b.topics.push((t = { slug: ut.slug, title: ut.title, level: ut.level }));
      t.status = "available";
      t.lessons = ut.units.length;
      t.units = true;
    });
    // chủ đề có bài lên trước, chủ đề "Sắp có" xuống cuối
    b.topics.sort((x, y) => (y.status === "available") - (x.status === "available"));
  });
  return { ...cat, branches };
}

// ---------- Đường dẫn (A-Q5: /for/<người-nghe>/<bài>) ----------
export const PARTS = [
  { key: "", label: "Bài viết", short: "Bài viết" },
  { key: "info", label: "Bảng thông tin", short: "Bảng" },
  { key: "quiz", label: "Trắc nghiệm", short: "Trắc nghiệm" },
  { key: "listen-speak", label: "Nghe nói", short: "Nghe nói" },
  { key: "true-or-false", label: "True or false", short: "True/False" },
];
export const audiencePath = (audience) => `/for/${audience}`;
/** Viết thường chữ đầu, giữ hoa tên riêng ("Việt", "Anh") — thay toLowerCase() cả câu (#086). */
export const lowerFirst = (s = "") => s.charAt(0).toLowerCase() + s.slice(1);
// #080 (PL-Q1…Q4): hai cửa "Học kỹ năng" / "Học kiến thức" (+ "Học chuyên môn" khi có chuỗi) — /learn/<path>
export const learnTypePath = (lt) => `/learn/${lt.path}`;
/** Các cửa đang có chủ đề (cửa trống, ví dụ chuyên môn chưa có chuỗi, không hiện). */
export const openLearnTypes = (idx) => (idx?.learnTypes || []).filter((x) => x.topics > 0);
/** Nhánh → chủ đề, chỉ giữ chủ đề thuộc cửa `lt` (nhánh không còn chủ đề thì bỏ). */
export const branchesOf = (idx, lt) =>
  idx.branches
    .map((b) => ({ ...b, topics: b.topics.filter((t) => !lt || t.learnType === lt) }))
    .filter((b) => b.topics.length);
export const unitPath = (audience, slug, part) => `/for/${audience}/${slug}${part ? `/${part}` : ""}`;

// ---------- Tiến độ một bài (SP08 §5) ----------
// Khoá: hkt.unit.<người-nghe>/<bài>
// { lastPart, refOpens,
//   pick: { ok:{i:1}, bad:{"i-k":1}, wrong },
//   say:  { pos, ok:{i:1}, wrong },
//   qa:   True or false { items:[{t:2,i,cand,truth}] ×80, pos, d2pt, d2n, done:{pos:{right,chose}}, finished, runs },
//   updatedAt }
// KHÔNG dùng "createdAt" (App.js tự xoá mục có createdAt sau 10 giờ).
export const unitKey = (audience, slug) => `hkt.unit.${audience}/${slug}`;
export function readUnitProgress(audience, slug) {
  try {
    const raw = window.localStorage.getItem(unitKey(audience, slug));
    const p = raw ? JSON.parse(raw) : null;
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}
export function writeUnitProgress(audience, slug, p) {
  try {
    window.localStorage.setItem(unitKey(audience, slug), JSON.stringify({ ...p, updatedAt: Date.now() }));
  } catch {
    /* bỏ qua */
  }
}

/** Tóm tắt 4 kết quả riêng (B-Q14) để hiện ở danh sách bài. */
export function unitSummary(p, total = 40) {
  if (!p) return null;
  const pickOk = Object.keys(p.pick?.ok || {}).length;
  const sayOk = Object.keys(p.say?.ok || {}).length;
  const qaDone = p.qa ? Object.keys(p.qa.done || {}).length : 0;
  const qaN = p.qa?.items?.length || qaTotal(total);
  return {
    pickOk, pickWrong: p.pick?.wrong || 0,
    sayOk, sayWrong: p.say?.wrong || 0,
    qaDone, qaTotal: qaN, d2pt: p.qa?.d2pt || 0, d2n: p.qa?.d2n || 0,
    finished: !!p.qa?.finished,
    started: !!(pickOk || sayOk || qaDone || p.lastPart),
    total,
  };
}

// ---------- Câu hỏi ----------
/** Ba đáp án theo thứ tự hiện (order là hoán vị của [0,1,2]; đáp án gốc 0 là đáp án đúng). */
export const shownOptions = (q) => q.order.map((i) => ({ key: i, text: q.options[i], ok: i === 0 }));

/** Xáo trộn (Fisher–Yates). */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Số câu phần True or false của một bài 40 câu: 80 (#060). */
export const qaTotal = (n) => n * 2;

/**
 * Phần True or false (#060): 80 câu, phân bổ đều — mỗi câu hỏi 2 lần: 1 lần với đáp án đúng (TRUE),
 * 1 lần với một đáp án sai (FALSE; hai đáp án sai được dùng đều nhau) → đúng 40 TRUE + 40 FALSE.
 * Xếp ngẫu nhiên; không quá 3 câu liền nhau cùng đáp số; hai câu liền nhau không cùng câu hỏi.
 */
export function newQaRun(n) {
  const wrongOf = {}; // 20 câu dùng đáp án sai 1, 20 câu dùng đáp án sai 2
  shuffle([...Array(n).keys()]).forEach((i, k) => (wrongOf[i] = 1 + (k % 2)));
  // 1) Dãy đáp số: đúng 40 TRUE – 40 FALSE, không quá 3 câu liền nhau cùng đáp số
  let truths;
  do {
    truths = shuffle([...Array(2 * n)].map((_, k) => k < n));
  } while (truths.some((v, k) => k >= 3 && v === truths[k - 1] && v === truths[k - 2] && v === truths[k - 3]));
  // 2) Gán câu hỏi: mỗi câu hỏi đúng một mục TRUE và một mục FALSE
  const tPool = shuffle([...Array(n).keys()]);
  const fPool = shuffle([...Array(n).keys()]);
  const items = truths.map((truth) => {
    const i = (truth ? tPool : fPool).pop();
    return { t: 2, i, cand: truth ? 0 : wrongOf[i], truth };
  });
  // 3) Hai câu liền nhau không cùng câu hỏi: đổi câu hỏi với một mục cùng đáp số ở chỗ khác
  const clash = (k) => (k > 0 && items[k].i === items[k - 1].i) || (k < items.length - 1 && items[k].i === items[k + 1].i);
  const swap = (a, b) => {
    const [ia, ib] = [items[a].i, items[b].i];
    items[a] = { ...items[a], i: ib, cand: items[a].truth ? 0 : wrongOf[ib] };
    items[b] = { ...items[b], i: ia, cand: items[b].truth ? 0 : wrongOf[ia] };
  };
  for (let k = 1; k < items.length; k++) {
    if (items[k].i !== items[k - 1].i) continue;
    for (const j of shuffle([...Array(items.length).keys()])) {
      if (j === k || items[j].truth !== items[k].truth) continue;
      swap(j, k);
      if (!clash(j) && !clash(k)) break;
      swap(j, k);
    }
  }
  return { items, pos: 0, d2pt: 0, d2n: 0, done: {}, finished: false };
}

/**
 * #073: True or false — trộn lại các câu CHƯA làm (từ vị trí `from`), giữ nguyên các câu đã làm.
 * Vẫn giữ luật: không quá 3 câu liền nhau cùng đáp số, hai câu liền nhau không cùng câu hỏi
 * (tính cả chỗ nối với các câu đã làm). Dựng giống newQaRun: dãy đáp số trước, rồi gán câu, rồi sửa câu trùng.
 */
export function reshuffleQaRest(items, from) {
  const head = items.slice(0, from);
  const rest = items.slice(from);
  if (rest.length < 2) return items;
  const nT = rest.filter((x) => x.truth).length;
  // 1) Dãy đáp số mới cho phần còn lại: không quá 3 câu liền nhau cùng đáp số (tính cả 3 câu cuối đã làm)
  const tail = head.slice(-3).map((x) => x.truth);
  const runBad = (arr) => arr.some((v, k) => k >= 3 && v === arr[k - 1] && v === arr[k - 2] && v === arr[k - 3]);
  let truths;
  let tries = 0;
  do {
    truths = shuffle(rest.map((_, k) => k < nT));
  } while (runBad(tail.concat(truths)) && ++tries < 5000);
  // 2) Gán lại các câu theo đáp số
  const tPool = shuffle(rest.filter((x) => x.truth));
  const fPool = shuffle(rest.filter((x) => !x.truth));
  const seq = head.concat(truths.map((t) => (t ? tPool : fPool).pop()));
  // 3) Hai câu liền nhau không cùng câu hỏi: đổi chỗ với một câu cùng đáp số ở phần còn lại
  const clash = (k) => (k > 0 && seq[k].i === seq[k - 1].i) || (k < seq.length - 1 && seq[k].i === seq[k + 1].i);
  const swap = (a, c) => ([seq[a], seq[c]] = [seq[c], seq[a]]);
  for (let k = Math.max(1, from); k < seq.length; k++) {
    if (seq[k].i !== seq[k - 1].i) continue;
    for (let j = from; j < seq.length; j++) {
      if (j === k || seq[j].truth !== seq[k].truth) continue;
      swap(j, k);
      if (!clash(j) && !clash(k)) break;
      swap(j, k);
    }
  }
  return seq;
}

/** Kiểu đoạn văn trong bài (UNIT-SPEC). */
// #065 (TL1–TL3): 8 khung minh hoạ — nhãn đúng từng ký tự như check_unit.py / UNIT-SPEC §2.
export const FRAMES = [
  { code: "k1", icon: "📌", label: "Tình huống thường gặp" },
  { code: "k2", icon: "⚖️", label: "Hiểu lầm thường gặp" },
  { code: "k3", icon: "💡", label: "Bạn có biết" },
  { code: "k4", icon: "❓", label: "Thử nghĩ xem" },
  { code: "k5", icon: "✍️", label: "Trước – sau" },
  { code: "k6", icon: "🧪", label: "Làm mẫu" },
  { code: "k7", icon: "🔀", label: "Hai lựa chọn" },
  { code: "k8", icon: "🗣️", label: "Trải nghiệm thật" },
];
/** Khung của một đoạn: { code, icon, label, body } hoặc null. */
export function frameOf(text) {
  for (const f of FRAMES) {
    const pre = `${f.icon} ${f.label}: `;
    if (text.startsWith(pre)) return { ...f, body: text.slice(pre.length) };
  }
  return null;
}
export function paraKind(text) {
  if (frameOf(text)) return "frame";
  if (text.startsWith("📌")) return "story";
  if (text.startsWith("→ Rút ra")) return "takeaway";
  if (text.startsWith("☐")) return "check";
  return "";
}

// ---------- KC-Q7 (#112, luật KC-05): "Nhân vật trong bài là minh hoạ." ở cuối bài viết có nhân vật ----------
// Cách nhận ra (đơn giản, chạy trên trình duyệt, không cần thêm dữ liệu): một đoạn khung 📌 🔀 🧪 ⚖️ có tên người Việt
// (danh sách GIVEN_NAMES) ở một trong ba chỗ: sau từ xưng hô ("chị Vân", "Anh Sơn"); đầu câu, chữ sau viết thường
// ("Hà học kế toán…"); giữa câu, chữ trước viết thường hoặc dấu phẩy ("…, Hà gửi"). Loại: chữ sau viết hoa ("Hoa Kỳ"),
// chữ trước viết hoa ("Thái Bình"), sau từ chỉ nơi chốn/ngày ("miền Nam", "thứ Năm"), từ ghép ("Sang tuần", "Nhân viên").
// Khung 🗣️ Trải nghiệm thật không xét (chuyện thật có nguồn). Kiểm trên 287 bài (#112): 246 bài có nhân vật.
const STORY_ICONS = ["📌 ", "🔀 ", "🧪 ", "⚖️ "];
export const GIVEN_NAMES = new Set(
  ("An Ân Ánh Đông Hiển Liên Mỹ Thục Bảo Bích Bình Cẩm Châu Cường Diễm Diệp Duy Duyên Dũng Đạt Định Đoan Đức Giang Giao Hà Hải Hảo Hằng Hạnh Hậu " +
    "Hiền Hiếu Hoa Hoà Hồng Huyền Hùng Hưng Hương Kha Khải Khang Khánh Khoa Khôi Khuê Kiên Kiệt Kiều Lan Lành Lâm Linh Loan " +
    "Long Lộc Lợi Lụa Lực Ly Mai Mẫn Minh My Na Nam Nga Ngân Nghĩa Ngọc Nguyệt Nhàn Nhân Nhi Nhung Như Ninh Oanh Phát Phong " +
    "Phúc Phương Phượng Quang Quân Quế Quý Quyên Sang Sơn Tài Tâm Thanh Thành Thảo Thắng Thịnh Thiện Thoa Thơ Thu Thuý Thúy " +
    "Thuỷ Thuỳ Thư Tiên Tiến Tín Toàn Trâm Trang Trí Trinh Triều Trung Tú Tuấn Tuệ Tùng Tường Uyên Vân Vinh Vũ Vy Xuân Yên Yến").split(" ")
);
const HONORIFIC = new Set("anh chị cô chú bác em ông bà bạn".split(" "));
const NOT_PERSON_BEFORE = new Set("miền phía phương tiếng thứ vua sông núi chùa đền chợ đường phố quận tỉnh cầu hồ biển đảo vịnh làng người nước gia".split(" "));
// Từ ghép hay gặp ở đầu câu, trùng chữ đầu với tên người ("Sang tuần", "Nhân viên", "Toàn bộ"…)
const NOT_NAME_PAIR = new Set(
  ("sang tuần|sang tháng|sang năm|sang ngày|sang hôm|nhân viên|nhân dịp|toàn bộ|phương án|phương pháp|tài xế|tài khoản|tài liệu|bảo hành|bảo hiểm|bảo vệ|" +
    "lợi ích|lợi nhuận|giao việc|giao hàng|thư mời|thư xin|nghĩa là|định kỳ|an toàn|thanh toán|tâm lý|thu nhập|tiến độ|trung bình|tín dụng|" +
    "thành công|như vậy|như thế|hoà bình|mai sau|kiên nhẫn|phát hiện|hải sản|lực lượng|my parents|my name|nhân với|nam bán|nam mỹ|liên đoàn|liên hệ|liên tục|mỹ phẩm|đông người|đông khách").split("|")
);
const isCap = (w) => !!w && w[0] !== w[0].toLowerCase();
const word = (t) => t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
/** Tên nhân vật minh hoạ đầu tiên tìm thấy trong một đoạn khung (hoặc null). */
export function storyName(text) {
  if (!STORY_ICONS.some((ic) => text.startsWith(ic))) return null;
  const toks = text.replace(/<[^>]+>/g, " ").split(/\s+/);
  for (let i = 1; i < toks.length; i++) {
    const raw = toks[i];
    const w = word(raw);
    if (!GIVEN_NAMES.has(w) || !raw.startsWith(w)) continue; // tên đứng sau dấu ngoặc kép → lời thoại, bỏ
    const prevRaw = toks[i - 1];
    const prev = word(prevRaw);
    const next = word(toks[i + 1] || "");
    if (/\p{L}$/u.test(raw) && isCap(next)) continue; // "Hoa Kỳ", "Minh Mạng"
    if (NOT_NAME_PAIR.has(`${w} ${next}`.toLowerCase())) continue; // "Sang tuần", "Nhân viên"
    if (HONORIFIC.has(prev.toLowerCase()) && /\p{L}$/u.test(prevRaw)) return w; // "chị Vân", "Anh Sơn"
    if (/[:.!?…)]$/.test(prevRaw)) {
      if (next && /\p{L}$/u.test(raw)) return w; // đầu câu, ngay sau là chữ thường: "Hà học kế toán…"
      continue;
    }
    if (/[\p{Ll},]$/u.test(prevRaw) && !isCap(prev) && !NOT_PERSON_BEFORE.has(prev)) return w; // giữa câu: "…, Hà gửi"
  }
  return null;
}
/** Bài có nhân vật minh hoạ không (xét các đoạn bài viết). */
export function hasIllustrativeCharacters(unit) {
  return !!unit?.article?.body?.some((s) => s.paragraphs.some((p) => storyName(p.text)));
}

// ---------- SP09 (#063): giao diện mới ----------
/** Bảng màu ảnh bìa chủ đề (UX-Q4: màu + chữ). Mỗi chủ đề một màu theo thứ tự trong cây. */
export const THUMB_COLORS = ["#2747c9", "#0f8a6c", "#d9690b", "#6b3fd1", "#c23d6a", "#0b78a0", "#1d2f6f", "#c8482a", "#2b8a3e", "#0e8784"];
export function topicColor(idx, topicSlug) {
  let k = 0;
  for (const b of idx?.branches || []) for (const t of b.topics) {
    if (t.slug === topicSlug) return THUMB_COLORS[(k * 3) % THUMB_COLORS.length];
    k++;
  }
  return THUMB_COLORS[0];
}
/** Danh sách phẳng mọi chủ đề { ...topic, branch, branchTitle }. */
export const allTopics = (idx) =>
  (idx?.branches || []).flatMap((b) => b.topics.map((t) => ({ ...t, branch: b.slug, branchTitle: b.title })));

/** Bài đang học gần nhất (nút "Học tiếp"). */
const LAST_KEY = "hkt.lastUnit";
export function readLastUnit() {
  try {
    const v = JSON.parse(window.localStorage.getItem(LAST_KEY) || "null");
    return v && v.audience && v.slug ? v : null;
  } catch {
    return null;
  }
}
export function writeLastUnit(audience, slug, part) {
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify({ audience, slug, part: part || "", at: Date.now() }));
  } catch {
    /* bỏ qua */
  }
}

/** Phần nào của bài đã xong (✓ trong mục lục). Bài viết, Bảng thông tin: đã đọc (bấm "Phần tiếp" / "Bắt đầu luyện"). */
export function partDone(p, key, total = 40) {
  if (!p) return false;
  if (key === "") return !!p.seen?.article;
  if (key === "info") return !!p.seen?.info;
  if (key === "quiz") return Object.keys(p.pick?.ok || {}).length >= total;
  if (key === "listen-speak") return Object.keys(p.say?.ok || {}).length >= total;
  if (key === "true-or-false") return !!p.qa?.finished;
  return false;
}
export const unitDoneCount = (p) => PARTS.filter((x) => partDone(p, x.key)).length;
/** Tiến độ cả chuỗi: số phần đã xong / tổng phần. */
export function seriesProgress(units) {
  const done = units.reduce((n, u) => n + unitDoneCount(readUnitProgress(u.audience, u.slug)), 0);
  return { done, total: units.length * PARTS.length };
}
/** Phút đọc ước tính của một bài (220 từ/phút). */
export function readMinutes(unit) {
  const a = unit?.article;
  if (!a) return 0;
  const text = [a.intro, ...a.body.flatMap((s) => s.paragraphs.map((p) => p.text)), a.outro].join(" ").replace(/<[^>]+>/g, " ");
  return Math.max(3, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}
