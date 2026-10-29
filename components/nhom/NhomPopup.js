"use client";
// #250 (NHA A3, D, E) — cửa sổ nổi trong trang nhóm:
//   PartPopup: làm một phần bài NGAY TRÊN CÂY (iframe cùng trang web, dùng chung PIN — xem nhomClient.inPopup), đóng lại thì cây tải lại.
//   QaPopup: Hỏi đáp của MỘT bài (nút nhỏ trên thân cây) — chỉ hiện tin gắn bài đó, gửi tin mới tự gắn nhãn bài.
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NhomChat } from "./NhomShared";
import { PART_SHORT } from "@/components/hkt/nhomRules";

function Shell({ title, onClose, wide, children, extra }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    // #267: nút Back của trình duyệt / điện thoại = đóng cửa sổ (không thoát khỏi nhóm); trang bài trong cửa sổ bấm "‹" cũng đóng
    let byPop = false;
    try {
      window.history.pushState({ nhPop: 1 }, "");
    } catch {
      /* bỏ qua */
    }
    const onPop = () => {
      byPop = true;
      closeRef.current();
    };
    const k = (e) => e.key === "Escape" && closeRef.current();
    const msg = (e) => e.origin === window.location.origin && e.data === "dp-nhom-dong" && closeRef.current();
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", k);
    window.addEventListener("message", msg);
    document.body.classList.add("nh-noscroll");
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", k);
      window.removeEventListener("message", msg);
      document.body.classList.remove("nh-noscroll");
      if (!byPop && window.history.state?.nhPop) window.history.back();
    };
  }, []);
  return (
    <div className="nh-pop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`nh-pop-in ${wide ? "is-wide" : ""}`}>
        <header>
          <b>{title}</b>
          {extra}
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

/** Làm phần bài trong cửa sổ nổi. href = đường dẫn bài trong nhóm (nhomUnitPath). */
export function PartPopup({ title, href, onClose }) {
  return (
    <Shell
      title={title}
      onClose={onClose}
      wide
    >
      <iframe className="nh-pop-frame" src={href} title={title} />
    </Shell>
  );
}

/** Hỏi đáp riêng một bài. gan = { bai, phan: "", nhan } */
export function QaPopup({ ma, who, gan, label, linkFor, chatTat, onClose }) {
  return (
    <Shell title={`Hỏi đáp · ${label}`} onClose={onClose}>
      <NhomChat ma={ma} who={who} gan={gan} chiBai={gan.bai} linkFor={linkFor} chatTat={chatTat} />
    </Shell>
  );
}

export const partTitle = (lbl, pk) => `${lbl} · ${PART_SHORT[pk]}`;
