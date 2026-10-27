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

const bufCache = new Map(); // text -> AudioBuffer (Web Audio)
const urlCache = new Map(); // text -> objectURL (dự phòng <audio>)
const rawCache = new Map(); // text -> ArrayBuffer gốc (để giải mã lại nếu cần)
let current = null; // { token, source, audio, utter, resolve }
let tokenSeq = 0;
let ctx = null;

const TIMEOUT_MS = 8000;

// Thử đặt phiên âm thanh cho cả trang (chỉ khi bật trong config và trình duyệt hỗ trợ — Safari mới).
try {
  if (IOS_AUDIO_SESSION && typeof navigator !== "undefined" && navigator.audioSession) {
    navigator.audioSession.type = IOS_AUDIO_SESSION;
  }
} catch {
  /* bỏ qua */
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
    return buf;
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
export function playText(text) {
  stopAudio();
  const token = ++tokenSeq;
  // Mở khoá / đánh thức AudioContext ngay trong cú bấm (iOS yêu cầu cử chỉ người dùng)
  const c = getCtx();
  try {
    if (c && c.state !== "running") c.resume();
  } catch {
    /* bỏ qua */
  }
  return new Promise((resolve) => {
    current = { token, source: null, audio: null, utter: null, resolve };
    playWebAudio(text, token).catch(() => playElement(text, token));
  });
}

async function playWebAudio(text, token) {
  const c = getCtx();
  if (!c) throw new Error("no-webaudio");
  const buf = await getBuffer(text);
  if (!current || current.token !== token) return;
  if (c.state !== "running") await c.resume();
  if (!current || current.token !== token) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.onended = () => finish(token);
  current.source = src;
  src.start();
}

async function playElement(text, token) {
  if (!current || current.token !== token) return;
  try {
    const url = await getUrl(text);
    if (!current || current.token !== token) return;
    const audio = new Audio(url);
    current.audio = audio;
    audio.onended = () => finish(token);
    audio.onerror = () => speakBrowser(text, token);
    await audio.play();
  } catch {
    speakBrowser(text, token);
  }
}

function speakBrowser(text, token) {
  if (!current || current.token !== token || current.utter) return;
  const synth = window.speechSynthesis;
  if (!synth) return finish(token);
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang && v.lang.startsWith("en"));
  if (voice) u.voice = voice;
  u.onend = () => finish(token);
  u.onerror = () => finish(token);
  current.utter = u;
  synth.speak(u);
}
