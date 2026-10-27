"use client";
import { useEffect, useRef, useState } from "react";

// State có nhớ trong localStorage. Mọi đọc/ghi đều bọc try/catch:
// trình duyệt chặn storage thì vẫn chạy bình thường với giá trị mặc định.
// Next.js (#190): máy chủ không có localStorage → lần dựng đầu dùng giá trị mặc định (giống HTML máy chủ),
// đọc giá trị đã lưu ngay sau khi trang hiện; chưa đọc xong thì không ghi đè.
export default function useStoredState(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const ready = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {
      /* bỏ qua */
    }
  }, [key]);
  useEffect(() => {
    if (!ready.current) {
      ready.current = true; // lần đầu: chưa có giá trị đã lưu → không ghi
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* bỏ qua */
    }
  }, [key, value]);
  return [value, setValue];
}
