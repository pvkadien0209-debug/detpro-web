"use client";
// #370 Chạy nền ở mọi trang khi máy đã đăng nhập: đồng bộ lúc mở trang, mỗi 3 phút và khi rời trang / ẩn thẻ.
import { useEffect } from "react";
import { dongBoNgay } from "./tkClient"; // chưa đăng nhập → dongBoNgay không làm gì

export default function DongBoTaiKhoan() {
  useEffect(() => {
    const chay = () => dongBoNgay().catch(() => {});
    const t0 = setTimeout(chay, 1500);
    const t = setInterval(chay, 180e3);
    const an = () => document.visibilityState === "hidden" && chay();
    document.addEventListener("visibilitychange", an);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
      document.removeEventListener("visibilitychange", an);
    };
  }, []);
  return null;
}
