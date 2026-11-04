// #467 Gửi lỗi phía trình duyệt về /api/loi → MongoDB `loi_web` (xem ở /quanlinhomhoc → "Lỗi web").
// Không bao giờ ném lỗi; mỗi lần mở trang tối đa 20 dòng, cùng một lỗi chỉ gửi 1 lần.
const daGui = new Set();
export function baoLoi(loai, chiTiet = "") {
  try {
    if (typeof window === "undefined") return;
    const k = loai + "|" + chiTiet;
    if (daGui.has(k) || daGui.size >= 20) return;
    daGui.add(k);
    const body = JSON.stringify({ loai, chiTiet: String(chiTiet).slice(0, 500), trang: location.pathname });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/loi", new Blob([body], { type: "application/json" }))) return;
    fetch("/api/loi", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* bỏ qua */
  }
}
