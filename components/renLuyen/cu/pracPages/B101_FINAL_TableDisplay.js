"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React, { useState } from "react";

const TableDisplay = ({ OnTable, DataAllSets, setOnTable }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  try {
    if (OnTable === null) {
      return (
        <div
          style={{
            border: "1px solid green",
            borderRadius: "5px",
            margin: "5%",
            padding: "1%",
            cursor: "pointer",
            height: "250px",
            overflow: "auto",
          }}
        >
          {DataAllSets.map((e, i) => (
            <button
              className="btn btn-outline-primary"
              key={i}
              onClick={() => setOnTable(i)}
              style={{ margin: "10px" }}
              // onMouseEnter={() => setHoverIndex(i)}
              // onMouseLeave={() => setHoverIndex(null)}
              // style={{
              //   backgroundColor: hoverIndex === i ? "#f0f0f0" : "transparent",
              //   border:
              //     hoverIndex === i
              //       ? "1px solid #007bff"
              //       : "1px solid transparent",
              //   transition:
              //     "background-color 0.3s ease, border-color 0.3s ease",
              //   cursor: "pointer",
              // }}
            >
              {/* <td style={{ border: "1px solid #ddd", padding: "8px" }}> */}
              [TB-
              {i + 1}]{/* </td> */}
              {/* <td
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  color: "blue",
                }}
              > */}
              <b> {e.HDTB.IF.IFname}</b>
              {/* </td> */}
            </button>
          ))}

          {/* <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  No.
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Table Name
                </th>
              </tr>
            </thead>
            <tbody>
              {DataAllSets.map((e, i) => (
                <tr
                  key={i}
                  onClick={() => setOnTable(i)}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    backgroundColor:
                      hoverIndex === i ? "#f0f0f0" : "transparent",
                    border:
                      hoverIndex === i
                        ? "1px solid #007bff"
                        : "1px solid transparent",
                    transition:
                      "background-color 0.3s ease, border-color 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {i + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      color: "blue",
                    }}
                  >
                    <b>{e.HDTB.IF.IFname}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table> */}
        </div>
      );
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error rendering TableDisplay:", error);
    return null;
  }
};

export default TableDisplay;
