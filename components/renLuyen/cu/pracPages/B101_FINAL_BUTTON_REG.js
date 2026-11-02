"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React from "react";

const RegButton = ({ setGetSTTDictaphone }) => {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      id="RegButton"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 24px",
        fontSize: "17px",
        fontWeight: 700,
        color: "#fff",
        background: isPressed
          ? "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)"
          : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        transform: isPressed ? "scale(0.95)" : "scale(1)",
        boxShadow: isPressed
          ? "0 2px 6px rgba(220,38,38,0.3)"
          : "0 4px 14px rgba(220,38,38,0.4)",
        touchAction: "manipulation",
        minHeight: "52px",
        minWidth: "140px",
      }}
      onMouseEnter={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={() => setGetSTTDictaphone(true)}
    >
      <i className="bi bi-mic-fill" style={{ fontSize: "20px" }} />
      Bắt đầu nói
    </button>
  );
};

export default RegButton;
