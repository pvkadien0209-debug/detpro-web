"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React from "react";

const StartButton = ({ setINDEXtoPlay, INDEXtoPlay, setStartSTT, Score }) => {
  const outerContainerStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "20vh",
    backgroundColor: "#f0f0f0", // Light grey background for better visibility
  };

  const buttonStyle = {
    padding: "20px 40px",
    fontSize: "24px",
    color: "white",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "center",
    transition: "background-color 0.3s, transform 0.3s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#45a049",
    transform: "scale(1.05)",
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div style={outerContainerStyle}>
      <div>
        <h1>SCORE: {Score}</h1>
      </div>
      {/* <div
        style={
          isHovered ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          setINDEXtoPlay((D) => D + 1);
          setStartSTT(false);
        }}
      >
        {INDEXtoPlay < 0 ? "START" : "NEXT"}
      </div> */}
    </div>
  );
};

export default StartButton;
