// #230 Học cùng — luật nhóm dùng chung cho máy chủ (API) và trình duyệt (cây, trang bài).
// Thiết kế: SEO\DetPro\research\2026-10-27-hoc-cung-nhau.md (mục 4, 4a, 5, 9).
// Không nhập "server-only" hay React ở đây — tệp chạy được cả hai phía.

export const PART_KEYS = ["", "info", "quiz", "listen-speak", "true-or-false"];
export const PART_SHORT = { "": "Bài viết", info: "Bảng", quiz: "Trắc nghiệm", "listen-speak": "Nghe nói", "true-or-false": "True/False" };

/** Ngưỡng mặc định (4a): Trắc nghiệm 40/40, Nghe nói 30/40 (#285), True or false làm xong lượt. */
export const NGUONG_MAC_DINH = { quiz: 40, "listen-speak": 30, tf: "xong" }; // #285 (LB-Q3): Nghe nói 30/40 cho nhóm mới (gõ vẫn tính); nhóm cũ giữ ngưỡng đã lưu
export const HAN_MAC_DINH = 48; // giờ, 0 = tắt
export const NHAC_MAC_DINH = 8; // giờ, 0 = tắt
export const TOI_DA = 8; // học viên mỗi nhóm (NH-Q2: 2–8)

/** Mã nhóm 6 ký tự dễ đọc (bỏ 0/O/1/I/L). */
export const MA_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const isMa = (s) => typeof s === "string" && /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/.test(s);
/** ID học viên: 2–20 ký tự, chữ thường không dấu, số, gạch; không trùng tên trang của nhóm. */
export const ID_CAM = new Set(["hoi-dap", "huong-dan", "tao", "api", "moi"]);
export const isId = (s) => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,18}[a-z0-9]$/.test(s) && !ID_CAM.has(s);
/** Gợi ý ID từ tên có dấu: "Nguyễn Lan" → "nguyen-lan". */
export function idFromName(name = "") {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

const nOk = (o) => Object.keys(o || {}).length;

/** ĐẠT điều kiện của một phần trong nhóm — ngưỡng nhóm thay cho "xong phần" mặc định (4a). p = tiến độ một bài (như localStorage). */
export function partDatNhom(p, key, ng = NGUONG_MAC_DINH, total = 40) {
  if (!p) return false;
  ng = { ...NGUONG_MAC_DINH, ...(ng || {}) };
  if (key === "") return !!p.seen?.article;
  if (key === "info") return !!p.seen?.info;
  if (key === "quiz") return nOk(p.pick?.ok) >= Math.min(total, +ng.quiz || total);
  if (key === "listen-speak") return nOk(p.say?.ok) >= Math.min(total, +ng["listen-speak"] || total);
  if (key === "true-or-false") {
    const qa = p.qa;
    if (!qa) return false;
    if (ng.tf === "xong" || !ng.tf) return !!qa.finished;
    // đúng ≥ N% số câu của lượt (tính khi đã làm hết lượt hoặc đã đủ số câu đúng)
    const items = qa.items?.length || total * 2;
    const right = Object.values(qa.done || {}).filter((d) => d.right).length;
    return right >= Math.ceil((items * +ng.tf) / 100);
  }
  return false;
}
/** #258 Xanh (XONG) của một phần trong nhóm = đạt điều kiện VÀ đã bấm "Đã xong mốc này" (p.xong[key] = giờ bấm). */
// #260: Bảng thông tin chỉ để xem (không chọn đáp án) → mở là xong, không cần bấm nút.
// #267 (anh chốt): lá ĐỌC (Bài viết, Bảng thông tin, xem video) xanh sẵn — chỉ 3 phần BÀI TẬP cần hoàn thành + bấm "Đã xong phần này".
export const PHAN_DOC = ["", "info"];
export const PHAN_TAP = ["quiz", "listen-speak", "true-or-false"];
export const partDoneNhom = (p, key, ng, total) => PHAN_DOC.includes(key) || (!!p?.xong?.[key] && partDatNhom(p, key, ng, total));
/** #258 Mô tả điều kiện của một phần + đã đạt chưa (cho nút "Đã xong mốc này"). Bài viết / Bảng: đạt khi đã mở tới cuối trang. */
export function dieuKien(p, key, ng = NGUONG_MAC_DINH) {
  ng = { ...NGUONG_MAC_DINH, ...(ng || {}) };
  const pp = { ...(p || {}), seen: { ...(p?.seen || {}), article: 1, info: 1 } };
  const dat = partDatNhom(pp, key, ng);
  if (key === "") return { dat, text: "Đọc hết bài viết" };
  if (key === "info") return { dat, text: "Bảng chỉ để xem, không chọn đáp án — mở là xong", tuXong: true };
  if (key === "quiz") return { dat, text: `Trắc nghiệm đúng ${ng.quiz}/40 — đang ${partCount(p, "quiz")}/40` };
  if (key === "listen-speak") return { dat, text: `Nghe nói đúng ${ng["listen-speak"]}/40 — đang ${partCount(p, "listen-speak")}/40` };
  if (key === "true-or-false") {
    const right = Object.values(p?.qa?.done || {}).filter((d) => d.right).length;
    return { dat, text: ng.tf === "xong" || !ng.tf ? `Làm hết lượt True or false — đã làm ${partCount(p, key)}/${p?.qa?.items?.length || 80}` : `True or false đúng từ ${ng.tf}% — đang đúng ${right}/${p?.qa?.items?.length || 80}` };
  }
  return { dat, text: "" };
}
export const unitGreenCount = (p, ng) => PART_KEYS.filter((k) => partDoneNhom(p, k, ng)).length;
export const unitGreen = (p, ng) => unitGreenCount(p, ng) === PART_KEYS.length;

/** Số đã làm của một phần (để hiện "Trắc nghiệm 23/40"). */
export function partCount(p, key) {
  if (!p) return 0;
  if (key === "quiz") return nOk(p.pick?.ok);
  if (key === "listen-speak") return nOk(p.say?.ok);
  if (key === "true-or-false") return nOk(p.qa?.done);
  if (key === "") return p.seen?.article ? 1 : 0;
  if (key === "info") return p.seen?.info ? 1 : 0;
  return 0;
}
/** Mô tả ngắn chỗ học viên đang dở ở một bài: "Trắc nghiệm 23/40" / "chưa bắt đầu". */
export function dangDo(p, ng) {
  if (!p || !Object.keys(p).length) return "chưa bắt đầu";
  const k = PART_KEYS.find((x) => !partDoneNhom(p, x, ng));
  if (k === undefined) return "xong";
  if (PHAN_TAP.every((x) => !partCount(p, x)) && !PHAN_TAP.some((x) => p?.xong?.[x])) return "chưa bắt đầu";
  if (partDatNhom(p, k, ng)) return `${PART_SHORT[k]}: đạt, chưa bấm "Đã xong"`;
  if (k === "quiz" || k === "listen-speak") return `${PART_SHORT[k]} ${partCount(p, k)}/40`;
  if (k === "true-or-false") return `${PART_SHORT[k]} ${partCount(p, k)}/80`;
  return `chưa xem ${PART_SHORT[k]}`;
}

/** Đồng hồ chặng (4a): { con (ms còn, âm = quá hạn), muc: "xanh"|"vang"|"do"|"qua", het (mốc hạn) } hoặc null nếu tắt. */
export function dongHo(moLuc, hanGio, now = Date.now()) {
  if (!moLuc || !hanGio) return null;
  const tong = hanGio * 3600e3;
  const het = new Date(moLuc).getTime() + tong;
  const con = het - now;
  const muc = con < 0 ? "qua" : con < 2 * 3600e3 ? "do" : con < tong * 0.25 ? "vang" : "xanh";
  return { con, muc, het };
}
export function fmtCon(ms) {
  const a = Math.abs(ms);
  const h = Math.floor(a / 3600e3);
  const m = Math.floor((a % 3600e3) / 60e3);
  const s = Math.floor((a % 60e3) / 1e3);
  const pad = (x) => String(x).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(s)}`;
}
export function fmtHan(ms) {
  if (ms < 0) {
    const h = Math.floor(-ms / 3600e3);
    return h >= 1 ? `Quá hạn ${h} giờ` : `Quá hạn ${Math.max(1, Math.floor(-ms / 60e3))} phút`;
  }
  return `còn ${fmtCon(ms)}`;
}

/** Học viên được mở bài thứ k khi k ≤ chặng nhóm, hoặc bài kế tiếp (làm trước tối đa 1 chặng — NH-Q3)
 *  #263: chỉ khi CHÍNH MÌNH đã xong cả 5 phần của chặng hiện tại (xongChang). */
export const baiMo = (k, changHienTai, xongChang = true) => k <= (changHienTai || 0) || (k === (changHienTai || 0) + 1 && !!xongChang);
/** #263 Người m (có tom từ API nhóm) đã xanh cả 5 phần của bài thứ k chưa. */
export const xongBaiTom = (m, nhom, k) => {
  const u = nhom?.chuoi?.bai?.[k];
  const g = u && m?.tom?.[`${u.audience}/${u.slug}`]?.g;
  return !!g && g.length === 5 && g.every(Boolean);
};
/** #263 Bài thứ k đã mở cho người m chưa (m rỗng = xem chung, giữ luật cũ). */
export const baiMoCua = (k, nhom, m) => baiMo(k, nhom.changHienTai, m ? xongBaiTom(m, nhom, nhom.changHienTai || 0) : true);

/** Đường dẫn trong nhóm. */
export const nhomPath = (ma, id) => `/nhom/${ma}${id ? `/${id}` : ""}`;
export const nhomUnitPath = (ma, id, audience, slug, part) => `/nhom/${ma}/${id}/${audience}/${slug}${part ? `/${part}` : ""}`;
export const baiKey = (u) => `${u.audience}/${u.slug}`;

// ---------- #231 Thống kê từng người (hiện trên cây) ----------
/** Số liệu luyện tập của một bài từ tiến độ (cùng cách tính với báo cáo cuối phần #160–#162). */
export function thongKe(p) {
  if (!p) return null;
  const pick = p.pick || {};
  const say = p.say || {};
  const qa = p.qa || {};
  const quizTries = {};
  Object.keys(pick.bad || {}).forEach((key) => {
    const i = +key.split("-")[0];
    quizTries[i] = (quizTries[i] || 0) + 1;
  });
  const quizOk = Object.keys(pick.ok || {});
  const sayBad = Object.values(say.bad || {}).reduce((a, b) => a + b, 0);
  const reads = say.reads || [];
  const avg = reads.length ? Math.round(reads.reduce((a, r) => a + (r.p || 0), 0) / reads.length) : null;
  const bins = [0, 0, 0, 0]; // <50, 50–69, 70–89, ≥90
  reads.forEach((r) => (bins[r.p < 50 ? 0 : r.p < 70 ? 1 : r.p < 90 ? 2 : 3] += 1));
  const tfDone = Object.values(qa.done || {});
  const tfRight = tfDone.filter((d) => d.right).length;
  return {
    quiz: { ok: quizOk.length, first: quizOk.filter((k) => !quizTries[k]).length, sai: Object.values(quizTries).reduce((a, b) => a + b, 0) },
    say: { ok: Object.keys(say.ok || {}).length, sai: sayBad, chuaHieu: say.unclear || 0, luot: reads.length, tb: avg, bins },
    tf: { lam: tfDone.length, dung: tfRight, diem: qa.d2pt || 0, luot: qa.runs || (qa.items ? 1 : 0) },
    bang: p.refOpens || 0,
  };
}
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ---------- #231 Lời nhắn / chọc nhau trên cây (icon + câu mẫu) ----------
export const NHAN_ICON = ["👏", "💪", "🔥", "🌟", "❤️", "😄", "👉", "☕"];
export const NHAN_MAU = [
  "Cố lên, sắp xong rồi!",
  "Làm tốt lắm!",
  "Chọc nè — vào học đi 😜",
  "Mình chờ bạn ở bài sau nha",
  "Cảm ơn bạn đã giúp mình",
  "Nghỉ chút rồi học tiếp nhé",
  "Phần này bạn làm đỉnh quá",
  "Cùng về đích nào!",
];

// #250 (NHA A3): MỐC NHỎ trong một chặng — 5 phần chia đều thời hạn chặng: phần thứ j (0–4) hết hạn lúc mở + hạn × (j+1)/5.
export const mocNho = (moLuc, hanGio, j, now = Date.now()) => (hanGio ? dongHo(moLuc, (hanGio * (Math.min(j, 4) + 1)) / PART_KEYS.length, now) : null);
/** Phần đang làm của một người trong bài (theo tóm tắt tom.g): 0–4, 5 = xong cả 5 phần. */
export const phanDangLam = (t) => {
  const j = PART_KEYS.findIndex((_, x) => !t?.g?.[x]);
  return j < 0 ? PART_KEYS.length : j;
};
// #250 (NHA D): mô tả ngắn từng lá (rê chuột vào lá)
export const PART_TIP = {
  "": "Đọc bài viết — chú ý chữ tô đậm",
  info: "Bảng 40 câu — tự tìm đáp án trong bài",
  quiz: "Trắc nghiệm 40 câu, mỗi câu chọn 1 lần",
  "listen-speak": "Nghe câu hỏi, nói lại đáp án đúng",
  "true-or-false": "80 câu đúng / sai, luyện phản xạ",
};

// ---------- #290 Đợt 3: gộp tiến độ theo TỪNG CÂU (hai máy / hai tab cùng làm một bài không ghi đè nhau) ----------
// Mỗi phần luyện có "lượt" lu (0 = lượt đầu; bấm Làm lại / Làm lại câu sai → lu = thời điểm bấm).
// Cùng lượt → cộng dồn các câu đã làm của cả hai bản; khác lượt → lượt mới hơn thắng (xoá có chủ ý vẫn giữ).
const luOf = (x) => +x?.lu || 0;
const nKey = (o) => Object.keys(o || {}).length;
const gopMax = (a = {}, b = {}) => {
  const o = { ...a };
  for (const k in b) o[k] = Math.max(+o[k] || 0, +b[k] || 0);
  return o;
};
const sameIt = (x, y) => !!x && !!y && x.i === y.i && x.truth === y.truth && x.cand === y.cand;

function gopQa(cu, moi) {
  // bản chính = bản mới gửi lên; trừ khi hai bản khác dãy câu mà bản cũ làm được nhiều hơn (máy kia lỡ tạo lượt mới)
  const lech = Object.keys(cu.done || {}).some((k) => !sameIt(cu.items?.[k], moi.items?.[k]));
  const [base, other] = lech && nKey(cu.done) > nKey(moi.done) ? [cu, moi] : [moi, cu];
  const done = { ...(base.done || {}) };
  let pt = 0;
  let them = 0;
  for (const k in other.done || {})
    if (!(k in done) && sameIt(base.items?.[k], other.items?.[k])) {
      done[k] = other.done[k];
      pt += other.done[k]?.right ? 1 : -1;
      them++;
    }
  if (!them) return base;
  const o = { ...base, done };
  if (typeof base.d2pt === "number") o.d2pt = base.d2pt + pt;
  if (typeof base.d2n === "number") o.d2n = base.d2n + them;
  if (base.items && nKey(done) >= base.items.length) o.finished = true;
  return o;
}

function gopPhan(cu, moi, key) {
  if (!cu || typeof cu !== "object") return moi;
  if (!moi || typeof moi !== "object") return cu;
  if (luOf(cu) !== luOf(moi)) return luOf(moi) > luOf(cu) ? moi : cu;
  if (key === "qa") return gopQa(cu, moi);
  const o = { ...cu, ...moi, ok: { ...(cu.ok || {}), ...(moi.ok || {}) }, wrong: Math.max(+cu.wrong || 0, +moi.wrong || 0) };
  if (key === "pick") o.bad = { ...(cu.bad || {}), ...(moi.bad || {}) };
  else {
    o.bad = gopMax(cu.bad, moi.bad);
    o.miss = gopMax(cu.miss, moi.miss);
    o.said = { ...(cu.said || {}), ...(moi.said || {}) };
    o.unclear = Math.max(+cu.unclear || 0, +moi.unclear || 0);
    if (cu.reads || moi.reads) o.reads = (moi.reads?.length || 0) >= (cu.reads?.length || 0) ? moi.reads : cu.reads;
  }
  return o;
}

/** Gộp tiến độ một bài: cu = bản đang lưu, moi = bản vừa gửi. Mốc xong / đã xem không bao giờ mất (#263). */
export function gopTienDo(cu, moi) {
  if (!cu || typeof cu !== "object") return moi;
  if (!moi || typeof moi !== "object") return cu;
  const o = { ...cu, ...moi, xong: { ...(cu.xong || {}), ...(moi.xong || {}) }, seen: { ...(cu.seen || {}), ...(moi.seen || {}) } };
  for (const k of ["pick", "say", "qa"]) if (cu[k] || moi[k]) o[k] = gopPhan(cu[k], moi[k], k);
  return o;
}

// ---------- #300 Chuỗi ngày học + tổng kết tối (giờ Việt Nam) ----------
export const ngayVN = (t = Date.now()) => new Date(+new Date(t) + 7 * 3600e3).toISOString().slice(0, 10);
export const gioVN = (t = Date.now()) => new Date(+new Date(t) + 7 * 3600e3).getUTCHours();
export const ngayTruoc = (d, n = 1) => new Date(Date.parse(`${d}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
/** Số ngày học liên tục tính tới ngày d (hôm nay chưa học thì tính tới hôm qua — chuỗi vẫn còn giữ được). */
export function chuoiNgay(hocNgay, d = ngayVN()) {
  const h = hocNgay || {};
  let x = h[d] !== undefined ? d : ngayTruoc(d);
  let n = 0;
  while (h[x] !== undefined && n < 400) {
    n++;
    x = ngayTruoc(x);
  }
  return n;
}
