"use client";
// #370 Tài khoản tuỳ chọn — phía trình duyệt: gọi API, cờ "đã đăng nhập" trên máy, đồng bộ localStorage ↔ máy chủ.
import { gopTienDo } from "@/components/hkt/nhomRules";

const CO = "dp.tk"; // { ten, tenHien, dongBoLuc } — chỉ để biết máy này đang đăng nhập (phiên thật nằm trong cookie httpOnly)
const UNIT = "hkt.unit.";
export const KHOA_DONG_BO = ["hkt.unit.", "hkt.progress.", "hkt.last", "dp.video.history", "dp.nhom.pin.", "dp.nhom.toi.", "dp.nhom.k.", "dp.nhom.cua-toi", "dp.nhom.chao.", "hkt.cheDo", "hkt.ngheCham", "hkt.viMoSan"];
export const EV = "dp-tai-khoan";

const ls = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    } catch {
      /* bỏ qua */
    }
  },
};
export const docCo = () => {
  try {
    return JSON.parse(ls.get(CO) || "null");
  } catch {
    return null;
  }
};
export const ghiCo = (v) => {
  ls.set(CO, v ? JSON.stringify({ ...(docCo() || {}), ...v }) : null);
  try {
    window.dispatchEvent(new Event(EV));
  } catch {
    /* bỏ qua */
  }
};

export class TkLoi extends Error {
  constructor(status, data) {
    super(data?.error || `Lỗi ${status}`);
    this.status = status;
    this.data = data || {};
  }
}
export async function tk(act = "", body) {
  const r = await fetch(`/api/tai-khoan${act ? "/" + act : ""}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && act === "dong-bo") ghiCo(null); // phiên hết hạn → máy này coi như đã đăng xuất
    throw new TkLoi(r.status, data);
  }
  return data;
}

export function gomMay() {
  const o = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && KHOA_DONG_BO.some((p) => k.startsWith(p))) o[k] = localStorage.getItem(k);
    }
  } catch {
    /* bỏ qua */
  }
  return o;
}
function ghiMay(d) {
  let n = 0;
  for (const [k, v] of Object.entries(d || {})) {
    if (typeof v !== "string" || !KHOA_DONG_BO.some((p) => k.startsWith(p))) continue;
    const cu = ls.get(k);
    if (cu === v) continue;
    if (k.startsWith(UNIT) && cu) {
      try {
        const a = JSON.parse(cu), b = JSON.parse(v);
        const g = JSON.stringify({ ...gopTienDo(a, b), updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0) });
        if (g !== cu) (ls.set(k, g), n++);
        continue;
      } catch {
        /* ghi đè bản máy chủ */
      }
    }
    ls.set(k, v);
    n++;
  }
  return n;
}

let dangChay = null;
/** Đồng bộ ngay: gửi dữ liệu trên máy → nhận bản gộp → ghi lại. Trả số khoá đổi trên máy. */
export function dongBoNgay() {
  if (!docCo()) return Promise.resolve(0);
  if (dangChay) return dangChay;
  dangChay = tk("dong-bo", { d: gomMay() })
    .then((r) => {
      const n = ghiMay(r.d);
      ghiCo({ dongBoLuc: Date.now() });
      if (n) {
        try {
          window.dispatchEvent(new Event("dp-dong-bo")); // trang nào cần thì đọc lại tiến độ
        } catch {
          /* bỏ qua */
        }
      }
      return n;
    })
    .finally(() => {
      dangChay = null;
    });
  return dangChay;
}

/** Xoá dữ liệu học trên máy này (khi đăng xuất ở máy dùng chung). */
export function xoaMay() {
  try {
    const ks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && KHOA_DONG_BO.some((p) => k.startsWith(p))) ks.push(k);
    }
    ks.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* bỏ qua */
  }
}
