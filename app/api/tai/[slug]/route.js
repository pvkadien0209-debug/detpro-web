// #200 — Link tải cố định cho bảng theo dõi đăng video (Excel): /api/tai/<bài>?loai=anh|video[&xem=1]
// Tìm <bài>--w01.jpg / <bài>--w01.mp4 trong thư mục Drive DetProMedia (cùng danh sách /api/drive-list, làm mới mỗi giờ)
// rồi chuyển hướng sang Google Drive: mặc định TẢI XUỐNG; ?xem=1 thì mở xem.
// Ảnh bìa chưa lên Drive → dùng khung hình Drive tự tạo từ video (nếu video đã có).
import { listDrive } from "@/lib/drive.server";

export const runtime = "nodejs";

const page = (title, text) =>
  new Response(
    `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>` +
      `<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px;color:#172033"><h1 style="font-size:22px">${title}</h1><p>${text}</p><p><a href="/videos">← Về trang Video DetPro</a></p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );

export async function GET(req, { params }) {
  const { slug } = await params;
  const u = new URL(req.url);
  const kind = u.searchParams.get("loai") === "video" ? "video" : "anh";
  const view = u.searchParams.get("xem") === "1";
  if (!/^[a-z0-9-]{2,120}$/.test(slug || "")) return page("Không tìm thấy", "Mã bài không hợp lệ.");

  let files = {};
  try {
    files = (await listDrive()).files || {};
  } catch {
    /* Drive lỗi → báo chưa có */
  }
  const jpg = files[`${slug}--w01.jpg`];
  const mp4 = files[`${slug}--w01.mp4`];
  const go = (url) => Response.redirect(url, 302);

  if (kind === "video") {
    if (!mp4) return page("Video chưa lên Drive", `Chưa thấy <b>${slug}--w01.mp4</b> trong DetProMedia. Tải tệp từ máy 01 lên Drive rồi thử lại (danh sách làm mới mỗi giờ).`);
    return go(view ? `https://drive.google.com/file/d/${mp4}/view` : `https://drive.google.com/uc?export=download&id=${mp4}`);
  }
  if (jpg) return go(view ? `https://drive.google.com/thumbnail?id=${jpg}&sz=w1920` : `https://drive.google.com/uc?export=download&id=${jpg}`);
  if (mp4) return go(`https://drive.google.com/thumbnail?id=${mp4}&sz=w1920`); // ảnh tạm: khung hình từ video
  return page("Ảnh bìa chưa lên Drive", `Chưa thấy <b>${slug}--w01.jpg</b> trong DetProMedia\\img. Ảnh có sẵn ở máy 01: <code>renders\\dp\\img\\</code>.`);
}
