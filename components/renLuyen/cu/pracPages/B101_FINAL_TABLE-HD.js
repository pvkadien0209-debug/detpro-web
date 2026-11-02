"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import { useEffect, useState, useRef, useCallback } from "react";
// ── Theme presets ────────────────────────────────────────────────────
const THEME_PRESETS = {
  light: {
    name: "Sáng",
    bg: "#ffffff",
    surface: "#f8fafc",
    border: "#d0d5dd",
    text: "#1e293b",
    textMuted: "#64748b",
    headerBg: "#f1f5f9",
    rowAlt: "#fafbfc",
    answerBg: "#eff6ff",
    answerBorder: "#2563eb",
    selectedBg: "#dcfce7",
    selectedBorder: "#16a34a",
    selectedText: "#14532d",
    accent: "#2563eb",
  },
  dark: {
    name: "Tối",
    bg: "#0f172a",
    surface: "#1e293b",
    border: "#334155",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    headerBg: "#1e293b",
    rowAlt: "#162032",
    answerBg: "#1e3a5f",
    answerBorder: "#3b82f6",
    selectedBg: "#14391f",
    selectedBorder: "#22c55e",
    selectedText: "#86efac",
    accent: "#3b82f6",
  },
};
const STORAGE_KEY = "tableHD_settings_v1";
const DEFAULT_SETTINGS = {
  fontSize: 15,
  themeMode: "light", // "light" | "dark" | "custom"
  customBg: "#ffffff",
  customText: "#1e293b",
  density: "compact", // "compact" | "comfortable"
};
// Marker dùng để đánh dấu 1 row cần merge toàn bộ cột thành 1 cell
const MERGE_MARKER = "[MERGE]";
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}
function TableHD({ data, data_TB, HINT, fnOnclick, PushAW = [] }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showAnswersPopup, setShowAnswersPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const containerRef = useRef(null);
  // Load persisted settings once on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);
  // Persist whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .no-copy-table * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      .thd-fade-in {
        animation: thd-fade-in 0.12s ease-out;
      }
      @keyframes thd-fade-in {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .thd-row:hover td {
        filter: brightness(0.97);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const closeAllPopups = useCallback(() => {
    setShowAnswersPopup(false);
    setShowSettingsPopup(false);
  }, []);
  try {
    // ── Resolve active theme colors ─────────────────────────────────
    const theme =
      settings.themeMode === "dark"
        ? THEME_PRESETS.dark
        : settings.themeMode === "light"
          ? THEME_PRESETS.light
          : {
              ...THEME_PRESETS.light,
              bg: settings.customBg,
              text: settings.customText,
              surface: settings.customBg,
            };
    const isCompact = settings.density === "compact";
    const cellPad = isCompact ? "4px 6px" : "8px 10px";
    const colorMapping = {
      X: "green",
      XX: "dodgerblue",
      [HINT + "#hint"]: "red",
      MM: "purple",
      XXX: "black",
    };
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    // Flatten data_TB to strings for quick lookup
    const data_TB_flat = data_TB.flatMap((row) =>
      row.map((item) => String(item)),
    );
    const answeredCount = PushAW.length;
    return (
      <div
        ref={containerRef}
        style={{
          backgroundColor: theme.bg,
          borderRadius: "10px",
          padding: "6px 0 10px",
        }}
      >
        {/* ── Top control bar: answer badge (left) + settings (right) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 4%",
            marginBottom: "8px",
            gap: "8px",
          }}
        >
          <button
            onClick={() => setShowAnswersPopup(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "20px",
              border: `1px solid ${theme.answerBorder}`,
              backgroundColor: theme.answerBg,
              color: theme.accent,
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              lineHeight: 1.4,
            }}
            title="Xem chi tiết đáp án đã chọn"
          >
            <i className="bi bi-check2-circle" />
            Đã chọn ({answeredCount})
          </button>
          <button
            onClick={() => setShowSettingsPopup(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "20px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.textMuted,
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              lineHeight: 1.4,
            }}
            title="Cài đặt hiển thị"
          >
            <i className="bi bi-gear" />
            Cài đặt | Mẹo Ctrl-F để tìm nhanh
          </button>
        </div>
        {/* ── Main data table ──────────────────────────────────────── */}
        <table
          className="table no-copy-table"
          style={{
            textAlign: "left",
            whiteSpace: "pre-line",
            margin: "0 4%",
            width: "92%",
            cursor: "pointer",
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: `${settings.fontSize}px`,
            color: theme.text,
            backgroundColor: theme.bg,
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            userSelect: "none",
          }}
          onCopy={(e) => e.preventDefault()}
        >
          <tbody>
            {data.map((row, rowIndex) => {
              // ── Row có [MERGE] ở cell đầu tiên: gộp toàn bộ cột thành 1 cell ──
              const firstHeader = headers[0];
              const isMergeRow =
                firstHeader !== undefined &&
                String(row[firstHeader] ?? "").trim() === MERGE_MARKER;
              if (isMergeRow) {
                const mergedText = headers
                  .slice(1)
                  .map((h) => row[h])
                  .filter((v) => v !== undefined && v !== null && v !== "")
                  .join(" ");
                return (
                  <tr
                    key={rowIndex}
                    className="thd-row"
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 0 ? theme.bg : theme.rowAlt,
                    }}
                  >
                    <td
                      colSpan={headers.length}
                      style={{
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                        userSelect: "none",
                        padding: cellPad,
                        borderBottom: `1px solid ${theme.border}`,
                      }}
                    >
                      {mergedText}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={rowIndex}
                  className="thd-row"
                  style={{
                    backgroundColor:
                      rowIndex % 2 === 0 ? theme.bg : theme.rowAlt,
                  }}
                >
                  {headers.map((header, colIndex) => {
                    const cellValue = String(row[header] || "");
                    const isAnswerCell = data_TB_flat.includes(cellValue);
                    const isSelected =
                      isAnswerCell && PushAW.includes(cellValue);
                    const hasAsterisk = cellValue.includes("(*)");
                    const hasQuestion = cellValue.includes("?");
                    return (
                      <td
                        key={colIndex}
                        style={{
                          fontWeight: hasQuestion ? "bold" : "initial",
                          fontSize: hasAsterisk ? "larger" : undefined,
                          color: hasAsterisk ? theme.accent : "inherit",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                          userSelect: "none",
                          padding: cellPad,
                          borderBottom: `1px solid ${theme.border}`,
                        }}
                        onClick={() => {
                          if (isAnswerCell) {
                            fnOnclick(cellValue, "submit");
                          } else {
                            fnOnclick(row[header], "none");
                          }
                        }}
                      >
                        {colorMapping[row[header]] ? (
                          <span
                            style={{
                              padding: "0 25px",
                              backgroundColor: colorMapping[row[header]],
                              borderRadius: "5px",
                            }}
                          />
                        ) : isImageUrl(row[header]) ? (
                          <img
                            src={row[header]}
                            alt={`element-${rowIndex}`}
                            style={imageStyle}
                          />
                        ) : isSelected ? (
                          // ── SELECTED STATE (compact inline) ──────
                          <span
                            style={{
                              ...selectedCellStyle(theme),
                              padding: isCompact ? "2px 6px" : "4px 8px",
                            }}
                          >
                            <i
                              className="bi bi-check-circle-fill"
                              style={{
                                color: theme.selectedBorder,
                                marginRight: 4,
                                fontSize: "0.9em",
                              }}
                            />
                            {row[header]}
                          </span>
                        ) : isAnswerCell ? (
                          // ── AVAILABLE ANSWER STATE (compact inline) ──
                          <span
                            style={{
                              ...answerCellStyle(theme),
                              padding: isCompact ? "2px 6px" : "4px 8px",
                            }}
                          >
                            <i
                              className="bi bi-hand-index-thumb"
                              style={{
                                color: theme.answerBorder,
                                marginRight: 4,
                                fontSize: "0.9em",
                              }}
                            />
                            {row[header]}
                          </span>
                        ) : (
                          // ── NORMAL CELL ───────────────────────────
                          <span>{row[header]}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* ── Popup: Answers detail ───────────────────────────────── */}
        {showAnswersPopup && (
          <PopupOverlay
            onClose={() => setShowAnswersPopup(false)}
            theme={theme}
          >
            <PopupHeader
              icon="bi-check2-circle"
              title={`Đáp án đã chọn (${answeredCount})`}
              theme={theme}
              onClose={() => setShowAnswersPopup(false)}
            />
            <div
              style={{
                padding: "12px 16px",
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              {answeredCount === 0 ? (
                <div
                  style={{
                    color: theme.textMuted,
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  Chưa chọn đáp án nào.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {PushAW.map((ans, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        backgroundColor: theme.selectedBg,
                        border: `1px solid ${theme.selectedBorder}`,
                        color: theme.selectedText,
                        fontSize: "14px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          opacity: 0.6,
                          minWidth: "20px",
                        }}
                      >
                        {i + 1}.
                      </span>
                      <i className="bi bi-check-circle-fill" />
                      <span>{ans}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopupOverlay>
        )}
        {/* ── Popup: Settings ─────────────────────────────────────── */}
        {showSettingsPopup && (
          <PopupOverlay
            onClose={() => setShowSettingsPopup(false)}
            theme={theme}
          >
            <PopupHeader
              icon="bi-gear"
              title="Cài đặt hiển thị"
              theme={theme}
              onClose={() => setShowSettingsPopup(false)}
            />
            <div
              style={{
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Font size */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: theme.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Kích thước chữ: {settings.fontSize}px
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <i
                    className="bi bi-fonts"
                    style={{ color: theme.textMuted, fontSize: "13px" }}
                  />
                  <input
                    type="range"
                    min={12}
                    max={22}
                    step={1}
                    value={settings.fontSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        fontSize: Number(e.target.value),
                      }))
                    }
                    style={{ flex: 1, accentColor: theme.accent }}
                  />
                  <i
                    className="bi bi-fonts"
                    style={{ color: theme.textMuted, fontSize: "20px" }}
                  />
                </div>
              </div>
              {/* Density */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: theme.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Mật độ hiển thị
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { key: "compact", label: "Gọn (nhiều dữ liệu)" },
                    { key: "comfortable", label: "Thoáng" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setSettings((s) => ({ ...s, density: opt.key }))
                      }
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: `1.5px solid ${
                          settings.density === opt.key
                            ? theme.accent
                            : theme.border
                        }`,
                        backgroundColor:
                          settings.density === opt.key
                            ? theme.answerBg
                            : "transparent",
                        color:
                          settings.density === opt.key
                            ? theme.accent
                            : theme.text,
                        fontSize: "13px",
                        fontWeight: settings.density === opt.key ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Theme mode */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: theme.textMuted,
                    marginBottom: "8px",
                  }}
                >
                  Giao diện
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { key: "light", label: "Sáng", icon: "bi-sun" },
                    { key: "dark", label: "Tối", icon: "bi-moon-stars" },
                    { key: "custom", label: "Tùy chỉnh", icon: "bi-palette" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setSettings((s) => ({ ...s, themeMode: opt.key }))
                      }
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: `1.5px solid ${
                          settings.themeMode === opt.key
                            ? theme.accent
                            : theme.border
                        }`,
                        backgroundColor:
                          settings.themeMode === opt.key
                            ? theme.answerBg
                            : "transparent",
                        color:
                          settings.themeMode === opt.key
                            ? theme.accent
                            : theme.text,
                        fontSize: "13px",
                        fontWeight: settings.themeMode === opt.key ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      <i className={opt.icon} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Custom color pickers - only when custom mode active */}
              {settings.themeMode === "custom" && (
                <div
                  className="thd-fade-in"
                  style={{ display: "flex", gap: "16px" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: theme.textMuted,
                        marginBottom: "8px",
                      }}
                    >
                      Màu nền
                    </label>
                    <input
                      type="color"
                      value={settings.customBg}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, customBg: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.border}`,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: theme.textMuted,
                        marginBottom: "8px",
                      }}
                    >
                      Màu chữ
                    </label>
                    <input
                      type="color"
                      value={settings.customText}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          customText: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "36px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.border}`,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              )}
              {/* Reset */}
              <button
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: "transparent",
                  color: theme.textMuted,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <i
                  className="bi bi-arrow-counterclockwise"
                  style={{ marginRight: 4 }}
                />
                Khôi phục mặc định
              </button>
            </div>
          </PopupOverlay>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error rendering TableHD:", error);
    return null;
  }
}
export default TableHD;
// ── Popup primitives ────────────────────────────────────────────────
function PopupOverlay({ children, onClose, theme }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="thd-fade-in"
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          borderRadius: "12px",
          width: "min(420px, 100%)",
          maxHeight: "80vh",
          overflow: "hidden",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          border: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
function PopupHeader({ icon, title, theme, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.headerBg ?? theme.surface,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 700,
          fontSize: "15px",
        }}
      >
        <i className={icon} />
        {title}
      </div>
      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          color: theme.textMuted,
          fontSize: "18px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "2px 4px",
        }}
        aria-label="Đóng"
      >
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}
// ── Helpers ──────────────────────────────────────────────────────────
const isImageUrl = (url) => {
  if (typeof url !== "string") return false;
  return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
};
const imageStyle = {
  maxWidth: "min(220px, 45vw)",
  maxHeight: "220px",
  objectFit: "cover",
  borderRadius: "6px",
  border: "2px solid #16a34a",
};
// Available-to-click answer: compact inline pill
const answerCellStyle = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "5px",
  backgroundColor: theme.answerBg,
  border: `1px solid ${theme.answerBorder}`,
  color: theme.text,
});
// Already selected answer: compact inline pill
const selectedCellStyle = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "5px",
  backgroundColor: theme.selectedBg,
  border: `1px solid ${theme.selectedBorder}`,
  color: theme.selectedText,
  fontWeight: 600,
});
