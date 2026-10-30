// #354 Màn chào khi mới vào nhóm — MỘT bộ dữ liệu cho 3 dạng: slideshow (web), bản chữ (web), video (phiên Remotion dựng từ đúng tệp này).
// Mỗi trang: { id, icon, tieuDe, dong: [chuỗi] }. {nhom} {chuoi} {soBai} được thay bằng thông tin nhóm thật.
import { VIEC_MOI_NGUOI, NHAN_DOC } from "@/components/hkt/nhomRules";

export const MAN_CHAO = [
  {
    id: "chao",
    icon: "👋",
    tieuDe: "Chào bạn đến nhóm học {nhom}",
    dong: ["Cả nhóm học cùng chuỗi “{chuoi}” — {soBai} bài, đi từng bài một.", "Học trên điện thoại hoặc máy tính, mỗi ngày 15–20 phút là đủ.", "2 phút đọc giới thiệu này giúp bạn biết rõ mình làm gì và vì sao."],
  },
  {
    id: "muc-tieu",
    icon: "🎯",
    tieuDe: "Mục tiêu của mỗi bài: một bài nói thật",
    dong: ["Cuối mỗi bài, bạn nói 1–2 phút bằng tiếng Anh về điều đã học.", "Mọi bài tập trước đó (Trắc nghiệm, Nghe nói, True or false) là để CHUẨN BỊ cho phần nói này.", "Người hướng dẫn nghe và sửa riêng bài nói của bạn — đó là phần bạn được kèm riêng."],
  },
  {
    id: "ai-lam-gi",
    icon: "🤝",
    tieuDe: "Ai làm việc gì",
    dong: VIEC_MOI_NGUOI.map((x) => `${x.icon} ${x.ai}: ${x.viec}`),
  },
  {
    id: "mot-bai",
    icon: "🌿",
    tieuDe: "Một bài đi thế nào: 5 lá → 1 hoa",
    dong: ["① Đọc bài viết (tiếng Việt, chữ đậm là ý sẽ hỏi) · ② Bảng 40 câu (xem trước hoặc bỏ qua).", "③ Trắc nghiệm — mỗi câu chọn 1 lần · ④ Nghe nói — nói lại đáp án · ⑤ True or false — phản xạ nhanh.", "Xong 5 lá → hoa mở 🌸: bấm hoa lấy gợi ý, nói và gửi bài nói. Cả nhóm xong thì bài sau mở."],
  },
  {
    id: "tieng-anh-yeu",
    icon: "🐢",
    tieuDe: "Tiếng Anh còn yếu? Không sao — có sẵn công cụ",
    dong: ["🐢 Nghe chậm: bấm nút 🐢 để nghe chậm lại · 👀 Hiện chữ (“Cả hai”): vừa nghe vừa đọc.", "🇻🇳 Bấm “Tiếng Việt” để xem nghĩa câu hỏi · “Giải thích” bằng tiếng Việt sau mỗi câu.", "🔤 Cách đọc 10 phút (nguyên âm, âm “ơ”, âm cuối) · ❓ Chưa hiểu thì hỏi người hướng dẫn trong Hỏi đáp.", NHAN_DOC.ghiChu],
  },
  {
    id: "tuan-dau",
    icon: "📅",
    tieuDe: "Tuần đầu nên làm thế này",
    dong: ["Ngày 1: đọc bài + Trắc nghiệm. Ngày 2: Nghe nói + True or false.", "Ngày 3: bấm hoa xem gợi ý, nói 1–2 phút và gửi — 30 giây cũng được, quan trọng là bắt đầu.", "Sai là đang học: đọc Giải thích, luyện lại câu sai. Đều đặn mỗi ngày quan trọng hơn làm nhiều một lúc."],
  },
];

/** 3 câu tự đánh giá (NM-Q2) → điểm 0–6. */
export const TU_DANH_GIA = [
  { id: "nghe", hoi: "Nghe một câu tiếng Anh ngắn, bạn hiểu được…", chon: ["Gần như chưa", "Một phần", "Phần lớn"] },
  { id: "doc", hoi: "Đọc to một câu tiếng Anh đơn giản…", chon: ["Chưa biết đọc nhiều từ", "Đọc được nhưng hay sai", "Đọc khá trôi"] },
  { id: "tu", hoi: "Số từ tiếng Anh bạn biết khoảng…", chon: ["Dưới 500 từ", "500 – 2.000 từ", "Trên 2.000 từ"] },
];
export const CHE_DO = {
  moi: { ten: "🌱 Mới bắt đầu", mo: "Bật sẵn: nghe chậm 🐢, hiện chữ (Cả hai), tiếng Việt mở sẵn, gợi ý bài nói bản dễ." },
  len: { ten: "🌿 Đang lên", mo: "Bật sẵn: hiện chữ (Cả hai). Nghe chậm khi cần (nút 🐢)." },
  vung: { ten: "🌳 Khá vững", mo: "Để mặc định — tự bật công cụ khi cần." },
};
export const cheDoTuDiem = (d) => (d <= 2 ? "moi" : d <= 4 ? "len" : "vung");
