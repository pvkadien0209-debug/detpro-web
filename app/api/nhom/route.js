// #230 Học cùng — POST /api/nhom: người hướng dẫn mở lớp cho một chủ đề (chuỗi bài). Trả { ma, k } (k = mã hướng dẫn).
import { findTopic } from "@/lib/data.server";
import { taoNhom, HttpErr } from "@/lib/nhom.server";

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
