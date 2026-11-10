# CLAUDE.md — detpro-web (web DetPro, Next.js)

@AGENTS.md

## Đọc trước mọi phiên
- Hợp đồng HĐ-01: `C:\Dienpham\App\DetPro-QuanTri\DetPro\quan-tri\HOP-DONG-DU-AN.md` (10 điều cốt lõi + Phụ lục A lỗi đã gặp).
- Việc đang dở: mục "Đang dở" + dòng mới nhất trong `DetPro-QuanTri\DetPro\THEO-DOI-TEP.md`.
- Thư mục web thật: `C:\Dienpham\App\Web\DetPro` (`App\DetPro` chỉ là junction, xin quyền / sửa ở đường thật).

## Cách làm với anh Điện
- Trả lời tiếng Việt, ngắn: đã làm gì · anh bấm gì theo thứ tự · việc tiếp.
- Việc lớn / mơ hồ: nghiên cứu → kế hoạch có câu hỏi (kèm đề xuất + lý do) → anh chốt → làm. Việc rõ, rẻ thì làm ngay.
- Sửa tối thiểu, giữ kiến trúc, bố cục và logic cũ trừ khi anh bảo đổi.
- Từ chỉ vai trò: "người hướng dẫn" (không "thầy", không "trưởng nhóm"). Tên mẫu: Oanh (người học), Điện (người hướng dẫn).
- Chữ trong .bat / cửa sổ lệnh: KHÔNG DẤU.

## Ghi sổ (mọi thay đổi, cùng lượt)
- `DetPro-QuanTri\DetPro\`: `nhat-ky\YYYY-MM.md` (mục `#NNN`), `INDEX.md`, `NHAT-KY.md` (dải "#391 – #N"), `THEO-DOI-TEP.md`.
- Lấy bản mới nhất ngay trước khi ghi (nhiều phiên cùng ghi); số `#` lấy lúc ghi; lỗi → ghi Phụ lục A.

## Giao bản cập nhật (gói)
- `bat\goi\goi-NNN.zip` (gốc trong zip là `DetPro/`, chỉ chứa tệp đổi) + `goi-NNN.txt` (không dấu) + dòng mới trong `bat\goi\danh-sach-goi.csv` (`So,Ngay,Viec,TrangThai,CanBam`; gói cũ → "Đã lên web dd/mm hh:mm" hoặc "Gộp vào #NNN").
- Anh bấm "▶ Cập nhật gói mới nhất" trong Excel web → ghi vào `bat\_nhat-ky-bam.csv` (dùng để biết gói đã lên chưa).
- Gói chỉ thêm / thay tệp, không xoá; tệp bỏ đi phải xoá riêng (xem trước + Thùng rác).

## Bảo mật
- Không in / ghi / commit giá trị `MONGODB_URI`, `DRIVE_API_KEY`, `QUANLI_MATKHAU`; `.env.local` chỉ ở máy; khoá gốc ở `DetPro-QuanTri\bi-mat\`.
- Dữ liệu học viên chỉ ở MongoDB, không xuất ra tệp / mail. Ngoại lệ #709: `lib/baoMail.server.js` gửi thư "xong một phần bài tập" CHỈ về mail anh (khoá `GMAIL_USER`, `GMAIL_APP_PASSWORD`; `BAO_MAIL_TAT=1` để tắt).

## Kỹ thuật
- Next.js 16 App Router (JS, Turbopack), React 19, MongoDB 7. `npm run dev` / `build` / `start` cổng 3001; `npm run dong-bo` chép dữ liệu bài từ project cũ.
- Thêm thư viện: ghi đúng số phiên bản (không `^`).
- Bài học 3 phần: `PART_KEYS = ["", "quiz", "true-or-false"]`; link cũ `/info`, `/listen-speak` vẫn mở được (`PARTS_ROUTE`).
- Tài khoản (`lib/taiKhoan.server.js`): scrypt, cookie httpOnly `dp_tk`; collection `tai_khoan`, `tai_khoan_phien`, `tai_khoan_du_lieu` (lưu mảng `{k,v}` vì khoá có dấu chấm). Nhóm: `lib/nhom.server.js`, PIN 6 số (PIN 4 số cũ vẫn nhận).
- Rèn luyện (`/ren-luyen`, chỉ máy tính): mã RoomOffline cũ ở `components/renLuyen/cu/` (chép từ `C:\Dienpham\App\AOLD\SEO-PT-projectjs - Lưu 14-9-2026`), nối qua `routerShim.js` + `appShim.js`; dữ liệu `public/jsonData/<ma>.json` (dạng cũ HDTB + charactor), danh mục `public/ren-luyen/index.json` (mỗi bộ 1 ô, `?a=all` luyện mọi bảng).
- Màu DetPro (xanh thông): `#0b5747 #0f6e5a #3f9a84 #9fd3c5 #cfe9e1 #eef7f3`; CSS chung ở `styles/kt.css`, ghi đè Bootstrap theo phạm vi (vd `.rl-phong`).
- Không đọc `window` / `localStorage` lúc dựng ở máy chủ (chỉ trong `useEffect`).
- Kiểm trước khi giao: `npm run build` sạch + chạy thử trọn luồng (cả dữ liệu xấu); nói rõ đã thử / chưa thử được (vd mic thật).
