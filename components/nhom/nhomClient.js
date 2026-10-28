"use client";
// #230 Học cùng — gọi API nhóm từ trình duyệt + ngữ cảnh nhóm cho trang bài (UnitPage, phần luyện).
// PIN chỉ giữ trong bộ nhớ của tab (thiết kế mục 3): tải lại trang thì hỏi lại; chuyển trang trong web vẫn giữ.
// Mã hướng dẫn: nhớ trên máy người hướng dẫn cho tiện (localStorage, có try/catch) — mất thì mở lại link hướng dẫn.
import { createContext, useContext } from "react";

const pins = new Map(); // "MA/id" → PIN
export const setPin = (ma, id, pin) => (pin ? pins.set(`${ma}/${id}`, pin) : pins.delete(`${ma}/${id}`));
export const getPin = (ma, id) => pins.get(`${ma}/${id}`) || "";

const KEY = (ma) => `dp.nhom.k.${ma}`;
export function saveK(ma, k) {
  try {
    localStorage.setItem(KEY(ma), k);
  } catch {
    /* bỏ qua */
  }
}
export function loadK(ma) {
  try {
    return localStorage.getItem(KEY(ma)) || "";
  } catch {
    return "";
  }
}
/** Nhóm tôi đã mở trên máy này (để người hướng dẫn tìm lại). */
export function rememberGroup(ma, ten) {
  try {
    const l = JSON.parse(localStorage.getItem("dp.nhom.cua-toi") || "[]").filter((x) => x.ma !== ma);
    l.unshift({ ma, ten, luc: Date.now() });
    localStorage.setItem("dp.nhom.cua-toi", JSON.stringify(l.slice(0, 20)));
  } catch {
    /* bỏ qua */
  }
}
export function myGroups() {
  try {
    return JSON.parse(localStorage.getItem("dp.nhom.cua-toi") || "[]");
  } catch {
    return [];
  }
}

export class ApiErr extends Error {
  constructor(status, data) {
    super(data?.error || `Lỗi ${status}`);
    this.status = status;
    this.data = data || {};
  }
}

/** api("K7M2QX/tien-do", { id, k, method, body, form, query }) */
export async function api(path, { id, k, method, body, form, query } = {}) {
  const ma = path.split("/")[0];
  const headers = {};
  if (id) {
    headers["x-nhom-id"] = id;
    const pin = getPin(ma, id);
    if (pin) headers["x-nhom-pin"] = pin;
  }
  if (k) headers["x-nhom-k"] = k;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const qs = query ? "?" + new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "")) : "";
  const r = await fetch(`/api/nhom${path ? `/${path}` : ""}${qs}`, { method: method || (payload ? "POST" : "GET"), headers, body: payload, cache: "no-store" });
  const isJson = (r.headers.get("content-type") || "").includes("json");
  const data = isJson ? await r.json().catch(() => ({})) : null;
  if (!r.ok) throw new ApiErr(r.status, data);
  return data;
}

export const tepUrl = (ma, tep) => `/api/nhom/${ma}/tep/${tep}`;

/** Ngữ cảnh nhóm cho trang bài: null khi học riêng. */
export const NhomCtx = createContext(null);
export const useNhom = () => useContext(NhomCtx);
