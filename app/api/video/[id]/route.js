// #272 Phát video Drive bằng trình phát GỐC của điện thoại (bấm toàn màn hình được, không bị dẫn sang Drive).
// GET /api/video/<mã tệp Drive>: máy chủ lấy tệp qua Drive API (khoá API ở máy chủ, không lộ ra trình duyệt) và trả theo
// từng đoạn (Range, 206) — iPhone bắt buộc phát theo đoạn. Mỗi lần trả tối đa 8 MB để hàm chạy nhanh; trình phát tự xin đoạn tiếp.
// Chỉ phát tệp nằm trong thư mục DetProMedia (không thành cổng tải tệp Drive bất kỳ).
import { listDrive } from "@/lib/drive.server";

export const runtime = "nodejs";
export const maxDuration = 30;
const CHUNK = 8 * 1024 * 1024;

let ids = null;
let idsAt = 0;
async function allowed(id) {
  if (!ids || Date.now() - idsAt > 10 * 60e3) {
    const { files } = await listDrive();
    ids = new Set(Object.values(files));
    idsAt = Date.now();
  }
  return ids.has(id);
}

export async function GET(req, { params }) {
  const { id } = await params;
  const key = process.env.DRIVE_API_KEY;
  if (!/^[\w-]{10,}$/.test(id || "") || !key) return new Response("Không có", { status: 404 });
  if (!(await allowed(id))) return new Response("Không có", { status: 404 });
  const referer = (process.env.SITE_URL || "https://detpro.vercel.app").replace(/\/?$/, "/");
  // Đoạn xin: "bytes=a-b" | "bytes=a-" | không có → giới hạn mỗi lần CHUNK
  const m = (req.headers.get("range") || "").match(/bytes=(\d*)-(\d*)/);
  const a = m && m[1] ? +m[1] : 0;
  const b = m && m[2] ? Math.min(+m[2], a + CHUNK - 1) : a + CHUNK - 1;
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${key}`, { headers: { Referer: referer, Range: `bytes=${a}-${b}` }, cache: "no-store" });
  if (!r.ok && r.status !== 206) return new Response("Drive lỗi", { status: 502 });
  const h = new Headers({
    "Content-Type": r.headers.get("content-type") || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  });
  for (const k of ["content-length", "content-range"]) if (r.headers.get(k)) h.set(k, r.headers.get(k));
  return new Response(r.body, { status: r.status === 206 ? 206 : 200, headers: h });
}
