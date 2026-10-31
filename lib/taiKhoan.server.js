// #370 Tài khoản TUỲ CHỌN (anh chốt 31/10): tên đăng nhập + mật khẩu, email tuỳ chọn (chưa gửi thư xác thực — làm sau).
// Không đăng nhập vẫn học như cũ (tiến độ trên máy). Đăng nhập → đồng bộ tiến độ tự học + các nhóm (ID/PIN, mã hướng dẫn) giữa các máy.
// Không thêm thư viện: mật khẩu băm scrypt (node:crypto), phiên = mã ngẫu nhiên trong cookie httpOnly, máy chủ chỉ lưu SHA-256 của mã.
//   tai_khoan          { ten (tên đăng nhập, chữ thường, duy nhất), tenHien, mk, email, emailXacThuc, saiMk, khoaDen, taoLuc, dungLuc }
//   tai_khoan_phien    { _id: sha(mã), uid, thietBi, taoLuc, dungLuc, hetHanLuc (TTL) }
//   tai_khoan_du_lieu  { _id: uid, ds: [{ k: khoá localStorage, v: chuỗi }], capNhat }
import "server-only";
import crypto from "crypto";
import { getDb } from "./mongodb";
import { gopTienDo } from "@/components/hkt/nhomRules";

export const COOKIE = "dp_tk";
const DAY = 864e5;
const PHIEN_NGAY = 180;
const SAI_TOI_DA = 5;
const KHOA_PHUT = 10;
export const MAX_DU_LIEU = 3_000_000; // byte JSON đồng bộ (Vercel giới hạn thân ~4,5 MB)

export class TkErr extends Error {
  constructor(status, msg, extra) {
    super(msg);
    this.status = status;
    this.extra = extra;
  }
}

let idx = null;
async function cols() {
  const db = await getDb();
  const c = { tk: db.collection("tai_khoan"), ph: db.collection("tai_khoan_phien"), dl: db.collection("tai_khoan_du_lieu") };
  if (!idx)
    idx = Promise.all([
      c.tk.createIndex({ ten: 1 }, { unique: true }),
      c.ph.createIndex({ uid: 1 }),
      c.ph.createIndex({ hetHanLuc: 1 }, { expireAfterSeconds: 0 }).catch(() => {}),
    ]).catch((e) => {
      idx = null;
      console.error("tai_khoan index:", e.message);
    });
  await idx;
  return c;
}

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const scrypt = (mk, salt) => new Promise((ok, no) => crypto.scrypt(mk.normalize("NFC"), salt, 32, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? no(e) : ok(k))));
async function bamMk(mk) {
  const salt = crypto.randomBytes(16);
  return `s1:${salt.toString("hex")}:${(await scrypt(mk, salt)).toString("hex")}`;
}
async function dungMk(mk, h) {
  const [v, s, k] = String(h || "").split(":");
  if (v !== "s1" || !s || !k) return false;
  const got = await scrypt(mk, Buffer.from(s, "hex"));
  const want = Buffer.from(k, "hex");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export const TEN_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const chuanTen = (t) => String(t || "").trim().toLowerCase();
const kiemMk = (mk) => {
  if (typeof mk !== "string" || mk.length < 6) throw new TkErr(400, "Mật khẩu ít nhất 6 ký tự");
  if (mk.length > 200) throw new TkErr(400, "Mật khẩu quá dài");
};
const kiemEmail = (e) => {
  const v = String(e || "").trim().toLowerCase();
  if (!v) return "";
  if (v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new TkErr(400, "Email chưa đúng dạng");
  return v;
};
const sach = (s, n) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

const pub = (u) => ({ ten: u.ten, tenHien: u.tenHien || u.ten, email: u.email || "", emailXacThuc: !!u.emailXacThuc, taoLuc: u.taoLuc });

async function taoPhien(c, uid, thietBi) {
  const ma = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  await c.ph.insertOne({ _id: sha(ma), uid, thietBi: sach(thietBi, 160), taoLuc: now, dungLuc: now, hetHanLuc: new Date(Date.now() + PHIEN_NGAY * DAY) });
  return ma;
}

/** Người đang đăng nhập (hoặc null). Gia hạn phiên tối đa mỗi giờ một lần. */
export async function docPhien(ma) {
  if (!ma || typeof ma !== "string" || ma.length > 100) return null;
  const c = await cols();
  const p = await c.ph.findOne({ _id: sha(ma) });
  if (!p || new Date(p.hetHanLuc) < new Date()) return null;
  const u = await c.tk.findOne({ _id: p.uid });
  if (!u) return null;
  if (Date.now() - new Date(p.dungLuc).getTime() > 3600e3)
    await c.ph.updateOne({ _id: p._id }, { $set: { dungLuc: new Date(), hetHanLuc: new Date(Date.now() + PHIEN_NGAY * DAY) } });
  return { c, u, p };
}
/** #370 uid (chuỗi) của phiên trong cookie, hoặc "" — dùng ở API nhóm để vào ID đã gắn tài khoản khỏi PIN. */
export async function uidPhien(ma) {
  if (!ma) return "";
  try {
    return String((await docPhien(ma))?.u._id || "");
  } catch {
    return "";
  }
}
async function can(ma) {
  const s = await docPhien(ma);
  if (!s) throw new TkErr(401, "Chưa đăng nhập (hoặc phiên đã hết hạn)");
  return s;
}

export async function dangKy(b, thietBi) {
  const ten = chuanTen(b.ten);
  if (!TEN_RE.test(ten)) throw new TkErr(400, "Tên đăng nhập 3–30 ký tự: chữ thường không dấu, số, dấu . _ -");
  kiemMk(b.mk);
  const email = kiemEmail(b.email);
  const c = await cols();
  const now = new Date();
  const doc = { ten, tenHien: sach(b.tenHien, 40) || ten, mk: await bamMk(b.mk), email, emailXacThuc: false, saiMk: 0, khoaDen: null, taoLuc: now, dungLuc: now };
  try {
    const r = await c.tk.insertOne(doc);
    return { u: pub(doc), ma: await taoPhien(c, r.insertedId, thietBi) };
  } catch (e) {
    if (e.code === 11000) throw new TkErr(409, "Tên đăng nhập này đã có người dùng");
    throw e;
  }
}

export async function dangNhap(b, thietBi) {
  const ten = chuanTen(b.ten);
  const c = await cols();
  const u = TEN_RE.test(ten) ? await c.tk.findOne({ ten }) : null;
  if (!u) throw new TkErr(401, "Sai tên đăng nhập hoặc mật khẩu");
  if (u.khoaDen && new Date(u.khoaDen) > new Date()) throw new TkErr(423, `Tạm khoá ${KHOA_PHUT} phút vì nhập sai nhiều lần`, { khoaDen: u.khoaDen });
  if (!(await dungMk(String(b.mk || ""), u.mk))) {
    const sai = (u.saiMk || 0) + 1;
    await c.tk.updateOne({ _id: u._id }, { $set: sai >= SAI_TOI_DA ? { saiMk: 0, khoaDen: new Date(Date.now() + KHOA_PHUT * 60e3) } : { saiMk: sai } });
    throw new TkErr(401, "Sai tên đăng nhập hoặc mật khẩu", { conLai: Math.max(0, SAI_TOI_DA - sai) });
  }
  await c.tk.updateOne({ _id: u._id }, { $set: { saiMk: 0, khoaDen: null, dungLuc: new Date() } });
  return { u: pub(u), ma: await taoPhien(c, u._id, thietBi) };
}

export async function dangXuat(ma) {
  if (!ma) return;
  const c = await cols();
  await c.ph.deleteOne({ _id: sha(ma) });
}

export async function toi(ma) {
  const s = await docPhien(ma);
  return s ? { u: pub(s.u) } : { u: null };
}

/** Sửa thông tin: tên hiển thị · email (chưa xác thực) · mật khẩu (cần mật khẩu cũ). */
export async function sua(ma, b) {
  const { c, u } = await can(ma);
  const set = {};
  if (b.tenHien !== undefined) set.tenHien = sach(b.tenHien, 40) || u.ten;
  if (b.email !== undefined) {
    set.email = kiemEmail(b.email);
    if (set.email !== (u.email || "")) set.emailXacThuc = false;
  }
  if (b.mkMoi !== undefined) {
    if (!(await dungMk(String(b.mkCu || ""), u.mk))) throw new TkErr(401, "Mật khẩu hiện tại chưa đúng");
    kiemMk(b.mkMoi);
    set.mk = await bamMk(b.mkMoi);
  }
  if (Object.keys(set).length) await c.tk.updateOne({ _id: u._id }, { $set: set });
  if (set.mk) await c.ph.deleteMany({ uid: u._id, _id: { $ne: sha(ma) } }); // đổi mật khẩu → đăng xuất các máy khác
  return { u: pub({ ...u, ...set }) };
}

export async function thietBi(ma) {
  const { c, u, p } = await can(ma);
  const l = await c.ph.find({ uid: u._id }).sort({ dungLuc: -1 }).limit(50).toArray();
  return { ds: l.map((x) => ({ id: x._id.slice(0, 16), thietBi: x.thietBi, taoLuc: x.taoLuc, dungLuc: x.dungLuc, mayNay: x._id === p._id })) };
}
export async function xoaThietBi(ma, id) {
  const { c, u, p } = await can(ma);
  if (id === "khac") await c.ph.deleteMany({ uid: u._id, _id: { $ne: p._id } });
  else if (/^[0-9a-f]{16}$/.test(String(id))) await c.ph.deleteMany({ uid: u._id, _id: { $regex: `^${id}` } });
  return thietBi(ma);
}

// ---------- Đồng bộ dữ liệu trên máy (localStorage) ----------
const UNIT = "hkt.unit.";
const MERGE_NHOM = "dp.nhom.cua-toi";
export const KHOA_DONG_BO = [UNIT, "hkt.progress.", "hkt.last", "dp.video.history", "dp.nhom.pin.", "dp.nhom.toi.", "dp.nhom.k.", MERGE_NHOM, "dp.nhom.chao.", "hkt.cheDo", "hkt.ngheCham", "hkt.viMoSan"];
const hopLe = (k) => typeof k === "string" && k.length < 200 && KHOA_DONG_BO.some((p) => k.startsWith(p));
const jp = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/** Gộp một khoá: tiến độ bài gộp theo từng câu (gopTienDo); danh sách nhóm gộp theo mã; còn lại máy gửi lên thắng. */
function gopKhoa(k, cu, moi) {
  if (cu == null) return moi;
  if (moi == null) return cu;
  if (k.startsWith(UNIT)) {
    const a = jp(cu), b = jp(moi);
    if (!a) return moi;
    if (!b) return cu;
    return JSON.stringify({ ...gopTienDo(a, b), updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0) });
  }
  if (k === MERGE_NHOM) {
    const m = new Map();
    for (const x of [...(jp(cu) || []), ...(jp(moi) || [])]) if (x?.ma && (!m.has(x.ma) || (x.luc || 0) > (m.get(x.ma).luc || 0))) m.set(x.ma, x);
    return JSON.stringify([...m.values()].sort((a, b) => (b.luc || 0) - (a.luc || 0)).slice(0, 40));
  }
  return moi;
}

// Khoá localStorage có dấu chấm → MongoDB không cho làm tên trường: lưu dạng mảng [{ k, v }]
const vaoMang = (o) => Object.entries(o).map(([k, v]) => ({ k, v }));
const raObj = (a) => Object.fromEntries((Array.isArray(a) ? a : []).filter((x) => x && typeof x.k === "string").map((x) => [x.k, x.v]));

/** Máy gửi { d: {khoá: chuỗi} } → máy chủ gộp với bản đã lưu → trả bản gộp (máy ghi lại). */
export async function dongBo(ma, d) {
  const { c, u } = await can(ma);
  const vao = {};
  for (const [k, v] of Object.entries(d && typeof d === "object" ? d : {})) if (hopLe(k) && typeof v === "string" && v.length < 400_000) vao[k] = v;
  const cu = raObj((await c.dl.findOne({ _id: u._id }))?.ds);
  const out = { ...cu };
  for (const [k, v] of Object.entries(vao)) out[k] = gopKhoa(k, cu[k], v);
  if (JSON.stringify(out).length > MAX_DU_LIEU) throw new TkErr(413, "Dữ liệu đồng bộ quá lớn");
  await c.dl.updateOne({ _id: u._id }, { $set: { ds: vaoMang(out), capNhat: new Date() } }, { upsert: true });
  return { d: out, capNhat: new Date() };
}

/** Tải toàn bộ dữ liệu của tôi (quyền riêng tư). Không kèm mật khẩu băm. */
export async function taiDuLieu(ma) {
  const { c, u } = await can(ma);
  const dl = await c.dl.findOne({ _id: u._id });
  const ph = await c.ph.find({ uid: u._id }).toArray();
  return { taiKhoan: pub(u), thietBi: ph.map((x) => ({ thietBi: x.thietBi, taoLuc: x.taoLuc, dungLuc: x.dungLuc })), duLieuDongBo: raObj(dl?.ds), xuatLuc: new Date() };
}

/** Xoá tài khoản (cần mật khẩu). Dữ liệu trong các nhóm là của nhóm — không xoá ở đây. */
export async function xoaTaiKhoan(ma, mk) {
  const { c, u } = await can(ma);
  if (!(await dungMk(String(mk || ""), u.mk))) throw new TkErr(401, "Mật khẩu chưa đúng");
  await c.dl.deleteOne({ _id: u._id });
  await c.ph.deleteMany({ uid: u._id });
  await c.tk.deleteOne({ _id: u._id });
  return { ok: true };
}

