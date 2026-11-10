// Phát âm cho module Học kiến thức — có thể DỪNG giữa chừng (cần cho khoá chồng chéo, §4).
// Thứ tự: POST /api/tts (Next.js, lang "en", cache MongoDB)
//         → giọng đọc trình duyệt (en-US) nếu server lỗi/hết giờ.
//
// #045 — iPhone: phát mp3 bằng thẻ <audio> giữ "phiên âm thanh" của iOS ở chế độ PHÁT, nên khi bấm mic
// nhận giọng nói (webkitSpeechRecognition) phải chờ iOS chuyển sang chế độ GHI — rất chậm, có khi treo.
// Cách xử lý:
//   1. Phát bằng Web Audio API (AudioContext + AudioBufferSourceNode) thay cho <audio>; <audio> chỉ còn là dự phòng.
//   2. releaseAudioForMic(): trước khi bật mic, dừng HẲN mọi âm thanh (nguồn Web Audio, <audio> — gỡ src,
//      giọng đọc trình duyệt) và tạm ngưng AudioContext để trả thiết bị âm thanh cho micro.
//   3. (Tuỳ chọn, để thử trên iPhone) IOS_AUDIO_SESSION trong config.js: đặt navigator.audioSession.type
//      = "play-and-record" cho cả trang để iOS không phải đổi chế độ giữa phát và ghi.
// Next.js (#190): máy chủ âm thanh là /api/tts của chính trang (Express/Heroku đã bỏ, #189)
const LinkAPI = "/api/";
import { IOS_AUDIO_SESSION } from "./config";
import { baoLoi } from "./baoLoi"; // #467 lỗi âm thanh → MongoDB

const laIOS = () => typeof navigator !== "undefined" && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
// môi trường âm thanh kèm theo mỗi dòng lỗi (để biết máy nào, phiên âm thanh gì)
const mt = () => {
  try {
    return `ios=${laIOS() ? 1 : 0} as=${navigator.audioSession ? navigator.audioSession.type : "khong"} ctx=${ctx ? ctx.state : "-"} mang=${navigator.onLine ? 1 : 0}`;
  } catch {
    return "";
  }
};
const loi = (loai, e, them = "") => baoLoi(loai, `${String(e?.name || "")}:${String(e?.message || e || "").slice(0, 160)} ${them} | ${mt()}`);

const bufCache = new Map(); // text -> AudioBuffer (Web Audio)
const urlCache = new Map(); // text -> objectURL (dự phòng <audio>)
const rawCache = new Map(); // text -> ArrayBuffer gốc (để giải mã lại nếu cần)
const mayCache = new Map(); // #476 text -> "kokoro" | "google" (tiêu đề X-TTS-May)
// #476 Google đọc giọng thường, phát chậm lại 0,9 (giữ cao độ, qua thẻ <audio>) cho dễ nghe; Kokoro giữ tốc độ gốc
const TOC_GOOGLE = 0.9;
const tocDo = (text) => tocDoNghe() * (mayCache.get(text) === "google" ? TOC_GOOGLE : 1);
let current = null; // { token, source, audio, utter, resolve }
let tokenSeq = 0;
let ctx = null;

const TIMEOUT_MS = 12000; // #476 đủ cho Kokoro chậm (5 giây) + Google dự phòng

// Thử đặt phiên âm thanh cho cả trang (chỉ khi bật trong config và trình duyệt hỗ trợ — Safari mới).
try {
  if (IOS_AUDIO_SESSION && typeof navigator !== "undefined" && navigator.audioSession) {
    navigator.audioSession.type = IOS_AUDIO_SESSION;
  }
} catch {
  /* bỏ qua */
}

// #467 iPhone gạt Im lặng: Web Audio bị tắt tiếng (thẻ <audio> thì không). Khi phát → xin phiên "playback"
// (bỏ qua nút Im lặng, Safari 16.4+); khi bật mic → trả "auto" để iOS tự chuyển sang ghi (giữ cách #045).
function datPhien(t) {
  try {
    if (!IOS_AUDIO_SESSION && typeof navigator !== "undefined" && navigator.audioSession && navigator.audioSession.type !== t) navigator.audioSession.type = t;
  } catch {
    /* bỏ qua */
  }
}

function getCtx() {
  const AC = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  if (!AC) return null;
  if (!ctx || ctx.state === "closed") ctx = new AC();
  return ctx;
}

async function fetchRaw(text) {
  if (rawCache.has(text)) return rawCache.get(text).slice(0);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LinkAPI + "tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error("empty audio");
    rawCache.set(text, buf.slice(0));
    mayCache.set(text, res.headers.get("X-TTS-May") === "google" ? "google" : "kokoro");
    return buf;
  } catch (e) {
    loi("am-tai-mp3", e, `dai=${text.length}`);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function decode(c, arrayBuffer) {
  // Safari cũ chỉ có dạng callback
  return new Promise((resolve, reject) => {
    const p = c.decodeAudioData(arrayBuffer, resolve, reject);
    if (p && p.then) p.then(resolve, reject);
  });
}

async function getBuffer(text) {
  if (bufCache.has(text)) return bufCache.get(text);
  const c = getCtx();
  if (!c) throw new Error("no-webaudio");
  const raw = await fetchRaw(text);
  const buf = await decode(c, raw);
  bufCache.set(text, buf);
  return buf;
}

async function getUrl(text) {
  if (urlCache.has(text)) return urlCache.get(text);
  const raw = await fetchRaw(text);
  const url = URL.createObjectURL(new Blob([raw], { type: "audio/mpeg" }));
  urlCache.set(text, url);
  return url;
}

// #706 báo tiếng đã bắt đầu (một lần / lượt)
function batDau(token) {
  if (!current || current.token !== token || !current.onStart) return;
  const f = current.onStart;
  current.onStart = null;
  try {
    f();
  } catch {
    /* bỏ qua */
  }
}

function finish(token) {
  if (!current || current.token !== token) return;
  const { resolve } = current;
  current = null;
  resolve();
}

function hardStop(c) {
  try {
    if (c.source) {
      c.source.onended = null;
      c.source.stop();
      c.source.disconnect();
    }
  } catch {
    /* đã dừng */
  }
  try {
    if (c.audio) {
      c.audio.onended = null;
      c.audio.onerror = null;
      c.audio.pause();
      c.audio.removeAttribute("src"); // gỡ hẳn nguồn để iOS nhả phiên phát
      c.audio.load();
    }
  } catch {
    /* bỏ qua */
  }
  try {
    if (c.utter && window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* bỏ qua */
  }
}

/** Dừng âm thanh đang phát (nếu có). */
export function stopAudio() {
  if (!current) return;
  const c = current;
  current = null;
  hardStop(c);
  c.resolve();
}

/**
 * #045 — Gọi NGAY trước khi bật nhận giọng nói: dừng hẳn mọi âm thanh và tạm ngưng AudioContext,
 * để iOS trả micro nhanh. Không chờ (để rec.start() vẫn nằm trong cú bấm của người dùng).
 */
export function releaseAudioForMic() {
  stopAudio();
  datPhien("auto");
  try {
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) window.speechSynthesis.cancel();
  } catch {
    /* bỏ qua */
  }
  try {
    if (ctx && ctx.state === "running") ctx.suspend();
  } catch {
    /* bỏ qua */
  }
}

/**
 * Đọc một câu tiếng Anh. Trả về Promise xong khi đọc hết HOẶC bị dừng.
 */
import { tocDoNghe } from "./hoTro"; // #354 nghe chậm

/**
 * #706 opts.onStart(): gọi MỘT lần khi tiếng thật sự bắt đầu (để nút đổi từ "đang tải" sang "đang phát").
 */
export function playText(text, opts = {}) {
  stopAudio();
  const token = ++tokenSeq;
  datPhien("playback");
  // Mở khoá / đánh thức AudioContext ngay trong cú bấm (iOS yêu cầu cử chỉ người dùng)
  const c = getCtx();
  try {
    if (c && c.state !== "running") c.resume();
  } catch {
    /* bỏ qua */
  }
  return new Promise((resolve) => {
    current = { token, source: null, audio: null, utter: null, resolve, onStart: typeof opts.onStart === "function" ? opts.onStart : null };
    // #354 nghe chậm: dùng thẻ <audio> (giữ cao độ giọng khi chậm lại); bình thường giữ Web Audio như cũ
    if (tocDo(text) < 1) playElement(text, token);
    else
      playWebAudio(text, token).catch((e) => {
        if (!/^HTTP|empty audio|abort|can-cham/i.test(String(e?.message || e?.name))) loi("am-webaudio", e);
        playElement(text, token);
      });
  });
}

async function playWebAudio(text, token) {
  const c = getCtx();
  if (!c) throw new Error("no-webaudio");
  const buf = await getBuffer(text);
  if (!current || current.token !== token) return;
  if (tocDo(text) < 1) throw new Error("can-cham"); // #476 âm thanh Google: chuyển sang <audio> để phát 0,9 giữ cao độ
  if (c.state !== "running") await c.resume();
  if (!current || current.token !== token) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.onended = () => finish(token);
  current.source = src;
  src.start();
  batDau(token);
  // #467 kiểm sau khi phát: AudioContext không chạy = iPhone/Android chặn tiếng
  setTimeout(() => {
    if (current && current.source === src && c.state !== "running") loi("am-ctx-dung", "ctx khong chay sau khi phat");
  }, 400);
  if (laIOS()) {
    // ghi 1 lần / ngày / máy: iPhone phát bằng phiên nào (để đối chiếu khi anh báo "bấm mà im")
    try {
      const k = "dp.amIos";
      const hom = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(k) !== hom) {
        localStorage.setItem(k, hom);
        baoLoi("am-ios-phat", `thong tin | ${mt()}`);
      }
    } catch {
      /* bỏ qua */
    }
  }
}

async function playElement(text, token) {
  if (!current || current.token !== token) return;
  try {
    const url = await getUrl(text);
    if (!current || current.token !== token) return;
    const audio = new Audio(url);
    const r = tocDo(text);
    if (r !== 1) {
      audio.preservesPitch = true;
      audio.playbackRate = r;
    }
    current.audio = audio;
    audio.onended = () => finish(token);
    audio.onerror = () => {
      loi("am-audio-the", audio.error ? `code ${audio.error.code}` : "onerror");
      speakBrowser(text, token);
    };
    await audio.play();
    batDau(token);
  } catch (e) {
    if (!/^HTTP|empty audio|abort/i.test(String(e?.message || e?.name))) loi("am-audio-the", e);
    speakBrowser(text, token);
  }
}

function speakBrowser(text, token) {
  if (!current || current.token !== token || current.utter) return;
  const synth = window.speechSynthesis;
  loi("am-giong-tb", "chuyen sang giong trinh duyet", `dai=${text.length}`);
  if (!synth) {
    loi("am-khong-giong", "khong co speechSynthesis");
    return finish(token);
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9 * tocDoNghe();
  const voice = synth.getVoices().find((v) => v.lang && v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  u.onstart = () => batDau(token);
  u.onend = () => finish(token);
  u.onerror = (ev) => {
    loi("am-giong-loi", ev?.error || "onerror");
    finish(token);
  };
  current.utter = u;
  synth.speak(u);
}
