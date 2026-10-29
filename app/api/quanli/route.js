// #271 API trang ẩn /quanlinhomhoc — mọi lệnh cần tiêu đề x-quanli = mật khẩu quản lý (biến QUANLI_MATKHAU).
//  GET  /api/quanli                 danh sách mọi nhóm
//  GET  /api/quanli?ma=XXXXXX       chi tiết một nhóm (cài đặt + mọi người + tóm tắt tiến độ)
//  GET  /api/quanli?ma=..&nk=<id>   nhật ký học của một người
//  POST /api/quanli                 { ma, viec: "nhom" | "tv" | "pin" | "mo-khoa", … } — KHÔNG có xoá
import { qlCheck, qlDanhSach, qlNhom, qlNhatKy, qlSua } from "@/lib/nhom.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const fail = (e) => {
  if (!e.status) console.error("quanli api:", e);
  return Response.json({ error: e.status ? e.message : "Lỗi máy chủ" }, { status: e.status || 500, headers: H });
};
export async function GET(req) {
  try {
    await qlCheck(req.headers.get("x-quanli"));
    const u = new URL(req.url);
    const ma = (u.searchParams.get("ma") || "").toUpperCase();
    if (ma && u.searchParams.get("nk")) return Response.json(await qlNhatKy(ma, u.searchParams.get("nk")), { headers: H });
    return Response.json(ma ? await qlNhom(ma) : await qlDanhSach(), { headers: H });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req) {
  try {
    await qlCheck(req.headers.get("x-quanli"));
    return Response.json(await qlSua(await req.json().catch(() => ({}))), { headers: H });
  } catch (e) {
    return fail(e);
  }
}
