// #230 Học cùng — phần máy chủ: MongoDB (nhom, thanh_vien, tin_nhan, loi_nhan, nhom_tep), mã nhóm, PIN, mở chặng, nhắc.
// #231: bỏ ghi giọng phần Nghe nói (anh: "không cần ghi lại giọng và lưu lại"); thêm lời nhắn / chọc nhau trên cây + thống kê từng người.
// Thiết kế: SEO\DetPro\research\2026-10-27-hoc-cung-nhau.md mục 9–10. Không có máy chủ chạy nền:
// mở chặng tính khi có người ghi tiến độ; tin "Đét nhắc" sinh khi có người mở trang sau mốc nhắc.
import "server-only";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import {
  MA_ABC, isMa, isId, NGUONG_MAC_DINH, thongKe, NHAN_ICON, NHAN_MAU, HAN_MAC_DINH, NHAC_MAC_DINH, TOI_DA, PART_KEYS, partDoneNhom, unitGreen, partCount, dangDo, baiKey, baiMo,
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
  };
  if (!idxDone)
    idxDone = Promise.all([
      c.tv.createIndex({ nhom: 1, id: 1 }, { unique: true }),
      c.tin.createIndex({ nhom: 1, luc: 1 }),
      c.chuc.createIndex({ nhom: 1, luc: 1 }),
      c.hdr.createIndex({ nhom: 1, luc: 1 }),
      // TTL: tự xoá khi tới hetHanLuc (bỏ qua nếu máy chủ không hỗ trợ — vd. FerretDB khi thử ở máy)
      ...[c.nhom, c.tv, c.tin, c.chuc, c.hdr, c.tep].map((x) => x.createIndex({ hetHanLuc: 1 }, { expireAfterSeconds: 0 }).catch((e) => console.warn("TTL index:", e.message))),
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

/** Chuẩn hoá cài đặt người hướng dẫn gửi lên (4a). */
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
  if (b.tenHuongDan !== undefined) out.tenHuongDan = clean(b.tenHuongDan, 40) || "Người hướng dẫn";
  return out;
}

/** Tạo nhóm từ một chủ đề (chép sẵn danh sách bài). Trả { ma, k } — k = mã hướng dẫn (chỉ hiện một lần). */
export async function taoNhom(topic, body) {
  const c = await cols();
  const bai = topic.t.units.map((u) => ({ audience: u.audience, slug: u.slug, title: u.title, kind: u.kind || null }));
  if (!bai.length) throw new HttpErr(400, "Chủ đề chưa có bài");
  const k = rnd(10);
  const set = caiDat({ hanChangGio: HAN_MAC_DINH, nhacGio: NHAC_MAC_DINH, toiDa: TOI_DA, ...body });
  const now = new Date();
  for (let t = 0; t < 6; t++) {
    const ma = rnd(6);
    try {
      await c.nhom.insertOne({
        _id: ma,
        ten: set.ten || topic.t.title.vi,
        tenHuongDan: set.tenHuongDan || "Người hướng dẫn",
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
      });
      return { ma, k };
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

/** Người hướng dẫn: mã k đúng không. */
export const isHuongDan = (g, k) => !!k && sha(`hd:${g._id}:${String(k).toUpperCase()}`) === g.huongDanHash;
async function needHuongDan(c, ma, k) {
  const g = await getNhom(c, ma);
  if (!isHuongDan(g, k)) throw new HttpErr(403, "Mã hướng dẫn không đúng");
  return g;
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
    const p = m.tienDo?.[baiKey(u)];
    if (!p) continue;
    tom[baiKey(u)] = {
      g: PART_KEYS.map((k) => (partDoneNhom(p, k, g.nguong) ? 1 : 0)),
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

/** Tin "Đét nhắc" (4a): mỗi chu kỳ nhắc mà còn người chưa xong chặng đang mở → một tin trong Hỏi đáp. */
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
  const nhan = await c.chuc.find({ nhom: ma }).sort({ luc: -1 }).limit(300).toArray();
  const hdr = await c.hdr.find({ nhom: ma }).sort({ luc: 1 }).toArray();
  return { nhom: pubNhom(g), members: members.map((m) => pubMember(g, m)), soTin, nhan: nhan.map(pubNhan), hdr: hdr.map(pubHdr), now: Date.now() };
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
  if (who.tu !== "huong-dan" && x.tu !== who.tu && x.den !== who.tu) throw new HttpErr(403, "Chỉ người gửi, người nhận hoặc người hướng dẫn xoá được");
  await c.chuc.deleteOne({ _id: x._id });
  return { ok: true };
}

// ---------- #232 Hướng dẫn riêng: tài liệu người hướng dẫn tự làm (link video tự quay, audio, chữ) gắn vào lớp / bài / phần ----------
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
    const tin = { nhom: ma, tu: "huong-dan", ten: g.tenHuongDan || "Người hướng dẫn", gan: bai ? { bai, phan: phan === "*" ? "" : phan, cau: null, nhan } : null, traLoi: null, daGiaiDap: false, xoa: false, luc: new Date(), hetHanLuc: later(KEEP_IDLE + KEEP_DONE) };
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
    if (g.khoaNguoiMoi) throw new HttpErr(403, "Nhóm đã khoá nhận người mới — nhắn người hướng dẫn");
    if (!isId(id)) throw new HttpErr(400, "ID 2–20 ký tự: chữ thường không dấu, số, dấu gạch (vd. lan, minh-12a3)");
    const ten = clean(b.ten, 40) || id;
    const n = await c.tv.countDocuments({ nhom: ma, trangThai: { $ne: "da-roi" } });
    if (n >= (g.toiDa || TOI_DA)) throw new HttpErr(403, `Nhóm đã đủ ${g.toiDa || TOI_DA} người`);
    if (g.batBuocPin && !isPin(b.pin)) throw new HttpErr(400, "Nhóm này yêu cầu PIN 4 số cho mỗi ID");
    if (b.pin && !isPin(b.pin)) throw new HttpErr(400, "PIN là 4 chữ số");
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
    return { ok: true, roi: true };
  }
  await touch(c, g, m);
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
      if (!baiMo(k, g.changHienTai)) throw new HttpErr(423, "Bài này chưa mở — chờ cả nhóm xong chặng trước");
      if (JSON.stringify(b.prog).length > MAX_PROG) throw new HttpErr(413, "Tiến độ quá lớn");
      set[`tienDo.${b.bai}`] = b.prog;
    }
    if (b.phan !== undefined) set.dangO = { bai: b.bai, phan: String(b.phan).slice(0, 20), luc: new Date() };
  }
  await c.tv.updateOne({ _id: m._id }, { $set: set });
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

/** Ai đang gửi: học viên (id + pin) hoặc người hướng dẫn (k). */
async function nguoiGui(c, g, b) {
  if (b.k) {
    if (!isHuongDan(g, b.k)) throw new HttpErr(403, "Mã hướng dẫn không đúng");
    return { tu: "huong-dan", ten: g.tenHuongDan || "Người hướng dẫn" };
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
  if (g.chatTat && who.tu !== "huong-dan") throw new HttpErr(403, "Người hướng dẫn đang tạm tắt Hỏi đáp");
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
  return { ok: true, tin: pubTin({ ...doc, _id: r.insertedId }) };
}

/** Sửa tin: xoá (của mình / người hướng dẫn xoá mọi tin), đánh dấu Đã giải đáp. */
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
    if (!hd && t.tu !== who.tu) throw new HttpErr(403, "Người hướng dẫn hoặc người hỏi mới đánh dấu được");
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
// ---------- Người hướng dẫn ----------
export async function xemHuongDan(ma, k) {
  const c = await cols();
  const g = await needHuongDan(c, ma, k);
  const v = await xemNhom(ma);
  const all = await c.tv.find({ nhom: ma }).toArray();
  return { ...v, nhom: { ...v.nhom, huongDan: true }, tatCa: all.map((m) => ({ id: m.id, ten: m.ten, trangThai: m.trangThai })) };
}

/** Mọi thao tác quản lý của người hướng dẫn. */
export async function quanLy(ma, b) {
  const c = await cols();
  const g = await needHuongDan(c, ma, b.k);
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
      if (b.ghiChu !== undefined) v.ghiChu = clean(b.ghiChu, 300);
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
