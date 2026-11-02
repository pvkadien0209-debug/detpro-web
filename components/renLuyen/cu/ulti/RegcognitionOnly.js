"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import InfoPopup from "./InfoPopup";

/* ════════════════════════════════════════════════════════════════════
   DictaphoneONLY — footer bar
   - Desktop (web): thanh mic Bật/Tắt (speech-to-text) như cũ.
   - Mobile / iOS: KHÔNG dùng speech-to-text. Thay vào đó là ô input
     nhập chữ, nằm tách biệt, dính đáy màn hình, full width, không bị
     ảnh hưởng bởi scroll trang. Nút "Viết/Tắt" chỉ bật/tắt việc HIỂN
     THỊ ô nhập chữ, không liên quan gì tới speech-to-text.
   - Nút "Gửi" xử lý lấy dữ liệu tuỳ theo hoàn cảnh: mobile → lấy giá
     trị ô input; desktop → lấy transcript từ speech-to-text.
════════════════════════════════════════════════════════════════════ */
const DictaphoneONLY = ({
  IsReading,
  lang = "en-US",
  onTranscript,
  data,
  dataTable,
}) => {
  const { transcript, resetTranscript, listening } = useSpeechRecognition();
  const [micEnabled, setMicEnabled] = useState(false);

  /* ── 4/5: Check ban đầu xem có phải mobile/iOS không ──────────
     Trên mobile/iOS: không dùng speech-to-text, chỉ dùng input text.
     Chỉ check 1 lần lúc mount ("check ban đầu").
  ─────────────────────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua =
      (typeof navigator !== "undefined" &&
        (navigator.userAgent || navigator.vendor)) ||
      "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) &&
      !(typeof window !== "undefined" && window.MSStream);
    const isAndroid = /android/i.test(ua);
    const isNarrowScreen =
      typeof window !== "undefined" && window.innerWidth <= 768;
    setIsMobile(isIOS || isAndroid || isNarrowScreen);
  }, []);

  /* ── 1/2: Ô input nhập chữ dùng cho mobile ────────────────────
     writeMode: bật/tắt HIỂN THỊ ô input — có thể tắt bất cứ lúc nào,
     không phụ thuộc việc đang có chữ hay không, và không đụng gì tới
     speech-to-text.
  ─────────────────────────────────────────────────────────────── */
  const [typedText, setTypedText] = useState("");
  const [writeMode, setWriteMode] = useState(false);

  const handleToggleWrite = () => {
    setWriteMode((prev) => !prev);
  };

  /* ── Popup INFO tra cứu phiên âm ────────────────────────────── */
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [inputString, setInputString] = useState(""); // giá trị đang gõ trong ô tra cứu
  const [searchQuery, setSearchQuery] = useState(""); // giá trị thật sự dùng để tìm (chỉ set khi bấm Tìm)

  /* ── Auto-detect mobile browser tự dừng (chỉ áp dụng cho desktop,
     vì mobile không dùng speech-to-text) ─────────────────────────
     Khi micEnabled=true nhưng listening tắt → reset cờ để nút
     tự chuyển sang trạng thái "cần bật lại"
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isMobile) return;
    if (micEnabled && !listening) {
      setMicEnabled(false);
    }
  }, [listening, isMobile]); // eslint-disable-line

  /* ── Toggle Bật / Tắt mic (chỉ dùng trên web) ─────────────────── */
  const handleToggle = () => {
    if (isMobile) return; // 5/ Không dùng speech-to-text trên mobile/iOS
    if (micEnabled) {
      // Đang bật → tắt
      SpeechRecognition.stopListening();
      setMicEnabled(false);
    } else {
      // Đang tắt → bật
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: lang });
      setMicEnabled(true);
    }
  };

  /* ── 3/: Gửi — lấy dữ liệu tuỳ hoàn cảnh (input chữ hay speech) ─
     mobile → lấy typedText; desktop → lấy transcript.
  ─────────────────────────────────────────────────────────────── */
  const handleSend = () => {
    const current = (isMobile ? typedText : transcript).trim();
    if (!current) return;

    // Ghi vào DOM để Dictaphone-check đọc
    const el = document.getElementById("dtphTranscript");
    if (el) el.innerText = current;
    // Kích hoạt check sau khi DOM cập nhật
    setTimeout(() => {
      document.getElementById("checkBTN")?.click();
    }, 100);

    if (onTranscript) onTranscript(current);

    // Reset và tiếp tục nghe/nhập câu mới
    if (isMobile) {
      setTypedText("");
    } else {
      resetTranscript();
    }
  };

  /* ── Xóa: xóa nội dung hiện tại (input hoặc transcript) ───────
     giữ nguyên trạng thái mic / writeMode
  ─────────────────────────────────────────────────────────────── */
  const handleReset = () => {
    if (isMobile) {
      setTypedText("");
    } else {
      resetTranscript();
    }
  };

  /* ── Mở popup tra cứu, tự điền câu hiện tại nếu có ─────────── */
  const handleOpenInfo = () => {
    const prefill = (isMobile ? typedText : transcript).trim();
    setInputString(prefill);
    setSearchQuery(prefill); // hiện kết quả sẵn cho câu vừa đọc/gõ, nếu có
    setShowInfoPopup(true);
  };

  const handleCloseInfo = () => {
    setShowInfoPopup(false);
  };

  /* ── Bấm Tìm: chỉ lúc này mới thực sự chạy tra cứu ─────────── */
  const handleSearchClick = () => {
    setSearchQuery(inputString.trim());
  };

  /* ── Trạng thái toggle button (mic — chỉ dùng trên web) ───────── */
  // micEnabled=false              → "Bật"   (xanh)
  // micEnabled=true, listening    → "Tắt"   (đỏ, pulse)
  // micEnabled=false sau auto-stop → "Bật lại" (cam) — handled by useEffect above
  const autoStopped = !micEnabled && transcript.trim().length > 0;
  const toggleState = micEnabled
    ? { label: "Tắt", cls: "dtph-toggle-on", icon: "bi-mic-fill" }
    : autoStopped
      ? { label: "Bật lại", cls: "dtph-toggle-warn", icon: "bi-mic" }
      : { label: "Bật", cls: "dtph-toggle-off", icon: "bi-mic-mute-fill" };

  const hasText = (isMobile ? typedText : transcript).trim().length > 0;

  return (
    <>
      <style>{`
        /* ── Wrapper (thanh desktop) ── */
        .dtph-bar {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 6px;
          padding: 0 6px;
          box-sizing: border-box;
          min-height: 0;
          transition: align-items 0.1s;
        }
        .dtph-bar.is-listening {
          align-items: flex-start;
        }
        /* ══ LEFT: Reset + Tiếp ══ */
        .dtph-left {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 2px;
          align-items: center;
        }
        .dtph-sm-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          width: 44px;
          height: 44px;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: transform 0.12s, opacity 0.12s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }
        .dtph-sm-btn:active  { transform: scale(0.90); }
        .dtph-sm-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .dtph-sm-btn i { font-size: 1rem; line-height: 1; }
        .dtph-btn-reset {
          background: rgba(148,163,184,0.35);
          color: #eef7f3;
          border: 1px solid rgba(15, 110, 90,0.35);
        }
        .dtph-btn-next {
          background: linear-gradient(135deg, #cfe9e1, #3f9a84);
          color: #fff;
          box-shadow: 0 2px 10px rgba(15, 110, 90,0.55);
        }
        /* ══ CENTER: Transcript — dùng height thật để animate mượt ══ */
        .dtph-center {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 5px 10px;
          height: 44px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          transition: height 0.45s ease-in-out, border-color 0.25s, background 0.25s;
          text-align: right;
          box-sizing: border-box;
        }
        .dtph-bar.is-listening .dtph-center {
          height: 200px;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, rgba(52,211,153,0.14), rgba(255,255,255,0.05));
          border-color: rgba(74,222,168,0.55);
          box-shadow: 0 0 0 1px rgba(74,222,168,0.15) inset, 0 0 24px rgba(52,211,153,0.15);
        }
        .dtph-transcript-text {
          font-size: 0.82rem;
          line-height: 1.35;
          color: #eef7f3;
          word-break: break-word;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          text-align: right;
          width: 100%;
          font-weight: 600;
          transition: font-size 0.3s ease-in-out, text-align 0.3s;
        }
        .dtph-bar.is-listening .dtph-transcript-text {
          font-size: 1.75rem;
          line-height: 1.5;
          font-weight: 800;
          -webkit-line-clamp: 30;
          text-align: center;
          color: #fff;
          text-shadow: 0 0 18px rgba(52,211,153,0.5), 0 2px 6px rgba(0,0,0,0.35);
          letter-spacing: 0.01em;
        }
        .dtph-placeholder-text {
          font-size: 0.76rem;
          color: rgba(15, 110, 90,0.5);
          font-style: italic;
          text-align: right;
          width: 100%;
          display: block;
          transition: font-size 0.3s ease-in-out, text-align 0.3s;
        }
        .dtph-bar.is-listening .dtph-placeholder-text {
          font-size: 1.25rem;
          text-align: center;
          color: rgba(255,255,255,0.85);
          font-weight: 600;
        }
        /* live blink dot */
        .dtph-live-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ade80;
          margin-left: 6px;
          vertical-align: middle;
          box-shadow: 0 0 8px rgba(74,222,128,0.9);
          animation: dtph-blink 1s step-start infinite;
        }
        @keyframes dtph-blink { 50% { opacity: 0; } }
        /* ══ Toggle button dùng chung (mic bên web / Viết-Tắt bên mobile) ══ */
        .dtph-toggle-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          border: none;
          border-radius: 11px;
          cursor: pointer;
          width: 52px;
          height: 52px;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 2px;
          transition: transform 0.12s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .dtph-toggle-btn:active { transform: scale(0.90); }
        .dtph-toggle-btn i { font-size: 1.15rem; line-height: 1; }
        /* OFF → Bật / Viết (xanh lá tươi) */
        .dtph-toggle-off {
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          color: #063d2c;
          box-shadow: 0 2px 12px rgba(16,185,129,0.55);
        }
        /* ON → Tắt (đỏ-hồng tươi, pulse) */
        .dtph-toggle-on {
          background: linear-gradient(135deg, #fca5a5, #ef4444);
          color: #fff;
          box-shadow: 0 2px 12px rgba(239,68,68,0.55);
          animation: dtph-toggle-pulse 1.6s ease-in-out infinite;
        }
        @keyframes dtph-toggle-pulse {
          0%, 100% { box-shadow: 0 2px 12px rgba(239,68,68,0.55); }
          50%       { box-shadow: 0 2px 26px rgba(239,68,68,0.9); }
        }
        /* AUTO-STOPPED → Bật lại (cam vàng tươi) */
        .dtph-toggle-warn {
          background: linear-gradient(135deg, #fde047, #f59e0b);
          color: #1c1917;
          box-shadow: 0 2px 12px rgba(245,158,11,0.55);
          animation: dtph-toggle-warn-pulse 0.9s ease-in-out infinite;
        }
        @keyframes dtph-toggle-warn-pulse {
          0%, 100% { box-shadow: 0 2px 12px rgba(245,158,11,0.55); }
          50%       { box-shadow: 0 2px 26px rgba(245,158,11,0.9); }
        }

        /* ══════════════════════════════════════════════════════════
           MOBILE — 1/ ô input tách riêng, nằm dưới cùng, full width
           4/ full màn hình & không bị ảnh hưởng bởi scroll trang
        ══════════════════════════════════════════════════════════ */
        .dtph-mobile-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 100vw;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: rgba(15, 110, 90,0.98);
          backdrop-filter: blur(6px);
          z-index: 9999;
        }
        /* 1/ ô input tách bạch, nằm riêng phía trên nút bấm, full width */
        .dtph-mobile-input-row {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dtph-mobile-input {
          width: 100%;
          box-sizing: border-box;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          color: #eef7f3;
          padding: 10px 12px;
          font-size: 0.95rem;
          outline: none;
          resize: none;
          max-height: 40vh;
          overflow-y: auto;
        }
        .dtph-mobile-input::placeholder {
          color: rgba(15, 110, 90,0.5);
          font-style: italic;
        }
        .dtph-mobile-bar {
          width: 100%;
          box-sizing: border-box;
          padding-top: 6px;
          padding-bottom: 6px;
        }
      `}</style>

      {/* ══ DESKTOP / WEB — chỉ hiển thị khi KHÔNG phải mobile ══ */}
      {!isMobile && (
        <div className={`dtph-bar ${listening ? "is-listening" : ""}`}>
          {/* ══ CENTER: Transcript ══ */}
          <div className="dtph-center">
            {hasText ? (
              <span className="dtph-transcript-text">
                {transcript}
                {listening && <span className="dtph-live-dot" />}
              </span>
            ) : (
              <span className="dtph-placeholder-text">
                {micEnabled
                  ? listening
                    ? "Đang nghe… | Khi đọc duy nhất 1 từ có thể hệ thống sẽ nhận dạng chậm hơn đôi chút!"
                    : "Đang kết nối…"
                  : "Bấm Bật để bắt đầu"}
              </span>
            )}
          </div>

          {/* ══ Toggle Bật/Tắt mic — chỉ hiển thị trên web, không liên quan gì tới ô input ══ */}
          <button
            className={`dtph-toggle-btn ${toggleState.cls}`}
            onClick={handleToggle}
            disabled={IsReading}
            title={toggleState.label}
          >
            {IsReading ? (
              "Chờ đọc xong"
            ) : (
              <>
                <i className={`bi ${toggleState.icon}`} />{" "}
                <span>{toggleState.label}</span>
              </>
            )}
          </button>

          {/* ══ Xóa + Gửi + INFO ══ */}
          <div className="dtph-left">
            <button
              className="dtph-sm-btn dtph-btn-reset"
              onClick={handleReset}
              title="Xóa transcript"
            >
              <i className="bi bi-trash3" />
              <span>Xóa</span>
            </button>
            <button
              className="dtph-sm-btn dtph-btn-next"
              onClick={handleSend}
              disabled={!hasText}
              title="Gửi & nghe câu mới"
            >
              <i className="bi bi-arrow-right-circle" />
              <span>Gửi</span>
            </button>
            <button
              className="dtph-sm-btn dtph-btn-next"
              onClick={handleOpenInfo}
              disabled={listening}
              title="Bảng thông tin tham khảo"
            >
              <i className="bi bi-info-circle" />
              <span>INFO</span>
            </button>
          </div>
        </div>
      )}

      {/* ══ MOBILE / iOS — chỉ hiển thị khi LÀ mobile, không dùng speech-to-text ══ */}
      {isMobile && (
        <div className="dtph-mobile-wrap">
          {/* 1/ ô input tách riêng, nằm ở trên thanh nút, full width — chỉ hiện khi bật "Viết" */}
          {writeMode && (
            <div className="dtph-mobile-input-row">
              <textarea
                className="dtph-mobile-input"
                rows={2}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Nhập câu của bạn ở đây…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
          )}

          <div className="dtph-bar dtph-mobile-bar">
            {/* 2/ Nút "Viết/Tắt" — chỉ bật/tắt hiển thị ô input, KHÔNG liên quan speech-to-text,
                có thể tắt bất cứ lúc nào chứ không cần phải có chữ mới tắt được */}
            <button
              className={`dtph-toggle-btn ${writeMode ? "dtph-toggle-on" : "dtph-toggle-off"}`}
              onClick={handleToggleWrite}
              disabled={IsReading}
              title={writeMode ? "Tắt" : "Viết"}
            >
              {IsReading ? (
                "Chờ đọc xong"
              ) : (
                <>
                  <i
                    className={`bi ${writeMode ? "bi-x-lg" : "bi-pencil-fill"}`}
                  />{" "}
                  <span>{writeMode ? "Tắt" : "Viết"}</span>
                </>
              )}
            </button>

            {/* ══ Xóa + Gửi + INFO ══ */}
            <div className="dtph-left">
              <button
                className="dtph-sm-btn dtph-btn-reset"
                onClick={handleReset}
                title="Xóa nội dung đã nhập"
              >
                <i className="bi bi-trash3" />
                <span>Xóa</span>
              </button>
              {/* 3/ Gửi — lấy dữ liệu từ ô input (mobile) */}
              <button
                className="dtph-sm-btn dtph-btn-next"
                onClick={handleSend}
                disabled={!hasText}
                title="Gửi"
              >
                <i className="bi bi-arrow-right-circle" />
                <span>Gửi</span>
              </button>
              <button
                className="dtph-sm-btn dtph-btn-next"
                onClick={handleOpenInfo}
                title="Bảng thông tin tham khảo"
              >
                <i className="bi bi-info-circle" />
                <span>INFO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Popup tra cứu phiên âm — tách riêng sang InfoPopup.js ══ */}
      <InfoPopup
        show={showInfoPopup}
        onClose={handleCloseInfo}
        inputString={inputString}
        setInputString={setInputString}
        searchQuery={searchQuery}
        onSearch={handleSearchClick}
        data={data}
        dataTable={dataTable}
      />

      {/* Hidden triggers — chỉ tác động speech-to-text trên desktop (5/ mobile không dùng STT) */}
      <button
        id="stopListenBTN"
        style={{ display: "none" }}
        onClick={handleToggle}
      />
      <button
        id="sttStopBTN"
        style={{ display: "none" }}
        onClick={() => {
          if (isMobile) return;
          SpeechRecognition.stopListening();
          setMicEnabled(false);
        }}
      />
      <button
        id="sttStartBTN"
        style={{ display: "none" }}
        onClick={() => {
          if (isMobile) return;
          SpeechRecognition.startListening({
            continuous: true,
            language: lang,
          });
          setMicEnabled(true);
        }}
      />
    </>
  );
};

export default DictaphoneONLY;
