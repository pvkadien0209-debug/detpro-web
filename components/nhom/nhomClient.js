"use client";
// #230 Học cùng — gọi API nhóm từ trình duyệt + ngữ cảnh nhóm cho trang bài (UnitPage, phần luyện).
// #253: PIN lưu trên máy (localStorage) sau lần nhập đầu — lần sau không hỏi lại; máy mới thì gõ lại PIN.
// Mã hướng dẫn: nhớ trên máy trưởng nhóm cho tiện (localStorage, có try/catch) — mất thì mở lại link hướng dẫn.
import { createContext, useContext } from "react";

const pins = new Map(); // "MA/id" → PIN
// #250: phần bài mở trong cửa sổ nổi (iframe cùng trang web) dùng chung PIN với trang cây → không hỏi lại PIN
if (typeof window !== "undefined") window.__dpNhomPins = pins;
const parentPins = () => {
  try {
    return typeof window !== "undefined" && window.parent !== window ? window.parent.__dpNhomPins : null;
  } catch {
    return null;
  }
};
// #253 (anh dặn): vào nhóm bằng tên + PIN một lần → lưu trên máy cá nhân, lần sau không gõ lại; sang máy mới mới cần nhớ PIN
const PK = (ma, id) => `dp.nhom.pin.${ma}/${id}`;
const lsGet = (k) => {
  try {
    return localStorage.getItem(k) || "";
  } catch {
    return "";
  }
};
const lsSet = (k, v) => {
  try {
    v ? localStorage.setItem(k, v) : localStorage.removeItem(k);
  } catch {
    /* bỏ qua */
  }
};
export const setPin = (ma, id, pin) => {
  pin ? pins.set(`${ma}/${id}`, pin) : pins.delete(`${ma}/${id}`);
  lsSet(PK(ma, id), pin || "");
};
export const getPin = (ma, id) => pins.get(`${ma}/${id}`) || parentPins()?.get(`${ma}/${id}`) || lsGet(PK(ma, id));
/** #253: ID của tôi trong nhóm này (máy này) — mở link chung là vào thẳng cây của mình. */
export const setMyId = (ma, id) => lsSet(`dp.nhom.toi.${ma}`, id || "");
export const getMyId = (ma) => lsGet(`dp.nhom.toi.${ma}`);
/** #250: trang đang nằm trong cửa sổ nổi của cây nhóm? */
export const inPopup = () => {
  try {
    return typeof window !== "undefined" && window.parent !== window && !!window.parent.__dpNhomPins;
  } catch {
    return false;
  }
};

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
/** Nhóm học tôi đã vào / đã mở trên máy này (#267: mọi người, không chỉ trưởng nhóm). */
export function rememberGroup(ma, ten, id) {
  try {
    const l = JSON.parse(localStorage.getItem("dp.nhom.cua-toi") || "[]").filter((x) => x.ma !== ma);
    l.unshift({ ma, ten, id: id || getMyId(ma) || "", luc: Date.now() }); // #267 nhớ cả ID của tôi trong nhóm
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
