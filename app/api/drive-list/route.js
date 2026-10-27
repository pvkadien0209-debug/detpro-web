// #190 — GET /api/drive-list → danh sách tệp trong thư mục Drive DetProMedia (tên → mã). Làm mới mỗi giờ.
import { listDrive } from "@/lib/drive.server";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  try {
    const d = await listDrive();
    return Response.json(d, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    return Response.json({ files: {}, info: {}, error: e.message }, { status: 200 });
  }
}
