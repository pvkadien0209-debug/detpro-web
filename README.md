# detpro-web — DetPro bản Next.js

**DetPro — Mỗi ngày biết thêm một điều hay.** Toàn bộ web DetPro chạy bằng Next.js (SP05, chuyển một lần ở #190).
Bản CRA và máy chủ Express đã bỏ (#189); project cũ `SEO-PT-projectjs` chỉ còn dùng ở máy: soạn / dựng dữ liệu bài, tạo mp3 lời đọc cho video.
Kế hoạch: `C:\Dienpham\App\SEO-PT-projectjs\DetPro\nextjs\KE-HOACH-NEXTJS.md`.

## Các tệp .bat — thư mục `bat\` (#233, xem `bat\DOC-TOI.txt`)
| Thư mục | Tệp | Việc |
|---|---|---|
| `1-cai-dat-lan-dau\` | `1-cai-thu-vien.bat` · `2-lay-chuoi-mongodb.bat` | cài thư viện (Node ≥ 20.9) · ghi `MONGODB_URI` + `DRIVE_API_KEY` vào `.env.local` (không in ra, không lên git) |
| `2-du-lieu\` | `1-dong-bo-du-lieu.bat` | chép bài học (`jsonData\units`), danh mục, video cũ, logo, ảnh Đét từ `SEO-PT-projectjs\client\public` (chỉ đọc project cũ) |
| `3-chay-thu\` | `1-chay-thu.bat` · `2-build-thu.bat` | http://localhost:3001 (sửa code) · build giống Vercel rồi chạy |
| `4-dua-len-web\` | `1-day-len-github.bat` | đẩy lên https://github.com/pvkadien0209-debug/detpro-web (kiểm danh sách **không có `.env.local`**) → Vercel tự build |
| `9-don-dep\` | `1-don-tep-cu-n1.bat` · `2-xoa-bat-cu-o-goc.bat` | chạy một lần: xoá tệp thừa mốc N1 · xoá 7 tệp .bat cũ ở gốc |

- **Máy mới:** `1-cai-dat-lan-dau\1` → `1-cai-dat-lan-dau\2` → `2-du-lieu\1` → `3-chay-thu\1`.
- **Sửa code:** `3-chay-thu\1` → (tuỳ chọn) `3-chay-thu\2` → `4-dua-len-web\1`.
- **Thêm / sửa bài** ở project cũ (`build_units.py`): `2-du-lieu\1` → `4-dua-len-web\1`.

## Các trang
| Đường dẫn | Component (chép từ CRA) | Dựng |
|---|---|---|
| `/` | HomeKnowledge | trình duyệt + HTML máy chủ có danh sách chủ đề cho Google |
| `/knowledge`, `/learn/[type]` | KnowledgeHome | như trên |
| `/knowledge/[nhánh]/[chủ-đề]` | TopicPage → TopicCourse | như trên; chủ đề đổi nhánh → chuyển 308 |
| `/for`, `/for/[người-nghe]` | AudiencesHome, AudiencePage | như trên; `/for/[người-nghe]` canonical về trang chủ đề |
| `/for/[người-nghe]/[bài]/[phần?]` | UnitPage + UnitParts | **dựng ở máy chủ** (đủ chữ bài viết, bảng câu hỏi, JSON-LD FAQ + Breadcrumb); dựng khi có người mở lần đầu rồi giữ lại. Phần luyện (quiz, listen-speak, true-or-false) `noindex` |
| `/videos`, `/videos/[bài]` | VideosPage, VideoWatchPage | trình duyệt; danh sách Drive qua `/api/drive-list` |
| `/me`, `/dang-bai/...` | MyPage, PostToolPage | trình duyệt, `noindex` |
| `/articles/...`, `/knowledge/.../<bài cũ>/...` | — | chuyển 308 sang bài mới (bảng `legacy` trong `units/index.json`) |
| `/sitemap.xml`, `/robots.txt`, 404 | — | máy chủ |

Phần cũ (rèn luyện, phòng, game, ghép âm…) không còn trên web.

## Máy chủ (`app/api`)
- `POST /api/tts { text }` → mp3: md5 → MongoDB `tts_audio_cache` (cache cũ dùng lại) → không có thì Google TTS rồi lưu. Trình duyệt (`audioPlayer.js`) gọi đường này; lỗi thì dùng giọng đọc của trình duyệt như trước.
- `GET /api/mongo-check` — thử kết nối MongoDB.
- `GET /api/drive-list` — danh sách tệp thư mục Drive DetProMedia (khoá ở máy chủ, làm mới mỗi giờ).
- Gửi mail: chưa có (để dành ở `SEO\DetPro\nextjs\next-server\san-sang\de-danh`).

## Biến môi trường (`.env.local` trên máy, Settings → Environment Variables trên Vercel)
| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `MONGODB_URI` | có | chuỗi kết nối MongoDB Atlas |
| `DRIVE_API_KEY` | có (trang Video) | khoá Google Drive API; khoá đang giới hạn theo trang web → máy chủ gửi kèm `Referer: SITE_URL` |
| `SITE_URL` | không | mặc định `https://detpro.vercel.app` (canonical, sitemap, Referer) |
| `DRIVE_FOLDER_ID` | không | mặc định thư mục DetProMedia |

## SEO
- `lib/seo.js` → `INDEX_DRAFTS = true`: bài "draft" vẫn cho Google lập chỉ mục (giống bản CRA). Đổi `false` khi muốn chỉ bài `published`.
- Trang bài: tiêu đề "… — dành cho …", mô tả, canonical, Open Graph `article`, JSON-LD.

## Cấu trúc
```
app/                     các trang (server) + api/
components/hkt/          code chép từ client/src/components/HocKienThuc (đầu tệp "use client", đổi 1 dòng import)
components/next/         ClientOnly (trang chỉ dựng ở trình duyệt), SeoBlock (chữ dựng sẵn cho Google)
lib/router.js            thay react-router-dom (Link, useNavigate, useParams, useLocation + state, useSearchParams, Navigate)
lib/helmet.js            thay react-helmet-async (không làm gì — tiêu đề đặt ở trang máy chủ)
lib/data.server.js       đọc public/jsonData ở máy chủ
lib/mongodb.js, lib/tts.js, lib/drive.server.js
styles/                  bootstrap (như CRA) + KnowledgeLesson, KnowledgePages, UnitPage, kt, VongDet .css
public/jsonData/         (sinh ra bằng bat\2-du-lieu\1-dong-bo-du-lieu.bat) dữ liệu bài — máy chủ và trình duyệt cùng đọc
```

**Chép thêm một tệp từ CRA:** thêm `"use client";`, đổi `from "react-router-dom"` → `from "@/lib/router"`, bỏ `import "./x.css"` (nạp ở `app/layout.js`). Không đọc `window` / `localStorage` lúc dựng (chỉ trong `useEffect`), nếu không HTML máy chủ và trình duyệt sẽ lệch.

## Lên Vercel
- Project Vercel trỏ vào repo này, nhánh `main`; thêm `MONGODB_URI`, `DRIVE_API_KEY`.
- MongoDB Atlas → Network Access: cho phép `0.0.0.0/0`.
- Google Cloud → khoá Drive API: giới hạn trang web phải có `https://detpro.vercel.app/*`.
- Gắn tên miền `detpro.vercel.app` cho project này (gỡ khỏi project CRA cũ).
