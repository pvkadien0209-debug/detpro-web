"use client";
// #231/#232 — HƯỚNG DẪN CHUNG gắn vào từng phần bài: có sẵn, nói cách dùng phần đó (kèm video chung #228), phòng khi người học chưa biết làm.
// (Hướng dẫn RIÊNG = tài liệu người hướng dẫn tự làm cho lớp — xem components/nhom/NhomHdr.js.)
// lần đầu vào một phần → hiện ra HỎI "Xem hướng dẫn ngắn?"; các lần sau có nút "?" để mở lại khi cần.
// Dùng ở: 5 phần của bài (UnitPage), cây nhóm (Học cùng), trang người hướng dẫn. Đã hỏi phần nào → nhớ trên máy (localStorage).
import React, { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Modal } from "./UnitParts";
import HomeVideos from "./HomeVideos";
import { GUIDE_VIDEOS } from "./trangChuVideoData";
import { useAskTurn } from "./askQueue";

const vid = (id) => GUIDE_VIDEOS.filter((v) => v.id === id);

export const GUIDES = {
  "": {
    ten: "Bài viết",
    video: "hd3",
    buoc: [
      "Đọc bài (có video tóm tắt ngay dưới tên bài nếu bạn thích xem hơn đọc).",
      "Chú ý chữ tô đậm — đó là ý sẽ được hỏi trong 40 câu.",
      "Đọc xong bấm “Bắt đầu luyện” hoặc “Phần tiếp” để sang Bảng thông tin.",
    ],
  },
  info: {
    ten: "Bảng thông tin",
    video: "hd3",
    buoc: [
      "40 câu, mỗi câu 3 đáp án — bảng KHÔNG đánh dấu đáp án đúng: tự tìm trong bài viết.",
      "“Nghe cả 40 câu”: nghe lần lượt câu hỏi → đáp án đúng, chọn hiện Câu hỏi / Đáp án / Cả hai hoặc nghe chay.",
      "Khi luyện, nút bảng ở góc phải mở lại bảng này để tra.",
    ],
  },
  quiz: {
    ten: "Trắc nghiệm",
    video: "hd4",
    buoc: [
      "Nghe / đọc câu hỏi, chọn 1 trong 3 đáp án. Sai thì chọn lại tới khi đúng.",
      "Bấm “Giải thích” để hiểu vì sao đúng — đọc lại đoạn bài liên quan.",
      "Xong cả 40 câu có báo cáo: câu sai được gom lại để luyện lại.",
    ],
  },
  "listen-speak": {
    ten: "Nghe nói",
    video: "hd5",
    buoc: [
      "Nghe câu hỏi và 3 đáp án, rồi bấm Nói và nói lại đáp án đúng bằng tiếng Anh (khớp từ 50% là được).",
      "Chọn cách hiện chữ: Chỉ nghe (khó nhất) · Câu hỏi · Đáp án · Cả hai.",
      "Trên điện thoại nên chọn “Cả hai”: đọc trên màn hình rồi chỉ nói đáp án.",
      "Máy chưa hiểu thì sẽ hỏi lại “Sorry, what did you say?” — không tính sai. Không nói được thì chuyển sang Gõ.",
    ],
  },
  "true-or-false": {
    ten: "True or false",
    video: "hd6",
    buoc: [
      "Nghe câu hỏi và một câu trả lời — câu trả lời đó đúng hay sai?",
      "Bấm True / False (hoặc nói “true” / “false”). Đúng +1, sai −1, không chọn lại.",
      "80 câu: 40 đúng + 40 sai trộn đều — trả lời nhanh để luyện phản xạ.",
    ],
  },
  nhom: {
    ten: "Học cùng nhóm",
    video: "hd7",
    buoc: [
      "Cây là đường đi của cả nhóm: mỗi bài 5 lá (5 phần) + 1 bông (bài nói tự do). Lá xanh đậm = cả nhóm xong.",
      "Bài sau chỉ mở khi mọi người xong bài trước — đồng hồ đếm ngược và chuông nhắc giúp cả nhóm giữ nhịp.",
      "Bấm tên một bạn: xem thống kê luyện tập, gửi icon / câu động viên hoặc chọc nhau trên cây của bạn ấy.",
      "Bài nói tự do: nói những gì bạn nghĩ và nhớ, gửi qua kênh của nhóm, rồi bấm “Đã gửi bài nói” — người hướng dẫn duyệt thì bông xanh.",
      "Nút “Hướng dẫn riêng” (nếu có): video / audio / lời dặn người hướng dẫn làm riêng cho lớp.",
      "Có gì chưa hiểu: bấm Hỏi đáp (chữ hoặc giọng ≤ 2 phút).",
    ],
  },
  "huong-dan": {
    ten: "Trang người hướng dẫn",
    video: null,
    buoc: [
      "Gửi link nhóm cho học viên (Zalo…). Link trang này là của riêng bạn — đừng gửi ai.",
      "Tổng quan: cây cả nhóm, bấm tên một người để xem thống kê và nhắn lên cây. “Chép lời nhắc” để dán vào Zalo.",
      "Bài nói tự do: học viên gửi audio qua kênh của bạn rồi bấm “Đã gửi” (ô vàng) → bạn nghe, ghi nhận xét, bấm Duyệt → xanh.",
      "Hướng dẫn riêng: video bạn tự quay (dán link YouTube / Drive), ghi âm hoặc lời dặn — gắn vào cả lớp, một bài hay một phần; học viên vào đúng chỗ sẽ được hỏi xem. Có thể đăng kèm lên Hỏi đáp hoặc chép gửi Zalo.",
      "Học viên bỏ dở: chuyển “Tạm nghỉ” để nhóm đi tiếp. Quên PIN: đặt lại ở tab Học viên.",
      "Cài đặt: ngưỡng qua phần, đếm ngược, tần suất nhắc — đổi lúc nào cũng được, áp từ chặng đang mở.",
    ],
  },
};

const KEY = (k) => `dp.guide.seen.${k || "bai-viet"}`;
const seen = (k) => {
  try {
    return !!localStorage.getItem(KEY(k));
  } catch {
    return true; // không đọc được bộ nhớ → không làm phiền
  }
};
const markSeen = (k) => {
  try {
    localStorage.setItem(KEY(k), "1");
  } catch {
    /* bỏ qua */
  }
};

/** Nút "?" + tự hỏi lần đầu. extra = dòng thêm (vd. ngưỡng của nhóm). */
export default function PartGuide({ k, extra, className = "kt-guidebtn", label }) {
  const g = GUIDES[k];
  const [mode, setMode] = useState(null); // null | "ask" | "open"
  useEffect(() => {
    setMode(g && !seen(k) ? "ask" : null);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const turn = useAskTurn(`pg-${k}`, mode === "ask" || mode === "open", 5);
  if (!g) return null;
  const close = () => {
    markSeen(k);
    setMode(null);
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setMode("open")} aria-label={`Hướng dẫn: ${g.ten}`} title={`Hướng dẫn chung: ${g.ten}`}>
        <HelpCircle size={18} aria-hidden="true" />
        {label && <span>{label}</span>}
      </button>
      {mode === "ask" && turn && (
        <div className="kt-guideask" role="dialog" aria-label={`Hướng dẫn ${g.ten}`}>
          <p>
            Lần đầu vào <b>{g.ten}</b> — xem hướng dẫn chung (cách làm phần này)?
          </p>
          <div>
            <button type="button" className="is-pri" onClick={() => setMode("open")}>
              Xem hướng dẫn
            </button>
            <button type="button" onClick={close}>
              Bỏ qua
            </button>
          </div>
          <small>Lúc nào cần, bấm nút ? để xem lại.</small>
        </div>
      )}
      <Modal open={mode === "open"} onClose={close} title={`Hướng dẫn chung: ${g.ten}`}>
        <ol className="kt-guidesteps">
          {g.buoc.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
          {extra && <li className="is-extra">{extra}</li>}
        </ol>
        {g.video && <HomeVideos list={vid(g.video)} title="Video ngắn" sub="Hướng dẫn chung — tiếng Anh, phụ đề Việt" id={`kt-pg-${g.video}`} />}
      </Modal>
    </>
  );
}
