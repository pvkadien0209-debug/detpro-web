"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React from "react";

// Function to check if the element is an image URL
const isImageUrl = (url) => {
  return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(url);
};

const TableTB = ({ data, addElementIfNotExist, color, PushAW }) => {
  try {
    const ColorP =
      color !== undefined ? "2px solid " + color : "1px solid #ccc";

    const containerStyle = {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      cursor: "pointer",
      marginBottom: "15px",
    };

    const textStyle = (element) => ({
      padding: "10px",
      border: PushAW.includes(element) ? "5px solid blue" : ColorP,
      borderRadius: "4px",
      backgroundColor: "#f9f9f9",
      maxWidth: "120px",
      textAlign: "center",
    });

    const imageStyle = (element) => ({
      maxWidth: "120px",
      maxHeight: "120px",
      objectFit: "cover",
      borderRadius: "4px",
      border: PushAW.includes(element) ? "5px solid blue" : "1px solid #ccc",
    });

    return (
      <div style={containerStyle}>
        {data.map((element, index) => (
          <div
            key={index}
            onClick={() => {
              addElementIfNotExist(element);
            }}
          >
            {isImageUrl(element) ? (
              <img
                src={element}
                alt={`element-${index}`}
                style={imageStyle(element)}
              />
            ) : (
              <div style={textStyle(element)}>{element}</div>
            )}
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return null;
  }
};

export default TableTB;
