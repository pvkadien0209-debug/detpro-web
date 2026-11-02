"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import React, { useEffect, useState } from "react";
import { compareTwoStrings } from "string-similarity";
import { socket } from "@/components/renLuyen/cu/appShim";
import BangUEOAI from "@/components/renLuyen/cu/A1_BangUEOAI";
/* ════════════════════════════════════════════════════════════════════
   HÀM CHUẨN HÓA TEXT
════════════════════════════════════════════════════════════════════ */
const normalizeText = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[.?!,]/g, "")
    .replace(/\s+/g, " ");

/* ════════════════════════════════════════════════════════════════════
   TÌM TOP MATCH TRONG DATA CŨ
   - Giữ nguyên logic cũ:
   - Tìm theo IPA-01
   - Không lọc theo ngưỡng điểm
   - Lấy top N
════════════════════════════════════════════════════════════════════ */
export function getTopMatches(inputString, phrasesArray, topN = 3) {
  if (
    !phrasesArray ||
    !Array.isArray(phrasesArray) ||
    phrasesArray.length === 0 ||
    !inputString ||
    !inputString.trim()
  ) {
    return [];
  }

  const normalizedInput = normalizeText(inputString);

  const scored = phrasesArray.map((item) => ({
    item,
    score: compareTwoStrings(normalizedInput, normalizeText(item?.["IPA-01"])),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

/* ════════════════════════════════════════════════════════════════════
   TÌM TOP MATCH TRONG DATATABLE
   ---------------------------------------------------------------
   dataTable mẫu:

   [
     {
       "HD-01": "Câu hỏi",
       "HD-02": "Mục đích",
       "HD-03": "My friend",
       "HD-04": "My teacher",
       "HD-05": "My father",
       "HD-06": "My boss"
     },
     ...
   ]

   Có thể có:
   HD-01 ... HD-06
   hoặc HD-01 ... HD-20
   hoặc ít hơn.

   Logic:
   - Duyệt toàn bộ cell của từng row.
   - Tìm cell giống searchQuery nhất.
   - Lấy score cao nhất của row.
   - Hiển thị nguyên row.
════════════════════════════════════════════════════════════════════ */
export function getTopTableMatches(inputString, dataTable, topN = 5) {
  if (
    !dataTable ||
    !Array.isArray(dataTable) ||
    dataTable.length === 0 ||
    !inputString ||
    !inputString.trim()
  ) {
    return [];
  }

  const normalizedInput = normalizeText(inputString);

  const scoredRows = dataTable
    .map((row, rowIndex) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const cells = Object.entries(row)
        .filter(([key, value]) => {
          // Chỉ lấy các cột HD-*
          return (
            /^HD-\d+$/i.test(key) &&
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          );
        })
        .map(([key, value]) => {
          const text = String(value);

          return {
            key,
            value: text,
            score: compareTwoStrings(normalizedInput, normalizeText(text)),
          };
        });

      if (!cells.length) {
        return null;
      }

      // Cell gần giống nhất trong row
      cells.sort((a, b) => b.score - a.score);

      const bestCell = cells[0];

      return {
        row,
        rowIndex,
        cells,
        bestCell,
        score: bestCell.score,
      };
    })
    .filter(Boolean);

  scoredRows.sort((a, b) => {
    // Nếu bằng điểm thì giữ thứ tự ban đầu
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.rowIndex - b.rowIndex;
  });

  return scoredRows.slice(0, topN);
}

/* ════════════════════════════════════════════════════════════════════
   HÀM THÊM TEXT VÀO TEXTAREA
════════════════════════════════════════════════════════════════════ */
function appendToTextarea(text) {
  if (!text) return;

  const textarea = document.getElementById("clearClassForTable");

  if (!textarea) return;

  const current = textarea.value || "";

  textarea.value = current ? current + " " + text : text;

  textarea.focus();

  textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

  // Kích hoạt input event nếu textarea được quản lý bởi React bên ngoài
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/* ════════════════════════════════════════════════════════════════════
   XÓA TEXTAREA
════════════════════════════════════════════════════════════════════ */
function clearTextareaById(elementId) {
  const el = document.getElementById(elementId);

  if (el) {
    el.value = "";
    el.focus();

    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/* ════════════════════════════════════════════════════════════════════
   TABLE MATCH RESULTS
   ---------------------------------------------------------------
   Hiển thị nguyên row của dataTable.

   Ví dụ tìm "teacher":

   ┌────────────┬────────────┬──────────────┬────────────┐
   │ Câu hỏi    │ Mục đích   │ My friend    │ My teacher │
   └────────────┴────────────┴──────────────┴────────────┘
                                             [+]
   
   Mỗi cell có nút + để thêm riêng cell đó vào textarea.
════════════════════════════════════════════════════════════════════ */
function TableMatchResults({ searchQuery, dataTable }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const topMatches = getTopTableMatches(searchQuery, dataTable, 5);

    setMatches(topMatches);
  }, [searchQuery, dataTable]);

  if (!searchQuery || !searchQuery.trim()) {
    return null;
  }

  if (!matches.length) {
    return null;
  }

  return (
    <div className="dtph-table-search-wrap">
      <div className="dtph-table-search-title">
        <i className="bi bi-table me-1"></i>
        Kết quả từ bảng dữ liệu
      </div>

      <div className="dtph-table-scroll">
        {matches.map((match, rowIndex) => {
          const pct = Math.round(match.score * 100);

          return (
            <div className="dtph-table-result-row" key={match.rowIndex}>
              {/* Số thứ tự + điểm */}
              <div className="dtph-table-result-meta">
                <span className="dtph-table-rank">#{rowIndex + 1}</span>

                <span className="dtph-table-score">{pct}%</span>
              </div>

              {/* Nguyên row */}
              <div className="dtph-table-cells">
                {match.cells.map((cell) => {
                  const isBest = cell.key === match.bestCell.key;

                  return (
                    <div
                      className={`dtph-table-cell ${
                        isBest ? "dtph-table-cell-best" : ""
                      }`}
                      key={cell.key}
                      title={`${cell.key}: ${cell.value}`}
                    >
                      <span className="dtph-table-cell-key">{cell.key}</span>

                      <span className="dtph-table-cell-value">
                        {cell.value}
                      </span>

                      <button
                        type="button"
                        className="dtph-table-plus-btn"
                        title={`Thêm "${cell.value}" vào ô phiên âm`}
                        onClick={() => appendToTextarea(cell.value)}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MATCH RESULTS — DATA CŨ
════════════════════════════════════════════════════════════════════ */
function MatchResults({ searchQuery, data }) {
  const [matches, setMatches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const top3 = getTopMatches(searchQuery, data, 3);

    setMatches(top3);
    setSelectedIndex(0);
  }, [searchQuery, data]);

  const selected = matches[selectedIndex];

  useEffect(() => {
    if (!selected) return;

    const ipa02 = selected.item["IPA-02"] || "";
    const ipa03 = selected.item["IPA-03"] || "";
    const ipa04 = selected.item["IPA-04"] || "";

    const decodeElement = document.getElementById("DeCode");

    if (decodeElement) {
      decodeElement.textContent = ipa02 + "zzz" + ipa03 + "zzz" + ipa04;
    }
  }, [selected]);

  if (!matches.length) {
    return (
      <p className="dtph-info-empty">
        Nhập câu cần tra cứu và bấm "Tìm" để hiển thị kết quả…
      </p>
    );
  }

  return (
    <div className="dtph-match-wrap">
      {/* ══ DANH SÁCH 3 ĐÁP ÁN DATA CŨ ══ */}
      <div className="dtph-match-section-title">
        <i className="bi bi-search me-1"></i>
        Kết quả phiên âm
      </div>

      <div className="dtph-match-list">
        {matches.map((m, idx) => {
          const ipa01 = m.item["IPA-01"] || "(trống)";
          const pct = Math.round(m.score * 100);

          return (
            <button
              key={idx}
              type="button"
              className={`dtph-match-btn ${
                idx === selectedIndex ? "dtph-match-btn-active" : ""
              }`}
              onClick={() => setSelectedIndex(idx)}
              title={ipa01}
            >
              <span className="dtph-match-rank">#{idx + 1}</span>

              <span className="dtph-match-text">{ipa01}</span>

              <span className="dtph-match-score">{pct}%</span>
            </button>
          );
        })}
      </div>

      {/* ══ THẺ CHI TIẾT DATA CŨ ══ */}
      {selected && (
        <div className="reference-card py-2 px-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h6 className="text-info mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Thông tin tham khảo (đáp án #{selectedIndex + 1}):
            </h6>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3">
            {[
              {
                label: "Câu gốc:",
                value: selected.item["IPA-01"] || "",
                cls: "text-info",
                btnCls: "btn-outline-info",
              },
              {
                label: "Dịch thô:",
                value: selected.item["IPA-02"] || "",
                cls: "text-info",
                btnCls: "btn-outline-info",
              },
              {
                label: "UK:",
                value: selected.item["IPA-03"] || "",
                cls: "text-success",
                btnCls: "btn-outline-success",
              },
              {
                label: "US:",
                value: selected.item["IPA-04"] || "",
                cls: "text-warning",
                btnCls: "btn-outline-warning",
              },
            ].map((f) => (
              <div className="d-flex align-items-center gap-1" key={f.label}>
                <small className={`${f.cls} fw-semibold`}>{f.label}</small>

                <strong style={{ color: "black" }}>{f.value}</strong>

                <button
                  type="button"
                  className={`btn btn-sm ${f.btnCls} py-0 px-1`}
                  title="Dán vào ô phiên âm"
                  onClick={() => appendToTextarea(f.value)}
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   INFO POPUP
════════════════════════════════════════════════════════════════════ */
const BOTTOM_HEIGHT_EXPANDED = 400;
const BOTTOM_HEIGHT_COLLAPSED = 200;

export default function InfoPopup({
  show,
  onClose,
  inputString,
  setInputString,
  searchQuery,
  onSearch,
  data,
  dataTable,
}) {
  const [expanded, setExpanded] = useState(false);

  const bottomHeight = expanded
    ? BOTTOM_HEIGHT_EXPANDED
    : BOTTOM_HEIGHT_COLLAPSED;

  const handleToggleRatio = () => {
    setExpanded((v) => !v);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        .dtph-info-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 110, 90,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 16px;
        }

        .dtph-info-modal {
          background: linear-gradient(180deg, #ffffff, #eef7f3);
          border: 1px solid rgba(148,163,184,0.25);
          border-radius: 18px;
          width: 96vw;
          height: 92vh;
          max-width: 1100px;
          padding: 20px;
          box-shadow: 0 20px 60px rgba(15, 110, 90,0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }

        .dtph-info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-shrink: 0;
        }

        .dtph-info-header h5 {
          color: #0b5747;
          font-weight: 800;
        }

        .dtph-info-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dtph-info-resize-btn {
          background: linear-gradient(135deg, #9fd3c5, #0f6e5a);
          border: none;
          color: #fff;
          height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(15, 110, 90,0.4);
          font-weight: 700;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dtph-info-resize-btn:active {
          transform: scale(0.95);
        }

        .dtph-info-close {
          background: linear-gradient(135deg, #fca5a5, #ef4444);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(239,68,68,0.45);
        }

        .dtph-info-search-row {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
          flex-shrink: 0;
        }

        .dtph-info-search-input {
          flex: 1;
          border-radius: 10px;
          border: 2px solid #9fd3c5;
          padding: 10px 14px;
          font-size: 1rem;
        }

        .dtph-info-search-input:focus {
          outline: none;
          border-color: #0f6e5a;
          box-shadow: 0 0 0 3px rgba(15, 110, 90,0.2);
        }

        .dtph-info-search-btn {
          border: none;
          border-radius: 10px;
          padding: 0 22px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          box-shadow: 0 2px 12px rgba(16,185,129,0.5);
          cursor: pointer;
        }

        .dtph-info-search-btn:active {
          transform: scale(0.96);
        }

        /* ═══════════════════════════════════════════════════════════
           KHỐI CHIA TRÊN / DƯỚI
        ═══════════════════════════════════════════════════════════ */

        .dtph-info-split {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dtph-info-top {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        .dtph-info-hr {
          flex-shrink: 0;
          border: none;
          border-top: 2px dashed #cfe9e1;
          margin: 8px 0;
        }

        .dtph-info-bottom {
          flex-shrink: 0;
          overflow-y: auto;
          transition: height 0.3s ease-in-out;
        }

        .dtph-info-result-area {
          height: 100%;
          overflow-y: auto;
          padding-bottom: 10px;
        }

        .dtph-info-empty {
          color: #64748b;
          font-style: italic;
          text-align: center;
          padding: 24px 0;
        }

        /* ═══════════════════════════════════════════════════════════
           DATA CŨ
        ═══════════════════════════════════════════════════════════ */

        .dtph-match-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dtph-match-section-title {
          font-weight: 800;
          color: #0b5747;
          margin-bottom: 2px;
        }

        .dtph-match-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dtph-match-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
          border: 2px solid #cfe9e1;
          background: #eef7f3;
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 0.85rem;
          transition:
            border-color 0.15s,
            background 0.15s;
        }

        .dtph-match-btn:active {
          transform: scale(0.97);
        }

        .dtph-match-btn-active {
          border-color: #0f6e5a;
          background: #eef7f3;
          box-shadow: 0 0 0 2px rgba(15, 110, 90,0.25);
        }

        .dtph-match-rank {
          font-weight: 800;
          color: #0b5747;
          flex-shrink: 0;
        }

        .dtph-match-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 320px;
          color: #0b5747;
          font-weight: 600;
        }

        .dtph-match-score {
          flex-shrink: 0;
          font-weight: 700;
          color: #0d9488;
          background: rgba(13,148,136,0.12);
          border-radius: 6px;
          padding: 1px 6px;
          font-size: 0.75rem;
        }

        /* ═══════════════════════════════════════════════════════════
           DATATABLE SEARCH
        ═══════════════════════════════════════════════════════════ */

        .dtph-table-search-wrap {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 2px dashed #cfe9e1;
        }

        .dtph-table-search-title {
          color: #3f9a84;
          font-weight: 800;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .dtph-table-scroll {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dtph-table-result-row {
          display: flex;
          align-items: stretch;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #cfe9e1;
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 2px 8px rgba(15, 110, 90,0.08);
        }

        .dtph-table-result-meta {
          width: 52px;
          min-width: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          border-right: 1px solid #cfe9e1;
        }

        .dtph-table-rank {
          font-weight: 800;
          color: #0f6e5a;
          font-size: 0.8rem;
        }

        .dtph-table-score {
          font-weight: 800;
          color: #059669;
          background: #ecfdf5;
          border-radius: 6px;
          padding: 2px 5px;
          font-size: 0.7rem;
        }

        .dtph-table-cells {
          flex: 1;
          min-width: 0;
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(150px, 1fr));
          gap: 5px;
        }

        .dtph-table-cell {
          min-width: 0;
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 28px 5px 7px;
          border: 1px solid #cfe9e1;
          border-radius: 7px;
          background: #eef7f3;
        }

        .dtph-table-cell-best {
          border-color: #9fd3c5;
          background: #eef7f3;
          box-shadow: inset 0 0 0 1px rgba(15, 110, 90,0.12);
        }

        .dtph-table-cell-key {
          flex-shrink: 0;
          font-size: 0.65rem;
          font-weight: 800;
          color: #3f9a84;
          background: #eef7f3;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .dtph-table-cell-value {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #0b5747;
          font-weight: 600;
          font-size: 0.82rem;
        }

        .dtph-table-plus-btn {
          position: absolute;
          right: 3px;
          top: 50%;
          transform: translateY(-50%);
          width: 23px;
          height: 23px;
          border: 1px solid #9fd3c5;
          border-radius: 6px;
          background: #fff;
          color: #3f9a84;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition:
            background 0.15s,
            color 0.15s,
            transform 0.15s;
        }

        .dtph-table-plus-btn:hover {
          background: #3f9a84;
          color: #fff;
        }

        .dtph-table-plus-btn:active {
          transform: translateY(-50%) scale(0.9);
        }

        /* ═══════════════════════════════════════════════════════════
           TEXTAREA
        ═══════════════════════════════════════════════════════════ */

        .dtph-info-textarea-wrap {
          background: linear-gradient(180deg, #ecfeff, #cfe9e1);
          border: 2px dashed #0f6e5a;
          border-radius: 16px;
          padding: 14px 16px 16px;
          box-shadow: 0 6px 20px rgba(15, 110, 90,0.18);
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .dtph-info-textarea-label {
          font-weight: 800;
          font-size: 1.05rem;
          color: #0b5747;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.01em;
          flex-shrink: 0;
        }

        .dtph-info-textarea-label::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0f6e5a;
          box-shadow: 0 0 8px rgba(15, 110, 90,0.8);
        }

        #clearClassForTable {
          border: 3px solid #3f9a84;
          border-radius: 12px;
          padding: 16px 18px;
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.5;
          color: #0b5747;
          background: #ffffff;
          flex: 1;
          min-height: 0;
          width: 100%;
          box-shadow: 0 2px 10px rgba(15, 110, 90,0.12) inset;
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
        }

        #clearClassForTable::placeholder {
          color: #9fd3c5;
          font-weight: 600;
          font-style: italic;
        }

        #clearClassForTable:focus {
          outline: none;
          border-color: #0f6e5a;
          box-shadow: 0 0 0 4px rgba(15, 110, 90,0.25);
        }

        /* ═══════════════════════════════════════════════════════════
           IPA
        ═══════════════════════════════════════════════════════════ */

        .dtph-ipa-panel {
          height: 100%;
          overflow-y: auto;
        }

        .ipa-ref-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1.2rem;
          table-layout: fixed;
        }

        .ipa-ref-table td {
          border: 1px solid #dee2e6;
          padding: 1px 2px;
          line-height: 1.1;
          text-align: center;
        }

        .ipa-ref-table .ipa-head td {
          background: #eef7f3;
          font-weight: 600;
          color: #0f6e5a;
        }

        @media (max-width: 768px) {
          .dtph-table-result-row {
            flex-direction: column;
          }

          .dtph-table-result-meta {
            width: 100%;
            min-width: 0;
            flex-direction: row;
            justify-content: flex-start;
            border-right: none;
            border-bottom: 1px solid #cfe9e1;
            padding-bottom: 4px;
          }

          .dtph-table-cells {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dtph-info-overlay">
        <div className="dtph-info-modal">
          {/* ══════════════════════════════════════════════════════════
              HEADER
          ══════════════════════════════════════════════════════════ */}
          <div className="dtph-info-header">
            <h5 className="mb-0">
              <i className="bi bi-search me-2"></i>
              Tra cứu phiên âm tham khảo
            </h5>

            <div className="dtph-info-header-actions">
              <button className="dtph-info-close" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              SEARCH
          ══════════════════════════════════════════════════════════ */}
          <div className="dtph-info-search-row">
            <input
              type="text"
              className="dtph-info-search-input"
              placeholder="Nhập câu cần tra cứu…"
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />

            <button
              type="button"
              className="dtph-info-search-btn"
              onClick={onSearch}
            >
              <i className="bi bi-search me-1"></i>
              Tìm
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════
              KHU KẾT QUẢ
          ══════════════════════════════════════════════════════════ */}
          <div className="dtph-info-split">
            <div className="dtph-info-top">
              <div className="dtph-info-result-area">
                {/* =====================================================
                    1. DATA CŨ
                ===================================================== */}
                <MatchResults searchQuery={searchQuery} data={data} />

                {/* =====================================================
                    2. DATATABLE MỚI
                ===================================================== */}
                <TableMatchResults
                  searchQuery={searchQuery}
                  dataTable={dataTable}
                />
              </div>
            </div>

            <hr className="dtph-info-hr" />

            {/* ═══════════════════════════════════════════════════════
                TEXTAREA + IPA
            ═══════════════════════════════════════════════════════ */}
            <div
              className="dtph-info-bottom"
              style={{
                height: `${bottomHeight}px`,
              }}
            >
              <div className="row g-3 h-100">
                {/* TEXTAREA */}
                <div className="col-12 col-md-8 h-100">
                  <div className="dtph-info-textarea-wrap">
                    <div className="row">
                      <div className="col-2">
                        {" "}
                        <button
                          type="button"
                          className="dtph-info-resize-btn"
                          onClick={handleToggleRatio}
                          title={
                            expanded
                              ? "Thu gọn khu phiên âm"
                              : "Mở rộng khu phiên âm"
                          }
                        >
                          <i
                            className={`bi ${
                              expanded
                                ? "bi-arrows-collapse"
                                : "bi-arrows-expand"
                            }`}
                          ></i>
                        </button>
                      </div>{" "}
                      <div className="col-1">
                        {" "}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info py-0 px-1"
                          title="Xóa"
                          onClick={() =>
                            clearTextareaById("clearClassForTable")
                          }
                        >
                          Xóa
                        </button>
                      </div>{" "}
                      <div className="col-2">
                        {" "}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info py-0 px-1"
                          title="Gửi bài tập"
                          onClick={() => {
                            try {
                              const element =
                                document.getElementById("clearClassForTable");

                              if (!element) {
                                console.warn(
                                  "Không tìm thấy #clearClassForTable",
                                );
                                return;
                              }
                              const timestamp = new Date().toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              );
                              const dataGET = element.value;
                              let getCurrent =
                                localStorage.getItem("groupChat") || "all";
                              socket.emit("messageReg", {
                                text: `BTJSON${JSON.stringify({
                                  type: "gheptu",
                                  data: dataGET,
                                })}`,
                                time: timestamp,
                                type: "text",
                                id: null,
                                group: getCurrent,
                              });
                            } catch (error) {
                              console.error(
                                "Lỗi khi tạo bài tập ghép từ:",
                                error,
                              );
                            }
                          }}
                        >
                          BTGT#1
                        </button>
                      </div>{" "}
                      <div className="col-5">
                        <label className="dtph-info-textarea-label">
                          Phiên âm đã chọn:
                        </label>
                      </div>
                    </div>

                    <textarea
                      className="textarea-practice w-100"
                      id="clearClassForTable"
                      placeholder="Nhập phiên âm tại đây…"
                    ></textarea>
                  </div>
                </div>

                {/* IPA PANEL */}
                <div className="col-12 col-md-4 h-100">
                  <BangUEOAI />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
