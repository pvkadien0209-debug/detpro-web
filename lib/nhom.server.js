// #230 Học cùng — phần máy chủ: MongoDB (nhom, thanh_vien, tin_nhan, loi_nhan, nhom_tep), mã nhóm, PIN, mở chặng, nhắc.
// #231: bỏ ghi giọng phần Nghe nói (anh: "không cần ghi lại giọng và lưu lại"); thêm lời nhắn / chọc nhau trên cây + thống kê từng người.
// Thiết kế: SEO\DetPro\research\2026-10-27-hoc-cung-nhau.md mục 9–10. Không có máy chủ chạy nền:
// mở chặng tính khi có người ghi tiến độ; tin "Đét nhắc" sinh khi có người mở trang sau mốc nhắc.
import "server-only";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import {
  MA_ABC, isMa, isId, NGUONG_MAC_DINH, thongKe, NHAN_ICON, NHAN_MAU, HAN_MAC_DINH, NHAC_MAC_DINH, TOI_DA, PART_KEYS, partDoneNhom, partDatNhom, PHAN_TAP, unitGreen, partCount, dangDo, baiKey, baiMo,
} from "@/components/hkt/nhomRules";

const DAY = 864e5;
const KEEP_IDLE = 180 * DAY; // GV-Q5: bỏ dở → xoá sau 180 ngày không hoạt động
const KEEP_DONE = 30 * DAY; // về đích + 30 ngày
const PIN_TRIES = 5;
const PIN_LOCK = 10 * 60e3;
export const MAX_PROG = 300_000; // byte JSON tiến độ một bài
export const MAX_AUDIO = 3_000_000; // byte một đoạn giọng (2 phút opus ~ 0,5 MB)
export const MAX_HDR_AUDIO = 4_200_000; // #232 hướng dẫn riêng dạng âm thanh (giới hạn thân yêu cầu Vercel ~4,5 MB)

export class HttpErr extends Error {
  constructor(status, msg, extra) {
    super(msg);
    this.status = status;
    this.extra = extra;
  }
}

let idxDone = null;
async function cols() {
  const db = await getDb();
  const c = {
    nhom: db.collection("nhom"),
    tv: db.collection("thanh_vien"),
    tin: db.collection("tin_nhan"),
    chuc: db.collection("loi_nhan"),
    hdr: db.collection("huong_dan_rieng"), // #232
    tep: db.collection("nhom_tep"),
    nk: db.collection("nhat_ky_hoc"), // #260 nhật ký từng người học
  };
  if (!idxDone)
    idxDone = Promise.all([
      c.tv.createIndex({ nhom: 1, id: 1 }, { unique: true }),
      c.tin.createIndex({ nhom: 1, luc: 1 }),
      c.chuc.createIndex({ nhom: 1, luc: 1 }),
      c.hdr.createIndex({ nhom: 1, luc: 1 }),
      c.nk.createIndex({ nhom: 1, id: 1, luc: -1 }),
      // TTL: tự xoá khi tới hetHanLuc (bỏ qua nếu máy chủ không hỗ trợ — vd. FerretDB khi thử ở máy)
      ...[c.nhom, c.tv, c.tin, c.chuc, c.hdr, c.tep, c.nk].map((x) => x.createIndex({ hetHanLuc: 1 }, { expireAfterSeconds: 0 }).catch((e) => console.warn("TTL index:", e.message))),
    ]).catch((e) => {
      idxDone = null;
      console.error("nhom index:", e.message);
    });
  await idxDone;
  return c;
}

const rnd = (n, abc = MA_ABC) => Array.from(crypto.randomBytes(n), (b) => abc[b % abc.length]).join("");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const hashPin = (pin, salt = rnd(8)) => `${salt}:${sha(`${salt}:${pin}`)}`;
const pinOk = (pin, h) => {
  if (!h) return true;
  const [salt] = h.split(":");
  return hashPin(String(pin || ""), salt) === h;
};
const isPin = (s) => typeof s === "string" && /^\d{4}$/.test(s);
const clean = (s, n) => String(s || "").replace(/[\u0000-\u0009\u000b-\u001f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, n); // giữ xuống dòng
const later = (ms) => new Date(Date.now() + ms);

// ---------- #260 Nhật ký từng người học (Mongo: nhat_ky_hoc) ----------
// Máy chủ tự ghi khi: vào / rời nhóm, mở một phần, đạt điều kiện, bấm "Đã xong mốc này", xong cả bài, báo gửi bài nói, gửi Hỏi đáp; id "*" = việc cả nhóm (mở chặng).
const PHAN_TEN = { "": "Bài viết", info: "Bảng thông tin", quiz: "Trắc nghiệm", "listen-speak": "Nghe nói", "true-or-false": "True or false" };
const tenBai = (g, bai) => {
  const k = g.chuoi.bai.findIndex((u) => baiKey(u) === bai);
  return k < 0 ? bai : g.chuoi.bai[k].kind === "tong" ? "Bài tổng" : `Bài ${k}`;
};
async function ghiNk(c, ma, id, viec, extra = {}) {
  try {
    await c.nk.insertOne({ nhom: ma, id, viec, ...extra, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) });
  } catch (e) {
    console.warn("nhat ky:", e.message);
  }
}
async function ghiTienNk(c, ma, id, bai, phan, viec) {
  try {
    await c.nk.updateOne({ nhom: ma, id, bai, phan, loai: "tien" }, { $set: { viec: `Đang làm ${viec}`, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) } }, { upsert: true });
  } catch (e) {
    console.warn("nhat ky tien:", e.message);
  }
}
/** Đọc nhật ký: của tôi (id + PIN), hoặc trưởng nhóm xem của người khác (ai=). */
export async function docNhatKy(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const ai = String(b.ai || b.id || "").toLowerCase();
  if (ai !== String(b.id || "").toLowerCase()) await needHuongDan(c, ma, b.k, b.id, b.pin);
  else await needMember(c, g, ai, b.pin);
  const ds = await c.nk.find({ nhom: ma, id: { $in: [ai, "*"] } }).sort({ luc: -1 }).limit(300).toArray();
  return { ai, ds: ds.map((x) => ({ viec: x.viec, bai: x.bai || null, phan: x.phan ?? null, chiTiet: x.chiTiet || "", chung: x.id === "*", dang: x.loai === "tien", luc: x.luc })) };
}

/** Chuẩn hoá cài đặt trưởng nhóm gửi lên (4a). */
export function caiDat(b = {}, old = {}) {
  const num = (v, lo, hi, d) => (Number.isFinite(+v) && +v >= lo && +v <= hi ? Math.round(+v) : d);
  const ng = { ...NGUONG_MAC_DINH, ...(old.nguong || {}) };
  if (b.nguong) {
    if (b.nguong.quiz !== undefined) ng.quiz = num(b.nguong.quiz, 1, 40, ng.quiz);
    if (b.nguong["listen-speak"] !== undefined) ng["listen-speak"] = num(b.nguong["listen-speak"], 1, 40, ng["listen-speak"]);
    if (b.nguong.tf !== undefined) ng.tf = b.nguong.tf === "xong" ? "xong" : num(b.nguong.tf, 1, 100, 80);
  }
  const out = { nguong: ng };
  if (b.hanChangGio !== undefined) out.hanChangGio = num(b.hanChangGio, 0, 24 * 30, HAN_MAC_DINH);
  if (b.nhacGio !== undefined) out.nhacGio = num(b.nhacGio, 0, 24 * 7, NHAC_MAC_DINH);
  if (b.kenhGuiBai !== undefined) {
    const u = clean(b.kenhGuiBai, 500);
    out.kenhGuiBai = /^https?:\/\//i.test(u) ? u : "";
  }
  if (b.batBuocPin !== undefined) out.batBuocPin = !!b.batBuocPin;
  if (b.khoaNguoiMoi !== undefined) out.khoaNguoiMoi = !!b.khoaNguoiMoi;
  if (b.chatTat !== undefined) out.chatTat = !!b.chatTat;
  if (b.toiDa !== undefined) out.toiDa = num(b.toiDa, 2, 30, TOI_DA);
  if (b.ten !== undefined) out.ten = clean(b.ten, 80);
  if (b.tenHuongDan !== undefined) out.tenHuongDan = clean(b.tenHuongDan, 40) || "Trưởng nhóm";
  return out;
}

/** Tạo nhóm từ một chủ đề (chép sẵn danh sách bài). Trả { ma, k } — k = mã hướng dẫn (chỉ hiện một lần). */
export async function taoNhom(topic, body) {
  const c = await cols();
  const bai = topic.t.units.map((u) => ({ audience: u.audience, slug: u.slug, title: u.title, kind: u.kind || null }));
  if (!bai.length) throw new HttpErr(400, "Chủ đề chưa có bài");
  const k = rnd(10);
  // #250 (NHA A1): trưởng nhóm cũng là người học → bắt buộc tên + ID + PIN 4 số; tạo luôn ID của họ trong nhóm
  const nt = body.nguoiTao || {};
  const ntId = String(nt.id || "").toLowerCase();
  if (!isId(ntId)) throw new HttpErr(400, "ID của bạn 2–20 ký tự: chữ thường không dấu, số, dấu gạch (vd. co-ha)");
  if (!isPin(nt.pin)) throw new HttpErr(400, "Trưởng nhóm phải đặt PIN 4 số");
  const ntTen = clean(nt.ten, 40) || ntId;
  const set = caiDat({ hanChangGio: HAN_MAC_DINH, nhacGio: NHAC_MAC_DINH, toiDa: TOI_DA, ...body });
  const now = new Date();
  for (let t = 0; t < 6; t++) {
    const ma = rnd(6);
    try {
      await c.nhom.insertOne({
        _id: ma,
        ten: set.ten || topic.t.title.vi,
        tenHuongDan: set.tenHuongDan || "Trưởng nhóm",
        chuoi: { branch: topic.b.slug, topic: topic.t.slug, title: topic.t.title.vi, bai },
        nguong: set.nguong,
        hanChangGio: set.hanChangGio,
        nhacGio: set.nhacGio,
        kenhGuiBai: set.kenhGuiBai || "",
        batBuocPin: !!set.batBuocPin,
        khoaNguoiMoi: false,
        chatTat: false,
        toiDa: set.toiDa,
        huongDanHash: sha(`hd:${ma}:${k}`),
        changHienTai: 0,
        moChangLuc: [now],
        nhacDaGui: {},
        taoLuc: now,
        hoatDongLuc: now,
        veDichLuc: null,
        hetHanLuc: later(KEEP_IDLE),
        nguoiTaoId: ntId,
      });
      await c.tv.insertOne({
        nhom: ma, id: ntId, ten: ntTen, pinHash: hashPin(nt.pin), saiPin: 0, khoaDen: null, trangThai: "hoc", laNguoiTao: true,
        tienDo: {}, noi: {}, dangO: null, vaoLuc: now, hoatDongLuc: now, hetHanLuc: later(KEEP_IDLE + KEEP_DONE),
      });
      await ghiNk(c, ma, ntId, "Lập nhóm và vào nhóm");
      return { ma, k, id: ntId };
    } catch (e) {
      if (e.code !== 11000) throw e; // trùng mã → thử mã khác
    }
  }
  throw new HttpErr(500, "Không tạo được mã nhóm, thử lại");
}

async function getNhom(c, ma) {
  if (!isMa(ma)) throw new HttpErr(404, "Không có nhóm này");
  const g = await c.nhom.findOne({ _id: ma });
  if (!g) throw new HttpErr(404, "Không có nhóm này (hoặc nhóm đã hết hạn)");
  return g;
}

/** Trưởng nhóm: mã k đúng không. */
export const isHuongDan = (g, k) => !!k && sha(`hd:${g._id}:${String(k).toUpperCase()}`) === g.huongDanHash;
// #253: trưởng nhóm vào bằng link chung, chọn tên + PIN (như mọi người) → được quyền quản lý; mã k cũ vẫn dùng được
async function needHuongDan(c, ma, k, id, pin) {
  const g = await getNhom(c, ma);
  if (isHuongDan(g, k)) return g;
  if (id && g.nguoiTaoId && String(id).toLowerCase() === g.nguoiTaoId) {
    const m = await c.tv.findOne({ nhom: ma, id: g.nguoiTaoId });
    if (m?.pinHash && pin && pinOk(pin, m.pinHash)) return g;
    throw new HttpErr(401, "Gõ PIN của trưởng nhóm", { canPin: true });
  }
  throw new HttpErr(403, "Chỉ trưởng nhóm mới làm được việc này");
}

/** Học viên: kiểm ID + PIN (PIN giữ trong bộ nhớ tab, gửi kèm mỗi lần ghi). */
async function needMember(c, g, id, pin) {
  if (!isId(id)) throw new HttpErr(400, "ID không hợp lệ");
  const m = await c.tv.findOne({ nhom: g._id, id });
  if (!m || m.trangThai === "da-roi") throw new HttpErr(404, "Không có ID này trong nhóm");
  if (m.pinHash) {
    if (m.khoaDen && new Date(m.khoaDen) > new Date()) throw new HttpErr(423, "ID tạm khoá 10 phút vì gõ sai PIN nhiều lần", { khoaDen: m.khoaDen });
    if (!pin) throw new HttpErr(401, "ID này có PIN", { canPin: true }); // chưa gõ PIN → không tính lần sai
    if (!pinOk(pin, m.pinHash)) {
      const sai = (m.saiPin || 0) + 1;
      await c.tv.updateOne({ _id: m._id }, { $set: sai >= PIN_TRIES ? { saiPin: 0, khoaDen: later(PIN_LOCK) } : { saiPin: sai } });
      throw new HttpErr(401, pin ? "PIN chưa đúng" : "ID này có PIN", { canPin: true, conLai: Math.max(0, PIN_TRIES - sai) });
    }
    if (m.saiPin) await c.tv.updateOne({ _id: m._id }, { $set: { saiPin: 0, khoaDen: null } });
  }
  return m;
}

async function touch(c, g, m) {
  const now = new Date();
  await c.nhom.updateOne({ _id: g._id }, { $set: { hoatDongLuc: now, hetHanLuc: g.veDichLuc ? g.hetHanLuc : later(KEEP_IDLE) } });
  if (m) await c.tv.updateOne({ _id: m._id }, { $set: { hoatDongLuc: now, hetHanLuc: later(KEEP_IDLE + KEEP_DONE) } });
}

// ---------- Xem nhóm (cây / bảng) ----------
function tomTat(g, m) {
  const tom = {};
  for (const u of g.chuoi.bai) {
    const p = m.tienDo?.[baiKey(u)]; // #267: bài chưa học vẫn có tóm tắt — lá đọc xanh sẵn
    tom[baiKey(u)] = {
      g: PART_KEYS.map((k) => (partDoneNhom(p, k, g.nguong) ? 1 : 0)),
      a: PART_KEYS.map((k) => (partDatNhom(p, k, g.nguong) && !partDoneNhom(p, k, g.nguong) ? 1 : 0)), // #267 đạt nhưng chưa bấm "Đã xong" → lá vàng
      c: { quiz: partCount(p, "quiz"), "listen-speak": partCount(p, "listen-speak"), "true-or-false": partCount(p, "true-or-false") },
      d: dangDo(p, g.nguong),
      s: thongKe(p), // #231: thống kê trên cây
    };
  }
  return tom;
}
const pubMember = (g, m) => ({
  id: m.id,
  ten: m.ten,
  coPin: !!m.pinHash,
  trangThai: m.trangThai,
  tom: tomTat(g, m),
  noi: m.noi || {},
  dangO: m.dangO || null,
  vaoLuc: m.vaoLuc,
});
const pubNhom = (g) => {
  const { huongDanHash, nhacDaGui, hetHanLuc, ...rest } = g;
  return { ma: g._id, ...rest, _id: undefined };
};

/** Tin "Đét nhắc" (4a): mỗi chu kỳ nhắc mà còn người chưa xong bài đang mở → một tin trong Hỏi đáp. */
async function nhacNeuDenGio(c, g, members) {
  const ch = g.changHienTai || 0;
  if (!g.nhacGio || ch >= g.chuoi.bai.length || g.veDichLuc) return;
  const mo = g.moChangLuc?.[ch];
  if (!mo) return;
  const n = Math.floor((Date.now() - new Date(mo).getTime()) / (g.nhacGio * 3600e3));
  if (n < 1 || (g.nhacDaGui?.[ch] || 0) >= n) return;
  const f = `nhacDaGui.${ch}`;
  const r = await c.nhom.updateOne({ _id: g._id, $or: [{ [f]: { $exists: false } }, { [f]: { $lt: n } }] }, { $set: { [f]: n } });
  if (!r.modifiedCount) return; // người khác vừa nhắc
  const u = g.chuoi.bai[ch];
  const cham = members.filter((m) => m.trangThai === "hoc" && !unitGreen(m.tienDo?.[baiKey(u)], g.nguong));
  if (!cham.length) return;
  const han = g.hanChangGio ? new Date(mo).getTime() + g.hanChangGio * 3600e3 - Date.now() : null;
  const hanTxt = han === null ? "" : han >= 0 ? ` còn ${Math.max(1, Math.round(han / 3600e3))} giờ` : ` đã quá hạn ${Math.max(1, Math.round(-han / 3600e3))} giờ`;
  const ds = cham.map((m) => `${m.ten} (${dangDo(m.tienDo?.[baiKey(u)], g.nguong)})`).join(", ");
  await c.tin.insertOne({
    nhom: g._id, tu: "det", ten: "Đét nhắc", loai: "chu",
    chu: `⏰ Lần nhắc ${n} · ${u.kind === "tong" ? "Bài tổng" : `Bài ${ch}`}${hanTxt} — ${ds}`,
    nhac: { chang: ch, lan: n, ai: cham.map((m) => m.id) },
    gan: null, traLoi: null, daGiaiDap: false, xoa: false, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE),
  });
}

export async function xemNhom(ma) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const members = await c.tv.find({ nhom: ma, trangThai: { $ne: "da-roi" } }).sort({ vaoLuc: 1 }).toArray();
  await nhacNeuDenGio(c, g, members).catch((e) => console.error("nhac:", e.message));
  const soTin = await c.tin.countDocuments({ nhom: ma, xoa: { $ne: true } });
  // #250 (NHA E): đếm tin Hỏi đáp gắn từng bài → nút nhỏ trên thân cây
  const tinBai = {};
  (await c.tin.find({ nhom: ma, xoa: { $ne: true }, "gan.bai": { $exists: true, $ne: null } }, { projection: { gan: 1 } }).limit(3000).toArray()).forEach((t) => {
    const b = t.gan?.bai;
    if (b) tinBai[b] = (tinBai[b] || 0) + 1;
  });
  const nhan = await c.chuc.find({ nhom: ma }).sort({ luc: -1 }).limit(300).toArray();
  const hdr = await c.hdr.find({ nhom: ma }).sort({ luc: 1 }).toArray();
  return { nhom: pubNhom(g), members: members.map((m) => pubMember(g, m)), soTin, nhan: nhan.map(pubNhan), hdr: hdr.map(pubHdr), tinBai, now: Date.now() };
}

// ---------- #231 Lời nhắn / chọc nhau trên cây (chỉ icon + câu mẫu) ----------
const pubNhan = (x) => ({ _id: String(x._id), tu: x.tu, ten: x.ten, den: x.den, icon: x.icon, chu: x.chu, bai: x.bai || null, luc: x.luc });
export async function guiNhan(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const who = await nguoiGui(c, g, b);
  const den = String(b.den || "");
  if (!(await c.tv.findOne({ nhom: ma, id: den }))) throw new HttpErr(404, "Không có bạn này trong nhóm");
  if (den === who.tu) throw new HttpErr(400, "Không gửi cho chính mình");
  const icon = NHAN_ICON.includes(b.icon) ? b.icon : null;
  const chu = Number.isInteger(+b.mau) && NHAN_MAU[+b.mau] ? NHAN_MAU[+b.mau] : "";
  if (!icon && !chu) throw new HttpErr(400, "Chọn icon hoặc câu mẫu");
  const last = await c.chuc.findOne({ nhom: ma, tu: who.tu, den }, { sort: { luc: -1 } });
  if (last && Date.now() - new Date(last.luc).getTime() < 15000) throw new HttpErr(429, "Chờ chút rồi gửi tiếp nhé");
  const bai = typeof b.bai === "string" && g.chuoi.bai.some((u) => baiKey(u) === b.bai) ? b.bai : null;
  const doc = { nhom: ma, tu: who.tu, ten: who.ten, den, icon, chu, bai, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) };
  const r = await c.chuc.insertOne(doc);
  return { ok: true, nhan: pubNhan({ ...doc, _id: r.insertedId }) };
}
export async function xoaNhan(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const who = await nguoiGui(c, g, b);
  if (!ObjectId.isValid(b.nhan)) throw new HttpErr(400, "Thiếu lời nhắn");
  const x = await c.chuc.findOne({ _id: new ObjectId(b.nhan), nhom: ma });
  if (!x) return { ok: true };
  if (who.tu !== "huong-dan" && x.tu !== who.tu && x.den !== who.tu) throw new HttpErr(403, "Chỉ người gửi, người nhận hoặc trưởng nhóm xoá được");
  await c.chuc.deleteOne({ _id: x._id });
  return { ok: true };
}

// ---------- #232 Hướng dẫn riêng: tài liệu trưởng nhóm tự làm (link video tự quay, audio, chữ) gắn vào lớp / bài / phần ----------
const pubHdr = (x) => ({ _id: String(x._id), bai: x.bai || null, phan: x.phan ?? "*", loai: x.loai, tieuDe: x.tieuDe, chu: x.chu || "", url: x.url || "", tep: x.tep ? String(x.tep) : null, giay: x.giay || 0, luc: x.luc });
export async function themHdr(ma, b, audio) {
  const c = await cols();
  const g = await needHuongDan(c, ma, b.k);
  const bai = b.bai && g.chuoi.bai.some((u) => baiKey(u) === b.bai) ? b.bai : null;
  const phan = bai && PART_KEYS.includes(b.phan) ? b.phan : "*";
  const tieuDe = clean(b.tieuDe, 120);
  const chu = clean(b.chu, 3000);
  const doc = { nhom: ma, bai, phan, tieuDe, chu, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) };
  if (audio) {
    doc.loai = "audio";
    doc.tep = await luuTep(c, ma, "huong-dan", audio, {}, MAX_HDR_AUDIO);
    doc.giay = Math.max(0, Math.round(+b.giay || 0));
  } else if (b.url) {
    const url = clean(b.url, 1000);
    if (!/^https?:\/\//i.test(url)) throw new HttpErr(400, "Link phải bắt đầu bằng http:// hoặc https://");
    doc.loai = "link";
    doc.url = url;
  } else {
    if (!chu) throw new HttpErr(400, "Thêm link, âm thanh hoặc nội dung chữ");
    doc.loai = "chu";
  }
  if (!doc.tieuDe) doc.tieuDe = doc.loai === "audio" ? "Hướng dẫn bằng giọng" : doc.loai === "link" ? "Video / tài liệu hướng dẫn" : "Hướng dẫn";
  const r = await c.hdr.insertOne(doc);
  if (b.dangChat === true || b.dangChat === "1") {
    // đăng kèm lên Hỏi đáp nhóm
    const k = bai ? g.chuoi.bai.findIndex((u) => baiKey(u) === bai) : -1;
    const nhan = k >= 0 ? `${g.chuoi.bai[k].kind === "tong" ? "Bài tổng" : `Bài ${k}`}${phan !== "*" ? ` · ${PART_SHORT_SV[phan]}` : ""}` : "Cả lớp";
    const tin = { nhom: ma, tu: "huong-dan", ten: g.tenHuongDan || "Trưởng nhóm", gan: bai ? { bai, phan: phan === "*" ? "" : phan, cau: null, nhan } : null, traLoi: null, daGiaiDap: false, xoa: false, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) };
    const head = `📌 Hướng dẫn riêng · ${nhan}: ${doc.tieuDe}`;
    if (doc.loai === "audio") Object.assign(tin, { loai: "giong", tep: doc.tep, giay: doc.giay, chu: head });
    else Object.assign(tin, { loai: "chu", chu: [head, doc.chu, doc.url].filter(Boolean).join("\n") });
    await c.tin.insertOne(tin);
  }
  return { ok: true, hdr: pubHdr({ ...doc, _id: r.insertedId }) };
}
const PART_SHORT_SV = { "": "Bài viết", info: "Bảng thông tin", quiz: "Trắc nghiệm", "listen-speak": "Nghe nói", "true-or-false": "True or false" };
export async function xoaHdr(ma, b) {
  const c = await cols();
  await needHuongDan(c, ma, b.k);
  if (!ObjectId.isValid(b.hdr)) throw new HttpErr(400, "Thiếu hướng dẫn");
  const x = await c.hdr.findOne({ _id: new ObjectId(b.hdr), nhom: ma });
  if (!x) return { ok: true };
  await c.hdr.deleteOne({ _id: x._id });
  if (x.tep && !(await c.tin.findOne({ tep: x.tep, xoa: { $ne: true } }))) await c.tep.deleteOne({ _id: x.tep });
  return { ok: true };
}

// ---------- Vào nhóm: chọn ID / tạo ID / đặt PIN ----------
export async function vao(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const id = String(b.id || "").toLowerCase();
  if (b.moi) {
    if (g.khoaNguoiMoi) throw new HttpErr(403, "Nhóm đã khoá nhận người mới — nhắn trưởng nhóm");
    if (!isId(id)) throw new HttpErr(400, "ID 2–20 ký tự: chữ thường không dấu, số, dấu gạch (vd. lan, minh-12a3)");
    const ten = clean(b.ten, 40) || id;
    const n = await c.tv.countDocuments({ nhom: ma, trangThai: { $ne: "da-roi" } });
    if (n >= (g.toiDa || TOI_DA)) throw new HttpErr(403, `Nhóm đã đủ ${g.toiDa || TOI_DA} người`);
    if (g.batBuocPin && !isPin(b.pin)) throw new HttpErr(400, "Nhóm này yêu cầu PIN 4 số cho mỗi ID");
    if (!isPin(b.pin)) throw new HttpErr(400, "Đặt PIN 4 số cho tên của bạn (để lần sau vào lại, và không ai vào nhầm)"); // #267 mọi người đều có PIN
    const now = new Date();
    try {
      await c.tv.insertOne({
        nhom: ma, id, ten, pinHash: b.pin ? hashPin(b.pin) : null, saiPin: 0, khoaDen: null, trangThai: "hoc",
        tienDo: {}, noi: {}, dangO: null, vaoLuc: now, hoatDongLuc: now, hetHanLuc: later(KEEP_IDLE + KEEP_DONE),
      });
    } catch (e) {
      if (e.code === 11000) throw new HttpErr(409, "ID này đã có người dùng — chọn ID khác");
      throw e;
    }
    await touch(c, g);
    await ghiNk(c, ma, id, "Vào nhóm lần đầu (tạo ID)");
    return { ok: true, id };
  }
  const m = await needMember(c, g, id, b.pin);
  // đặt PIN cho ID của mình (đã vào được)
  if (b.datPin !== undefined) {
    if (b.datPin && !isPin(b.datPin)) throw new HttpErr(400, "PIN là 4 chữ số");
    if (!b.datPin && g.batBuocPin) throw new HttpErr(400, "Nhóm yêu cầu PIN — không bỏ được");
    await c.tv.updateOne({ _id: m._id }, { $set: { pinHash: b.datPin ? hashPin(b.datPin) : null } });
  }
  if (b.roi) {
    // "Rời nhóm và xoá dữ liệu của tôi" (mục 11)
    await c.tv.deleteOne({ _id: m._id });
    await c.chuc.deleteMany({ nhom: ma, $or: [{ tu: id }, { den: id }] });
    await c.tin.updateMany({ nhom: ma, tu: id }, { $set: { xoa: true, chu: "", tep: null } });
    await c.nk.deleteMany({ nhom: ma, id }); // #260 rời nhóm = xoá cả nhật ký
    return { ok: true, roi: true };
  }
  await touch(c, g, m);
  if (b.datPin === undefined) await ghiNk(c, ma, id, "Vào nhóm (chọn tên + PIN)");
  return { ok: true, id, ten: m.ten, canPin: g.batBuocPin && !m.pinHash };
}

// ---------- Tiến độ ----------
export async function docTienDo(ma, id, pin, bai) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const m = await needMember(c, g, id, pin);
  return { prog: bai ? m.tienDo?.[bai] || {} : m.tienDo || {}, ten: m.ten };
}

/** Ghi tiến độ một bài (thay cả object như localStorage) và/hoặc vị trí "đang làm"; mở chặng khi cả nhóm xanh. */
export async function ghiTienDo(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const m = await needMember(c, g, b.id, b.pin);
  const set = { hoatDongLuc: new Date() };
  if (b.bai) {
    const k = g.chuoi.bai.findIndex((u) => baiKey(u) === b.bai);
    if (k < 0) throw new HttpErr(400, "Bài không thuộc chuỗi của nhóm");
    if (b.prog) {
      const ch = g.changHienTai || 0; // #263 làm trước 1 chặng chỉ khi chính mình xong chặng hiện tại
      if (!baiMo(k, ch, unitGreen(m.tienDo?.[baiKey(g.chuoi.bai[ch] || {})], g.nguong))) throw new HttpErr(423, "Bài này chưa mở — xong bài trước đã");
      // #263 mốc đã xong / đã xem không bao giờ mất: gộp với bản trên máy chủ (một trang cũ ghi đè cũng không xoá mốc)
      const cu = m.tienDo?.[b.bai] || {};
      b.prog = { ...b.prog, xong: { ...(cu.xong || {}), ...(b.prog.xong || {}) }, seen: { ...(cu.seen || {}), ...(b.prog.seen || {}) } };
      if (JSON.stringify(b.prog).length > MAX_PROG) throw new HttpErr(413, "Tiến độ quá lớn");
      set[`tienDo.${b.bai}`] = b.prog;
    }
    if (b.phan !== undefined) set.dangO = { bai: b.bai, phan: String(b.phan).slice(0, 20), luc: new Date() };
  }
  await c.tv.updateOne({ _id: m._id }, { $set: set });
  // #260 nhật ký: so tiến độ cũ / mới
  if (b.bai) {
    const ten = tenBai(g, b.bai);
    if (set.dangO && (m.dangO?.bai !== b.bai || m.dangO?.phan !== set.dangO.phan)) await ghiNk(c, ma, m.id, `Mở ${ten} · ${PHAN_TEN[set.dangO.phan] ?? set.dangO.phan}`, { bai: b.bai, phan: set.dangO.phan });
    if (b.prog) {
      const cu = m.tienDo?.[b.bai];
      for (const k of PHAN_TAP) { // #267 chỉ phần bài tập (phần đọc xanh sẵn)
        const dk = `${PHAN_TEN[k]} — ${k === "quiz" || k === "listen-speak" ? `${partCount(b.prog, k)}/40` : k === "true-or-false" ? `${partCount(b.prog, k)} câu` : "đã xem"}`;
        if (!partDatNhom(cu, k, g.nguong) && partDatNhom(b.prog, k, g.nguong)) await ghiNk(c, ma, m.id, `Đạt điều kiện ${ten} · ${PHAN_TEN[k]}`, { bai: b.bai, phan: k, chiTiet: dk });
        if (!cu?.xong?.[k] && b.prog.xong?.[k]) await ghiNk(c, ma, m.id, `Đã xong ${ten} · ${PHAN_TEN[k]}`, { bai: b.bai, phan: k, chiTiet: dk });
        // #267 nhật ký liên tục: MỘT dòng "đang làm" cho mỗi phần, cập nhật số câu mỗi lần lưu (người khác bấm "Cập nhật" là thấy)
        if (partCount(cu, k) !== partCount(b.prog, k)) await ghiTienNk(c, ma, m.id, b.bai, k, `${ten} · ${PHAN_TEN[k]}: ${dk.split(" — ")[1]}`);
      }
      if (!unitGreen(cu, g.nguong) && unitGreen(b.prog, g.nguong)) await ghiNk(c, ma, m.id, `Xong cả 5 phần ${ten}`, { bai: b.bai });
    }
  }
  if (b.prog) await moChang(c, ma);
  const g2 = await c.nhom.findOne({ _id: ma }, { projection: { changHienTai: 1, moChangLuc: 1, veDichLuc: 1 } });
  return { ok: true, changHienTai: g2.changHienTai, moChangLuc: g2.moChangLuc, veDichLuc: g2.veDichLuc };
}

/** Mở chặng tiếp khi mọi học viên đang học xanh 5 phần của chặng hiện tại (cập nhật có điều kiện → chỉ mở một lần). */
async function moChang(c, ma) {
  for (let t = 0; t < 12; t++) {
    const g = await c.nhom.findOne({ _id: ma });
    const ch = g.changHienTai || 0;
    const n = g.chuoi.bai.length;
    if (ch >= n) return;
    const active = await c.tv.find({ nhom: ma, trangThai: "hoc" }).toArray();
    if (!active.length) return;
    const u = g.chuoi.bai[ch];
    if (!active.every((m) => unitGreen(m.tienDo?.[baiKey(u)], g.nguong))) return;
    const now = new Date();
    const set = { changHienTai: ch + 1 };
    if (ch + 1 >= n) Object.assign(set, { veDichLuc: now, hetHanLuc: later(KEEP_DONE) });
    const r = await c.nhom.updateOne({ _id: ma, changHienTai: ch }, { $set: set, $push: { moChangLuc: now } });
    if (!r.modifiedCount) return;
    await ghiNk(c, ma, "*", ch + 1 >= n ? "Cả nhóm về đích cả chuỗi" : `Cả nhóm xong ${u.kind === "tong" ? "Bài tổng" : `Bài ${ch}`} — mở Bài ${ch + 1}`);
    await c.tin.insertOne({
      nhom: ma, tu: "det", ten: "Đét", loai: "chu",
      chu: ch + 1 >= n ? "🎉 Cả nhóm đã về đích cả chuỗi! Đét!" : `✅ Cả nhóm xong ${u.kind === "tong" ? "Bài tổng" : `Bài ${ch}`} — mở ${`Bài ${ch + 1}`}: ${g.chuoi.bai[ch + 1].title}`,
      gan: null, traLoi: null, daGiaiDap: false, xoa: false, luc: now, hetHanLuc: later(KEEP_IDLE + KEEP_DONE),
    });
  }
}

// ---------- Bài nói tự do ----------
export async function baoGuiNoi(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const m = await needMember(c, g, b.id, b.pin);
  if (!g.chuoi.bai.some((u) => baiKey(u) === b.bai)) throw new HttpErr(400, "Bài không thuộc chuỗi");
  const old = m.noi?.[b.bai] || {};
  await c.tv.updateOne({ _id: m._id }, { $set: { [`noi.${b.bai}`]: { ...old, baoGui: new Date(), soLan: (old.soLan || 0) + 1 } } });
  await ghiNk(c, ma, m.id, `Báo đã gửi bài nói ${tenBai(g, b.bai)} (lần ${(old.soLan || 0) + 1})`, { bai: b.bai });
  return { ok: true };
}

// ---------- Hỏi đáp ----------
const pubTin = (t) => ({ _id: String(t._id), tu: t.tu, ten: t.ten, loai: t.loai, chu: t.chu, tep: t.tep ? String(t.tep) : null, giay: t.giay, gan: t.gan, traLoi: t.traLoi ? String(t.traLoi) : null, daGiaiDap: !!t.daGiaiDap, xoa: !!t.xoa, nhac: t.nhac ? { ai: t.nhac.ai } : undefined, luc: t.luc });

export async function docTin(ma, sau) {
  const c = await cols();
  await getNhom(c, ma);
  const q = { nhom: ma };
  const d = sau ? new Date(sau) : null;
  if (d && !isNaN(d)) q.luc = { $gt: d };
  const list = await c.tin.find(q).sort({ luc: -1 }).limit(200).toArray();
  return { tin: list.reverse().map(pubTin) };
}

/** Ai đang gửi: học viên (id + pin) hoặc trưởng nhóm (k). */
async function nguoiGui(c, g, b) {
  if (b.k) {
    if (!isHuongDan(g, b.k)) throw new HttpErr(403, "Mã hướng dẫn không đúng");
    return { tu: "huong-dan", ten: g.tenHuongDan || "Trưởng nhóm" };
  }
  const m = await needMember(c, g, b.id, b.pin);
  return { tu: m.id, ten: m.ten, m };
}

const BAD = /\b(fuck|shit|bitch)\b|đ[ịi]t|đ[ụu] m|l[ồo]n|c[ặa]c\b|đ[ĩi] m[ẹe]/gi;
const locTuc = (s) => s.replace(BAD, (w) => "*".repeat(w.length));

export async function guiTin(ma, b, audio) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const who = await nguoiGui(c, g, b);
  if (g.chatTat && who.tu !== "huong-dan") throw new HttpErr(403, "Trưởng nhóm đang tạm tắt Hỏi đáp");
  const now = new Date();
  const doc = { nhom: ma, tu: who.tu, ten: who.ten, gan: null, traLoi: null, daGiaiDap: false, xoa: false, luc: now, hetHanLuc: later(KEEP_IDLE + KEEP_DONE) };
  if (b.gan && typeof b.gan === "object") doc.gan = { bai: clean(b.gan.bai, 200), phan: clean(b.gan.phan, 20), cau: Number.isFinite(+b.gan.cau) ? +b.gan.cau : null, nhan: clean(b.gan.nhan, 80) };
  if (b.traLoi && ObjectId.isValid(b.traLoi)) doc.traLoi = new ObjectId(b.traLoi);
  if (audio) {
    const giay = Math.round(+b.giay || 0);
    if (giay > 125) throw new HttpErr(413, "Tin giọng tối đa 2 phút");
    const tep = await luuTep(c, ma, "chat", audio, { ms: giay * 1000 });
    Object.assign(doc, { loai: "giong", tep, giay, chu: clean(b.chu, 200) });
  } else {
    const chu = locTuc(clean(b.chu, 2000));
    if (!chu) throw new HttpErr(400, "Tin trống");
    Object.assign(doc, { loai: "chu", chu });
  }
  const r = await c.tin.insertOne(doc);
  await touch(c, g, who.m);
  if (who.m) await ghiNk(c, ma, who.m.id, doc.traLoi ? "Trả lời trong Hỏi đáp" : "Gửi câu hỏi / tin Hỏi đáp", { chiTiet: doc.gan?.nhan || (doc.loai === "giong" ? "tin giọng" : String(doc.chu).slice(0, 80)) });
  return { ok: true, tin: pubTin({ ...doc, _id: r.insertedId }) };
}

/** Sửa tin: xoá (của mình / trưởng nhóm xoá mọi tin), đánh dấu Đã giải đáp. */
export async function suaTin(ma, b) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const who = await nguoiGui(c, g, b);
  if (!ObjectId.isValid(b.tin)) throw new HttpErr(400, "Thiếu tin");
  const t = await c.tin.findOne({ _id: new ObjectId(b.tin), nhom: ma });
  if (!t) throw new HttpErr(404, "Không có tin");
  const hd = who.tu === "huong-dan";
  if (b.xoa) {
    if (!hd && t.tu !== who.tu) throw new HttpErr(403, "Chỉ xoá được tin của mình");
    if (t.tep && !(await c.hdr.findOne({ tep: t.tep }))) await c.tep.deleteOne({ _id: t.tep }); // tệp còn dùng ở hướng dẫn riêng thì giữ
    await c.tin.updateOne({ _id: t._id }, { $set: { xoa: true, chu: "", tep: null } });
  }
  if (b.daGiaiDap !== undefined) {
    if (!hd && t.tu !== who.tu) throw new HttpErr(403, "Trưởng nhóm hoặc người hỏi mới đánh dấu được");
    await c.tin.updateOne({ _id: t._id }, { $set: { daGiaiDap: !!b.daGiaiDap } });
  }
  return { ok: true };
}

// ---------- Tệp âm thanh (Hỏi đáp giọng, giọng Nghe nói) ----------
async function luuTep(c, ma, loai, audio, extra = {}, max = MAX_AUDIO) {
  if (!audio?.buf?.length) throw new HttpErr(400, "Thiếu âm thanh");
  if (audio.buf.length > max) throw new HttpErr(413, `Tệp âm thanh quá lớn (tối đa ${Math.floor(max / 1e6)} MB)`);
  const mime = /^audio\/[a-z0-9.+-]+(;.*)?$/i.test(audio.mime || "") ? audio.mime.split(";")[0] : "audio/webm";
  const r = await c.tep.insertOne({ nhom: ma, loai, mime, data: audio.buf, bytes: audio.buf.length, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE), ...extra });
  return r.insertedId;
}
export async function docTep(ma, fid) {
  const c = await cols();
  if (!isMa(ma) || !ObjectId.isValid(fid)) throw new HttpErr(404, "Không có tệp");
  const t = await c.tep.findOne({ _id: new ObjectId(fid), nhom: ma });
  if (!t) throw new HttpErr(404, "Không có tệp");
  const data = t.data?.buffer ? Buffer.from(t.data.buffer) : Buffer.from(t.data);
  return { mime: t.mime, data };
}
// ---------- Trưởng nhóm ----------
export async function xemHuongDan(ma, k, id, pin) {
  const c = await cols();
  const g = await needHuongDan(c, ma, k, id, pin);
  const v = await xemNhom(ma);
  const all = await c.tv.find({ nhom: ma }).toArray();
  return { ...v, nhom: { ...v.nhom, huongDan: true }, tatCa: all.map((m) => ({ id: m.id, ten: m.ten, trangThai: m.trangThai })) };
}

/** Mọi thao tác quản lý của trưởng nhóm. */
export async function quanLy(ma, b) {
  const c = await cols();
  const g = await needHuongDan(c, ma, b.k, b.tuId, b.tuPin);
  const mem = async () => {
    const m = await c.tv.findOne({ nhom: ma, id: String(b.id || "") });
    if (!m) throw new HttpErr(404, "Không có ID này");
    return m;
  };
  switch (b.viec) {
    case "cai-dat": {
      const set = caiDat(b.caiDat || {}, g);
      await c.nhom.updateOne({ _id: ma }, { $set: set });
      await moChang(c, ma); // ngưỡng hạ xuống → có thể mở chặng ngay
      break;
    }
    case "tich-noi": {
      const m = await mem();
      if (!g.chuoi.bai.some((u) => baiKey(u) === b.bai)) throw new HttpErr(400, "Bài không thuộc chuỗi");
      const old = m.noi?.[b.bai] || {};
      const v = { ...old, xanh: !!b.xanh, xanhLuc: b.xanh ? new Date() : null };
      if (b.ghiChu !== undefined) v.ghiChu = clean(b.ghiChu, 3000); // #268 nhận xét dài, có định dạng nhẹ
      await c.tv.updateOne({ _id: m._id }, { $set: { [`noi.${b.bai}`]: v } });
      break;
    }
    case "tich-cot": {
      // tích xanh cả cột: mọi người đã báo gửi bài này
      const list = await c.tv.find({ nhom: ma, trangThai: { $ne: "da-roi" } }).toArray();
      for (const m of list) {
        const old = m.noi?.[b.bai];
        if (old?.baoGui && !old.xanh) await c.tv.updateOne({ _id: m._id }, { $set: { [`noi.${b.bai}`]: { ...old, xanh: true, xanhLuc: new Date() } } });
      }
      break;
    }
    case "trang-thai": {
      const m = await mem();
      if (!["hoc", "tam-nghi"].includes(b.trangThai)) throw new HttpErr(400, "Trạng thái không hợp lệ");
      await c.tv.updateOne({ _id: m._id }, { $set: { trangThai: b.trangThai } });
      await moChang(c, ma); // chuyển Tạm nghỉ → có thể mở chặng
      break;
    }
    case "pin": {
      const m = await mem();
      if (b.pin && !isPin(b.pin)) throw new HttpErr(400, "PIN là 4 chữ số");
      await c.tv.updateOne({ _id: m._id }, { $set: { pinHash: b.pin ? hashPin(b.pin) : null, saiPin: 0, khoaDen: null } });
      break;
    }
    case "doi-ten": {
      const m = await mem();
      await c.tv.updateOne({ _id: m._id }, { $set: { ten: clean(b.ten, 40) || m.id } });
      break;
    }
    case "xoa-id": {
      const m = await mem();
      await c.tv.deleteOne({ _id: m._id });
      await c.chuc.deleteMany({ nhom: ma, $or: [{ tu: m.id }, { den: m.id }] });
      await c.nk.deleteMany({ nhom: ma, id: m.id }); // #260
      await moChang(c, ma);
      break;
    }
    case "xoa-nhan": {
      if (!ObjectId.isValid(b.nhan)) throw new HttpErr(400, "Thiếu lời nhắn");
      await c.chuc.deleteOne({ _id: new ObjectId(b.nhan), nhom: ma });
      break;
    }
    default:
      throw new HttpErr(400, "Việc không rõ");
  }
  return { ok: true };
}

// ---------- #271 Trang ẩn /quanlinhomhoc: xem + sửa MỌI nhóm học (KHÔNG xoá gì, PIN chỉ đặt mới — không bỏ được) ----------
// Mật khẩu quản lý đặt ở biến môi trường QUANLI_MATKHAU (máy: .env.local · Vercel: Settings → Environment Variables).
// Repo công khai → chỉ mật khẩu này bảo vệ trang; sai nhiều lần bị chậm lại.
const qlSai = globalThis.__dpQlSai || (globalThis.__dpQlSai = { n: 0, den: 0 });
export async function qlCheck(pw) {
  const mk = process.env.QUANLI_MATKHAU || "";
  if (mk.length < 8) throw new HttpErr(503, "Chưa đặt mật khẩu quản lý (biến QUANLI_MATKHAU, tối thiểu 8 ký tự)");
  if (Date.now() < qlSai.den) throw new HttpErr(429, "Sai nhiều lần — thử lại sau 1 phút");
  const a = crypto.createHash("sha256").update(String(pw || "")).digest();
  const b = crypto.createHash("sha256").update(mk).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    qlSai.n += 1;
    if (qlSai.n >= 5) Object.assign(qlSai, { n: 0, den: Date.now() + 60e3 });
    await new Promise((r) => setTimeout(r, 800));
    throw new HttpErr(401, "Mật khẩu quản lý chưa đúng");
  }
  qlSai.n = 0;
}
export async function qlDanhSach() {
  const c = await cols();
  const ds = await c.nhom.find({}, { projection: { huongDanHash: 0, nhacDaGui: 0 } }).sort({ hoatDongLuc: -1 }).limit(500).toArray();
  const mapN = {};
  for (const m of await c.tv.find({}, { projection: { nhom: 1, trangThai: 1 } }).toArray()) {
    const x = (mapN[m.nhom] ||= { n: 0, hoc: 0 });
    x.n += 1;
    if (m.trangThai === "hoc") x.hoc += 1;
  }
  return {
    nhom: ds.map((g) => ({
      ma: g._id, ten: g.ten, chuoi: g.chuoi?.title, soBai: g.chuoi?.bai?.length || 0, chang: g.changHienTai || 0, nguoiTaoId: g.nguoiTaoId || "", tenHuongDan: g.tenHuongDan,
      soNguoi: mapN[g._id]?.n || 0, dangHoc: mapN[g._id]?.hoc || 0, taoLuc: g.taoLuc, hoatDongLuc: g.hoatDongLuc, veDichLuc: g.veDichLuc || null, hetHanLuc: g.hetHanLuc || null,
    })),
  };
}
export async function qlNhom(ma) {
  const c = await cols();
  const g = await getNhom(c, ma);
  const tv = await c.tv.find({ nhom: ma }).sort({ vaoLuc: 1 }).toArray();
  const soTin = await c.tin.countDocuments({ nhom: ma, xoa: { $ne: true } });
  return {
    nhom: { ...pubNhom(g), hetHanLuc: g.hetHanLuc || null },
    members: tv.map((m) => ({
      ...pubMember(g, m), laNguoiTao: g.nguoiTaoId === m.id, saiPin: m.saiPin || 0, khoaDen: m.khoaDen || null, hoatDongLuc: m.hoatDongLuc || null,
      dangDo: (() => { const u = g.chuoi.bai[Math.min(g.changHienTai || 0, g.chuoi.bai.length - 1)]; return dangDo(m.tienDo?.[baiKey(u)], g.nguong); })(),
    })),
    soTin,
  };
}
export async function qlNhatKy(ma, id) {
  const c = await cols();
  await getNhom(c, ma);
  const ds = await c.nk.find({ nhom: ma, id: { $in: [String(id || ""), "*"] } }).sort({ luc: -1 }).limit(300).toArray();
  return { ds: ds.map((x) => ({ viec: x.viec, chiTiet: x.chiTiet || "", chung: x.id === "*", dang: x.loai === "tien", luc: x.luc })) };
}
export async function qlSua(b) {
  const c = await cols();
  const ma = String(b.ma || "").toUpperCase();
  const g = await getNhom(c, ma);
  const mem = async () => {
    const m = await c.tv.findOne({ nhom: ma, id: String(b.id || "").toLowerCase() });
    if (!m) throw new HttpErr(404, "Không có ID này trong nhóm");
    return m;
  };
  switch (b.viec) {
    case "nhom": {
      const set = caiDat(b.caiDat || {}, g);
      if (b.caiDat?.nguoiTaoId !== undefined) {
        const id = String(b.caiDat.nguoiTaoId).toLowerCase();
        if (!(await c.tv.findOne({ nhom: ma, id }))) throw new HttpErr(400, "Trưởng nhóm mới phải là người đang có trong nhóm");
        set.nguoiTaoId = id;
      }
      await c.nhom.updateOne({ _id: ma }, { $set: set });
      await moChang(c, ma);
      break;
    }
    case "tv": {
      const m = await mem();
      const set = {};
      if (b.ten !== undefined) set.ten = clean(b.ten, 40) || m.ten;
      if (b.trangThai !== undefined) set.trangThai = b.trangThai === "tam-nghi" ? "tam-nghi" : "hoc"; // không có "xoá"
      await c.tv.updateOne({ _id: m._id }, { $set: set });
      await moChang(c, ma);
      break;
    }
    case "pin": {
      // chỉ ĐẶT PIN mới (thêm hoặc thay) — không bao giờ bỏ PIN
      if (!isPin(b.pin)) throw new HttpErr(400, "PIN mới phải là 4 chữ số");
      const m = await mem();
      await c.tv.updateOne({ _id: m._id }, { $set: { pinHash: hashPin(b.pin), saiPin: 0, khoaDen: null } });
      await ghiNk(c, ma, m.id, "Quản lý đặt PIN mới");
      break;
    }
    case "mo-khoa": {
      const m = await mem();
      await c.tv.updateOne({ _id: m._id }, { $set: { saiPin: 0, khoaDen: null } });
      break;
    }
    default:
      throw new HttpErr(400, "Việc không hợp lệ (trang quản lý không xoá dữ liệu)");
  }
  return { ok: true };
}
