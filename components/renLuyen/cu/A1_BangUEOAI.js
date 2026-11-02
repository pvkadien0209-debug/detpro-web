"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import { useState, useCallback, useRef, useEffect } from "react";
function BangUEOAI() {
  const cellStyle = {
    padding: "3px 6px",
    border: "1px solid #ddd",
    textAlign: "center",
    verticalAlign: "top",
    cursor: "pointer",
  };
  const tableStyle = {
    borderCollapse: "collapse",
    border: "5px solid purple",
    width: "100%",
    marginBottom: "6px",
    cursor: "pointer",
  };
  const ipaStyle = { color: "#999", fontSize: "16px" };
  const arrowStyle = { color: "#bbb", fontSize: "11px", margin: "0 2px" };
  const wordStyle = { color: "#000", fontWeight: "bold" };
  const HIGHLIGHT_BG = "#fff59d";
  const BLINK_ANIMATION_NAME = "bangUEOAIBlink";
  const BLINK_DURATION_MS = 400; // tổng thời gian nhấp nháy trước khi dừng lại ở màu
  const BLINK_STEP_MS = 200; // mỗi lần chớp
  const BLINK_ITERATIONS = BLINK_DURATION_MS / BLINK_STEP_MS;
  // các id đang được highlight tại thời điểm hiện tại
  const [activeIds, setActiveIds] = useState(() => new Set());
  // các id đang trong giai đoạn nhấp nháy (1s đầu sau khi bật highlight)
  const [blinkingIds, setBlinkingIds] = useState(() => new Set());
  // lưu timeout của từng id để có thể huỷ khi cần (tắt sớm / clear all / unmount)
  const blinkTimersRef = useRef({});
  useEffect(() => {
    return () => {
      Object.values(blinkTimersRef.current).forEach(clearTimeout);
      blinkTimersRef.current = {};
    };
  }, []);
  const clearBlinkTimer = useCallback((id) => {
    if (blinkTimersRef.current[id]) {
      clearTimeout(blinkTimersRef.current[id]);
      delete blinkTimersRef.current[id];
    }
  }, []);
  const toggleHighlight = useCallback(
    (id) => {
      setActiveIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          // đang highlight -> bỏ highlight (tắt luôn nhấp nháy nếu có)
          next.delete(id);
          clearBlinkTimer(id);
          setBlinkingIds((prevBlink) => {
            if (!prevBlink.has(id)) return prevBlink;
            const nb = new Set(prevBlink);
            nb.delete(id);
            return nb;
          });
        } else {
          // chưa highlight -> bật highlight kèm nhấp nháy 1s rồi mới dừng lại ở màu
          next.add(id);
          setBlinkingIds((prevBlink) => {
            const nb = new Set(prevBlink);
            nb.add(id);
            return nb;
          });
          clearBlinkTimer(id);
          blinkTimersRef.current[id] = setTimeout(() => {
            setBlinkingIds((prevBlink) => {
              if (!prevBlink.has(id)) return prevBlink;
              const nb = new Set(prevBlink);
              nb.delete(id);
              return nb;
            });
            delete blinkTimersRef.current[id];
          }, BLINK_DURATION_MS);
        }
        return next;
      });
    },
    [clearBlinkTimer],
  );
  const handleClick = useCallback(
    (id) => (e) => {
      e.stopPropagation(); // không cho bubble lên cha (table)
      toggleHighlight(id);
    },
    [toggleHighlight],
  );

  // copy "text" vào clipboard, có fallback cho trường hợp Clipboard API
  // không khả dụng (trình duyệt cũ / trang không chạy trên HTTPS)
  const copyToClipboard = useCallback((text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // im lặng bỏ qua nếu bị từ chối quyền copy
      });
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      // im lặng bỏ qua nếu trình duyệt không hỗ trợ
    }
    document.body.removeChild(ta);
  }, []);

  // bấm vào ô (td) -> vừa toggle highlight của ô, vừa copy luôn chữ sau dấu mũi
  // (span wordStyle) vào clipboard để dán ra chỗ khác
  const handleCellClick = useCallback(
    (id, word) => (e) => {
      e.stopPropagation();
      toggleHighlight(id);
      copyToClipboard(word);
    },
    [toggleHighlight, copyToClipboard],
  );

  // bấm nút gôm -> xoá hết highlight toàn bộ (thay cho double click trước đây)
  const clearAllHighlights = useCallback(() => {
    Object.values(blinkTimersRef.current).forEach(clearTimeout);
    blinkTimersRef.current = {};
    setActiveIds(new Set());
    setBlinkingIds(new Set());
  }, []);

  // trạng thái toàn màn hình (giống F11) + tắt scroll của trang khi đang full
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!fsEl);
      // tắt scroll trang khi full, trả lại như cũ khi thoát full
      document.body.style.overflow = fsEl ? "hidden" : "";
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.body.style.overflow = "";
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) {
      const el = document.documentElement;
      const requestFs = el.requestFullscreen || el.webkitRequestFullscreen;
      if (requestFs) requestFs.call(el);
    } else {
      const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFs) exitFs.call(document);
    }
  }, []);
  const withHighlight = (style, id) => {
    const isBlinking = blinkingIds.has(id);
    const isActive = activeIds.has(id);
    if (isBlinking) {
      return {
        ...style,
        animation: `${BLINK_ANIMATION_NAME} ${BLINK_STEP_MS}ms ease-in-out ${BLINK_ITERATIONS}`,
        animationFillMode: "forwards",
      };
    }
    return {
      ...style,
      backgroundColor: isActive ? HIGHLIGHT_BG : "transparent",
      transition: "background-color 0.4s ease",
    };
  };
  // map: mỗi ô = [ipa1, ipa2, ...] -> chữ thay thế
  const groupUEOAI = [
    { head: "U", ipas: ["uː", "ʊ"], word: "U" },
    { head: "E", ipas: ["e", "ɛ"], word: "E" },
    { head: "O", ipas: ["ɒ", "ɔː"], word: "O" },
    { head: "A", ipas: ["ɑː", "æ", "ʌ"], word: "A" },
    { head: "I", ipas: ["iː", "ɪ"], word: "I" },
    { head: "Ơ", ipas: ["ɜː", "ə"], word: "Ơ" },
  ];
  const groupDouble = [
    { ipa: "eɪ", word: "Ei" },
    { ipa: "aɪ", word: "Ai" },
    { ipa: "ɔɪ", word: "Oi" },
    { ipa: "əʊ", word: "Ơu" },
    { ipa: "aʊ", word: "Au" },
    { ipa: "ɪə", word: "I-ơ" },
    { ipa: "eə", word: "E-ơ" },
    { ipa: "ʊə", word: "U-ơ" },
  ];
  return (
    <div
      style={{
        fontFamily: "inherit",
        lineHeight: 1.3,
        fontSize: "18px",
        padding: "10px",
        maxWidth: "480px",
        margin: "0 auto",
        backgroundColor: "#f9f9f9",
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <style>{`
        @keyframes ${BLINK_ANIMATION_NAME} {
          0%, 100% { background-color: ${HIGHLIGHT_BG}; }
          50% { background-color: transparent; }
        }
      `}</style>
      <i style={{ fontSize: "16px", color: "#555" }}>
        {[
          "(B1) Lấy phiên âm IPA → ",
          "(B2) So chiếu với bảng UEOAI-ơ. ",
          "(B3) Thực hiện 'ghép âm' a/Đọc trước to rõ, sau ngắn nhẹ, âm gió. ",
          "(b) Đọc theo xu hướng âm, từ trái sang phải, từ âm chính sang âm dấu.",
        ].map((text, idx) => {
          const id = `instr-${idx}`;
          return (
            <span
              key={id}
              style={withHighlight({ cursor: "pointer" }, id)}
              onClick={handleClick(id)}
            >
              {text}
            </span>
          );
        })}
      </i>{" "}
      <button
        type="button"
        onClick={clearAllHighlights}
        title="Xoá toàn bộ highlight"
        aria-label="Xoá toàn bộ highlight"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          width: "26px",
          height: "26px",
          padding: 0,
          border: "1px solid #ccc",
          borderRadius: "5px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <g transform="rotate(-45 12 12)">
            <rect
              x="4"
              y="8"
              width="16"
              height="8"
              rx="2"
              fill="#f48fb1"
              stroke="#555"
              strokeWidth="1"
            />
            <rect
              x="4"
              y="8"
              width="8"
              height="8"
              rx="2"
              fill="#9fd3c5"
              stroke="#555"
              strokeWidth="1"
            />
          </g>
        </svg>
      </button>{" "}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          width: "26px",
          height: "26px",
          padding: 0,
          border: "1px solid #ccc",
          borderRadius: "5px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          {isFullscreen ? (
            <path
              d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
              fill="#555"
            />
          ) : (
            <path
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              fill="#555"
            />
          )}
        </svg>
      </button>
      <table
        style={withHighlight(tableStyle, "table-ueoai")}
        onClick={handleClick("table-ueoai")}
      >
        <tbody>
          <tr>
            {groupUEOAI.map((g) => {
              const tdId = `td-ueoai-${g.head}`;
              return (
                <td
                  key={g.head}
                  style={withHighlight(cellStyle, tdId)}
                  onClick={handleCellClick(tdId, g.word)}
                >
                  <span style={ipaStyle}>{g.ipas.join(" / ")}</span>
                  <br />
                  <span style={arrowStyle}>↓</span>
                  <br />
                  <span style={wordStyle}>{g.word}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <table
        style={withHighlight(tableStyle, "table-double")}
        onClick={handleClick("table-double")}
      >
        <tbody>
          <tr>
            {groupDouble.map((g) => {
              const tdId = `td-double-${g.ipa}`;
              return (
                <td
                  key={g.ipa}
                  style={withHighlight(cellStyle, tdId)}
                  onClick={handleCellClick(tdId, g.word)}
                >
                  <span style={ipaStyle}>{g.ipa}</span>
                  <br />
                  <span style={arrowStyle}>↓</span>
                  <br />
                  <span style={wordStyle}>{g.word}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: "14px", color: "#555", marginTop: "10px" }}>
        <hr />
        <i>
          Tiếng Việt và tiếng Anh có nhiều điểm khác biệt trong phát âm, nhưng
          giữa hai ngôn ngữ vẫn tồn tại những nét tương đồng có thể tận dụng.
          Phương pháp này bắt đầu từ việc{" "}
          <strong>tìm ra cái quen thuộc để làm cầu nối</strong>, rồi từng bước
          làm quen và dung hòa những điểm khác biệt. Nhờ đó, việc học phát âm
          tiếng Anh trở nên{" "}
          <strong>
            dễ tiếp cận hơn, bớt cảm giác xa lạ và đặc biệt là có logic để hiểu,
            ghi nhớ và vận dụng
          </strong>
          .
        </i>{" "}
      </div>
    </div>
  );
}
export default BangUEOAI;
