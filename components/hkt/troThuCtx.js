"use client";
// #269 Đét trợ thủ — kho ngữ cảnh nhỏ: trang nào đang mở báo cho Đét biết "bạn đang ở đâu, đã làm tới đâu" (không lưu đi đâu).
import { useEffect, useState } from "react";

let cur = null;
const subs = new Set();
export function setTroThu(ctx) {
  cur = ctx;
  subs.forEach((f) => f(cur));
}
export function useTroThuCtx() {
  const [c, setC] = useState(cur);
  useEffect(() => {
    subs.add(setC);
    setC(cur);
    return () => subs.delete(setC);
  }, []);
  return c;
}
/** Trang gọi: useBaoTroThu(ctx, [deps]) — tự xoá khi rời trang. */
export function useBaoTroThu(make, deps) {
  useEffect(() => {
    setTroThu(make());
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => setTroThu(null), []);
}
