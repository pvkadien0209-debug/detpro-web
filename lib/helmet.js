"use client";
// #190 — Thay react-helmet-async. Ở Next.js, tiêu đề / mô tả / JSON-LD được đặt ở trang máy chủ (generateMetadata trong app/**/page.js)
// nên <Helmet> trong các component chép từ CRA không làm gì nữa (giữ để mỗi tệp chỉ đổi một dòng import).
export function Helmet() {
  return null;
}
export function HelmetProvider({ children }) {
  return children;
}
