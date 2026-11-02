"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/components/renLuyen/cu/routerShim";

/* ─────────────────────────────────────────────
   HELPER: detect Zalo / Messenger in-app browser
   ───────────────────────────────────────────── */
const detectInAppBrowser = () => {
  const ua = navigator.userAgent || "";
  if (/Zalo/i.test(ua)) return "zalo";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FBANDROID/i.test(ua)) return "messenger";
  if (/Instagram/i.test(ua)) return "instagram";
  return null;
};

/* ─────────────────────────────────────────────
   HELPER: detect browser for mic instructions
   ───────────────────────────────────────────── */
const detectBrowser = () => {
  const ua = navigator.userAgent || "";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/CriOS/i.test(ua)) return "chrome-ios";
  if (/FxiOS/i.test(ua)) return "firefox-ios";
  if (/iPhone|iPad/i.test(ua)) return "safari-ios";
  if (/Chrome/i.test(ua)) return "chrome";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Safari/i.test(ua)) return "safari";
  return "chrome";
};

/* ─────────────────────────────────────────────
   BLOCKER: In-App Browser — inline trong hero card
   ───────────────────────────────────────────── */
const InAppBlocker = ({ browserType }) => {
  const appName =
    browserType === "zalo"
      ? "Zalo"
      : browserType === "instagram"
        ? "Instagram"
        : "Messenger";

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
        border: "2px solid #fb923c",
        borderRadius: 14,
        padding: "18px 16px",
        marginTop: 4,
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg,#ff6b35,#f7c59f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(255,107,53,0.3)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c2410c",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
            Trình duyệt trong {appName}
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#7c2d12" }}>
            Không thể lấy dữ liệu từ đây
          </div>
        </div>
      </div>

      <p style={{ fontSize: "0.8rem", color: "#9a3412", lineHeight: 1.6, margin: "0 0 14px" }}>
        Trình duyệt trong <strong>{appName}</strong> không hỗ trợ micro và một số tính năng cần thiết.
        Vui lòng mở trang bằng <strong>trình duyệt web</strong> để tiếp tục.
      </p>

      {/* Steps */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px", border: "1.5px solid #fed7aa" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9a3412",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 11 }}>
          Cách mở trình duyệt web
        </div>

        {/* Step 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1d4ed8",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a2b4a" }}>
              Bấm icon{" "}
              <span style={{ background: "#1d4ed8", color: "#fff",
                padding: "1px 6px", borderRadius: 4, fontSize: "0.72rem" }}>⋮</span>{" "}
              3 chấm
            </div>
            <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>Góc phải phía trên màn hình</div>
          </div>
          <div style={{ background: "#ff6b35", color: "#fff", borderRadius: 20,
            padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>
            Bước 1
          </div>
        </div>

        <div style={{ borderLeft: "2px dashed #fed7aa", margin: "0 14px 10px", height: 10 }}/>

        {/* Step 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#059669",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a2b4a", marginBottom: 5 }}>
              Chọn biểu tượng{" "}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2,
                background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 5,
                padding: "1px 5px", verticalAlign: "middle" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#059669" }}>quả cầu</span>
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {["Mở bằng Safari","Open in Chrome","Mở bằng trình duyệt","Open in browser"].map(label => (
                <span key={label} style={{ fontSize: "0.64rem", background: "#f1f5f9",
                  color: "#475569", borderRadius: 4, padding: "1px 5px",
                  fontWeight: 600, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ background: "#059669", color: "#fff", borderRadius: 20,
            padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>
            Bước 2
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   BLOCKER: Mic bị chặn — inline trong hero card
   ───────────────────────────────────────────── */
const MicDeniedBlocker = ({ onMicGranted }) => {
  const [requesting, setRequesting] = useState(false);
  const browser = detectBrowser();

  const guideSteps = {
    chrome: [
      { text: 'Bấm icon 🔒 khoá ở thanh địa chỉ (góc trái trên)' },
      { text: 'Tìm dòng "Micro" → đổi từ "Chặn" sang "Cho phép"' },
      { text: 'Tải lại trang → bấm "Cho phép" khi được hỏi' },
    ],
    "chrome-ios": [
      { text: "Vào Cài đặt iPhone → Tìm ứng dụng Chrome" },
      { text: 'Bật công tắc "Micro"' },
      { text: "Quay lại trang và tải lại" },
    ],
    "safari-ios": [
      { text: "Vào Cài đặt iPhone → Safari" },
      { text: 'Bấm vào "Micro" → chọn "Hỏi"' },
      { text: 'Quay lại trang → bấm "Cho phép" khi được hỏi' },
    ],
    samsung: [
      { text: "Bấm menu ⋮ ở góc phải → Cài đặt" },
      { text: 'Tìm "Quyền riêng tư" → "Cài đặt trang web" → "Micro"' },
      { text: "Xoá chặn trang này rồi tải lại trang" },
    ],
    "firefox-ios": [
      { text: "Vào Cài đặt iPhone → Firefox" },
      { text: 'Bật công tắc "Micro"' },
      { text: "Quay lại trang và tải lại" },
    ],
    firefox: [
      { text: "Bấm icon 🔒 ở thanh địa chỉ" },
      { text: "Bấm × để xoá quyền Micro đang bị chặn" },
      { text: 'Tải lại trang → bấm "Cho phép"' },
    ],
    safari: [
      { text: "Vào Safari → Cài đặt cho trang web này" },
      { text: 'Tìm "Micro" → đổi sang "Hỏi" hoặc "Cho phép"' },
      { text: "Tải lại trang" },
    ],
  };

  const browserLabel = {
    chrome: "Chrome",
    "chrome-ios": "Chrome (iOS)",
    "safari-ios": "Safari (iOS)",
    samsung: "Samsung Internet",
    "firefox-ios": "Firefox (iOS)",
    firefox: "Firefox",
    safari: "Safari",
  };

  const steps = guideSteps[browser] || guideSteps["chrome"];
  const bLabel = browserLabel[browser] || "Chrome";

  const tryRequest = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      if (onMicGranted) onMicGranted();
    } catch {
      // still denied
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg,#fff1f2,#ffe4e6)",
      border: "2px solid #f87171",
      borderRadius: 14,
      padding: "18px 16px",
      marginTop: 4,
    }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "linear-gradient(135deg,#dc2626,#f87171)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 4px 10px rgba(220,38,38,0.3)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#b91c1c",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
            Micro bị chặn
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#7f1d1d" }}>
            Cần bật micro để lấy dữ liệu
          </div>
        </div>
      </div>

      <p style={{ fontSize: "0.8rem", color: "#991b1b", lineHeight: 1.6, margin: "0 0 14px" }}>
        Trang thực hành cần dùng <strong>micro</strong> để luyện phát âm.
        Hiện tại micro đang bị chặn trên <strong>{bLabel}</strong>.
      </p>

      {/* Steps */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px",
        border: "1.5px solid #fca5a5", marginBottom: 12 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#b91c1c",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 11 }}>
          Hướng dẫn bật lại micro ({bLabel})
        </div>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9,
              marginBottom: i < steps.length - 1 ? 10 : 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "#fee2e2", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.72rem", flexShrink: 0,
                fontWeight: 800, color: "#dc2626",
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#7f1d1d",
                lineHeight: 1.5, paddingTop: 4 }}>
                {step.text}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ borderLeft: "2px dashed #fca5a5",
                margin: "0 12px 10px", height: 8 }}/>
            )}
          </React.Fragment>
        ))}
        <div style={{ marginTop: 12, padding: "8px 10px", background: "#fef3c7",
          borderRadius: 8, fontSize: "0.73rem", color: "#92400e", lineHeight: 1.5 }}>
          💡 <strong>Mẹo:</strong> Sau khi đổi cài đặt, hãy <strong>tải lại trang</strong> để áp dụng.
        </div>
      </div>

      {/* Retry button — thử lại sau khi user đã đổi settings */}
      <button
        onClick={tryRequest}
        disabled={requesting}
        style={{
          width: "100%", padding: "12px",
          background: requesting ? "#9ca3af" : "#dc2626",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: "0.85rem", fontWeight: 800, cursor: requesting ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "background 0.15s",
        }}
      >
        {requesting ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: "spin 0.8s linear infinite" }}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Đang kiểm tra...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Thử lại sau khi đã bật micro
          </>
        )}
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SUB-COMPONENT: Mic Permission Card (sidebar)
   — chỉ hiển thị trạng thái, không block
   ───────────────────────────────────────────── */
const MicPermissionCard = ({ micState, onMicStateChange }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const browser = detectBrowser();

  const checkPermission = useCallback(() => {
    if (!navigator.permissions) { onMicStateChange?.("unknown"); return; }
    navigator.permissions.query({ name: "microphone" })
      .then(result => {
        onMicStateChange?.(result.state);
        result.onchange = () => onMicStateChange?.(result.state);
      })
      .catch(() => onMicStateChange?.("unknown"));
  }, [onMicStateChange]);

  useEffect(() => { checkPermission(); }, [checkPermission]);

  const requestMic = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      onMicStateChange?.("granted");
    } catch {
      onMicStateChange?.("denied");
    } finally {
      setRequesting(false);
    }
  };

  const statusMap = {
    granted: { color: "#059669", bg: "#d1fae5", border: "#6ee7b7", icon: "✅", label: "Micro đã bật", sub: "Sẵn sàng thực hành!" },
    denied:  { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: "🚫", label: "Micro bị chặn", sub: "Xem hướng dẫn bên dưới" },
    prompt:  { color: "#d97706", bg: "#fef3c7", border: "#fde68a", icon: "⚠️", label: "Chưa cấp quyền", sub: "Bấm nút bên dưới để bật" },
    unknown: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", icon: "❓", label: "Chưa kiểm tra", sub: "Micro chưa được kiểm tra" },
  };
  const s = statusMap[micState] || statusMap.unknown;

  return (
    <div className="dpc-card-sm" style={{ gridColumn: "1 / -1" }}>
      <p className="dpc-card-sm-title">🎤 Quyền micro</p>

      <div style={{ display: "flex", alignItems: "center", gap: 10,
        background: s.bg, border: `1.5px solid ${s.border}`,
        borderRadius: 10, padding: "10px 13px", marginBottom: 10 }}>
        <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: s.color }}>{s.label}</div>
          <div style={{ fontSize: "0.72rem", color: s.color, opacity: 0.8 }}>{s.sub}</div>
        </div>
        <button onClick={checkPermission} title="Kiểm tra lại"
          style={{ background: "transparent", border: `1.5px solid ${s.border}`,
            borderRadius: 7, padding: "4px 8px", cursor: "pointer",
            fontSize: "0.7rem", color: s.color, fontWeight: 700 }}>
          ↻
        </button>
      </div>

      {micState === "prompt" && (
        <button onClick={requestMic} disabled={requesting}
          style={{ width: "100%", padding: "11px", background: "#f59e0b",
            color: "#fff", border: "none", borderRadius: 9, fontSize: "0.83rem",
            fontWeight: 800, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          {requesting ? "Đang yêu cầu..." : "🎤 Bật micro ngay"}
        </button>
      )}

      {micState === "denied" && (
        <>
          <button onClick={() => setShowGuide(!showGuide)}
            style={{ width: "100%", padding: "10px", background: "#dc2626",
              color: "#fff", border: "none", borderRadius: 9, fontSize: "0.8rem",
              fontWeight: 800, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            {showGuide ? "▲ Ẩn" : "🛠 Cách bật lại"}
          </button>
          {showGuide && (
            <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa",
              borderRadius: 10, padding: "10px 12px", fontSize: "0.74rem",
              color: "#7c2d12", lineHeight: 1.5 }}>
              Xem hướng dẫn chi tiết tại phần <strong>"Lấy dữ liệu"</strong> ở trên.
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const DataPracticeComponent = ({
  roomCode,
  currentIndex,
  setStartToGetData,
  fetchTitle,
}) => {
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [startToGetData, setStartToGetDataLocal] = useState(false);
  const [hasExistingName, setHasExistingName] = useState(false);
  const [inAppBrowserType, setInAppBrowserType] = useState(null);
  // micState lifted lên để dùng ở cả hero card lẫn sidebar card
  const [micState, setMicState] = useState("unknown");

  useEffect(() => {
    console.log("[DPC] userAgent:", navigator.userAgent);

    const savedName = localStorage.getItem("nameDinhDanh") || "";
    if (savedName) {
      setUserName(savedName);
      setHasExistingName(true);
      setIsEditingName(false);
    } else {
      setHasExistingName(false);
      setIsEditingName(false);
    }

    const detected = detectInAppBrowser();
    console.log("[DPC] inAppBrowser detected:", detected);
    if (detected) setInAppBrowserType(detected);
  }, []);

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 8) setUserName(value);
  };

  const saveUserName = () => {
    const trimmedName = userName.trim();
    if (trimmedName) {
      setIsEditingName(false);
      setHasExistingName(true);
      localStorage.setItem("nameDinhDanh", trimmedName);
    } else {
      alert("Vui lòng nhập tên!");
    }
  };

  const handleEditName = () => setIsEditingName(true);

  /* ── Kiểm tra điều kiện trước khi fetch ── */
  const fetchBlocked = inAppBrowserType
    ? "inapp"
    : micState === "denied"
      ? "mic"
      : null;

  const handleFetchTitle = () => {
    if (!hasExistingName) { alert("Vui lòng nhập tên trước khi lấy dữ liệu!"); return; }
    if (fetchBlocked) return; // guard (nút đã disabled, nhưng phòng hờ)
    setStartToGetDataLocal(true);
    if (setStartToGetData) setStartToGetData(true);
    if (fetchTitle) {
      fetchTitle();
    } else {
      setTimeout(() => {
        alert("Dữ liệu đã được lấy thành công!");
        setStartToGetDataLocal(false);
        if (setStartToGetData) setStartToGetData(false);
      }, 1000);
    }
  };

  const navigate = useNavigate();
  const needsName = !hasExistingName || isEditingName;

  return (
    <>
      <style>{`
        .dpc-root {
          min-height: 100vh;
          background: #eef2f7;
          padding: 16px 14px 32px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .dpc-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .dpc-header-logo { width:36px; height:36px; border-radius:8px; border:1.5px solid #0070f3; object-fit:cover; flex-shrink:0; }
        .dpc-header-text h1 { font-size:1.05rem; font-weight:700; color:#1a2b4a; margin:0 0 2px 0; }
        .dpc-header-text p  { font-size:0.72rem; color:#8a95a5; margin:0; }

        .dpc-steps { display:flex; align-items:center; gap:0; background:#fff; border-radius:12px; padding:10px 14px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .dpc-step  { display:flex; align-items:center; gap:7px; flex:1; }
        .dpc-step-num { width:26px; height:26px; border-radius:50%; font-size:0.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.3s; }
        .dpc-step-num.done   { background:#28a745; color:#fff; }
        .dpc-step-num.active { background:#f59e0b; color:#fff; animation:pulse-ring 1.6s ease-out infinite; }
        .dpc-step-num.idle   { background:#e5e8ed; color:#9aa3af; }
        .dpc-step-label { font-size:0.76rem; font-weight:600; line-height:1.2; }
        .dpc-step-label.done   { color:#28a745; }
        .dpc-step-label.active { color:#d97706; }
        .dpc-step-label.idle   { color:#b0b8c4; }
        .dpc-step-arrow { color:#c8cfd8; font-size:0.75rem; padding:0 4px; flex-shrink:0; }

        .dpc-hero { border-radius:16px; padding:20px 18px; margin-bottom:14px; box-shadow:0 4px 18px rgba(0,0,0,0.09); transition:all 0.3s; }
        .dpc-hero.step-name  { background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); border:2px solid #f59e0b; }
        .dpc-hero.step-fetch { background:linear-gradient(135deg,#eff8ff 0%,#dbeafe 100%); border:2px solid #3b82f6; }
        /* khi bị block, giữ màu hero nhạt hơn để blocker nổi */
        .dpc-hero.step-fetch.is-blocked { background:linear-gradient(135deg,#f8faff 0%,#eff6ff 100%); border-color:#93c5fd; }

        .dpc-hero-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; }
        .dpc-hero-badge.name  { background:#fde68a; color:#92400e; }
        .dpc-hero-badge.fetch { background:#bfdbfe; color:#1e40af; }
        .dpc-hero-badge.blocked { background:#fee2e2; color:#b91c1c; }
        .dpc-hero-title { font-size:1.2rem; font-weight:800; margin:0 0 4px 0; letter-spacing:-0.3px; }
        .dpc-hero.step-name  .dpc-hero-title { color:#78350f; }
        .dpc-hero.step-fetch .dpc-hero-title { color:#1e3a8a; }
        .dpc-hero-sub { font-size:0.82rem; margin:0 0 18px 0; }
        .dpc-hero.step-name  .dpc-hero-sub { color:#92400e; }
        .dpc-hero.step-fetch .dpc-hero-sub { color:#1e40af; }

        .dpc-input-wrap { position:relative; margin-bottom:12px; }
        input.dpc-main-input { width:100%; padding:15px 50px 15px 18px; border:2.5px solid #f59e0b; border-radius:12px; font-size:1.1rem; font-weight:600; color:#1a2b4a; background:#fff; outline:none; box-sizing:border-box; animation:glow-amber 2s ease-in-out infinite; transition:border-color 0.2s; }
        input.dpc-main-input:focus { border-color:#d97706; animation:none; box-shadow:0 0 0 4px rgba(245,158,11,0.18); }
        input.dpc-main-input::placeholder { color:#c4a25a; font-weight:400; }
        .dpc-char-count { position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:0.72rem; color:#a78028; font-weight:600; pointer-events:none; }

        .dpc-btn-save { width:100%; padding:16px; background:#f59e0b; color:#fff; border:none; border-radius:12px; font-size:1.05rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:background 0.15s, transform 0.1s; letter-spacing:0.2px; }
        .dpc-btn-save:active { transform:scale(0.98); background:#d97706; }

        .dpc-name-confirmed { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.65); border:1.5px solid #93c5fd; border-radius:10px; padding:10px 14px; margin-bottom:14px; }
        .dpc-name-confirmed .avatar { width:38px; height:38px; border-radius:50%; background:#3b82f6; color:#fff; font-size:0.95rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; text-transform:uppercase; }
        .dpc-name-confirmed .info { flex:1; }
        .dpc-name-confirmed .info small { font-size:0.7rem; color:#3b82f6; display:block; margin-bottom:1px; }
        .dpc-name-confirmed .info strong { font-size:1rem; color:#1e3a8a; }
        .dpc-btn-edit-small { padding:5px 12px; background:transparent; border:1.5px solid #93c5fd; border-radius:7px; color:#3b82f6; font-size:0.76rem; font-weight:600; cursor:pointer; flex-shrink:0; transition:background 0.15s; }
        .dpc-btn-edit-small:active { background:#dbeafe; }

        .dpc-btn-fetch { width:100%; padding:18px; background:#1d4ed8; color:#fff; border:none; border-radius:14px; font-size:1.15rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; letter-spacing:-0.2px; box-shadow:0 6px 20px rgba(29,78,216,0.35); transition:background 0.15s, transform 0.1s, box-shadow 0.15s; animation:pulse-blue 2s ease-in-out infinite; }
        .dpc-btn-fetch:active { transform:scale(0.98); box-shadow:0 2px 8px rgba(29,78,216,0.25); animation:none; }
        .dpc-btn-fetch.loading { background:#6b7280; box-shadow:none; animation:none; cursor:not-allowed; }
        .dpc-btn-fetch-arrow { width:28px; height:28px; background:rgba(255,255,255,0.22); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .dpc-secondary { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .dpc-card-sm { background:#fff; border-radius:12px; padding:14px 13px; box-shadow:0 1px 6px rgba(0,0,0,0.06); }
        .dpc-card-sm-title { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.7px; color:#a0a9b5; margin:0 0 10px 0; }

        .dpc-logo-sm { width:48px; height:48px; border-radius:9px; border:2px solid #0070f3; object-fit:cover; display:block; margin:0 auto 10px; transition:transform 0.2s, opacity 0.2s; }
        .dpc-logo-sm.active { cursor:pointer; }
        .dpc-logo-sm.active:active { transform:scale(0.93); }
        .dpc-logo-sm.dimmed { opacity:0.35; cursor:not-allowed; }
        .dpc-nav-sm { width:100%; padding:10px 8px; background:#f0f6ff; border:1.5px solid #c5d9f7; border-radius:9px; color:#0070f3; font-size:0.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:background 0.15s; box-sizing:border-box; }
        .dpc-nav-sm.dimmed { opacity:0.4; cursor:not-allowed; pointer-events:none; }
        .dpc-nav-sm:active { background:#dceeff; }

        .dpc-guide-mini { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
        .dpc-guide-mini li { display:flex; align-items:flex-start; gap:7px; font-size:0.78rem; color:#4a5568; line-height:1.45; }
        .dpc-guide-dot { width:18px; height:18px; border-radius:5px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .dpc-guide-dot.b { background:#dbeafe; color:#1d4ed8; }
        .dpc-guide-dot.g { background:#dcfce7; color:#15803d; }
        .dpc-guide-dot.o { background:#fef3c7; color:#b45309; }

        @keyframes pulse-ring  { 0%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 70%{box-shadow:0 0 0 8px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }
        @keyframes glow-amber  { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.25)} 50%{box-shadow:0 0 0 5px rgba(245,158,11,0.1)} }
        @keyframes pulse-blue  { 0%,100%{box-shadow:0 6px 20px rgba(29,78,216,0.35)} 50%{box-shadow:0 6px 28px rgba(29,78,216,0.55)} }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        @media (min-width:680px) {
          .dpc-root { padding:28px 24px 40px; }
          .dpc-layout-wrap { max-width:860px; margin:0 auto; display:grid; grid-template-columns:1.6fr 1fr; gap:18px; align-items:start; }
          .dpc-steps { margin-bottom:0; }
          .dpc-secondary { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="dpc-root">
        {/* Header */}
        <div className="dpc-header">
          <img src="/detpro-icon.svg"
            className="dpc-header-logo" alt="logo"/>
          <div className="dpc-header-text">
            <h1>Dữ liệu thực hành</h1>
            <p>DetPro</p>
          </div>
        </div>

        {/* Step progress tracker */}
        <div className="dpc-steps">
          <div className="dpc-step">
            <div className={`dpc-step-num ${hasExistingName ? "done" : "active"}`}>
              {hasExistingName ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : "1"}
            </div>
            <div>
              <div className={`dpc-step-label ${hasExistingName ? "done" : "active"}`}>Nhập tên</div>
            </div>
          </div>
          <div className="dpc-step-arrow">›</div>
          <div className="dpc-step">
            <div className={`dpc-step-num ${!hasExistingName ? "idle" : "active"}`}>2</div>
            <div>
              <div className={`dpc-step-label ${!hasExistingName ? "idle" : "active"}`}>Lấy dữ liệu</div>
            </div>
          </div>
          <div className="dpc-step-arrow">›</div>
          <div className="dpc-step">
            <div className="dpc-step-num idle">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div>
              <div className="dpc-step-label idle">Thực hành</div>
            </div>
          </div>
        </div>

        <div className="dpc-layout-wrap">
          {/* ── LEFT: Hero action card ── */}
          <div>
            {needsName ? (
              /* ── Step 1: Nhập tên ── */
              <div className="dpc-hero step-name">
                <div className="dpc-hero-badge name">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Bước 1 — cần làm ngay
                </div>
                <p className="dpc-hero-title">Nhập tên của bạn</p>
                <p className="dpc-hero-sub">Tên dùng để lưu tiến độ thực hành (tối đa 8 ký tự)</p>
                <div className="dpc-input-wrap">
                  <input type="text" value={userName} onChange={handleNameChange}
                    placeholder="Gõ tên vào đây..." maxLength={8}
                    className="dpc-main-input"
                    onKeyPress={(e) => { if (e.key === "Enter") saveUserName(); }}
                    autoFocus/>
                  <span className="dpc-char-count">{userName.length}/8</span>
                </div>
                <button className="dpc-btn-save" onClick={saveUserName}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Lưu tên &amp; tiếp tục
                </button>
              </div>
            ) : (
              /* ── Step 2: Lấy dữ liệu ── */
              <div className={`dpc-hero step-fetch${fetchBlocked ? " is-blocked" : ""}`}>

                {/* Badge — đổi màu khi bị block */}
                <div className={`dpc-hero-badge ${fetchBlocked ? "blocked" : "fetch"}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {fetchBlocked === "inapp"
                    ? "Cần mở trình duyệt web"
                    : fetchBlocked === "mic"
                      ? "Cần bật micro trước"
                      : "Bước 2 — cần làm ngay"}
                </div>

                <p className="dpc-hero-title">
                  {fetchBlocked === "inapp"
                    ? "Mở bằng trình duyệt web"
                    : fetchBlocked === "mic"
                      ? "Bật micro để tiếp tục"
                      : "Lấy dữ liệu thực hành"}
                </p>
                <p className="dpc-hero-sub">
                  {fetchBlocked === "inapp"
                    ? "Trình duyệt trong ứng dụng không hỗ trợ tính năng cần thiết"
                    : fetchBlocked === "mic"
                      ? "Micro đang bị chặn — làm theo hướng dẫn bên dưới"
                      : "Tải nội dung mới nhất về máy để bắt đầu"}
                </p>

                {/* Tên đã lưu — luôn hiển thị */}
                <div className="dpc-name-confirmed">
                  <div className="avatar">{userName.charAt(0)}</div>
                  <div className="info">
                    <small>Tên đã lưu</small>
                    <strong>{userName}</strong>
                  </div>
                  <button className="dpc-btn-edit-small" onClick={handleEditName}>Đổi tên</button>
                </div>

                {/* ── Blocker: In-App Browser ── */}
                {fetchBlocked === "inapp" && (
                  <InAppBlocker browserType={inAppBrowserType}/>
                )}

                {/* ── Blocker: Mic bị chặn ── */}
                {fetchBlocked === "mic" && (
                  <MicDeniedBlocker onMicGranted={() => setMicState("granted")}/>
                )}

                {/* ── Nút fetch — chỉ hiện khi không bị block ── */}
                {!fetchBlocked && (
                  <button
                    className={`dpc-btn-fetch ${startToGetData ? "loading" : ""}`}
                    onClick={handleFetchTitle}
                    disabled={startToGetData}
                  >
                    {startToGetData ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ animation: "spin 0.8s linear infinite" }}>
                          <polyline points="23 4 23 10 17 10"/>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        Đang lấy dữ liệu...
                      </>
                    ) : (
                      <>
                        <span>Lấy dữ liệu ngay</span>
                        <div className="dpc-btn-fetch-arrow">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Secondary cards ── */}
          <div className="dpc-secondary">
            {/* Navigate card */}
            <div className="dpc-card-sm">
              <p className="dpc-card-sm-title">Trang thực hành</p>
              <img
                src="/detpro-icon.svg"
                className={`dpc-logo-sm ${hasExistingName ? "active" : "dimmed"}`}
                onClick={() => {
                  if (hasExistingName) {
                    navigate(
                      "/learninghub/" + (roomCode || "DEMO123") +
                      "?ls=" + (currentIndex || 0) +
                      "&&Fid=div_01_content_table_to_practice"
                    );
                  } else {
                    alert("Vui lòng nhập tên trước khi tiếp tục!");
                  }
                }}
                alt="DetPro"
              />
              <button
                className={`dpc-nav-sm ${hasExistingName ? "" : "dimmed"}`}
                onClick={() => {
                  if (hasExistingName) {
                    navigate(
                      "/learninghub/" + (roomCode || "DEMO123") +
                      "?ls=" + (currentIndex || 0) +
                      "&&Fid=div_01_content_table_to_practice"
                    );
                  }
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Về trang chủ
              </button>
            </div>

            {/* Guide card */}
            <div className="dpc-card-sm">
              <p className="dpc-card-sm-title">Hướng dẫn</p>
              <ul className="dpc-guide-mini">
                {needsName ? (
                  <>
                    <li><span className="dpc-guide-dot b">1</span>Nhập tên &amp; bấm <strong>Lưu tên</strong></li>
                    <li><span className="dpc-guide-dot g">2</span>Bấm <strong>Lấy dữ liệu</strong> để tải nội dung</li>
                    <li><span className="dpc-guide-dot o">3</span>Vào trang thực hành để học</li>
                  </>
                ) : (
                  <>
                    <li><span className="dpc-guide-dot g">✓</span>Tên đã lưu — <strong>bấm Lấy dữ liệu</strong></li>
                    <li><span className="dpc-guide-dot b">→</span>Sau đó vào trang thực hành</li>
                    <li><span className="dpc-guide-dot o">i</span>Đổi tên nếu cần bằng nút nhỏ</li>
                  </>
                )}
              </ul>
            </div>

            {/* Mic permission card — sidebar, nhẹ hơn, không block */}
            <MicPermissionCard
              micState={micState}
              onMicStateChange={setMicState}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DataPracticeComponent;