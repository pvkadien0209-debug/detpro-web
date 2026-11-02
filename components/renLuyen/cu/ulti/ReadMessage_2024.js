"use client";
// #414 Chép y nguyên mã nguồn cũ (AOLD\SEO-PT-projectjs - Lưu 14-9-2026\client\src) — chỉ đổi đường import.
import read_by_Tts from "./readMessage_TtsServer";
let imale, ifemale;

// Phát hiện điện thoại (mobile) — trên điện thoại chỉ đọc bằng file mp3, không dùng TTS
function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Ghép đường dẫn tới file audio mp3 từ tên file
function buildAudioPath(filename) {
  let link_t_get_audio = "/audio/";
  if (filename.includes("_")) {
    link_t_get_audio += filename.split("_")[0] + "/";
  } else {
    if (filename.startsWith("B")) {
      link_t_get_audio += "T1A1/";
    }
  }
  return `${link_t_get_audio}${filename}.mp3`;
}

function playAudio(filename, disableButton, enableButton, onFail) {
  try {
    // Tạo một đường dẫn đến file audio
    let link_t_get_audio = "/audio/";
    if (filename.includes("_")) {
      link_t_get_audio += filename.split("_")[0] + "/";
    } else {
      if (filename.startsWith("B")) {
        link_t_get_audio += "T1A1/";
      }
    }
    const audioPath = `${link_t_get_audio}${filename}.mp3`;
    // Tạo phần tử Audio
    const audio = new Audio(audioPath);
    audio.addEventListener("play", () => {
      disableButton(); // Vô hiệu hóa nút khi audio đang phát
    });
    // Xử lý sự kiện khi audio phát xong
    audio.addEventListener("ended", () => {
      enableButton();
      audio.remove(); // Giải phóng bộ nhớ
    });
    // Xử lý sự kiện khi có lỗi trong quá trình phát
    audio.addEventListener("error", () => {
      enableButton(); // Kích hoạt lại nút
      console.warn(`Audio file not supported or not found: ${audioPath}`);
      audio.remove(); // Giải phóng bộ nhớ
      // if (typeof onFail === "function") {
      //   onFail(); // Gọi callback khi lỗi
      // }
    });
    // Thử phát audio
    audio.play().catch(() => {
      enableButton(); // Kích hoạt lại nút nếu play() gặp lỗi
      console.warn(`Failed to play audio: ${audioPath}`);
      if (typeof onFail === "function") {
        onFail(); // Gọi callback khi lỗi
      }
    });
  } catch (error) {
    console.error("Error in playAudio function:", error);
    enableButton(); // Đảm bảo nút được kích hoạt lại trong trường hợp lỗi
    if (typeof onFail === "function") {
      onFail(); // Gọi callback khi lỗi
    }
  }
}

// Hiển thị popup <audio> cố định giữa màn hình để người dùng tự bấm nghe
// (dùng thay cho .play() tự động — phù hợp cho điện thoại, không autoplay)
function showAudioPopup(filename, disableButton, enableButton) {
  try {
    const audioPath = buildAudioPath(filename);

    // Xoá popup cũ nếu còn tồn tại trước khi tạo popup mới
    const oldOverlay = document.getElementById("audioPopupOverlay");
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = "audioPopupOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const box = document.createElement("div");
    box.style.position = "relative";
    box.style.backgroundColor = "#ffffff";
    box.style.borderRadius = "12px";
    box.style.padding = "24px 28px";
    box.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
    box.style.textAlign = "center";
    box.style.minWidth = "260px";

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✕";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "6px";
    closeBtn.style.right = "10px";
    closeBtn.style.border = "none";
    closeBtn.style.background = "transparent";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.color = "#495057";

    const label = document.createElement("div");
    label.innerText = "Bấm nút bên dưới để nghe";
    label.style.marginBottom = "12px";
    label.style.color = "#495057";
    label.style.fontSize = "16px";

    const audioEl = document.createElement("audio");
    audioEl.src = audioPath;
    audioEl.controls = true;
    audioEl.style.width = "240px";

    const closePopup = () => {
      overlay.remove();
    };

    audioEl.addEventListener("play", () => {
      disableButton();
    });
    audioEl.addEventListener("ended", () => {
      enableButton();
      closePopup();
    });
    audioEl.addEventListener("error", () => {
      enableButton();
      console.warn(`Audio file not supported or not found: ${audioPath}`);
      closePopup();
    });

    closeBtn.addEventListener("click", () => {
      enableButton();
      closePopup();
    });

    box.appendChild(closeBtn);
    box.appendChild(label);
    box.appendChild(audioEl);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  } catch (error) {
    console.error("Error in showAudioPopup function:", error);
    enableButton();
  }
}

// Function to set the state of a button
function setButtonState(buttonId, isEnabled) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = !isEnabled;
    button.style.cursor = isEnabled ? "pointer" : "not-allowed";
    button.style.opacity = isEnabled ? "1" : "0.1";
  }
}
// Enable specific buttons
function enableButton() {
  setButtonState("RegButton", true);
  setButtonState("BtnFsp", true);
  const buttonReadingFalse = document.getElementById("readingFalse");
  buttonReadingFalse.click();
}
// Disable specific buttons
function disableButton() {
  try {
    setButtonState("RegButton", false);
    setButtonState("BtnFsp", false);
    const button = document.getElementById("sttStopBTN");
    button.click();
    const buttonReadingTrue = document.getElementById("readingTrue");
    buttonReadingTrue.click();
  } catch (error) {}
  //
}
// Function to count and split sentences in a given text
function countAndSplitSentences(text) {
  const sentences = text.match(/[^?!.;]+[?!.;]*/g);
  return sentences || [text];
}
// Check function execution frequency
function checkFunctionExecution(functionName) {
  const lastExecutionTime = localStorage.getItem(functionName);
  const currentTime = Date.now();
  if (lastExecutionTime && currentTime - lastExecutionTime < 1000) {
    return false;
  }
  localStorage.setItem(functionName, currentTime);
  return true;
}
// Main function to read messages
export default async function ReadMessage(ObjVoices, text, voiceNum, audio) {
  if (!checkFunctionExecution("ReadMessage")) {
    console.warn("ReadMessage called too frequently.");
    return;
  }
  // Trên điện thoại: chỉ đọc bằng file mp3 (không dùng TTS), hiển thị popup
  // <audio> cố định giữa màn hình để người dùng tự bấm nghe (không autoplay,
  // không hiển thị text)
  if (isMobileDevice()) {
    if (Array.isArray(audio) && audio.length > 0) {
      const randomIndex = Math.floor(Math.random() * audio.length);
      showAudioPopup(audio[randomIndex].id, disableButton, enableButton);
    } else {
      console.warn("Không có file mp3 để đọc trên điện thoại.");
    }
    return;
  }
  if (audio) {
    if (!Array.isArray(audio) || audio.length === 0) {
    } else {
      try {
        const randomIndex = Math.floor(Math.random() * audio.length);
        playAudio(audio[randomIndex].id, disableButton, enableButton, () => {
          read_by_Tts(
            text,
            () => {
              ReadMessage_02(ObjVoices, text, voiceNum);
            },
            disableButton,
            enableButton,
          );
        });
        return;
      } catch (error) {
        console.log(error);
      }
    }
  } else {
    read_by_Tts(
      text,
      () => {
        ReadMessage_02(ObjVoices, text, voiceNum);
      },
      disableButton,
      enableButton,
    );
    // ReadMessage_02(ObjVoices, text, voiceNum);
  }
}
async function ReadMessage_02(ObjVoices, text, voiceNum) {
  if (text === null) {
    return;
  }
  if (!text) {
    return;
  }
  imale = ObjVoices.imale;
  ifemale = ObjVoices.ifemale;
  if (imale === undefined || ifemale === undefined) {
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  // Ensure voices are loaded before proceeding
  if (!voices.length) {
    window.speechSynthesis.onvoiceschanged = () =>
      ReadMessage(ObjVoices, text, voiceNum);
    return;
  }
  let voiceIndex = voiceNum === 1 ? ifemale : imale;
  const sentences = countAndSplitSentences(text);
  const speakSentences = (index, sentenceLength) => {
    let msg = new SpeechSynthesisUtterance();
    msg.voice = voices[voiceIndex];
    msg.rate = 0.7;
    msg.text = sentences[index];
    msg.onstart = () => {
      if (index === 0) disableButton();
    };
    msg.onend = () => {
      if (index >= sentenceLength - 1) {
        enableButton();
      } else {
        speakSentences(index + 1, sentenceLength);
      }
    };
    msg.onerror = (error) => {
      console.error("Error in speech synthesis: ", error);
      enableButton();
    };
    speechSynthesis.speak(msg);
  };
  speakSentences(0, sentences.length);
}
