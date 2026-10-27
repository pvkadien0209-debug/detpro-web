"use client";
// #190 — Trang đọc localStorage / tải dữ liệu ở trình duyệt (danh mục, Của tôi, Video, Đăng bài): chỉ dựng ở trình duyệt.
// Trên máy chủ hiện `fallback` — phần chữ dựng sẵn cho Google (SeoBlock) + vòng đang tải — rồi thay bằng trang thật khi đã tải.
import { useEffect, useState } from "react";
import { VongDetLoading } from "@/components/hkt/VongDet";

export default function ClientOnly({ children, fallback = null }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (ready) return children;
  return (
    <>
      <div className="kt-ssr-loading">
        <VongDetLoading />
      </div>
      {fallback}
    </>
  );
}
