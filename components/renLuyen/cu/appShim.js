"use client";
// #414 Thay cho "../App" của project cũ (CRA): không còn máy chủ socket (Heroku) → socket giả không làm gì; ObjREADContext giữ nguyên.
import { createContext } from "react";

const khongLam = () => {};
export const socket = { id: "offline", connected: true, emit: khongLam, on: khongLam, off: khongLam };
export const ObjREADContext = createContext(null);
