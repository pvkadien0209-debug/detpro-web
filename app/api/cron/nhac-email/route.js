// #900 Vercel Cron 19:00 giờ VN (vercel.json "0 12 * * *" UTC): thư nhắc cho người học đã xác nhận email, chưa xong bài đang mở.
// Bảo vệ: có CRON_SECRET (Vercel tự gửi "Authorization: Bearer <CRON_SECRET>") thì bắt buộc; chưa đặt thì chỉ nhận lượt gọi của Vercel Cron.
// Gọi thừa cũng không gửi đôi: mỗi người tối đa 1 thư nhắc / ngày (mail.nhacNgay).
import { nhacEmailHangNgay } from "@/lib/nhom.server";
import { getCollection } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  const sec = process.env.CRON_SECRET;
  const okAuth = sec ? req.headers.get("authorization") === `Bearer ${sec}` : /vercel-cron/i.test(req.headers.get("user-agent") || "");
  if (!okAuth) return Response.json({ error: "Không có quyền" }, { status: 401 });
  try {
    const kq = await nhacEmailHangNgay();
    if (kq.loi) await (await getCollection("loi_web")).insertOne({ loai: "mail-loi", chiTiet: `thư nhắc 19:00: ${kq.loi} thư lỗi, ${kq.gui} thư gửi được`, trang: "/api/cron/nhac-email", ua: "may-chu", luc: new Date() }).catch(() => {});
    return Response.json(kq, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    await (await getCollection("loi_web")).insertOne({ loai: "mail-loi", chiTiet: `thư nhắc 19:00 hỏng: ${String(e?.message || "").slice(0, 200)}`, trang: "/api/cron/nhac-email", ua: "may-chu", luc: new Date() }).catch(() => {});
    return Response.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
