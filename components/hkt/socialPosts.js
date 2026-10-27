// #175 (SP11 mức 1 trên web) — soạn bài đăng Facebook / Zalo từ dữ liệu bài (không soạn mới, #088).
// Cùng quy tắc với công cụ máy (my-sta-video/goi-dang-bai.js, #172): P1 video · P2 "Câu hỏi hôm nay" (+ đáp án cho bình luận) · P5 tin Zalo.
export const SITE = "https://detpro.vercel.app";

// #133: bài pháp lý / tài chính / sức khoẻ → một dòng lưu ý chung cuối bài đăng
const NOTE_BRANCH = {
  "law-practice": "pháp lý", "law-everyday": "pháp lý", "lawyer-exam": "pháp lý", "epc-contracts": "pháp lý",
  "personal-finance": "tài chính cá nhân", "money-life": "tài chính cá nhân", "food-health": "của bác sĩ / chuyên gia y tế",
};
export const noteOf = (branch) => (NOTE_BRANCH[branch] ? `Lưu ý: nội dung mang tính tham khảo chung, không thay cho tư vấn ${NOTE_BRANCH[branch]} cho trường hợp cụ thể của bạn.` : "");

const lowerFirst = (s = "") => s.charAt(0).toLowerCase() + s.slice(1);
export const plain = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
/** 1–2 câu đầu, tối đa n ký tự. */
export const lead = (s, n = 260) => {
  const t = plain(s);
  const parts = t.match(/[^.!?…]+[.!?…]+/g) || [t];
  let out = "";
  for (const p of parts) {
    if ((out + p).length > n) break;
    out += p;
  }
  return out.trim() || `${t.slice(0, n).replace(/\s+\S*$/, "")}…`;
};
const noAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const hashtag = (s) => {
  const t = noAccent(s).replace(/[^A-Za-z0-9 ]+/g, " ").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  return t && t.length <= 32 ? `#${t}` : "";
};
export const seriesShort = (s) => String(s || "").split(/\s+[—–-]\s+/)[0].trim();
const utm = (url, src, slug, kind) => `${url}${url.includes("?") ? "&" : "?"}utm_source=${src}&utm_medium=social&utm_campaign=${slug}&utm_content=${kind}`;

/** Câu nhắc tên nhân vật trong truyện của bài → đứng riêng trên mạng khó hiểu → để sau cùng. */
const STOP = new Set(["I", "English", "Vietnam", "Vietnamese", "Civil", "Code", "AI", "OK", "CV", "IELTS", "TOEIC", "VSTEP", "THPT", "EPC", "VAT", "PIT", "HR", "IT", "US", "UK", "EU"]);
const namesIn = (q) => {
  const vi = noAccent(q.vi || "");
  // từ viết hoa không đứng đầu câu (không dùng lookbehind cho trình duyệt cũ)
  const words = q.q.split(/\s+/);
  const caps = words.filter((w, i) => i > 0 && !/[.?!:]$/.test(words[i - 1]) && /^[A-Z][a-z]+/.test(w)).map((w) => w.match(/^[A-Z][a-z]+/)[0]);
  return caps.filter((w) => !STOP.has(w) && new RegExp(`\\b${w}\\b`).test(vi));
};
/** Chọn n câu: ngắn (vừa ảnh), không nhắc nhân vật, rải nhiều đoạn, cố định theo bài. */
export function pickQuestions(qs, n = 3) {
  const scored = qs
    .map((q, i) => ({ q, i, len: q.q.length + q.options.reduce((a, o) => a + o.length, 0), story: namesIn(q).length > 0 }))
    .filter((x) => x.len <= 330);
  scored.sort((a, b) => a.story - b.story || a.len - b.len || a.i - b.i);
  const pool = scored.slice(0, Math.max(n * 4, 12));
  const out = [];
  const usedPara = new Set();
  for (const x of pool) {
    if (out.length >= n) break;
    if (!usedPara.has(x.q.para)) {
      usedPara.add(x.q.para);
      out.push(x);
    }
  }
  for (const x of pool) if (out.length < n && !out.includes(x)) out.push(x);
  return out.sort((a, b) => a.i - b.i);
}

// ---------- #177 bộ ảnh (IG-Q1): A2 "Bài học trong 5 thẻ", A3 "3 hiểu lầm" ----------
const FRAME_ICONS = ["📌", "⚖️", "💡", "❓", "✍️", "🧪", "🔀", "🗣️"];
const isPlainPara = (t) => !t.startsWith("→") && !t.startsWith("☐") && !FRAME_ICONS.some((i) => t.startsWith(i));
/** 3 mục có câu "→ Rút ra" (rải đầu – giữa – cuối bài): tiêu đề mục, câu chốt, 1–2 câu giải thích đầu mục. */
export function takeaways(u, n = 3) {
  const all = (u.article?.body || [])
    .map((s) => {
      const tk = s.paragraphs.find((p) => p.text.startsWith("→ Rút ra"));
      const ex = s.paragraphs.find((p) => isPlainPara(p.text));
      return tk ? { heading: s.heading, take: plain(tk.text.replace(/^→\s*Rút ra:\s*/, "")), expl: ex ? lead(ex.text, 210) : "" } : null;
    })
    .filter(Boolean);
  if (all.length <= n) return all;
  const pick = [0, Math.floor((all.length - 1) / 2), all.length - 1];
  return [...new Set(pick)].map((i) => all[i]).slice(0, n);
}
/** 3 "hiểu lầm" từ câu hỏi (không trùng câu của "Câu hỏi hôm nay"): đáp án sai ngắn hơn ↔ đáp án đúng + giải thích. */
export function myths(u, used = [], n = 3) {
  const qs = (u.questions || []).map((q, i) => ({ q, i })).filter((x) => !used.includes(x.i));
  return pickQuestions(qs.map((x) => x.q), n).map(({ q }) => {
    const wrong = [q.options[1], q.options[2]].filter(Boolean).sort((a, b) => a.length - b.length)[0];
    return { q: q.vi, wrong, right: q.options[0], explain: plain(q.explain) };
  });
}

/** Mọi bài đăng của một bài học. video = { drive, cover } nếu bài đã có video trên Drive. */
export function buildPosts(u, video, nQ = 3) {
  const m = u.meta;
  const slug = m.slug;
  const series = seriesShort(m.series);
  const who = m.audienceTitle ? `Dành cho ${lowerFirst(m.audienceTitle)}.` : "";
  const intro = lead(u.article?.intro);
  const note = noteOf(m.branch);
  const tags = ["#DetPro", "#MoiNgayBietThem", "#HocMoiNgay", hashtag(series)] // #191: bộ hashtag cố định như Fanpage (fanpage-detpro.md §2).filter(Boolean).join(" ");
  const lessonUrl = `${SITE}/for/${m.audience}/${slug}`;
  const p1url = video ? `${SITE}/videos/${slug}` : lessonUrl;
  const j = (...xs) => xs.filter((x) => x !== null && x !== undefined && x !== false).join("\n");
  const posts = [];

  posts.push({
    id: "fb-video", net: "Facebook", title: video ? "Video tóm tắt" : "Giới thiệu bài (chưa có video)", video: !!video, cover: !!video?.cover,
    text: j(`${video ? "🎬 " : ""}${m.title}`, who, "", intro, "", `👉 ${video ? "Xem video và luyện 40 câu hỏi" : "Đọc bài và luyện 40 câu hỏi"}: ${utm(p1url, "facebook", slug, "video")}`, tags, note ? "" : null, note || null),
  });
  const picked = pickQuestions(u.questions || [], nQ);
  // #177: A2 bộ 5 thẻ + A3 "3 hiểu lầm"
  const tks = takeaways(u);
  const endSlide = { kind: "end", title: m.title, note, line1: "Nhớ lâu hơn khi tự trả lời", line2: "40 câu hỏi nghe – nói về bài này, miễn phí, ngay trên điện thoại." };
  if (tks.length) {
    const slides = [
      { kind: "cover", tag: "BÀI HỌC TRONG 5 THẺ", series, title: m.title, sub: who, list: tks.map((x) => x.heading), detName: "det-wave" },
      ...tks.map((x) => ({ kind: "take", ...x })),
      endSlide,
    ];
    const n = slides.length;
    posts.push({
      id: "fb-the-5", net: "Facebook", title: `Bộ ${n} ảnh: bài học trong ${n} thẻ`, slides, deck: "the",
      text: j(`📚 ${m.title}`, who, "", `Lướt ${n} ảnh để nắm nhanh bài:`, ...tks.map((x) => `• ${x.take}`), "", `👉 Đọc đủ và luyện 40 câu: ${utm(lessonUrl, "facebook", slug, "the-5")}`, tags, note ? "" : null, note || null),
    });
    posts.push({
      id: "zalo-the-5", net: "Zalo", title: `Bộ ${n} ảnh: bài học trong ${n} thẻ`, slides, deck: "the",
      text: j(`${m.title} — ${n} ảnh nắm nhanh bài.`, `Đọc đủ và luyện câu hỏi: ${utm(lessonUrl, "zalo", slug, "the-5")}`, note || null),
    });
  }
  const ms = myths(u, picked.map((x) => x.i));
  if (ms.length) {
    const slides = [
      { kind: "cover", tag: "3 HIỂU LẦM", series, title: `${ms.length} điều nghe có vẻ đúng — nhưng không`, sub: m.title, list: ms.map((x) => x.q), detName: "det-stop" },
      ...ms.map((x) => ({ kind: "myth", ...x })),
      endSlide,
    ];
    posts.push({
      id: "fb-hieu-lam", net: "Facebook", title: `Bộ ${slides.length} ảnh: ${ms.length} hiểu lầm`, slides, deck: "hieu-lam",
      text: j(`⚠️ ${ms.length} hiểu lầm thường gặp · ${series}`, "", ...ms.map((x, k) => `${k + 1}. ${x.q}`), "", "Lướt ảnh để xem điều tưởng đúng và điều thật ra.", `👉 Bài đầy đủ + 40 câu luyện: ${utm(lessonUrl, "facebook", slug, "hieu-lam")}`, tags, note ? "" : null, note || null),
    });
    posts.push({
      id: "zalo-hieu-lam", net: "Zalo", title: `Bộ ${slides.length} ảnh: ${ms.length} hiểu lầm`, slides, deck: "hieu-lam",
      text: j(`${ms.length} hiểu lầm thường gặp — ${m.title}.`, `Xem bài và luyện câu hỏi: ${utm(lessonUrl, "zalo", slug, "hieu-lam")}`, note || null),
    });
  }
  picked.forEach((x, k) => {
    const q = x.q;
    const shown = q.order.map((i) => q.options[i]);
    const ans = q.order.indexOf(0) + 1;
    const quiz = { topic: series, q: q.q, vi: q.vi, options: shown };
    posts.push({
      id: `fb-cau-${k + 1}`, net: "Facebook", title: `Câu hỏi hôm nay ${k + 1}/${nQ}`, quiz,
      text: j(`❓ Câu hỏi hôm nay · ${series}`, "", q.vi, "(Ảnh: câu hỏi tiếng Anh và 3 đáp án)", "", "Bạn chọn 1, 2 hay 3? Đáp án ở bình luận đầu tiên.", `Làm đủ 40 câu: ${utm(`${lessonUrl}/quiz`, "facebook", slug, `cau-${k + 1}`)}`, tags, note ? "" : null, note || null),
      comment: j(`Đáp án: ${ans}. ${q.options[0]}`, plain(q.explain), "", `Bài đầy đủ: ${utm(lessonUrl, "facebook", slug, `dap-an-${k + 1}`)}`),
    });
    posts.push({
      id: `zalo-cau-${k + 1}`, net: "Zalo", title: `Câu hỏi hôm nay ${k + 1}/${nQ}`, quiz,
      text: j(`Câu hỏi hôm nay: ${q.vi}`, "Bạn chọn 1, 2 hay 3? Làm thử và xem đáp án:", utm(`${lessonUrl}/quiz`, "zalo", slug, `cau-${k + 1}`)),
    });
  });
  posts.push({
    id: "zalo-tin", net: "Zalo", title: "Tin nhắn ngắn", cover: !!video?.cover,
    text: j(`${m.title} — ${lead(u.article?.intro, 140)}`, `${video ? "Xem video và luyện câu hỏi" : "Đọc và luyện câu hỏi"}: ${utm(p1url, "zalo", slug, "tin")}`, note || null),
  });
  return posts;
}

// ---------- đánh dấu "Đã đăng" (trình duyệt này) ----------
const K = (slug, id) => `dp.dang.${slug}.${id}`;
export const isPosted = (slug, id) => {
  try {
    return !!window.localStorage.getItem(K(slug, id));
  } catch {
    return false;
  }
};
export const setPosted = (slug, id, on) => {
  try {
    if (on) window.localStorage.setItem(K(slug, id), "1");
    else window.localStorage.removeItem(K(slug, id));
  } catch {
    /* bỏ qua */
  }
};
