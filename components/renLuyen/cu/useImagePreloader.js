"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import { useEffect } from "react";

const useImagePreloader = (imageUrls) => {
  const isImageUrl = (url) => {
    return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(url);
  };

  useEffect(() => {
    if (imageUrls && imageUrls.length > 0) {
      imageUrls.forEach((url) => {
        if (isImageUrl(url)) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [imageUrls]);
};

export default useImagePreloader;
