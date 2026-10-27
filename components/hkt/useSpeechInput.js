"use client";
// SP08 · U3 — Nhận giọng nói dùng chung cho Nghe – nói và Hỏi – đáp.
// Cùng cách làm với KnowledgeLesson (SP01 M3 + #045): luôn tạo đối tượng mới, nhả âm thanh trước khi bật mic,
// #156: nghe liên tục tới khi bấm Dừng/Gửi; canh giờ micro (thử lại 1 lần rồi mời gõ).
import { useEffect, useRef, useState } from "react";
import { MIC_WATCHDOG_MS } from "./config";
import { releaseAudioForMic } from "./audioPlayer";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const speechSupported = !!SR;

const SPEECH_ERRORS = {
  "not-allowed": "Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khoá trên thanh địa chỉ để cho phép, hoặc chuyển sang Gõ.",
  "service-not-allowed": "Trình duyệt không cho dùng nhận giọng nói. Hãy chuyển sang Gõ.",
  "no-speech": "Chưa nghe thấy gì. Bấm mic rồi nói gần micro hơn.",
  "audio-capture": "Không tìm thấy micro. Kiểm tra micro hoặc chuyển sang Gõ.",
  network: "Nhận giọng nói cần mạng. Kiểm tra kết nối hoặc chuyển sang Gõ.",
};

/**
 * onResult(alternatives: string[]) — các phương án nhận dạng, phương án đầu là khả năng cao nhất.
 * #156: nghe LIÊN TỤC cho tới khi người học bấm Dừng hoặc Gửi (không tự ngắt khi im lặng, không giới hạn 10 giây):
 *   continuous = true; trình duyệt tự dừng (im lâu, mất mạng ngắn) → tự bật lại, giữ chữ đã nghe.
 *   Chỉ hiện chữ ĐÃ CHỐT (final), không hiện chữ tạm (interim) nhảy liên tục.
 */
export default function useSpeechInput(onResult) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState(""); // chữ đã chốt trong lượt nghe hiện tại
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const watchRef = useRef(null);
  const userStopRef = useRef(false); // người học bấm Dừng/Gửi → không tự bật lại
  const partsRef = useRef([]); // [[phương án 1, 2, 3], …] mỗi đoạn đã chốt
  const cbRef = useRef(onResult);
  cbRef.current = onResult;

  const joined = () => partsRef.current.map((p) => p[0]).join(" ").replace(/\s+/g, " ").trim();

  const stop = () => {
    userStopRef.current = true;
    if (recRef.current) recRef.current.stop();
  };

  const abortAll = () => {
    userStopRef.current = true;
    clearTimeout(watchRef.current);
    const r = recRef.current;
    recRef.current = null;
    if (r) {
      try {
        r.onresult = r.onerror = r.onend = null;
        r.abort();
      } catch {
        /* bỏ qua */
      }
    }
    setRecording(false);
    setText("");
    partsRef.current = [];
  };
  useEffect(() => abortAll, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    clearTimeout(watchRef.current);
    recRef.current = null;
    setRecording(false);
    const head = joined();
    const parts = partsRef.current;
    partsRef.current = [];
    setText("");
    if (!head) return;
    const alts = parts.length === 1 && parts[0].length > 1 ? parts[0].map((x) => x.trim()) : [head];
    cbRef.current(alts);
  };

  // attempt: lần thử micro (canh giờ iPhone); resume: tự bật lại giữa chừng — giữ chữ đã nghe
  const start = (attempt = 0, resume = false) => {
    if (!SR || (recRef.current && attempt === 0 && !resume)) return;
    if (!resume) {
      releaseAudioForMic();
      setError(null);
      setText("");
      partsRef.current = [];
      userStopRef.current = false;
    }
    const rec = new SR();
    let alive = false;
    let failed = false;
    const markAlive = () => {
      if (alive) return;
      alive = true;
      clearTimeout(watchRef.current);
    };
    rec.onaudiostart = markAlive;
    rec.onspeechstart = markAlive;
    rec.onstart = () => {
      if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) markAlive();
    };
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = true;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      markAlive();
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) partsRef.current.push(Array.from(res).map((a) => a.transcript.trim()).filter(Boolean));
      }
      partsRef.current = partsRef.current.filter((p) => p.length);
      setText(joined());
    };
    rec.onerror = (e) => {
      markAlive();
      if (e.error === "no-speech" || e.error === "aborted") return; // im lặng: không báo lỗi, tự nghe tiếp
      failed = true;
      userStopRef.current = true;
      setError(SPEECH_ERRORS[e.error] || "Không nhận được giọng nói. Bấm mic thử lại, hoặc chuyển sang Gõ.");
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      if (!userStopRef.current && !failed) {
        // trình duyệt tự dừng → bật lại ngay, vẫn giữ chữ
        recRef.current = null;
        setTimeout(() => {
          if (!userStopRef.current) startRef.current(1, true);
          else finish();
        }, 120);
        return;
      }
      finish();
    };
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
      clearTimeout(watchRef.current);
      if (!resume)
        watchRef.current = setTimeout(() => {
          if (alive) return;
          abortAll();
          if (attempt === 0) setTimeout(() => startRef.current(1), 250);
          else setError("Micro chưa sẵn sàng (thường gặp trên iPhone ngay sau khi phát âm thanh). Bấm mic lần nữa, hoặc chuyển sang Gõ.");
        }, MIC_WATCHDOG_MS);
    } catch {
      if (resume) return finish();
      setError("Không bật được micro. Bấm mic thử lại, hoặc chuyển sang Gõ.");
      setRecording(false);
    }
  };
  const startRef = useRef(start);
  startRef.current = start;

  // #161: Xoá chữ đã nghe (đang nghe thì vẫn nghe tiếp, bắt đầu lại từ chữ trống)
  const clear = () => {
    partsRef.current = [];
    setText("");
  };
  return { supported: speechSupported, recording, text, interim: text, error, start: () => start(0), stop, clear, abort: abortAll, clearError: () => setError(null) };
}
