// Cấu hình chung cho module Học kiến thức (SP01).
// Code TEST trong CRA (K8) — data & docs mới là phần mang sang Next.js.

export const KT_STORAGE = {
  showAnswers: "hkt.showAnswers", // R2 (cũ, không dùng nữa từ #044)
  listenOnly: "hkt.listenOnly", // UXC-Q3 (#044): mặc định HIỆN chữ; bật "Chỉ nghe" để thử thách
  answerMode: "hkt.answerMode", // "speak" | "type" — dùng từ M2/M3
  lang: "hkt.lang", // "both" | "vi" | "en" — công tắc song ngữ dùng chung (X5)
};

// Ngưỡng so khớp (Q1, §3 kế hoạch) — dùng từ M2.
export const MATCH = { sim: 0.5, wordMatch: 0.7, margin: 0.1 };

export const dataUrl = (branch, topic, file) =>
  `/jsonData/knowledge/${branch}/${topic}/${file}.json`;

// #045 — iPhone: micro sau khi phát âm thanh.
// Thời gian chờ micro "thật sự nghe" (onaudiostart). Quá hạn → huỷ, tự thử lại 1 lần, rồi mời gõ.
export const MIC_WATCHDOG_MS = 4000;
// Thử nghiệm trên iPhone: đặt "play-and-record" để iOS giữ một phiên âm thanh cho cả phát lẫn ghi
// (không phải đổi chế độ mỗi lần bấm mic). Để null = không đặt (mặc định trình duyệt).
// Lưu ý: khi bật, một số iPhone phát tiếng nhỏ hơn / qua loa trong — cần thử thật rồi mới quyết.
export const IOS_AUDIO_SESSION = null; // ví dụ: "play-and-record"

// #116 — Video bài học trên Google Drive: render xong, chép NGUYÊN TÊN tệp (<slug>--w01.mp4) vào thư mục DetProMedia
// (chia sẻ "Bất kỳ ai có đường liên kết"). Web tự tìm tệp theo tên qua Google Drive API — không phải ghi đường dẫn từng tệp.
// apiKey: khoá API Google Cloud (bật "Google Drive API", giới hạn theo trang web). Để "" = tắt, chỉ dùng videos/dp/index.json.
export const DRIVE_VIDEO = {
  folderId: "1fC5sc5PhkKZka66tfjZL98sCzdyN_vLA",
  apiKey: "", // #190: khoá nằm ở máy chủ (biến DRIVE_API_KEY), trình duyệt gọi /api/drive-list
};
