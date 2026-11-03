// #434 GET /api/nhom?tom=MA1,MA2: tóm tắt nhóm (chủ đề, người hướng dẫn, thành viên) để phân biệt nhóm trên trang "Của tôi".
// #230 Học cùng — POST /api/nhom: người hướng dẫn mở lớp cho một chủ đề (chuỗi bài). Trả { ma, k } (k = mã hướng dẫn).
import { findTopic } from "@/lib/data.server";
import { taoNhom, tomNhom, HttpErr } from "@/lib/nhom.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}));
    const [branch, topic] = String(b.topic || "").split("/");
    const t = branch && topic ? await findTopic(branch, topic) : null;
    if (!t || t.legacy || !t.t.units?.length) throw new HttpErr(400, "Không tìm thấy chuỗi bài này");
    return Response.json(await taoNhom(t, b));
  } catch (e) {
    return Response.json({ error: e.message, ...(e.extra || {}) }, { status: e.status || 500 });
  }
}

export async function GET(req) {
  try {
    const mas = (new URL(req.url).searchParams.get("tom") || "").split(",");
    return Response.json(await tomNhom(mas), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: e.status ? e.message : "Lỗi máy chủ" }, { status: e.status || 500 });
  }
}
