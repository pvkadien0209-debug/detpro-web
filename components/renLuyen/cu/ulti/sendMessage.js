"use client";
// #414 Chép từ mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — giữ bố cục + logic; #416 đổi màu theo DetPro.
import { socket } from "@/components/renLuyen/cu/appShim";
function sendMessageToServer(message, note, chanel) {
  if (message.trim()) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const sender =
      localStorage.getItem("nameDinhDanh") || localStorage.getItem("dinhDanh");

    socket.emit("message", {
      text: message,
      time: `${timestamp} ${sender}`,
      group: chanel ? chanel : localStorage.getItem("groupChat") || "all",
    });
  }
}
export default sendMessageToServer;
