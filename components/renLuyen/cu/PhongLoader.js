"use client";
// #414 Chỉ chạy trên trình duyệt (mã cũ dùng window, giọng nói, micro).
import dynamic from "next/dynamic";
import { Suspense } from "react";

const App = dynamic(() => import("./RoomOfflineApp"), { ssr: false, loading: () => <p style={{ padding: 24 }}>Đang tải phòng rèn luyện…</p> });
export default function PhongLoader() {
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}
