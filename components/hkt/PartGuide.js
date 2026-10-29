"use client";
// #231/#232 — HƯỚNG DẪN CHUNG gắn vào từng phần bài: có sẵn, nói cách dùng phần đó (kèm video chung #228), phòng khi người học chưa biết làm.
// #250 (NHA H): bỏ "Hướng dẫn riêng" — người hướng dẫn dặn dò trong Hỏi đáp của từng bài.
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
    ten: "Nhóm học",
    video: "hd8", // #255 (trước: hd7)
    buoc: [
      "Bấm nút xanh “Học tiếp” là vào đúng phần cần làm. Bài làm mở trong cửa sổ lớn; bấm ‹ hoặc nút Back để về cây.",
      "Mỗi bài 5 lá: 2 lá ĐỌC (Bài viết, Bảng thông tin) xanh sẵn; 3 lá BÀI TẬP (Trắc nghiệm, Nghe nói, True or false) xanh khi bạn đạt điều kiện và bấm “Đã xong phần này”. Lá vàng = đạt rồi nhưng chưa bấm.",
      "Bạn xong 5 phần của bài hiện tại → được làm trước 1 bài. Bài xa hơn mở khi cả nhóm xong.",
      "Đồng hồ trên đầu trang = thời hạn của bài hiện tại cho cả nhóm.",
      "Bấm tên một bạn: xem thống kê, gửi icon / câu động viên. “Ai đang làm gì” cho biết bạn bè đang ở câu nào — bấm “Cập nhật” để xem mới nhất.",
      "Bông cuối cành = bài nói tự do: nói điều bạn nhớ, gửi qua kênh Zalo của nhóm rồi bấm “Đã gửi bài nói”.",
      "Nút tròn trên thân cây = Hỏi đáp của bài đó. Hỏi đáp chung ở nút 💬.",
    ],
  },
  "huong-dan": {
    ten: "Trưởng nhóm",
    video: "hd9", // #255
    buoc: [
      "Gửi link nhóm (nút “Chép link nhóm”) cho mọi người qua Zalo. Ai mở link cũng chọn tên mình và gõ PIN — kể cả bạn.",
      "Bạn học cùng nhóm như mọi người; thêm 3 tab: Duyệt bài nói · Học viên · Cài đặt nhóm.",
      "Học viên: xem nhật ký từng người, đổi tên, đặt lại PIN khi ai quên, Tạm nghỉ người bỏ dở để nhóm đi tiếp.",
      "Bài nói tự do: học viên gửi qua Zalo rồi bấm “Đã gửi” (bông vàng) → bạn nghe, ghi nhận xét, bấm Nhận → bông xanh.",
      "Dặn dò riêng từng bài: viết vào Hỏi đáp của bài đó (nút tròn trên thân cây).",
      "Cài đặt: điều kiện qua phần, thời hạn mỗi bài, nhắc — đổi lúc nào cũng được.",
    ],
  },
};

const KEY = (k) => `dp.guide.seen.${k || "bai-viet"}`;
// #267 (anh chốt): chỉ hỏi "xem hướng dẫn?" MỘT lần trên mỗi máy — các phần sau chỉ còn nút "?"
const DA_HOI = "dp.guide.daHoi";
const seen = (k) => {
  try {
    return !!localStorage.getItem(DA_HOI) || !!localStorage.getItem(KEY(k));
  } catch {
    return true; // không đọc được bộ nhớ → không làm phiền
  }
};
const markSeen = (k) => {
  try {
    localStorage.setItem(KEY(k), "1");
    localStorage.setItem(DA_HOI, "1");
  } catch {
    /* bỏ qua */
  }
};

/** Nút "?" + tự hỏi lần đầu. extra = dòng thêm (vd. ngưỡng của nhóm). */
export default function PartGuide({ k, extra, className = "kt-guidebtn", label }) {
  const g = GUIDES[k];
  const [mode, setMode] = useState(null); // null | "ask" | "open"
  const [all, setAll] = useState(false); // #250 (NHA A2): xem cả danh sách video ngay trong cửa sổ, không chuyển trang
  useEffect(() => {
    const trongCuaSo = typeof window !== "undefined" && window.parent !== window; // #267 bài mở trong cửa sổ trên cây → cây đã hỏi rồi
    setMode(g && !seen(k) && !trongCuaSo ? "ask" : null);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const turn = useAskTurn(`pg-${k}`, mode === "ask" || mode === "open", 5);
  if (!g) return null;
  const close = () => {
    markSeen(k);
    setMode(null);
    setAll(false);
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setMode("open")} aria-label={`Hướng dẫn: ${g.ten}`} title={`Hướng dẫn chung: ${g.ten}`}>
        <HelpCircle size={18} aria-hidden="true" />
        {label && <span>{label}</span>}
      </button>
      {mode === "ask" && turn && !seen("__") && (
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
        {all ? (
          <HomeVideos list={GUIDE_VIDEOS} title="Tất cả video hướng dẫn" sub="Vì sao và làm thế nào cho hiệu quả" id={`kt-pg-all-${k || "bai"}`} />
        ) : (
          <p className="kt-guide-link">
            <button type="button" className="kt-linkbtn" onClick={() => setAll(true)}>
              🎬 Xem thêm {GUIDE_VIDEOS.length} video hướng dẫn: vì sao và làm thế nào cho hiệu quả
            </button>
          </p>
        )}
      </Modal>
    </>
  );
}
