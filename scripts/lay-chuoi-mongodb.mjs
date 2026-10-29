// #188 — Chép chuỗi kết nối MongoDB từ project cũ (SEO-PT-projectjs\server\ulti\mongodb.js) vào .env.local của detpro-web.
// #190 — Chép thêm khoá Google Drive (DRIVE_VIDEO.apiKey trong client\src\components\HocKienThuc\config.js) → DRIVE_API_KEY.
// KHÔNG in chuỗi ra màn hình. .env.local đã chặn git (.gitignore: .env*.local) nên không lên GitHub.
// Chạy:  node scripts/lay-chuoi-mongodb.mjs [--nguon "<đường dẫn tới mongodb.js cũ>"]
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--nguon");
const SRC = path.resolve(i > 0 ? process.argv[i + 1] : path.join(ROOT, "..", "AOLD", "SEO-PT-projectjs - 2910", "server", "ulti", "mongodb.js") /* #277: project cũ nay ở AOLD */);
const ENV = path.join(ROOT, ".env.local");

const src = await fs.readFile(SRC, "utf8").catch(() => null);
if (!src) {
  console.error(`✗ Không đọc được ${SRC}\n  Dùng --nguon "<đường dẫn tới server\\ulti\\mongodb.js>"`);
  process.exit(1);
}
const uri = (src.match(/mongodb(?:\+srv)?:\/\/[^"'`\s]+/) || [])[0];
if (!uri || uri.includes("<")) {
  console.error("✗ Không tìm thấy chuỗi mongodb:// hoặc mongodb+srv:// trong tệp nguồn.");
  process.exit(1);
}

// #190: khoá Drive (trang Video, video trong bài) — đọc ở máy chủ, không còn trong mã trình duyệt
const j = process.argv.indexOf("--nguon-drive");
const CFG = path.resolve(j > 0 ? process.argv[j + 1] : path.join(path.dirname(SRC), "..", "..", "client", "src", "components", "HocKienThuc", "config.js"));
const cfg = await fs.readFile(CFG, "utf8").catch(() => "");
const driveKey = (cfg.match(/apiKey:\s*"(AIza[\w-]{20,})"/) || [])[1];

// Giữ các dòng khác trong .env.local (nếu có), chỉ thay MONGODB_URI, DRIVE_API_KEY
const keys = ["MONGODB_URI=", ...(driveKey ? ["DRIVE_API_KEY="] : [])];
const old = (await fs.readFile(ENV, "utf8").catch(() => "")).split(/\r?\n/).filter((l) => l && !keys.some((k) => l.startsWith(k)));
const add = [`MONGODB_URI=${uri}`, ...(driveKey ? [`DRIVE_API_KEY=${driveKey}`] : [])];
await fs.writeFile(ENV, [...old, ...add, ""].join("\n"), "utf8");

const host = (uri.match(/@([^/?]+)/) || [])[1] || "?";
console.log(`✓ Đã ghi MONGODB_URI vào .env.local (máy chủ: ${host}; tài khoản và mật khẩu không in ra).`);
console.log(driveKey ? "✓ Đã ghi DRIVE_API_KEY (khoá Drive) vào .env.local (không in ra)." : `⚠ Không thấy khoá Drive trong ${CFG} → trang Video chưa có danh sách Drive.`);
console.log("  Trên Vercel: Settings → Environment Variables → thêm MONGODB_URI và DRIVE_API_KEY cùng giá trị (mở .env.local để chép).");
