// #467 Nhận lỗi từ trình duyệt (âm thanh, …) → MongoDB `loi_web` (tự xoá sau 60 ngày).
//  POST /api/loi  { loai, chiTiet, trang }      — ai cũng gửi được; KHÔNG lưu IP / tên / dữ liệu cá nhân
//  GET  /api/loi?n=200                          — cần tiêu đề x-quanli (mật khẩu quản lý), xem ở /quanlinhomhoc
import { getCollection } from "@/lib/mongodb";
import { qlCheck } from "@/lib/nhom.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const cat = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").slice(0, n);

// chặn gửi dồn: mỗi máy chủ (phiên chạy) tối đa 300 dòng / phút
const dem = globalThis.__dpLoiDem || (globalThis.__dpLoiDem = { phut: 0, n: 0 });
let daTaoChiMuc = false;
async function col() {
  const c = await getCollection("loi_web");
  if (!daTaoChiMuc) {
    daTaoChiMuc = true;
    await c.createIndex({ luc: 1 }, { expireAfterSeconds: 60 * 86400 }).catch(() => {});
  }
  return c;
}

export async function POST(req) {
  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > 4000) return new Response(null, { status: 204 });
  let b;
  try {
    b = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 204 });
  }
  const loai = cat(b?.loai, 40);
  if (!/^[a-z0-9-]{2,40}$/.test(loai)) return new Response(null, { status: 204 });
  const p = Math.floor(Date.now() / 60000);
  if (dem.phut !== p) Object.assign(dem, { phut: p, n: 0 });
  if (++dem.n > 300) return new Response(null, { status: 204 });
  try {
    let trang = cat(b.trang, 200);
    try {
      trang = new URL(trang, "https://x").pathname.slice(0, 200); // bỏ ?query (có thể chứa mã / tên)
    } catch {
      /* giữ nguyên */
    }
    // #606 đường trang nhóm có mã người học (/nhom/<mã>/<người>/…) → che phần người (không lưu tên)
    const che = (t) => t.replace(/\/nhom\/([A-Za-z0-9]+)\/[^/\s·?#]+/g, "/nhom/$1/*");
    await (await col()).insertOne({
      loai,
      chiTiet: che(cat(b.chiTiet, 500)),
      trang: che(trang),
      ua: cat(req.headers.get("user-agent"), 200),
      luc: new Date(),
    });
  } catch (e) {
    console.error("loi api:", e?.message);
  }
  return new Response(null, { status: 204 });
}

export async function GET(req) {
  try {
    await qlCheck(req.headers.get("x-quanli"));
    const n = Math.min(500, Math.max(1, parseInt(new URL(req.url).searchParams.get("n") || "200", 10) || 200));
    const ds = await (await col()).find({}, { projection: { _id: 0 } }).sort({ luc: -1 }).limit(n).toArray();
    return Response.json({ loi: ds }, { headers: H });
  } catch (e) {
    if (!e.status) console.error("loi api:", e);
    return Response.json({ error: e.status ? e.message : "Lỗi máy chủ" }, { status: e.status || 500, headers: H });
  }
}
