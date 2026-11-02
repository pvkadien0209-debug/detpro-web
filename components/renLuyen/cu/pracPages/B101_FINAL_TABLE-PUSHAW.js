"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React from "react";

const isImageUrl = (url) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(url);
};

const TablePushAW = ({ data }) => {
  try {
    return (
      <div style={containerStyle}>
        {data.map((element, index) => (
          <div key={index} style={chipWrapStyle}>
            {isImageUrl(element) ? (
              <img src={element} alt={`aw-${index}`} style={imageStyle} />
            ) : (
              <div style={chipStyle}>
                <span style={checkStyle}>✓</span>
                {element.length > 18 ? element.slice(0, 16) + "…" : element}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return null;
  }
};

export default TablePushAW;

const containerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "4px 0",
};

const chipWrapStyle = {
  display: "inline-flex",
  alignItems: "center",
};

const chipStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "7px 13px",
  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
  color: "#fff",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: 600,
  boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
  whiteSpace: "nowrap",
  maxWidth: "200px",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const checkStyle = {
  fontSize: "12px",
  opacity: 0.9,
};

const imageStyle = {
  width: "56px",
  height: "56px",
  objectFit: "cover",
  borderRadius: "10px",
  border: "2px solid #16a34a",
  boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
};
