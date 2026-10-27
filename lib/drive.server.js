// #190 — Đọc thư mục Drive "DetProMedia" ở MÁY CHỦ (chuyển từ UnitVideo.js của bản CRA). Khoá API không lộ ra trình duyệt.
// Biến môi trường: DRIVE_API_KEY (bắt buộc), DRIVE_FOLDER_ID (mặc định thư mục DetProMedia), SITE_URL (gửi kèm Referer,
// vì khoá đang "giới hạn theo trang web" — Google kiểm tra Referer).
// #165: đọc cả thư mục con (sâu tối đa 2 cấp), bỏ thư mục âm thanh; trùng tên thì lấy tệp sửa gần nhất.
import "server-only";

const FOLDER = "application/vnd.google-apps.folder";
const SKIP_DIR = /^(audio|am[ -]?thanh|âm thanh)$/i;
export const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || "1fC5sc5PhkKZka66tfjZL98sCzdyN_vLA";

/** { files: { "<tên>": "<mã>" }, info: { "<tên>": { dur, t } } } — rỗng nếu chưa đặt khoá. */
export async function listDrive() {
  const apiKey = process.env.DRIVE_API_KEY;
  const files = {};
  const info = {};
  if (!apiKey) return { files, info, error: "Thiếu DRIVE_API_KEY" };
  const referer = (process.env.SITE_URL || "https://detpro.vercel.app").replace(/\/?$/, "/");

  const listIn = async (parent, sub) => {
    let token = null;
    do {
      const q = encodeURIComponent(`'${parent}' in parents and trashed = false`);
      const url =
        `https://www.googleapis.com/drive/v3/files?q=${q}` +
        `&fields=nextPageToken,files(id,name,mimeType,modifiedTime,videoMediaMetadata(durationMillis))` +
        `&orderBy=modifiedTime desc&pageSize=1000&key=${apiKey}${token ? `&pageToken=${token}` : ""}`;
      const r = await fetch(url, { headers: { Referer: referer }, next: { revalidate: 3600 } });
      if (!r.ok) throw new Error(`Drive ${r.status}`);
      const d = await r.json();
      for (const f of d.files || []) {
        if (f.mimeType === FOLDER) SKIP_DIR.test(f.name) || sub.push(f.id);
        else if (!files[f.name]) {
          files[f.name] = f.id;
          info[f.name] = { dur: Number(f.videoMediaMetadata?.durationMillis) || 0, t: f.modifiedTime || "" };
        }
      }
      token = d.nextPageToken || null;
    } while (token);
    return sub;
  };

  let parents = [DRIVE_FOLDER_ID];
  for (let depth = 0; parents.length && depth <= 2; depth++) {
    const subs = await Promise.all(parents.map((p) => listIn(p, []).catch(() => [])));
    parents = subs.flat();
  }
  return { files, info };
}
