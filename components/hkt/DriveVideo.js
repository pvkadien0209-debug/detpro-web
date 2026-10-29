"use client";
// #272 Trình phát video Drive dùng thẻ <video> gốc (qua /api/video/<mã>): bấm ⛶ là toàn màn hình trên điện thoại,
// không hiện nút "mở bằng Drive". Lỗi (Drive chặn, mạng) → tự lùi về khung xem của Drive như trước.
import React, { useState } from "react";

export default function DriveVideo({ id, poster, title, autoPlay = true, className }) {
  const [loi, setLoi] = useState(false);
  if (loi) return <iframe className={className} src={`https://drive.google.com/file/d/${id}/preview`} title={title} allow="autoplay; fullscreen" allowFullScreen />;
  return (
    <video
      className={className}
      src={`/api/video/${id}`}
      poster={poster}
      controls
      playsInline
      autoPlay={autoPlay}
      preload="metadata"
      controlsList="nodownload"
      aria-label={title}
      onError={() => setLoi(true)}
    />
  );
}
