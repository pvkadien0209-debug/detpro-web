// #1039 Tài liệu học (Legal contract learning) — mở tự do, không cần mật khẩu (anh chốt #1043); không lập chỉ mục.
//  GET /api/hoc-rieng/<id>   → trang HTML (trình duyệt nhúng vào khung srcdoc, không lưu đệm)
import fs from "node:fs/promises";
import path from "node:path";
import { HOC_RIENG } from "@/lib/hocRieng";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const bai = HOC_RIENG.find((b) => b.id === id);
    if (!bai) return Response.json({ error: "Không có tài liệu này" }, { status: 404, headers: H });
    const html = await fs.readFile(path.join(process.cwd(), "rieng", "hoc", bai.tep), "utf8");
    return new Response(html, { headers: { ...H, "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    if (!e.status) console.error("hoc-rieng api:", e);
    return Response.json({ error: e.status ? e.message : "Lỗi máy chủ" }, { status: e.status || 500, headers: H });
  }
}
