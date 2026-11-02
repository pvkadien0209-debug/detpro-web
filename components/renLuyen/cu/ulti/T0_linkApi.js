"use client";
// #414 Máy chủ cũ (Heroku) không dùng nữa: giọng đọc gọi /api/tts của web DetPro (cùng kiểu POST { text } → mp3).
const LinkAPI = "/api/";
export default LinkAPI;

/** #414 "Nộp bài tập" / thư 10 điểm của bản cũ gửi qua máy chủ Heroku (đã bỏ) → không gửi đi đâu (dữ liệu học viên không ra ngoài),
 *  trả "thành công" để màn hình y như cũ. */
export function nopBaiTaiCho() {
  return Promise.resolve({ ok: true, status: 200, statusText: "OK", json: async () => ({ success: true }) });
}
