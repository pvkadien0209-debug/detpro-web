"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import React, { useState, useEffect } from "react";

const CountdownTimer = ({ setSTT, STT, TIME, setScore }) => {
  const [timeLeft, setTimeLeft] = useState(TIME); // 120 seconds countdown

  useEffect(() => {
    setTimeout(() => {
      const div_get_id = document.getElementById("counterTime");
      div_get_id.style.opacity = "1";
    }, 500);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      // Cleanup interval on component unmount
      return () => clearInterval(timerId);
    } else if (timeLeft === 0) {
      const div_get_id = document.getElementById("counterTime");
      div_get_id.style.opacity = 0; // Làm mờ nút dần
      try {
        setScore((S) => S - 1);
      } catch (error) {}
      setSTT(STT);
    }
  }, [timeLeft]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div id="counterTime" style={styles.container}>
      <h1 style={styles.timer}>{formatTime(timeLeft)}</h1>
    </div>
  );
};

// Styles for the timer component
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "10vh",
    backgroundColor: "#f0f0f0",
    opacity: "0",
    transition: "height 2s ease, opacity 1s ease",
    borderRadius: "15px",
    border: "1px solid black",
  },
  timer: {
    fontSize: "48px",
    fontWeight: "bold",
    margin: "0",
  },
  message: {
    fontSize: "24px",
    color: "red",
  },
};

export default CountdownTimer;
