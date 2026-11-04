// lib/tts.js — #184: phần xử lý âm thanh tách từ SEO-PT-projectjs/server/server.js (route POST /tts), giữ nguyên cách làm:
// md5 của chữ → cache MongoDB `tts_audio_cache` → không có thì Google TTS (en, đọc chậm), > 200 ký tự thì cắt câu, tạo song song, nối mp3.
// Bỏ tầng cache đĩa và hàng đợi trong bộ nhớ: máy chủ Vercel không giữ tệp / bộ nhớ giữa các lượt gọi.
import "server-only";
import crypto from "crypto";
import * as googleTTS from "google-tts-api";
import { getCollection } from "./mongodb";

export const TTS_MAX_CHUNK_LENGTH = 200; // giới hạn ký tự/lần gọi của google-tts-api
export const TTS_MONGO_COLLECTION = "tts_audio_cache";

// #476 Giọng chính Kokoro (DeepInfra, khoá DEEPINFRA_API_KEY ở máy chủ) · dự phòng Google (cắt câu ở . ! ? rồi , ; :, giọng thường).
// Mỗi giọng một mã lưu riêng → đổi giọng / cách cắt không lẫn âm thanh cũ (bản cũ md5(chữ) = Google đọc chậm, không dùng nữa).
export const KOKORO_MODEL = "hexgrad/Kokoro-82M";
export const kokoroVoice = () => (/^[a-z]{2}_[a-z]+$/.test(process.env.KOKORO_VOICE || "") ? process.env.KOKORO_VOICE : "af_heart");
export const coKokoro = () => !!process.env.DEEPINFRA_API_KEY && process.env.TTS_MAY !== "google";
export const GOOGLE_PHIEN = "g2"; // g2 = cắt . , + giọng thường (#476)
const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");
export const getCacheHash = (text, may = "google") => (may === "kokoro" ? md5(`kk1|${kokoroVoice()}|${text}`) : md5(`${GOOGLE_PHIEN}|${text}`));

// BSON Binary -> Buffer (driver có thể trả về Binary thay vì Buffer thuần)
function toNodeBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value?.buffer) return Buffer.from(value.buffer);
  return Buffer.from(value);
}

export async function readMongoCache(hash) {
  try {
    const col = await getCollection(TTS_MONGO_COLLECTION);
    const doc = await col.findOne({ _id: hash }, { projection: { audio: 1 } });
    return doc ? toNodeBuffer(doc.audio) : null;
  } catch (err) {
    // MongoDB lỗi không được làm hỏng luồng TTS chính
    console.warn("⚠️ Không đọc được TTS cache từ MongoDB:", err.message);
    return null;
  }
}

// Có await (khác bản Express "bắn rồi quên"): hàm máy chủ có thể bị dừng ngay sau khi trả lời → ghi dở.
// Chỉ chạy khi phải gọi Google TTS (đã chậm sẵn), lỗi thì bỏ qua.
export async function writeMongoCache(hash, buffer, text, may = "google") {
  try {
    const col = await getCollection(TTS_MONGO_COLLECTION);
    await col.updateOne(
      { _id: hash },
      { $set: { audio: buffer, textLength: text.length, may, lastAccessedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn("⚠️ Không ghi được TTS cache vào MongoDB:", err.message);
  }
}

// #476 Tách câu cho Google: ưu tiên dấu kết câu . ! ?, rồi dấu ngắt , ; : — mỗi đoạn ngắn để Google đọc tự nhiên
// (đọc 1 lèo câu dài nghe "dở"). Đoạn quá ngắn (≤ 2 từ) gộp vào đoạn trước; đoạn vẫn > maxLength thì cắt theo từ.
export const TTS_DOAN_TOT = 120; // đoạn dài hơn mức này mới cắt tiếp ở dấu phẩy
export function splitText(text, maxLength = TTS_MAX_CHUNK_LENGTH) {
  // giữ chữ viết tắt (Mr. Dr. e.g. …) không bị coi là hết câu
  const t = String(text)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|e\.g|i\.e|No)\./gi, "$1\u2024");
  if (!t) return [];
  const tach = (s, re) => s.match(re)?.map((x) => x.trim()).filter(Boolean) || [s];
  const out = [];
  for (const cau of tach(t, /[^.!?]+(?:[.!?]+["')\]]*|$)/g)) {
    const doan = cau.length > TTS_DOAN_TOT ? tach(cau, /[^,;:]+(?:[,;:]+|$)/g) : [cau];
    for (const d of doan) {
      if (d.length <= maxLength) out.push(d);
      else {
        let cur = "";
        for (const w of d.split(" ")) {
          if (cur && (cur + " " + w).length > maxLength) {
            out.push(cur);
            cur = w;
          } else cur = cur ? cur + " " + w : w;
        }
        if (cur) out.push(cur);
      }
    }
  }
  // gộp mẩu quá ngắn vào đoạn trước (nếu còn chỗ) để khỏi ngắt vụn
  // mẩu đầu quá ngắn thì gộp vào đoạn sau
  const gop = [];
  let treo = "";
  for (let d of out) {
    if (treo && (treo + " " + d).length <= maxLength) d = treo + " " + d;
    else if (treo) gop.push(treo);
    treo = "";
    const prev = gop[gop.length - 1];
    if (d.split(" ").length <= 2) {
      if (prev && (prev + " " + d).length <= maxLength) gop[gop.length - 1] = prev + " " + d;
      else if (!prev) treo = d;
      else gop.push(d);
    } else gop.push(d);
  }
  if (treo) gop.push(treo);
  return (gop.length ? gop : [t.slice(0, maxLength)]).map((x) => x.replace(/\u2024/g, "."));
}

// 1 lần gọi Google TTS
async function createAudioBuffer(text) {
  const url = googleTTS.getAudioUrl(text, { lang: "en", slow: false }); // #476 giọng thường; trình duyệt phát 0,9 (giữ cao độ)
  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Google TTS ${audioRes.status}`);
  return Buffer.from(await audioRes.arrayBuffer());
}

// Tạo mới qua Google TTS (khi cache trượt); nhiều đoạn thì gọi song song, nối theo đúng thứ tự
export async function generateAudioBuffer(text) {
  const buffers = await Promise.all(splitText(text).map(createAudioBuffer));
  return buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);
}

// ---------- #476 Kokoro qua DeepInfra (giọng chính) ----------
// Gọi cổng kiểu OpenAI (trả thẳng mp3); cổng đó lỗi 404/405/422 thì thử cổng riêng của DeepInfra (trả mp3 / wav thẳng hoặc JSON có "audio" base64).
const KOKORO_TIMEOUT_MS = 5000; // quá 5 giây thì bỏ, đọc Google (trình duyệt chờ tối đa 12 giây)
const BASE = process.env.DEEPINFRA_BASE || "https://api.deepinfra.com/v1"; // DEEPINFRA_BASE chỉ để chạy thử với máy giả
async function goi(url, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), KOKORO_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}
async function amThanhTu(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) {
    const j = await res.json();
    const a = j?.audio;
    if (typeof a !== "string" || !a) throw new Error("Kokoro: JSON khong co audio");
    const m = a.match(/^data:([^;]+);base64,(.*)$/s);
    return { buf: Buffer.from(m ? m[2] : a, "base64"), type: m ? m[1] : "audio/mpeg" };
  }
  return { buf: Buffer.from(await res.arrayBuffer()), type: ct.split(";")[0] || "audio/mpeg" };
}
export async function generateKokoro(text) {
  const voice = kokoroVoice();
  let res = await goi(`${BASE}/openai/audio/speech`, { model: KOKORO_MODEL, input: text, voice, response_format: "mp3" });
  if ([404, 405, 422].includes(res.status)) {
    res = await goi(`${BASE}/inference/${KOKORO_MODEL}`, { text, preset_voice: [voice], output_format: "mp3" });
  }
  if (!res.ok) {
    const e = new Error(`Kokoro HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  const { buf, type } = await amThanhTu(res);
  if (buf.length < 500) throw new Error("Kokoro: am thanh rong");
  if (!/mpeg|mp3/.test(type)) throw new Error(`Kokoro: tra ve ${type}, can mp3`);
  return buf;
}
