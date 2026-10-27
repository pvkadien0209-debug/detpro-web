// N1 — Đồng bộ dữ liệu + hình thương hiệu từ bản CRA cũ sang detpro-web (NX2-Q3: chép bằng script, dời hẳn khi bỏ CRA).
// Nguồn vẫn là SEO-PT-projectjs vì Remotion và các script Python đang đọc ở đó. Script CHỈ ĐỌC project cũ, không sửa gì bên đó.
//
// Chạy:  node scripts/dong-bo-du-lieu.mjs            (mặc định nguồn ..\SEO-PT-projectjs\client\public)
//        node scripts/dong-bo-du-lieu.mjs --nguon "C:\Dienpham\App\SEO-PT-projectjs\client\public"
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
const SRC = path.resolve(getArg("--nguon") || process.env.DETPRO_NGUON || path.join(ROOT, "..", "SEO-PT-projectjs", "client", "public"));

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
    console.error(`✗ Không thấy thư mục nguồn: ${units}\n  Dùng --nguon "<đường dẫn tới client\\public của SEO-PT-projectjs>"`);
    process.exit(1);
  }
  console.log(`Nguồn: ${SRC}${DRY ? "  (chạy thử, không chép)" : ""}`);

  console.log("[1/3] Bài học → public\\jsonData\\units, danh mục → public\\jsonData\\knowledge");
  await mirror(units, path.join(ROOT, "public", "jsonData", "units"));
  await mirror(path.join(SRC, "jsonData", "knowledge"), path.join(ROOT, "public", "jsonData", "knowledge"), (rel) =>
    /^(index\.json|[^\\/]+[\\/][^\\/]+[\\/]topic\.json)$/.test(rel)
  );

  console.log("[2/3] Video cũ trong web (videos\\dp: index.json + mp4 + ảnh bìa)");
  await mirror(path.join(SRC, "videos", "dp"), path.join(ROOT, "public", "videos", "dp"));

  console.log("[3/3] Logo, favicon, ảnh chia sẻ, brand\\");
  for (const f of BRAND_FILES) await copyFile(path.join(SRC, f), path.join(ROOT, "public", f));
  for (const rel of await listFiles(path.join(SRC, "brand"))) await copyFile(path.join(SRC, "brand", rel), path.join(ROOT, "public", "brand", rel));

  console.log(`✓ Xong: chép ${copied} tệp, giữ nguyên ${same} tệp, xoá ${removed} tệp thừa.`);
}

main().catch((e) => {
  console.error("✗ Lỗi:", e.message);
  process.exit(1);
});
