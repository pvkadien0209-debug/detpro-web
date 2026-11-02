"use client";
// #414 Thay react-router-dom của project cũ bằng Next.js — giữ đúng tên hàm để mã cũ chạy y nguyên.
import { useParams as useNextParams, usePathname, useSearchParams } from "next/navigation";
import { useNavigate as useNav } from "@/lib/router";

/** Tham số đường dẫn /ren-luyen/phong/<roomCode>/<currentIndex> (tên giống route cũ /roomoffline/:roomCode/:currentIndex). */
export function useParams() {
  const p = useNextParams() || {};
  return { ...p, id: p.roomCode };
}
export function useLocation() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const s = sp?.toString() || "";
  return { pathname, search: s ? `?${s}` : "" };
}
export function useNavigate() {
  const nav = useNav();
  // đường dẫn cũ /roomoffline/... và /learninghub/... → trang Rèn luyện mới
  return (to, opt) => nav(String(to).replace(/^\/?roomoffline\//, "/ren-luyen/phong/").replace(/^\/?learninghub\/.*/, "/ren-luyen"), opt);
}
export const json = (x) => x;
