// N1 — Đồng bộ dữ liệu bài vào detpro-web. Script CHỈ ĐỌC nguồn, không sửa gì bên đó.
// #277 (gốc đổi tên #275): nguồn mặc định = C:\Dienpham\App\DetPro-QuanTri\DetPro\data (thư mục dữ liệu đã dựng, dùng chung web + Remotion):
//   data\jsonData\units\      ← build_units.py ghi vào (python build_units.py "...\DetPro\data\jsonData")
//   data\jsonData\knowledge\  ← danh mục (index.json + <nhánh>\<chủ đề>\topic.json)
// (Trước #275 nguồn là SEO-PT-projectjs\client\public — đã xoá, bản lưu ở AOLD. Vẫn chạy được với --nguon trỏ tới thư mục có jsonData\.)
//
// Chạy:  node scripts/dong-bo-du-lieu.mjs            (nguồn mặc định ..\DetPro-QuanTri\DetPro\data)
//        node scripts/dong-bo-du-lieu.mjs --nguon "<thư mục có jsonData\>"
//        node scripts/dong-bo-du-lieu.mjs --thu        (chỉ in ra sẽ chép gì, không chép)
//
// Chép (#190: một nơi duy nhất là public\jsonData — máy chủ Next.js và trình duyệt cùng đọc):
//   <nguồn>\jsonData\units\        → public\jsonData\units\
//   <nguồn>\jsonData\knowledge\    → public\jsonData\knowledge\ (chỉ index.json + <nhánh>\<chủ đề>\topic.json; bỏ bài 50 câu cũ)
//   <nguồn>\videos\dp\ (index.json, mp4, ảnh bìa) → public\videos\dp\
//   logo, favicon, ảnh chia sẻ, manifest, public\brand\ → public\
// Chỉ chép tệp mới / đã đổi (so cỡ + giờ sửa). Tệp đã bị xoá bên nguồn thì xoá bên đích (chỉ trong các thư mục units).
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const getArg = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : null;
};
const DRY = args.includes("--thu");
const SRC = path.resolve(getArg("--nguon") || process.env.DETPRO_NGUON || path.join(ROOT, "..", "DetPro-QuanTri", "DetPro", "data"));

const BRAND_FILES = ["favicon.ico", "detpro-icon.svg", "favicon-vong-det.svg", "logo192.png", "logo512.png", "og-detpro.jpg", "manifest.json"];

const stat = (p) => fs.stat(p).catch(() => null);
let copied = 0, same = 0, removed = 0;

async function copyFile(from, to) {
  const a = await stat(from);
  if (!a) return;
  const b = await stat(to);
  if (b && b.size === a.size && Math.abs(b.mtimeMs - a.mtimeMs) < 2000) {
    same++;
    return;
  }
  copied++;
  if (DRY) return console.log("  chép", path.relative(ROOT, to));
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  await fs.utimes(to, a.atime, a.mtime); // giữ giờ sửa để lần sau so được
}

async function listFiles(dir, base = dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p, base)));
    else out.push(path.relative(base, p));
  }
  return out;
}

async function mirror(fromDir, toDir, keepFile = () => true) {
  const src = (await listFiles(fromDir)).filter(keepFile);
  for (const rel of src) await copyFile(path.join(fromDir, rel), path.join(toDir, rel));
  const keep = new Set(src);
  for (const rel of await listFiles(toDir)) {
    if (keep.has(rel)) continue;
    removed++;
    if (DRY) console.log("  xoá", path.relative(ROOT, path.join(toDir, rel)));
    else await fs.unlink(path.join(toDir, rel));
  }
}

async function main() {
  const units = path.join(SRC, "jsonData", "units");
  if (!(await stat(units))) {
    console.error(`✗ Không thấy thư mục nguồn: ${units}\n  Lần đầu: bấm bat\\2-du-lieu\\0-khoi-tao-data-tu-web.bat (chép dữ liệu web hiện có sang DetPro\\data).\n  Hoặc dùng --nguon "<thư mục có jsonData\\>"`);
    process.exit(1);
  }
  console.log(`Nguồn: ${SRC}${DRY ? "  (chạy thử, không chép)" : ""}`);

  console.log("[1/3] Bài học → public\\jsonData\\units, danh mục → public\\jsonData\\knowledge");
  await mirror(units, path.join(ROOT, "public", "jsonData", "units"));
  await mirror(path.join(SRC, "jsonData", "knowledge"), path.join(ROOT, "public", "jsonData", "knowledge"), (rel) =>
    /^(index\.json|[^\\/]+[\\/][^\\/]+[\\/]topic\.json)$/.test(rel)
  );

  // #277: video / logo chỉ chép khi nguồn CÓ (DetPro\data không có) và KHÔNG xoá gì bên web —
  // web tự giữ videos\dp (youtube.json do VID ghi thẳng vào web, #273) và logo.
  if (await stat(path.join(SRC, "videos", "dp"))) {
    console.log("[2/3] Video (videos\\dp) — chỉ chép thêm, không xoá");
    for (const rel of await listFiles(path.join(SRC, "videos", "dp"))) await copyFile(path.join(SRC, "videos", "dp", rel), path.join(ROOT, "public", "videos", "dp", rel));
  } else console.log("[2/3] Video: nguồn không có videos\\dp — giữ nguyên bên web");
  if (await stat(path.join(SRC, "brand"))) {
    console.log("[3/3] Logo, favicon, ảnh chia sẻ, brand\\");
    for (const f of BRAND_FILES) await copyFile(path.join(SRC, f), path.join(ROOT, "public", f));
    for (const rel of await listFiles(path.join(SRC, "brand"))) await copyFile(path.join(SRC, "brand", rel), path.join(ROOT, "public", "brand", rel));
  } else console.log("[3/3] Logo: nguồn không có — giữ nguyên bên web");

  console.log(`✓ Xong: chép ${copied} tệp, giữ nguyên ${same} tệp, xoá ${removed} tệp thừa.`);
}

main().catch((e) => {
  console.error("✗ Lỗi:", e.message);
  process.exit(1);
});
