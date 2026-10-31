// #370 Tài khoản tuỳ chọn — API. Phiên trong cookie httpOnly "dp_tk" (trình duyệt tự gửi, JavaScript không đọc được).
//  GET  /api/tai-khoan                 tôi là ai ({ u } | { u: null })
//  GET  /api/tai-khoan/thiet-bi        các máy đang đăng nhập
//  GET  /api/tai-khoan/tai-du-lieu     tải toàn bộ dữ liệu (JSON)
//  POST /api/tai-khoan/dang-ky         { ten, mk, tenHien?, email? }
//  POST /api/tai-khoan/dang-nhap       { ten, mk }
//  POST /api/tai-khoan/dang-xuat
//  POST /api/tai-khoan/sua             { tenHien? , email? , mkCu + mkMoi? }
//  POST /api/tai-khoan/dong-bo         { d: { khoá: chuỗi } } → { d } đã gộp
//  POST /api/tai-khoan/thiet-bi        { id | "khac" } đăng xuất máy đó / mọi máy khác
//  POST /api/tai-khoan/xoa             { mk }
import { cookies } from "next/headers";
import { nhomCuaTaiKhoan, ganNhomTay, boGanNhom } from "@/lib/nhom.server";
import { COOKIE, TkErr, uidPhien, toi, dangKy, dangNhap, dangXuat, sua, thietBi, xoaThietBi, dongBo, taiDuLieu, xoaTaiKhoan } from "@/lib/taiKhoan.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const H = { "Cache-Control": "no-store" };
const ok = (x) => Response.json(x, { headers: H });
const fail = (e) => {
  const biet = e instanceof TkErr || (e?.status && e.status < 500); // HttpErr của nhóm (PIN sai…)
  if (!biet) console.error("tai-khoan api:", e);
  return Response.json({ error: biet ? e.message : "Lỗi máy chủ", ...(e.extra || {}) }, { status: e.status || 500, headers: H });
};
const maPhien = async () => (await cookies()).get(COOKIE)?.value || "";
const thietBiCua = (req) => {
  const ua = req.headers.get("user-agent") || "";
  const he = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : "Máy khác";
  const tr = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "";
  return `${he}${tr ? " · " + tr : ""}`;
};
async function datCookie(ma) {
  (await cookies()).set(COOKIE, ma, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 180 * 86400 });
}
async function xoaCookie() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function GET(req, { params }) {
  try {
    const [act] = (await params).act || [];
    const ma = await maPhien();
    if (!act) {
      const r = await toi(ma);
      return ok(r.u ? { ...r, nhom: await nhomCuaTaiKhoan(await uidPhien(ma)) } : r); // #370 các ID nhóm đã gắn
    }
    if (act === "thiet-bi") return ok(await thietBi(ma));
    if (act === "tai-du-lieu") {
      const d = await taiDuLieu(ma);
      return new Response(JSON.stringify(d, null, 2), { headers: { ...H, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="detpro-${d.taiKhoan.ten}.json"` } });
    }
    throw new TkErr(404, "Không có mục này");
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req, { params }) {
  try {
    const [act] = (await params).act || [];
    const len = Number(req.headers.get("content-length") || 0);
    if (len > 3_500_000) throw new TkErr(413, "Dữ liệu quá lớn");
    const b = await req.json().catch(() => ({}));
    const ma = await maPhien();
    switch (act) {
      case "dang-ky": {
        const r = await dangKy(b, thietBiCua(req));
        await datCookie(r.ma);
        return ok({ u: r.u });
      }
      case "dang-nhap": {
        const r = await dangNhap(b, thietBiCua(req));
        await datCookie(r.ma);
        return ok({ u: r.u });
      }
      case "dang-xuat":
        await dangXuat(ma);
        await xoaCookie();
        return ok({ ok: true });
      case "sua":
        return ok(await sua(ma, b));
      case "gan-nhom": { // #370 { ma, id, pin }
        const uid = await uidPhien(ma);
        if (!uid) throw new TkErr(401, "Chưa đăng nhập");
        await ganNhomTay(uid, b.ma, b.id, b.pin);
        return ok({ nhom: await nhomCuaTaiKhoan(uid) });
      }
      case "bo-gan": {
        const uid = await uidPhien(ma);
        if (!uid) throw new TkErr(401, "Chưa đăng nhập");
        await boGanNhom(uid, b.ma, b.id);
        return ok({ nhom: await nhomCuaTaiKhoan(uid) });
      }
      case "dong-bo":
        return ok(await dongBo(ma, b.d));
      case "thiet-bi":
        return ok(await xoaThietBi(ma, b.id));
      case "xoa": {
        const r = await xoaTaiKhoan(ma, b.mk);
        await xoaCookie();
        return ok(r);
      }
      default:
        throw new TkErr(404, "Không có mục này");
    }
  } catch (e) {
    return fail(e);
  }
}
