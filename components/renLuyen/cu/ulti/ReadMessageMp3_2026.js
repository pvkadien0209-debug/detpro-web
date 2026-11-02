"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
function playAudio(filename, disableButton, enableButton) {
  let link = "/audio/";
  if (filename.includes("_")) {
    link += filename.split("_")[0] + "/";
  } else if (filename.startsWith("B")) {
    link += "T1A1/";
  }
  const audio = new Audio(`${link}${filename}.mp3`);
  audio.addEventListener("play", disableButton);
  audio.addEventListener("ended", () => {
    enableButton();
    audio.remove();
  });
  audio.addEventListener("error", () => {
    enableButton();
    audio.remove();
  });
  audio.play().catch(enableButton);
}
function setButtonState(id, on) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = !on;
  btn.style.cursor = on ? "pointer" : "not-allowed";
  btn.style.opacity = on ? "1" : "0.1";
}
function enableButton() {
  // Audio phát xong → kích hoạt lại nút Bật mic và nút Nghe lại
  // setButtonState("sttStartBTN", true);
  setButtonState("ngheLaiBtn", true);
}
function disableButton() {
  // Audio sắp phát → tắt STT ngay + vô hiệu hóa nút Bật lại và Nghe lại
  document.getElementById("sttStopBTN")?.click();
  // setButtonState("sttStartBTN", false);
  setButtonState("ngheLaiBtn", false);
}
export default function ReadMessageMp3(audio) {
  if (!Array.isArray(audio) || !audio.length) return;
  const idx = Math.floor(Math.random() * audio.length);
  const id = audio[idx].id;
  const textAudio = audio[idx].st;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    // Điện thoại → hiển thị text
    const el = document.getElementById("aw01Textcontent");
    if (el) el.textContent = textAudio;
  } else {
    // Desktop / laptop → phát audio
    playAudio(id, disableButton, enableButton);
  }
}
