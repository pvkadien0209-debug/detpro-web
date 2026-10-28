"use client";
// #232 — Hàng chờ các thẻ "lần đầu … xem không?": mỗi lúc chỉ hiện MỘT thẻ (hướng dẫn riêng trước, hướng dẫn chung sau).
import { useEffect, useSyncExternalStore } from "react";

let queue = []; // [{ key, prio }]
const subs = new Set();
const emit = () => subs.forEach((f) => f());
const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};
const head = () => (queue.length ? queue.reduce((a, b) => (b.prio < a.prio ? b : a)).key : null);

/** want = muốn hiện thẻ hỏi; prio nhỏ hơn hiện trước. Trả true khi tới lượt. */
export function useAskTurn(key, want, prio = 5) {
  useEffect(() => {
    if (!want) return undefined;
    queue = [...queue.filter((x) => x.key !== key), { key, prio }];
    emit();
    return () => {
      queue = queue.filter((x) => x.key !== key);
      emit();
    };
  }, [key, want, prio]);
  const cur = useSyncExternalStore(subscribe, head, () => null);
  return want && cur === key;
}
